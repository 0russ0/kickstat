import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AthleteBar } from "@/components/AthleteBar";
import { KickHistoryList } from "@/components/KickHistoryList";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { formatHangtime } from "@/hooks/useStopwatch";
import { useGetKicks, getGetKicksQueryKey } from "@workspace/api-client-react";
import type { Kick } from "@workspace/api-client-react";

function computePracticeStats(kicks: Kick[]) {
  const fgKicks = kicks.filter((k) => k.kickType === "field_goal");
  const puntKicks = kicks.filter((k) => k.kickType === "punt");
  const koKicks = kicks.filter((k) => k.kickType === "kickoff");

  const fgTotal = fgKicks.length;
  const fgMade = fgKicks.filter((k) => (k.data as Record<string, unknown>)["outcome"] === "made").length;
  const fgDistances = fgKicks
    .map((k) => (k.data as Record<string, unknown>)["totalDistance"] as number)
    .filter((d) => d != null && !isNaN(d));
  const fgAvgDist = fgDistances.length > 0 ? fgDistances.reduce((a, b) => a + b, 0) / fgDistances.length : null;

  const puntTotal = puntKicks.length;
  const puntDistances = puntKicks
    .map((k) => (k.data as Record<string, unknown>)["distance"] as number | null)
    .filter((d): d is number => d != null && d > 0);
  const puntAvgDist = puntDistances.length > 0 ? puntDistances.reduce((a, b) => a + b, 0) / puntDistances.length : null;
  const puntHangtimes = puntKicks
    .map((k) => (k.data as Record<string, unknown>)["hangtime"] as number)
    .filter((h) => h != null && h > 0);
  const puntAvgHT = puntHangtimes.length > 0 ? puntHangtimes.reduce((a, b) => a + b, 0) / puntHangtimes.length : null;

  const koTotal = koKicks.length;
  const koTouchbacks = koKicks.filter((k) => (k.data as Record<string, unknown>)["touchback"] === true).length;
  const koHangtimes = koKicks
    .map((k) => (k.data as Record<string, unknown>)["hangtime"] as number)
    .filter((h) => h != null && h > 0);
  const koAvgHT = koHangtimes.length > 0 ? koHangtimes.reduce((a, b) => a + b, 0) / koHangtimes.length : null;

  return { total: kicks.length, fg: { total: fgTotal, made: fgMade, avgDist: fgAvgDist }, punt: { total: puntTotal, avgDist: puntAvgDist, avgHT: puntAvgHT }, ko: { total: koTotal, touchbacks: koTouchbacks, avgHT: koAvgHT } };
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 9 }}>
      <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{label}</Text>
      <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{value}</Text>
    </View>
  );
}

function pct(made: number, total: number): string {
  if (total === 0) return "—";
  return `${Math.round((made / total) * 100)}%`;
}

export default function PracticeScreen() {
  const colors = useColors();
  const { activeAthleteId } = useApp();

  const params = { athleteId: activeAthleteId ?? undefined, practiceOnly: true, limit: 1000 };
  const { data: kicks = [] } = useGetKicks(params, {
    query: {
      queryKey: getGetKicksQueryKey(params),
      enabled: !!activeAthleteId,
    },
  });

  const stats = useMemo(() => computePracticeStats(kicks), [kicks]);

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 1, textTransform: "uppercase" },
    card: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 4 },
    divider: { height: 1, backgroundColor: colors.border },
    noData: { alignItems: "center", justifyContent: "center", paddingVertical: 24, borderRadius: 12, borderWidth: 1, borderStyle: "dashed", borderColor: colors.border },
    noDataText: { fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
  });

  return (
    <View style={s.screen}>
      <AthleteBar />
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.sectionTitle}>Practice Stats (All Time)</Text>

        {stats.total === 0 ? (
          <View style={s.noData}>
            <Text style={s.noDataText}>No practice kicks recorded yet.</Text>
          </View>
        ) : (
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
                    <StatRow label="Avg FG Distance" value={`${Math.round(stats.fg.avgDist)}yd`} />
                  </>
                )}
              </>
            )}
            {stats.fg.total > 0 && (stats.punt.total > 0 || stats.ko.total > 0) && (
              <View style={[s.divider, { marginVertical: 4 }]} />
            )}
            {stats.punt.total > 0 && (
              <>
                <StatRow label="Punts" value={stats.punt.total} />
                {stats.punt.avgDist != null && (
                  <>
                    <View style={s.divider} />
                    <StatRow label="Avg Punt Distance" value={`${Math.round(stats.punt.avgDist)}yd`} />
                  </>
                )}
                {stats.punt.avgHT != null && (
                  <>
                    <View style={s.divider} />
                    <StatRow label="Avg Punt Hangtime" value={formatHangtime(stats.punt.avgHT)} />
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
                {stats.ko.avgHT != null && (
                  <>
                    <View style={s.divider} />
                    <StatRow label="Avg KO Hangtime" value={formatHangtime(stats.ko.avgHT)} />
                  </>
                )}
              </>
            )}
          </View>
        )}

        <KickHistoryList practiceOnly />
      </ScrollView>
    </View>
  );
}
