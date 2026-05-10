import React, { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useGetKicks, getGetKicksQueryKey } from "@workspace/api-client-react";
import type { Kick, KickType } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { formatHangtime } from "@/hooks/useStopwatch";
import { EditKickModal } from "@/components/EditKickModal";

interface Props {
  kickType?: KickType;
  practiceOnly?: boolean;
  practiceSessionId?: string;
  gameId?: string;
  /** Max items to display (default 10). All are still fetched for reset. */
  displayLimit?: number;
}

const RESULT_LABELS: Record<string, string> = {
  out_of_bounds: "Out of Bounds",
  touchback: "Touchback",
  blocked: "Blocked",
  bad_snap: "Bad Snap",
  fair_catch: "Fair Catch",
  downed: "Downed",
  punt_return: "Punt Return",
};

function formatKickSummary(kick: Kick): string {
  const d = kick.data as Record<string, unknown>;

  if (kick.kickType === "field_goal") {
    const outcome = d["outcome"] as string;
    const los = d["los"] as number;
    const totalDist = d["totalDistance"] as number;
    const missType = d["missType"] as string | undefined;
    const badSnapSuffix = d["badSnap"] ? " · Bad Snap" : "";
    const outcomeStr = outcome === "made" ? `✓ Made` : `✗ ${missType ?? "Missed"}`;
    return `${outcomeStr}${badSnapSuffix} · ${totalDist}yd (LOS ${los})`;
  }

  if (kick.kickType === "punt") {
    const dist = d["distance"] as number | null | undefined;
    const ht = d["hangtime"] as number;
    const result = d["result"] as string | null | undefined;
    const badSnapSuffix = d["badSnap"] ? " · Bad Snap" : "";
    const returnYards = d["returnYards"] as number | null | undefined;

    let distStr: string;
    if (dist != null && dist > 0) {
      distStr = `${dist}yd`;
    } else if (result) {
      distStr = RESULT_LABELS[result] ?? result;
    } else {
      distStr = "—";
    }

    let suffix = ` · ${formatHangtime(ht)}${badSnapSuffix}`;
    if (result === "punt_return" && returnYards != null) {
      suffix += ` · ${returnYards}yd ret`;
    }
    return `${distStr}${suffix}`;
  }

  if (kick.kickType === "kickoff") {
    const tb = d["touchback"] as boolean;
    const ht = d["hangtime"] as number;
    const tbType = d["touchbackType"] as string | undefined;
    const returnYards = d["returnYards"] as number | null | undefined;
    const tbStr = tb
      ? `Touchback${tbType ? ` (${tbType.replace("_", " ")})` : ""}`
      : `Returned${returnYards != null ? ` ${returnYards}yd` : ""}`;
    return `${tbStr} · ${formatHangtime(ht)}`;
  }

  return "";
}

