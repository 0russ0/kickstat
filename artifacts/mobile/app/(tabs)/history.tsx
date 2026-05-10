import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AthleteBar } from "@/components/AthleteBar";
import { KickHistoryList } from "@/components/KickHistoryList";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { formatHangtime } from "@/hooks/useStopwatch";
import { useGetKicks, getGetKicksQueryKey } from "@workspace/api-client-react";
import type { Kick } from "@workspace/api-client-react";

type Period = "game" | "season" | "career";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfSeason(): Date {
  const now = new Date();
  const year = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  return new Date(year, 7, 1); // Aug 1
}

function computeStats(kicks: Kick[], start: Date | null) {
  const filtered = start
    ? kicks.filter((k) => new Date(k.createdAt) >= start)
    : kicks;

  const fgKicks = filtered.filter((k) => k.kickType === "field_goal");
  const puntKicks = filtered.filter((k) => k.kickType === "punt");
  const koKicks = filtered.filter((k) => k.kickType === "kickoff");

  const fgTotal = fgKicks.length;
  const fgMade = fgKicks.filter(
    (k) => (k.data as Record<string, unknown>)["outcome"] === "made",
  ).length;
  const fgDistances = fgKicks.map(
    (k) => (k.data as Record<string, unknown>)["totalDistance"] as number,
  ).filter((d) => d != null && !isNaN(d));
  const fgAvgDist =
    fgDistances.length > 0
      ? fgDistances.reduce((a, b) => a + b, 0) / fgDistances.length
      : null;

  const puntTotal = puntKicks.length;
  const puntDistances = puntKicks
    .map((k) => (k.data as Record<string, unknown>)["distance"] as number | null)
    .filter((d): d is number => d != null && d > 0);
  const puntAvgDist =
    puntDistances.length > 0
      ? puntDistances.reduce((a, b) => a + b, 0) / puntDistances.length
      : null;
  const puntHangtimes = puntKicks
    .map((k) => (k.data as Record<string, unknown>)["hangtime"] as number)
    .filter((h) => h != null && h > 0);
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
    .filter((h) => h != null && h > 0);
  const koAvgHangtime =
    koHangtimes.length > 0
      ? koHangtimes.reduce((a, b) => a + b, 0) / koHangtimes.length
      : null;

  return {
    total: filtered.length,
    fg: { total: fgTotal, made: fgMade, avgDist: fgAvgDist },
    punt: { total: puntTotal, avgDist: puntAvgDist, avgHangtime: puntAvgHangtime },
    ko: { total: koTotal, touchbacks: koTouchbacks, avgHangtime: koAvgHangtime },
  };
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  const colors = useColors();
  return (
    <View style={statRowStyles.row}>
      <Text style={[statRowStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[statRowStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const statRowStyles = StyleSheet.create({
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

function StatsSection({
  label,
  stats,
}: {
  label: string;
  stats: ReturnType<typeof computeStats>;
}) {
  const colors = useColors();
  const s = StyleSheet.create({
    header: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 4,
      marginBottom: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
  });

  if (stats.total === 0) {
    return (
      <View>
        <Text style={s.header}>{label}</Text>
        <View style={[s.card, { paddingVertical: 16, alignItems: "center" }]}>
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13 }}>
            No kicks recorded
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <Text style={s.header}>{label}</Text>
      <View style={s.card}>
        {stats.fg.total > 0 && (
          <>
            <StatRow label="FG Attempts" value={stats.fg.total} />
            <View style={s.divider} />
            <StatRow label="FG Made" value={`${stats.fg.made} / ${stats.fg.total}`} />
            <View style={s.divider} />
            <StatRow label="FG %" value={pct(stats.fg.made, stats.fg.total)} />
            {stats.fg.avgDist != null && (
              <>
                <View style={s.divider} />
                <StatRow label="Avg FG Distance" value={avg(stats.fg.avgDist, "yd")} />
              </>
            )}
          </>
        )}
        {stats.fg.total > 0 && (stats.punt.total > 0 || stats.ko.total > 0) && (
          <View style={[s.divider, { marginVertical: 4, backgroundColor: colors.border }]} />
        )}
        {stats.punt.total > 0 && (
          <>
            <StatRow label="Punts" value={stats.punt.total} />
            {stats.punt.avgDist != null && (
              <>
                <View style={s.divider} />
                <StatRow label="Avg Punt Distance" value={avg(stats.punt.avgDist, "yd")} />
              </>
            )}
            {stats.punt.avgHangtime != null && (
              <>
                <View style={s.divider} />
                <StatRow label="Avg Punt Hangtime" value={formatHangtime(stats.punt.avgHangtime)} />
              </>
            )}
          </>
        )}
        {stats.punt.total > 0 && stats.ko.total > 0 && (
          <View style={[s.divider, { marginVertical: 4 }]} />
        )}
        {stats.ko.total > 0 && (
          <>
            <StatRow label="Kickoffs" value={stats.ko.total} />
            <View style={s.divider} />
            <StatRow label="Touchbacks" value={`${stats.ko.touchbacks} / ${stats.ko.total}`} />
            <View style={s.divider} />
            <StatRow label="Touchback %" value={pct(stats.ko.touchbacks, stats.ko.total)} />
            {stats.ko.avgHangtime != null && (
              <>
                <View style={s.divider} />
                <StatRow label="Avg KO Hangtime" value={formatHangtime(stats.ko.avgHangtime)} />
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const { activeAthleteId } = useApp();
  const [period, setPeriod] = useState<Period>("season");

  const allKicksParams = {
    athleteId: activeAthleteId ?? undefined,
    limit: 1000,
  };

  const { data: allKicks = [] } = useGetKicks(allKicksParams, {
    query: {
      queryKey: getGetKicksQueryKey(allKicksParams),
      enabled: !!activeAthleteId,
    },
  });

  const stats = useMemo(() => {
    const startMap: Record<Period, Date | null> = {
      game: startOfToday(),
      season: startOfSeason(),
      career: null,
    };
    return computeStats(allKicks, startMap[period]);
  }, [allKicks, period]);

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    segmentWrap: {
      flexDirection: "row",
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 4,
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
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 4,
    },
    noAthlete: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    noAthleteText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
  });

  const PERIODS: { key: Period; label: string }[] = [
    { key: "game", label: "Game" },
    { key: "season", label: "Season" },
    { key: "career", label: "Career" },
  ];

  return (
    <View style={s.screen}>
      <AthleteBar />
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Period selector */}
        <View style={s.segmentWrap}>
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
                  { color: period === p.key ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <StatsSection
          label={
            period === "game"
              ? "Today's Stats"
              : period === "season"
                ? "Season Stats  (Aug – present)"
                : "Career Stats"
          }
          stats={stats}
        />

        <KickHistoryList />
      </ScrollView>
    </View>
  );
}
