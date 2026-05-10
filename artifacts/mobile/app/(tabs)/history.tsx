import React, { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AthleteBar } from "@/components/AthleteBar";
import { KickHistoryList } from "@/components/KickHistoryList";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { formatHangtime } from "@/hooks/useStopwatch";
import { useGetKicks, getGetKicksQueryKey } from "@workspace/api-client-react";
import type { Kick } from "@workspace/api-client-react";

type Period = "game" | "season" | "career";
type KickRecord = Kick & { isGameWinner?: boolean | null };

const PERIODS: { key: Period; label: string }[] = [
  { key: "game", label: "Game" },
  { key: "season", label: "Season" },
  { key: "career", label: "Career" },
];

function startOfSeason(): Date {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 7, 1);
}

function computeStats(kicks: KickRecord[]) {
  const fgKicks = kicks.filter((k) => k.kickType === "field_goal");
  const puntKicks = kicks.filter((k) => k.kickType === "punt");
  const koKicks = kicks.filter((k) => k.kickType === "kickoff");

  const fgTotal = fgKicks.length;
  const fgMade = fgKicks.filter(
    (k) => (k.data as Record<string, unknown>)["outcome"] === "made",
  ).length;
  const fgMadeDistances = fgKicks
    .filter((k) => (k.data as Record<string, unknown>)["outcome"] === "made")
    .map((k) => (k.data as Record<string, unknown>)["totalDistance"] as number)
    .filter((d): d is number => d != null && !isNaN(d));
  const fgAllDistances = fgKicks
    .map((k) => (k.data as Record<string, unknown>)["totalDistance"] as number)
    .filter((d): d is number => d != null && !isNaN(d));
  const fgAvgDist =
    fgAllDistances.length > 0
      ? fgAllDistances.reduce((a, b) => a + b, 0) / fgAllDistances.length
      : null;
  const fgLongest = fgMadeDistances.length > 0 ? Math.max(...fgMadeDistances) : null;
  const fgGameWinners = fgKicks.filter((k) => k.isGameWinner === true).length;

  const puntTotal = puntKicks.length;
  const puntDistances = puntKicks
    .map((k) => (k.data as Record<string, unknown>)["distance"] as number | null)
    .filter((d): d is number => d != null && d > 0);
  const puntAvgDist =
    puntDistances.length > 0
      ? puntDistances.reduce((a, b) => a + b, 0) / puntDistances.length
      : null;
  const puntLongest = puntDistances.length > 0 ? Math.max(...puntDistances) : null;
  const puntHangtimes = puntKicks
    .map((k) => (k.data as Record<string, unknown>)["hangtime"] as number)
    .filter((h): h is number => h != null && h > 0);
  const puntAvgHangtime =
    puntHangtimes.length > 0
      ? puntHangtimes.reduce((a, b) => a + b, 0) / puntHangtimes.length
      : null;

  const koTotal = koKicks.length;
  const koTouchbacks = koKicks.filter(
    (k) => (k.data as Record<string, unknown>)["touchback"] === true,
  ).length;
  const koHangtimes = koKicks
    .map((k) => (k.data as Record<string, unknown>)["hangtime"] as number)
    .filter((h): h is number => h != null && h > 0);
  const koAvgHangtime =
    koHangtimes.length > 0
      ? koHangtimes.reduce((a, b) => a + b, 0) / koHangtimes.length
      : null;

  return {
    total: kicks.length,
    fg: { total: fgTotal, made: fgMade, avgDist: fgAvgDist, longest: fgLongest, gameWinners: fgGameWinners },
    punt: { total: puntTotal, avgDist: puntAvgDist, longest: puntLongest, avgHangtime: puntAvgHangtime },
    ko: { total: koTotal, touchbacks: koTouchbacks, avgHangtime: koAvgHangtime },
  };
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  const colors = useColors();
  return (
    <View style={statRowSt.row}>
      <Text style={[statRowSt.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[statRowSt.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const statRowSt = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  label: { fontSize: 14, fontFamily: "Inter_400Regular" },
  value: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});

function pct(made: number, total: number): string {
  if (total === 0) return "—";
  return `${Math.round((made / total) * 100)}%`;
}

function avg(val: number | null, unit: string): string {
  if (val == null) return "—";
  return `${Math.round(val)}${unit}`;
}

function SectionCard({
  title,
  children,
  empty,
}: {
  title: string;
  children?: React.ReactNode;
  empty?: boolean;
}) {
  const colors = useColors();
  const s = StyleSheet.create({
    header: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: empty ? 16 : 4,
    },
    emptyText: {
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      textAlign: "center",
    },
  });
  return (
    <View>
      <Text style={s.header}>{title}</Text>
      <View style={s.card}>
        {empty ? <Text style={s.emptyText}>No kicks recorded</Text> : children}
      </View>
    </View>
  );
}

function Divider() {
  const colors = useColors();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

function FGStatsCard({ stats }: { stats: ReturnType<typeof computeStats>["fg"] }) {
  if (stats.total === 0) return <SectionCard title="Field Goals" empty />;
  return (
    <SectionCard title="Field Goals">
      <StatRow label="Attempts" value={stats.total} />
      <Divider />
      <StatRow label="Made" value={`${stats.made} / ${stats.total}`} />
      <Divider />
      <StatRow label="FG %" value={pct(stats.made, stats.total)} />
      <Divider />
      <StatRow label="Avg Distance" value={avg(stats.avgDist, "yd")} />
      <Divider />
      <StatRow label="Longest FG" value={stats.longest != null ? `${stats.longest}yd` : "—"} />
      <Divider />
      <StatRow label="Game Winners" value={stats.gameWinners} />
    </SectionCard>
  );
}

function PuntStatsCard({ stats }: { stats: ReturnType<typeof computeStats>["punt"] }) {
  if (stats.total === 0) return <SectionCard title="Punts" empty />;
  return (
    <SectionCard title="Punts">
      <StatRow label="Total Punts" value={stats.total} />
      {stats.avgDist != null && (
        <>
          <Divider />
          <StatRow label="Avg Distance" value={avg(stats.avgDist, "yd")} />
        </>
      )}
      {stats.longest != null && (
        <>
          <Divider />
          <StatRow label="Longest Punt" value={`${stats.longest}yd`} />
        </>
      )}
      {stats.avgHangtime != null && (
        <>
          <Divider />
          <StatRow label="Avg Hangtime" value={formatHangtime(stats.avgHangtime)} />
        </>
      )}
    </SectionCard>
  );
}

function KOStatsCard({ stats }: { stats: ReturnType<typeof computeStats>["ko"] }) {
  if (stats.total === 0) return <SectionCard title="Kickoffs" empty />;
  return (
    <SectionCard title="Kickoffs">
      <StatRow label="Total Kickoffs" value={stats.total} />
      <Divider />
      <StatRow label="Touchbacks" value={`${stats.touchbacks} / ${stats.total}`} />
      <Divider />
      <StatRow label="Touchback %" value={pct(stats.touchbacks, stats.total)} />
      {stats.avgHangtime != null && (
        <>
          <Divider />
          <StatRow label="Avg Hangtime" value={formatHangtime(stats.avgHangtime)} />
        </>
      )}
    </SectionCard>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const { activeAthleteId } = useApp();
  const [period, setPeriod] = useState<Period>("career");
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const allKicksParams = { athleteId: activeAthleteId ?? undefined, limit: 1000 };
  const { data: allKicks = [] } = useGetKicks(allKicksParams, {
    query: {
      queryKey: getGetKicksQueryKey(allKicksParams),
      enabled: !!activeAthleteId,
    },
  });

  const periodIndex = PERIODS.findIndex((p) => p.key === period);

  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-30, 30])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.velocityX < -300 && e.translationX < -30 && periodIndex < PERIODS.length - 1) {
        setPeriod(PERIODS[periodIndex + 1].key);
      } else if (e.velocityX > 300 && e.translationX > 30 && periodIndex > 0) {
        setPeriod(PERIODS[periodIndex - 1].key);
      }
    });

  const { kicks, label } = useMemo(() => {
    switch (period) {
      case "game": {
        const k = (allKicks as KickRecord[]).filter((k) => k.gameId != null);
        return { kicks: k, label: "Game Stats" };
      }
      case "season": {
        const cutoff = startOfSeason();
        const k = (allKicks as KickRecord[]).filter(
          (k) => k.gameId != null && new Date(k.createdAt) >= cutoff,
        );
        return { kicks: k, label: `Season Summary (Aug ${cutoff.getFullYear()}–Present)` };
      }
      case "career":
      default: {
        const k = (allKicks as KickRecord[]).filter((kk) => kk.gameId != null);
        return { kicks: k, label: "Career Summary" };
      }
    }
  }, [allKicks, period]);

  const stats = useMemo(() => computeStats(kicks), [kicks]);

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPadding + 8,
      paddingHorizontal: 20,
      paddingBottom: 14,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 120 },
    segWrap: {
      flexDirection: "row",
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 9,
      alignItems: "center",
    },
    segLabel: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.2,
    },
    periodHint: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
      opacity: 0.6,
      marginTop: 2,
    },
    sectionHeader: {
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 2,
    },
    statsGroup: { gap: 12 },
  });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={s.screen}>
        <View style={s.header}>
          <Text style={s.headerTitle}>History & Stats</Text>
        </View>
        <AthleteBar />
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          {/* Period selector */}
          <View>
            <View style={s.segWrap}>
              {PERIODS.map((p) => (
                <Pressable
                  key={p.key}
                  style={[
                    s.segBtn,
                    { backgroundColor: period === p.key ? colors.primary : "transparent" },
                  ]}
                  onPress={() => setPeriod(p.key)}
                >
                  <Text
                    style={[
                      s.segLabel,
                      {
                        color:
                          period === p.key ? colors.primaryForeground : colors.mutedForeground,
                      },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={s.periodHint}>Swipe left/right to change period</Text>
          </View>

          {/* Stats — three separate cards */}
          <Text style={s.sectionHeader}>{label}</Text>
          <View style={s.statsGroup}>
            <FGStatsCard stats={stats.fg} />
            <PuntStatsCard stats={stats.punt} />
            <KOStatsCard stats={stats.ko} />
          </View>

          {/* Recent kicks */}
          <KickHistoryList />
        </ScrollView>
      </View>
    </GestureDetector>
  );
}
