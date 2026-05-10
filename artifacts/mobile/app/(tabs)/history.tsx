import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AthleteBar } from "@/components/AthleteBar";
import { KickHistoryList } from "@/components/KickHistoryList";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useGetAthleteStats, getGetAthleteStatsQueryKey } from "@workspace/api-client-react";

function StatCard({ label, value }: { label: string; value: string | number }) {
  const colors = useColors();
  return (
    <View
      style={[
        statStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[statStyles.value, { color: colors.primary }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    gap: 4,
    minWidth: 90,
  },
  value: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
});

export default function HistoryScreen() {
  const colors = useColors();
  const { activeAthleteId } = useApp();

  const { data: stats } = useGetAthleteStats(activeAthleteId ?? "", {
    query: {
      queryKey: getGetAthleteStatsQueryKey(activeAthleteId ?? ""),
      enabled: !!activeAthleteId,
    },
  });

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 20, paddingBottom: 40 },
    sectionTitle: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  });

  const fgTotal = stats?.fieldGoals.total ?? 0;
  const fgMade = stats?.fieldGoals.made ?? 0;
  const fgPercent =
    stats && fgTotal > 0
      ? Math.round((fgMade / fgTotal) * 100)
      : null;

  return (
    <View style={s.screen}>
      <AthleteBar />
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {stats && (
          <View>
            <Text style={s.sectionTitle}>Season Stats</Text>
            <View style={s.statsGrid}>
              <StatCard label="Total Kicks" value={stats.totalKicks} />
              <StatCard label="FG Made" value={stats.fieldGoals.made ?? 0} />
              {fgPercent !== null && <StatCard label="FG %" value={`${fgPercent}%`} />}
              <StatCard label="Punts" value={stats.punts.total ?? 0} />
              {stats.punts.avgDistance != null && stats.punts.avgDistance > 0 && (
                <StatCard label="Avg Punt" value={`${Math.round(stats.punts.avgDistance ?? 0)}yd`} />
              )}
              <StatCard label="Kickoffs" value={stats.kickoffs.total ?? 0} />
              <StatCard label="Touchbacks" value={stats.kickoffs.touchbacks ?? 0} />
            </View>
          </View>
        )}

        <KickHistoryList />
      </ScrollView>
    </View>
  );
}
