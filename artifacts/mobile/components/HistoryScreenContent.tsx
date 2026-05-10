import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { AthleteBar } from "@/components/AthleteBar";
import { KickHistoryList } from "@/components/KickHistoryList";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { formatHangtime } from "@/hooks/useStopwatch";
import {
  useGetKicks,
  useGetGames,
  useGetSeasons,
  getGetKicksQueryKey,
  getGetGamesQueryKey,
  getGetSeasonsQueryKey,
} from "@workspace/api-client-react";
import type { Kick, Game } from "@workspace/api-client-react";

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

function formatGameDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatScore(game: Game): string | null {
  if (game.myScore != null && game.opponentScore != null) {
    const won = game.myScore > game.opponentScore;
    return `${won ? "W" : "L"} ${game.myScore}–${game.opponentScore}`;
  }
  return null;
}

function computeStats(kicks: KickRecord[]) {
  const fgKicks = kicks.filter((k) => k.kickType === "field_goal");
  const puntKicks = kicks.filter((k) => k.kickType === "punt");
  const koKicks = kicks.filter((k) => k.kickType === "kickoff");

  const fgTotal = fgKicks.length;
  const fgMade = fgKicks.filter((k) => (k.data as Record<string, unknown>)["outcome"] === "made").length;
  const fgMadeDistances = fgKicks
    .filter((k) => (k.data as Record<string, unknown>)["outcome"] === "made")
    .map((k) => (k.data as Record<string, unknown>)["totalDistance"] as number)
    .filter((d): d is number => d != null && !isNaN(d));
  const fgAllDistances = fgKicks
    .map((k) => (k.data as Record<string, unknown>)["totalDistance"] as number)
    .filter((d): d is number => d != null && !isNaN(d));
  const fgAvgDist = fgAllDistances.length > 0 ? fgAllDistances.reduce((a, b) => a + b, 0) / fgAllDistances.length : null;
  const fgLongest = fgMadeDistances.length > 0 ? Math.max(...fgMadeDistances) : null;
  const fgGameWinners = fgKicks.filter((k) => k.isGameWinner === true).length;

  const puntTotal = puntKicks.length;
  const puntDistances = puntKicks
    .map((k) => (k.data as Record<string, unknown>)["distance"] as number | null)
    .filter((d): d is number => d != null && d > 0);
  const puntAvgDist = puntDistances.length > 0 ? puntDistances.reduce((a, b) => a + b, 0) / puntDistances.length : null;
  const puntLongest = puntDistances.length > 0 ? Math.max(...puntDistances) : null;
  const puntHangtimes = puntKicks
    .map((k) => (k.data as Record<string, unknown>)["hangtime"] as number)
    .filter((h): h is number => h != null && h > 0);
  const puntAvgHangtime = puntHangtimes.length > 0 ? puntHangtimes.reduce((a, b) => a + b, 0) / puntHangtimes.length : null;

  const koTotal = koKicks.length;
  const koTouchbacks = koKicks.filter((k) => (k.data as Record<string, unknown>)["touchback"] === true).length;
  const koHangtimes = koKicks
    .map((k) => (k.data as Record<string, unknown>)["hangtime"] as number)
    .filter((h): h is number => h != null && h > 0);
  const koAvgHangtime = koHangtimes.length > 0 ? koHangtimes.reduce((a, b) => a + b, 0) / koHangtimes.length : null;

  const patKicks = kicks.filter((k) => k.kickType === "pat");
  const patTotal = patKicks.length;
  const patMade = patKicks.filter((k) => (k.data as Record<string, unknown>)["outcome"] === "made").length;

  return {
    total: kicks.length,
    fg: { total: fgTotal, made: fgMade, avgDist: fgAvgDist, longest: fgLongest, gameWinners: fgGameWinners },
    punt: { total: puntTotal, avgDist: puntAvgDist, longest: puntLongest, avgHangtime: puntAvgHangtime },
    ko: { total: koTotal, touchbacks: koTouchbacks, avgHangtime: koAvgHangtime },
    pat: { total: patTotal, made: patMade },
  };
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9 }}>
      <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{label}</Text>
      <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{value}</Text>
    </View>
  );
}

function pct(made: number, total: number): string {
  if (total === 0) return "—";
  return `${Math.round((made / total) * 100)}%`;
}

function avg(val: number | null, unit: string): string {
  if (val == null) return "—";
  return `${Math.round(val)}${unit}`;
}

function Divider() {
  const colors = useColors();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

function SectionCard({ title, children, empty }: { title: string; children?: React.ReactNode; empty?: boolean }) {
  const colors = useColors();
  return (
    <View>
      <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{title}</Text>
      <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: empty ? 16 : 4 }}>
        {empty ? <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" }}>No kicks recorded</Text> : children}
      </View>
    </View>
  );
}