function getKickTypeLabel(type: string): string {
  if (type === "field_goal") return "FG";
  if (type === "punt") return "Punt";
  if (type === "kickoff") return "KO";
  return type;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface KickRowProps {
  kick: Kick;
  onDelete: (kick: Kick) => void;
  onEdit: (kick: Kick) => void;
}

function KickRow({ kick, onDelete, onEdit }: KickRowProps) {
  const colors = useColors();
  const d = kick.data as Record<string, unknown>;
  const isBad =
    kick.kickType === "field_goal"
      ? d["outcome"] !== "made"
      : kick.kickType === "punt"
        ? d["badSnap"] === true || ["blocked"].includes((d["result"] as string) ?? "")
        : false;

  return (
    <View style={[rowStyles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[rowStyles.typeTag, { backgroundColor: colors.secondary }]}>
        <Text style={[rowStyles.typeText, { color: colors.mutedForeground }]}>
          {getKickTypeLabel(kick.kickType)}
        </Text>
      </View>
      <View style={rowStyles.info}>
        <Text
          style={[rowStyles.summary, { color: isBad ? colors.destructive : colors.foreground }]}
          numberOfLines={1}
        >
          {formatKickSummary(kick)}
          {kick.isGameWinner ? " 🏆" : ""}
        </Text>
        <Text style={[rowStyles.time, { color: colors.mutedForeground }]}>
          {formatTime(kick.createdAt)}
        </Text>
      </View>
      <View style={rowStyles.actions}>
        <Pressable style={rowStyles.actionBtn} onPress={() => onEdit(kick)} hitSlop={8}>
          <Feather name="edit-2" size={14} color={colors.primary} />
        </Pressable>
        <Pressable style={rowStyles.actionBtn} onPress={() => onDelete(kick)} hitSlop={8}>
          <Feather name="trash-2" size={15} color={colors.destructive} />
        </Pressable>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 6,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 36,
    alignItems: "center",
  },
  typeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  summary: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  actionBtn: {
    padding: 4,
  },
});

export function KickHistoryList({ kickType, practiceOnly, practiceSessionId, gameId, displayLimit = 10 }: Props) {
  const colors = useColors();
  const { activeAthleteId, removeKick } = useApp();
  const [editingKick, setEditingKick] = useState<Kick | null>(null);

  // Fetch all kicks for practice contexts (needed for reset to work on > 10 kicks)
  const fetchLimit = practiceOnly || practiceSessionId ? 1000 : 10;

  const params = {
    athleteId: activeAthleteId ?? undefined,
    kickType,
    gameId,
    practiceSessionId,
    practiceOnly: practiceOnly ? true : undefined,
    limit: fetchLimit,
  };

  const { data: allKicks = [], isLoading } = useGetKicks(params, {
    query: {
      queryKey: getGetKicksQueryKey(params),
      enabled: !!activeAthleteId,
    },
  });

  const kicks = allKicks.slice(0, displayLimit);

  const confirmDelete = (kick: Kick) => {
    Alert.alert(
      "Delete Kick",
      "Are you sure you want to delete this kick? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removeKick(kick.id),
        },
      ],
    );
  };

  const handleReset = () => {
    const typeName = kickType ? kickType.replace("_", " ") : "practice";
    Alert.alert(
      "Reset Practice Kicks",
      `Delete all ${typeName} practice kicks for this athlete? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset All",
          style: "destructive",
          onPress: async () => {
            // Snapshot all IDs before any deletes so re-renders don't affect the list
            const ids = allKicks.map((k) => k.id);
            await Promise.all(ids.map((id) => removeKick(id)));
          },
        },
      ],
    );
  };

  if (!activeAthleteId) {
    return (
      <View style={[listStyles.empty, { borderColor: colors.border }]}>
        <Feather name="user" size={24} color={colors.mutedForeground} />
        <Text style={[listStyles.emptyText, { color: colors.mutedForeground }]}>
          Select an athlete above
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[listStyles.empty, { borderColor: colors.border }]}>
        <Text style={[listStyles.emptyText, { color: colors.mutedForeground }]}>Loading…</Text>
      </View>
    );
  }

  if (kicks.length === 0) {
    return (
      <View style={[listStyles.empty, { borderColor: colors.border }]}>
        <Feather name="clipboard" size={24} color={colors.mutedForeground} />
        <Text style={[listStyles.emptyText, { color: colors.mutedForeground }]}>No kicks yet</Text>
      </View>
    );
  }

  return (
    <>
      <View style={listStyles.wrapper}>
        <View style={listStyles.headingRow}>
          <Text style={[listStyles.heading, { color: colors.mutedForeground }]}>
            Recent Kicks{allKicks.length > displayLimit ? ` (showing ${displayLimit} of ${allKicks.length})` : ""}
          </Text>
          {(practiceOnly || practiceSessionId) && allKicks.length > 0 && (
            <Pressable style={[listStyles.resetBtn, { borderColor: colors.destructive }]} onPress={handleReset}>
              <Feather name="trash-2" size={12} color={colors.destructive} />
              <Text style={[listStyles.resetBtnText, { color: colors.destructive }]}>Reset All</Text>
            </Pressable>
          )}
        </View>
        <FlatList
          data={kicks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <KickRow kick={item} onDelete={confirmDelete} onEdit={setEditingKick} />
          )}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <EditKickModal kick={editingKick} onClose={() => setEditingKick(null)} />
    </>
  );
}

const listStyles = StyleSheet.create({
  wrapper: { gap: 4 },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  heading: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
