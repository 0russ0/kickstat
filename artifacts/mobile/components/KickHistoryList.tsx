import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useGetKicks, getGetKicksQueryKey } from "@workspace/api-client-react";
import type { Kick, KickType } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { formatHangtime } from "@/hooks/useStopwatch";

interface Props {
  kickType?: KickType;
}

function formatKickSummary(kick: Kick): string {
  const d = kick.data as Record<string, unknown>;
  if (kick.kickType === "field_goal") {
    const outcome = d["outcome"] as string;
    const los = d["los"] as number;
    const totalDist = d["totalDistance"] as number;
    const missType = d["missType"] as string | undefined;
    const outcomeStr = outcome === "made" ? "✓ Made" : `✗ ${missType ?? "Missed"}`;
    return `${outcomeStr} · ${totalDist}yd (LOS ${los})`;
  }
  if (kick.kickType === "punt") {
    const dist = d["distance"] as number;
    const ht = d["hangtime"] as number;
    return `${dist}yd · ${formatHangtime(ht)}`;
  }
  if (kick.kickType === "kickoff") {
    const tb = d["touchback"] as boolean;
    const ht = d["hangtime"] as number;
    const tbType = d["touchbackType"] as string | undefined;
    const tbStr = tb ? `Touchback${tbType ? ` (${tbType.replace("_", " ")})` : ""}` : "Returned";
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
  onDelete: (id: string) => void;
  showType?: boolean;
}

function KickRow({ kick, onDelete, showType }: KickRowProps) {
  const colors = useColors();
  const isGood =
    kick.kickType === "field_goal"
      ? (kick.data as Record<string, unknown>)["outcome"] === "made"
      : true;

  return (
    <View style={[rowStyles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[rowStyles.typeTag, { backgroundColor: colors.secondary }]}>
        <Text style={[rowStyles.typeText, { color: colors.mutedForeground }]}>
          {getKickTypeLabel(kick.kickType)}
        </Text>
      </View>
      <View style={rowStyles.info}>
        <Text style={[rowStyles.summary, { color: isGood ? colors.foreground : colors.destructive }]} numberOfLines={1}>
          {formatKickSummary(kick)}
        </Text>
        <Text style={[rowStyles.time, { color: colors.mutedForeground }]}>
          {formatTime(kick.createdAt)}
        </Text>
      </View>
      <Pressable style={rowStyles.deleteBtn} onPress={() => onDelete(kick.id)} hitSlop={8}>
        <Feather name="trash-2" size={15} color={colors.destructive} />
      </Pressable>
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
    gap: 10,
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
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    padding: 4,
  },
});

export function KickHistoryList({ kickType }: Props) {
  const colors = useColors();
  const { activeAthleteId, removeKick } = useApp();

  const params = {
    athleteId: activeAthleteId ?? undefined,
    kickType,
    limit: 10,
  };

  const { data: kicks = [], isLoading } = useGetKicks(params, {
    query: {
      queryKey: getGetKicksQueryKey(params),
      enabled: !!activeAthleteId,
    },
  });

  if (!activeAthleteId) {
    return (
      <View style={[listStyles.empty, { borderColor: colors.border }]}>
        <Feather name="user" size={24} color={colors.mutedForeground} />
        <Text style={[listStyles.emptyText, { color: colors.mutedForeground }]}>Select an athlete above</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[listStyles.empty, { borderColor: colors.border }]}>
        <Text style={[listStyles.emptyText, { color: colors.mutedForeground }]}>Loading...</Text>
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
    <View style={listStyles.wrapper}>
      <Text style={[listStyles.heading, { color: colors.mutedForeground }]}>Recent Kicks</Text>
      <FlatList
        data={kicks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <KickRow kick={item} onDelete={removeKick} showType={!kickType} />
        )}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const listStyles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  heading: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
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