function FGStatsCard({ stats }: { stats: ReturnType<typeof computeStats>["fg"] }) {
  if (stats.total === 0) return <SectionCard title="Field Goals" empty />;
  return (
    <SectionCard title="Field Goals">
      <StatRow label="Attempts" value={stats.total} />
      <Divider /><StatRow label="Made" value={`${stats.made} / ${stats.total}`} />
      <Divider /><StatRow label="FG %" value={pct(stats.made, stats.total)} />
      <Divider /><StatRow label="Avg Distance" value={avg(stats.avgDist, "yd")} />
      <Divider /><StatRow label="Longest FG" value={stats.longest != null ? `${stats.longest}yd` : "—"} />
      <Divider /><StatRow label="Game Winners" value={stats.gameWinners} />
    </SectionCard>
  );
}

function PuntStatsCard({ stats }: { stats: ReturnType<typeof computeStats>["punt"] }) {
  if (stats.total === 0) return <SectionCard title="Punts" empty />;
  return (
    <SectionCard title="Punts">
      <StatRow label="Total Punts" value={stats.total} />
      {stats.avgDist != null && <><Divider /><StatRow label="Avg Distance" value={avg(stats.avgDist, "yd")} /></>}
      {stats.longest != null && <><Divider /><StatRow label="Longest Punt" value={`${stats.longest}yd`} /></>}
      {stats.avgHangtime != null && <><Divider /><StatRow label="Avg Hangtime" value={formatHangtime(stats.avgHangtime)} /></>}
    </SectionCard>
  );
}

function PATStatsCard({ stats }: { stats: ReturnType<typeof computeStats>["pat"] }) {
  if (stats.total === 0) return <SectionCard title="PAT" empty />;
  return (
    <SectionCard title="PAT">
      <StatRow label="Attempts" value={stats.total} />
      <Divider /><StatRow label="Made" value={`${stats.made} / ${stats.total}`} />
      <Divider /><StatRow label="PAT %" value={pct(stats.made, stats.total)} />
    </SectionCard>
  );
}

function KOStatsCard({ stats }: { stats: ReturnType<typeof computeStats>["ko"] }) {
  if (stats.total === 0) return <SectionCard title="Kickoffs" empty />;
  return (
    <SectionCard title="Kickoffs">
      <StatRow label="Total Kickoffs" value={stats.total} />
      <Divider /><StatRow label="Touchbacks" value={`${stats.touchbacks} / ${stats.total}`} />
      <Divider /><StatRow label="Touchback %" value={pct(stats.touchbacks, stats.total)} />
      {stats.avgHangtime != null && <><Divider /><StatRow label="Avg Hangtime" value={formatHangtime(stats.avgHangtime)} /></>}
    </SectionCard>
  );
}

function GameInfoCard({ game, seasonName }: { game: Game; seasonName?: string }) {
  const colors = useColors();
  const score = formatScore(game);
  const scoreColor = game.myScore != null && game.opponentScore != null
    ? game.myScore > game.opponentScore ? colors.success : colors.destructive
    : colors.mutedForeground;
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground }}>
          {game.homeAway === "home" ? "vs" : "@"} {game.opponent ?? "TBD"}
        </Text>
        {game.isPlayoff && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: colors.warning + "22" }}>
            <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.warning }}>Playoff</Text>
          </View>
        )}
      </View>
      <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
        {formatGameDate(game.date)}{seasonName ? `  ·  ${seasonName}` : ""}
      </Text>
      <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
        {game.homeAway === "home" ? "Home" : "Away"}  ·  {game.surface}
        {game.weather?.conditions ? `  ·  ${game.weather.conditions}` : ""}
        {game.weather?.windMph ? `  ${game.weather.windMph} mph` : ""}
      </Text>
      {score && <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: scoreColor }}>{score}</Text>}
    </View>
  );
}

