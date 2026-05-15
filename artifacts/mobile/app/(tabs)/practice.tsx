import React, { useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  useGetPracticeSessions,
  useCreatePracticeSession,
  useUpdatePracticeSession,
  useDeletePracticeSession,
  useGetKicks,
  getGetPracticeSessionsQueryKey,
  getGetKicksQueryKey,
} from "@workspace/api-client-react";
import type { PracticeSession } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AthleteBar } from "@/components/AthleteBar";
import { KickHistoryList } from "@/components/KickHistoryList";
import { CalendarPicker, todayEastern, formatDate } from "@/components/CalendarPicker";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { SwipeableScreen } from "@/components/SwipeableScreen";
import { formatHangtime } from "@/hooks/useStopwatch";
import type { Kick } from "@workspace/api-client-react";

function pct(a: number, b: number) {
  if (b === 0) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

function avg(vals: number[]): number | null {
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function computeStats(kicks: Kick[]) {
  const fg = kicks.filter((k) => k.kickType === "field_goal");
  const punt = kicks.filter((k) => k.kickType === "punt");
  const ko = kicks.filter((k) => k.kickType === "kickoff");

  const fgMade = fg.filter((k) => (k.data as Record<string, unknown>)["outcome"] === "made").length;

  const puntDists = punt
    .map((k) => (k.data as Record<string, unknown>)["distance"] as number | null)
    .filter((d): d is number => d != null && d > 0);

  const koTB = ko.filter((k) => (k.data as Record<string, unknown>)["touchback"] === true).length;

  const koHangtimes = ko
    .map((k) => (k.data as Record<string, unknown>)["hangtime"] as number | null)
    .filter((h): h is number => h != null && h > 0);

  const koLandingYards = ko
    .map((k) => (k.data as Record<string, unknown>)["landingYard"] as number | null)
    .filter((y): y is number => y != null && y > 0);

  return {
    total: kicks.length,
    fg: { total: fg.length, made: fgMade },
    punt: { total: punt.length, avgDist: avg(puntDists) },
    ko: { total: ko.length, touchbacks: koTB, avgHangtime: avg(koHangtimes), avgLandingYard: avg(koLandingYards) },
  };
}

// ─── Session Create/Edit Modal ─────────────────────────────────────────────

interface SessionModalProps {
  visible: boolean;
  initial?: PracticeSession;
  athleteId: string;
  onClose: () => void;
}

function SessionModal({ visible, initial, athleteId, onClose }: SessionModalProps) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const createMutation = useCreatePracticeSession();
  const updateMutation = useUpdatePracticeSession();

  const [date, setDate] = useState(initial?.date ?? todayEastern());
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset state when modal opens
  const handleOpen = () => {
    setDate(initial?.date ?? todayEastern());
    setNotes(initial?.notes ?? "");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (initial) {
        await updateMutation.mutateAsync({ id: initial.id, data: { date, notes: notes || null } });
      } else {
        await createMutation.mutateAsync({ data: { athleteId, date, notes: notes || null } });
      }
      queryClient.invalidateQueries({ queryKey: getGetPracticeSessionsQueryKey() });
      onClose();
    } catch {
      Alert.alert("Error", "Failed to save session.");
    } finally {
      setSaving(false);
    }
  };

  const s = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, borderTopWidth: 1, borderColor: colors.border },
    handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
    title: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 20 },
    label: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 },
    dateBtn: { backgroundColor: colors.secondary, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
    dateBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    notesInput: { backgroundColor: colors.input, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground, minHeight: 70, textAlignVertical: "top", marginBottom: 20 },
    saveBtn: { backgroundColor: colors.primary, borderRadius: 12, padding: 14, alignItems: "center", marginBottom: 8 },
    saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
    cancelBtn: { alignItems: "center", padding: 10 },
    cancelBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
  });

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} onShow={handleOpen}>
        <Pressable style={s.overlay} onPress={onClose}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.handle} />
            <Text style={s.title}>{initial ? "Edit Session" : "New Practice Session"}</Text>

            <Text style={s.label}>Date</Text>
            <Pressable style={s.dateBtn} onPress={() => setCalendarOpen(true)}>
              <Text style={s.dateBtnText}>{formatDate(date)}</Text>
              <Feather name="calendar" size={18} color={colors.mutedForeground} />
            </Pressable>

            <Text style={s.label}>Notes (optional)</Text>
            <TextInput
              style={s.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Morning practice, windy conditions…"
              placeholderTextColor={colors.mutedForeground}
              multiline
            />

            <Pressable style={[s.saveBtn, { opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
              <Text style={s.saveBtnText}>{saving ? "Saving…" : initial ? "Save Changes" : "Create Session"}</Text>
            </Pressable>
            <Pressable style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <CalendarPicker
        visible={calendarOpen}
        value={date}
        onSelect={setDate}
        onClose={() => setCalendarOpen(false)}
      />
    </>
  );
}

// ─── Session Card ──────────────────────────────────────────────────────────

interface SessionCardProps {
  session: PracticeSession;
  isActive: boolean;
  onSetActive: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function SessionCard({ session, isActive, onSetActive, onEdit, onDelete }: SessionCardProps) {
  const colors = useColors();
  const { activeAthleteId } = useApp();
  const [expanded, setExpanded] = useState(false);

  const params = { athleteId: activeAthleteId ?? undefined, practiceSessionId: session.id, limit: 1000 };
  const { data: kicks = [] } = useGetKicks(params, {
    query: { queryKey: getGetKicksQueryKey(params), enabled: !!activeAthleteId },
  });

  const stats = useMemo(() => computeStats(kicks), [kicks]);

  const s = StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: 14, borderWidth: isActive ? 2 : 1, borderColor: isActive ? colors.primary : colors.border, overflow: "hidden", marginBottom: 12 },
    header: { padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
    activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    dateText: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground, flex: 1 },
    badge: { backgroundColor: colors.secondary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    headerActions: { flexDirection: "row", gap: 6 },
    iconBtn: { padding: 6, borderRadius: 8, backgroundColor: colors.secondary },
    notes: { paddingHorizontal: 14, paddingBottom: 10, fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingBottom: 12, flexWrap: "wrap" },
    statChip: { backgroundColor: colors.secondary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
    statChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground },
    expandBtn: { borderTopWidth: 1, borderColor: colors.border, padding: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
    expandBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    kicksContainer: { borderTopWidth: 1, borderColor: colors.border, padding: 12 },
    activeBtn: { marginHorizontal: 14, marginBottom: 12, padding: 10, borderRadius: 10, alignItems: "center", borderWidth: 1, borderColor: isActive ? colors.primary : colors.border, backgroundColor: isActive ? colors.primary + "22" : "transparent" },
    activeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: isActive ? colors.primary : colors.mutedForeground },
  });

  return (
    <View style={s.card}>
      <View style={s.header}>
        {isActive && <View style={s.activeDot} />}
        <Text style={s.dateText}>{formatDate(session.date)}</Text>
        <View style={s.badge}>
          <Text style={s.badgeText}>{stats.total} kicks</Text>
        </View>
        <View style={s.headerActions}>
          <Pressable style={s.iconBtn} onPress={onEdit} hitSlop={6}>
            <Feather name="edit-2" size={14} color={colors.primary} />
          </Pressable>
          <Pressable style={s.iconBtn} onPress={onDelete} hitSlop={6}>
            <Feather name="trash-2" size={14} color={colors.destructive} />
          </Pressable>
        </View>
      </View>

      {!!session.notes && <Text style={s.notes}>{session.notes}</Text>}

      {stats.total > 0 && (
        <View style={s.statsRow}>
          {stats.fg.total > 0 && (
            <View style={s.statChip}>
              <Text style={s.statChipText}>FG {stats.fg.made}/{stats.fg.total} ({pct(stats.fg.made, stats.fg.total)})</Text>
            </View>
          )}
          {stats.punt.total > 0 && (
            <View style={s.statChip}>
              <Text style={s.statChipText}>
                {stats.punt.total} punt{stats.punt.total !== 1 ? "s" : ""}
                {stats.punt.avgDist != null ? ` · ${Math.round(stats.punt.avgDist)}yd avg` : ""}
              </Text>
            </View>
          )}
          {stats.ko.total > 0 && (
            <View style={s.statChip}>
              <Text style={s.statChipText}>
                KO {stats.ko.touchbacks}/{stats.ko.total} TB
                {stats.ko.avgLandingYard != null ? ` · ${Math.round(stats.ko.avgLandingYard)}yd avg` : ""}
                {stats.ko.avgHangtime != null ? ` · ${(stats.ko.avgHangtime / 1000).toFixed(1)}s hang` : ""}
              </Text>
            </View>
          )}
        </View>
      )}

      <Pressable style={s.activeBtn} onPress={onSetActive}>
        <Text style={s.activeBtnText}>{isActive ? "✓ Active Session (recording here)" : "Set as Active Session"}</Text>
      </Pressable>

      <Pressable style={s.expandBtn} onPress={() => setExpanded(!expanded)}>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
        <Text style={s.expandBtnText}>{expanded ? "Hide Kicks" : "Show Kicks"}</Text>
      </Pressable>

      {expanded && (
        <View style={s.kicksContainer}>
          <KickHistoryList practiceSessionId={session.id} displayLimit={50} />
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────

export default function PracticeScreen() {
  const colors = useColors();
  const tabBarHeight = useTabBarHeight();
  const { activeAthleteId, activePracticeSession, setActivePracticeSession } = useApp();
  const queryClient = useQueryClient();
  const deleteMutation = useDeletePracticeSession();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState<PracticeSession | null>(null);

  const { data: sessions = [], isLoading } = useGetPracticeSessions(
    { athleteId: activeAthleteId ?? "" },
    {
      query: {
        queryKey: getGetPracticeSessionsQueryKey({ athleteId: activeAthleteId ?? "" }),
        enabled: !!activeAthleteId,
      },
    },
  );

  const handleDelete = (session: PracticeSession) => {
    Alert.alert(
      "Delete Session",
      `Delete the session from ${formatDate(session.date)}? Kicks in this session won't be deleted but will no longer be grouped under this session.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Session",
          style: "destructive",
          onPress: async () => {
            await deleteMutation.mutateAsync({ id: session.id });
            queryClient.invalidateQueries({ queryKey: getGetPracticeSessionsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetKicksQueryKey() });
            if (activePracticeSession?.id === session.id) setActivePracticeSession(null);
          },
        },
      ],
    );
  };

  const handleSetActive = (session: PracticeSession) => {
    if (activePracticeSession?.id === session.id) {
      setActivePracticeSession(null);
    } else {
      setActivePracticeSession(session);
    }
  };

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: tabBarHeight },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 1, textTransform: "uppercase" },
    newBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
    newBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
    activeBanner: { backgroundColor: colors.primary + "22", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.primary, flexDirection: "row", alignItems: "center", gap: 8 },
    activeBannerText: { fontSize: 13, fontFamily: "Inter_500Medium", color: colors.primary, flex: 1 },
    noData: { alignItems: "center", justifyContent: "center", paddingVertical: 32, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, gap: 12 },
    noDataText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center" },
    noDataBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
    noDataBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  });

  if (!activeAthleteId) {
    return (
      <View style={s.screen}>
        <AthleteBar />
        <View style={[s.noData, { margin: 16 }]}>
          <Feather name="user" size={32} color={colors.mutedForeground} />
          <Text style={s.noDataText}>Select an athlete to see practice sessions.</Text>
        </View>
      </View>
    );
  }

  return (
  <SwipeableScreen tabIndex={3}>
    <View style={s.screen}>
      <AthleteBar />
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>

        {activePracticeSession && (
          <View style={s.activeBanner}>
            <Feather name="target" size={16} color={colors.primary} />
            <Text style={s.activeBannerText}>
              Recording into: {formatDate(activePracticeSession.date)}
              {activePracticeSession.notes ? ` · ${activePracticeSession.notes}` : ""}
            </Text>
            <Pressable onPress={() => setActivePracticeSession(null)}>
              <Feather name="x" size={16} color={colors.primary} />
            </Pressable>
          </View>
        )}

        <View style={s.header}>
          <Text style={s.sectionTitle}>Practice Sessions</Text>
          <Pressable style={s.newBtn} onPress={() => setShowCreateModal(true)}>
            <Feather name="plus" size={14} color="#fff" />
            <Text style={s.newBtnText}>New Session</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={s.noData}>
            <Text style={s.noDataText}>Loading…</Text>
          </View>
        ) : sessions.length === 0 ? (
          <View style={s.noData}>
            <Feather name="calendar" size={32} color={colors.mutedForeground} />
            <Text style={s.noDataText}>No practice sessions yet.{"\n"}Create one to group your kicks.</Text>
            <Pressable style={s.noDataBtn} onPress={() => setShowCreateModal(true)}>
              <Text style={s.noDataBtnText}>Create First Session</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={sessions}
            keyExtractor={(s) => s.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <SessionCard
                session={item}
                isActive={activePracticeSession?.id === item.id}
                onSetActive={() => handleSetActive(item)}
                onEdit={() => setEditingSession(item)}
                onDelete={() => handleDelete(item)}
              />
            )}
          />
        )}
      </ScrollView>

      <SessionModal
        visible={showCreateModal}
        athleteId={activeAthleteId}
        onClose={() => setShowCreateModal(false)}
      />

      {editingSession && (
        <SessionModal
          visible
          initial={editingSession}
          athleteId={activeAthleteId}
          onClose={() => setEditingSession(null)}
        />
      )}
    </View>
  </SwipeableScreen>
  );
}