function GamePicker({ games, seasonMap, selectedId, onSelect }: {
  games: Game[]; seasonMap: Record<string, string>; selectedId: string | null; onSelect: (id: string | null) => void;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const selected = games.find((g) => g.id === selectedId);
  const label = selected
    ? `${selected.homeAway === "home" ? "vs" : "@"} ${selected.opponent ?? "TBD"}  ·  ${formatGameDate(selected.date)}`
    : games.length === 0 ? "No games recorded yet" : "Select a game…";

  return (
    <>
      <Pressable
        style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 11, gap: 8 }}
        onPress={() => games.length > 0 && setOpen(true)}
      >
        <Feather name="calendar" size={16} color={colors.primary} />
        <Text style={{ flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground }} numberOfLines={1}>{label}</Text>
        {games.length > 0 && <Feather name="chevron-down" size={16} color={colors.mutedForeground} />}
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }} onPress={() => setOpen(false)}>
          <Pressable style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: colors.border, maxHeight: "70%" }} onPress={(e) => e.stopPropagation()}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
            <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textAlign: "center", letterSpacing: 0.5, textTransform: "uppercase", paddingBottom: 8 }}>Select Game</Text>
            <FlatList
              data={games}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item: game, index }) => {
                const isSelected = selectedId === game.id;
                const sName = game.seasonId ? (seasonMap[game.seasonId] ?? "") : "";
                return (
                  <Pressable
                    style={[{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 12 }, index > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}
                    onPress={() => { onSelect(game.id); setOpen(false); }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>
                        {game.homeAway === "home" ? "vs" : "@"} {game.opponent ?? "TBD"}{game.isPlayoff ? "  🏆" : ""}
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
                        {formatGameDate(game.date)}{sName ? `  ·  ${sName}` : ""}
                      </Text>
                    </View>
                    <View style={{ width: 20, alignItems: "center" }}>
                      {isSelected && <Feather name="check" size={16} color={colors.primary} />}
                    </View>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export function HistoryScreenContent({ onClose }: { onClose: () => void }) {
  const colors = useColors();
  const { activeAthleteId } = useApp();
  const [period, setPeriod] = useState<Period>("career");
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const allKicksParams = { athleteId: activeAthleteId ?? undefined, limit: 1000 };
  const { data: allKicks = [] } = useGetKicks(allKicksParams, { query: { queryKey: getGetKicksQueryKey(allKicksParams), enabled: !!activeAthleteId } });
  const gamesParams = { athleteId: activeAthleteId ?? undefined };
  const { data: allGames = [] } = useGetGames(gamesParams, { query: { queryKey: getGetGamesQueryKey(gamesParams), enabled: !!activeAthleteId } });
  const seasonsParams = { athleteId: activeAthleteId ?? "" };
  const { data: seasons = [] } = useGetSeasons(seasonsParams, { query: { queryKey: getGetSeasonsQueryKey(seasonsParams), enabled: !!activeAthleteId } });

  const seasonMap = useMemo(() => {
    const map: Record<string, string> = {};
    seasons.forEach((s) => { map[s.id] = s.name; });
    return map;
  }, [seasons]);

  const selectedGame = useMemo(
    () => (selectedGameId ? allGames.find((g) => g.id === selectedGameId) ?? null : null),
    [selectedGameId, allGames],
  );

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
        const base = (allKicks as KickRecord[]).filter((k) => k.gameId != null);
        const k = selectedGameId ? base.filter((k) => k.gameId === selectedGameId) : base;
        const lbl = selectedGameId
          ? selectedGame ? `${selectedGame.homeAway === "home" ? "vs" : "@"} ${selectedGame.opponent ?? "TBD"}` : "Game Stats"
          : "All Games";
        return { kicks: k, label: lbl };
      }
      case "season": {
        const cutoff = startOfSeason();
        const k = (allKicks as KickRecord[]).filter((k) => k.gameId != null && new Date(k.createdAt) >= cutoff);
        return { kicks: k, label: `Season Summary (Aug ${cutoff.getFullYear()}–Present)` };
      }
      default: {
        const k = (allKicks as KickRecord[]).filter((kk) => kk.gameId != null);
        return { kicks: k, label: "Career Summary" };
      }
    }
  }, [allKicks, period, selectedGameId, selectedGame]);

  const stats = useMemo(() => computeStats(kicks), [kicks]);

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPadding + 8, paddingHorizontal: 20, paddingBottom: 14,
      backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
      flexDirection: "row", alignItems: "center", gap: 10,
    },
    backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
    headerTitle: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground },
    segWrap: { flexDirection: "row", backgroundColor: colors.secondary, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: colors.border },
    segBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: "center" },
    segLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.2 },
  });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={s.screen}>
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={onClose} hitSlop={8}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={s.headerTitle}>History & Stats</Text>
        </View>
        <AthleteBar />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 60 }}>

          <View>
            <View style={s.segWrap}>
              {PERIODS.map((p) => (
                <Pressable key={p.key} style={[s.segBtn, { backgroundColor: period === p.key ? colors.primary : "transparent" }]} onPress={() => setPeriod(p.key)}>
                  <Text style={[s.segLabel, { color: period === p.key ? colors.primaryForeground : colors.mutedForeground }]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", opacity: 0.6, marginTop: 2 }}>Swipe left/right to change period</Text>
          </View>

          {period === "game" && (
            <GamePicker games={allGames} seasonMap={seasonMap} selectedId={selectedGameId} onSelect={setSelectedGameId} />
          )}

          {period === "game" && selectedGame && (
            <GameInfoCard game={selectedGame} seasonName={selectedGame.seasonId ? seasonMap[selectedGame.seasonId] : undefined} />
          )}

          {period === "game" && !selectedGameId && (
            <View style={{ backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 32, alignItems: "center", gap: 10 }}>
              <Feather name="calendar" size={32} color={colors.mutedForeground} />
              <Text style={{ fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Select a game</Text>
              <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center" }}>
                Use the dropdown above to pick a game and see its kick summary.
              </Text>
            </View>
          )}

          {(period !== "game" || selectedGameId != null) && (
            <>
              <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 2 }}>{label}</Text>
              <View style={{ gap: 12 }}>
                <FGStatsCard stats={stats.fg} />
                <PATStatsCard stats={stats.pat} />
                <PuntStatsCard stats={stats.punt} />
                <KOStatsCard stats={stats.ko} />
              </View>
              <KickHistoryList gameId={period === "game" && selectedGameId ? selectedGameId : undefined} />
            </>
          )}

        </ScrollView>
      </View>
    </GestureDetector>
  );
}
