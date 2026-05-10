import React, { useState } from "react";
import {
  Alert,
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
  useGetSeasons,
  useCreateSeason,
  useDeleteSeason,
  useGetGames,
  useCreateGame,
  useDeleteGame,
  useUpdateGame,
  getGetSeasonsQueryKey,
  getGetGamesQueryKey,
} from "@workspace/api-client-react";
import type { Game, Season } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AthleteBar } from "@/components/AthleteBar";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Surface = "grass" | "turf";
type HomeAway = "home" | "away";
type WeatherCond = "clear" | "cloudy" | "rain" | "snow" | "dome";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function formatScore(game: Game): string {
  if (game.myScore != null && game.opponentScore != null) {
    const won = game.myScore > game.opponentScore;
    return `${won ? "W" : "L"} ${game.myScore}-${game.opponentScore}`;
  }
  return "Final score TBD";
}

export default function GamesScreen() {
  const colors = useColors();
  const { activeAthleteId } = useApp();
  const queryClient = useQueryClient();

  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);

  // Season modal
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [seasonName, setSeasonName] = useState("");
  const [seasonYear, setSeasonYear] = useState(String(new Date().getFullYear()));

  // Game modal
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameSeasonId, setGameSeasonId] = useState("");
  const [gameOpponent, setGameOpponent] = useState("");
  const [gameDate, setGameDate] = useState(new Date().toISOString().slice(0, 10));
  const [gameHomeAway, setGameHomeAway] = useState<HomeAway>("home");
  const [gameSurface, setGameSurface] = useState<Surface>("grass");
  const [gameWeatherCond, setGameWeatherCond] = useState<WeatherCond>("clear");
  const [gameWindMph, setGameWindMph] = useState("");
  const [gameIsPlayoff, setGameIsPlayoff] = useState(false);

  // Score modal
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [scoringGame, setScoringGame] = useState<Game | null>(null);
  const [myScore, setMyScore] = useState("");
  const [oppScore, setOppScore] = useState("");

  const seasonsQuery = useGetSeasons(
    { athleteId: activeAthleteId ?? "" },
    {
      query: {
        queryKey: getGetSeasonsQueryKey({ athleteId: activeAthleteId ?? "" }),
        enabled: !!activeAthleteId,
      },
    },
  );

  const gamesQuery = useGetGames(
    { seasonId: expandedSeason ?? "" },
    {
      query: {
        queryKey: getGetGamesQueryKey({ seasonId: expandedSeason ?? "" }),
        enabled: !!expandedSeason,
      },
    },
  );

  const createSeasonMutation = useCreateSeason();
  const deleteSeasonMutation = useDeleteSeason();
  const createGameMutation = useCreateGame();
  const deleteGameMutation = useDeleteGame();
  const updateGameMutation = useUpdateGame();

  const invalidateSeasons = () => queryClient.invalidateQueries({ queryKey: getGetSeasonsQueryKey() });
  const invalidateGames = () => queryClient.invalidateQueries({ queryKey: getGetGamesQueryKey() });

  const handleCreateSeason = async () => {
    if (!activeAthleteId) return;
    if (!seasonName.trim()) { Alert.alert("Missing", "Enter a season name."); return; }
    const yr = parseInt(seasonYear, 10);
    if (isNaN(yr)) { Alert.alert("Missing", "Enter a valid year."); return; }
    await createSeasonMutation.mutateAsync({ data: { athleteId: activeAthleteId, name: seasonName.trim(), year: yr } });
    invalidateSeasons();
    setSeasonName("");
    setSeasonYear(String(new Date().getFullYear()));
    setShowSeasonModal(false);
  };

  const handleDeleteSeason = (season: Season) => {
    Alert.alert("Delete Season", `Delete "${season.name}" and all its games?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          await deleteSeasonMutation.mutateAsync({ id: season.id });
          invalidateSeasons();
          if (expandedSeason === season.id) setExpandedSeason(null);
        },
      },
    ]);
  };

  const handleCreateGame = async () => {
    if (!activeAthleteId) return;
    await createGameMutation.mutateAsync({
      data: {
        seasonId: gameSeasonId,
        athleteId: activeAthleteId,
        opponent: gameOpponent.trim() || null,
        date: gameDate,
        homeAway: gameHomeAway,
        surface: gameSurface,
        weather: {
          conditions: gameWeatherCond,
          windMph: gameWindMph ? parseInt(gameWindMph, 10) : null,
          windDir: null,
        },
        isPlayoff: gameIsPlayoff,
      },
    });
    invalidateGames();
    setShowGameModal(false);
    resetGameForm();
  };

  const resetGameForm = () => {
    setGameOpponent("");
    setGameDate(new Date().toISOString().slice(0, 10));
    setGameHomeAway("home");
    setGameSurface("grass");
    setGameWeatherCond("clear");
    setGameWindMph("");
    setGameIsPlayoff(false);
  };

  const handleDeleteGame = (game: Game) => {
    Alert.alert("Delete Game", "Delete this game and all its kicks?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive", onPress: async () => {
          await deleteGameMutation.mutateAsync({ id: game.id });
          invalidateGames();
        },
      },
    ]);
  };

  const handleSaveScore = async () => {
    if (!scoringGame) return;
    await updateGameMutation.mutateAsync({
      id: scoringGame.id,
      data: {
        myScore: myScore ? parseInt(myScore, 10) : null,
        opponentScore: oppScore ? parseInt(oppScore, 10) : null,
      },
    });
    invalidateGames();
    setShowScoreModal(false);
    setScoringGame(null);
  };

  const seasons = seasonsQuery.data ?? [];
  const games = gamesQuery.data ?? [];

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 1, textTransform: "uppercase" },
    addBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 8 },
    addBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
    card: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    seasonRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
    seasonName: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    seasonYear: { fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginRight: 8 },
    divider: { height: 1, backgroundColor: colors.border },
    gameRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 4 },
    gameTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    gameMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    gameActions: { flexDirection: "row", gap: 10, marginTop: 4 },
    scoreBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.secondary, borderRadius: 7, borderWidth: 1, borderColor: colors.border },
    scoreBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: colors.foreground },
    emptyText: { padding: 20, textAlign: "center", fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground },
    // Modal
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
    sheet: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 14, borderTopWidth: 1, borderColor: colors.border },
    sheetHandle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 8 },
    sheetTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground },
    label: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4 },
    input: { backgroundColor: colors.input, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground },
    toggleRow: { flexDirection: "row", gap: 8 },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", borderWidth: 1.5 },
    toggleBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    gridRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: colors.primary },
    saveBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
    cancelBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center" },
    cancelBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.mutedForeground },
    playoffRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    checkBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    playoffLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground },
  });

  const WEATHER_OPTIONS: WeatherCond[] = ["clear", "cloudy", "rain", "snow", "dome"];
  const WEATHER_LABELS: Record<WeatherCond, string> = { clear: "Clear", cloudy: "Cloudy", rain: "Rain", snow: "Snow", dome: "Dome" };

  return (
    <View style={s.screen}>
      <AthleteBar />
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        {/* Seasons list */}
        <View style={s.headerRow}>
          <Text style={s.sectionTitle}>Seasons</Text>
          <Pressable style={s.addBtn} onPress={() => setShowSeasonModal(true)}>
            <Feather name="plus" size={14} color="#fff" />
            <Text style={s.addBtnText}>New Season</Text>
          </Pressable>
        </View>

        {seasons.length === 0 ? (
          <View style={[s.card, { padding: 20, alignItems: "center" }]}>
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>No seasons yet. Add one to get started.</Text>
          </View>
        ) : (
          seasons.map((season) => (
            <View key={season.id} style={s.card}>
              <Pressable
                style={s.seasonRow}
                onPress={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
              >
                <Text style={s.seasonName}>{season.name}</Text>
                <Text style={s.seasonYear}>{season.year}</Text>
                <Pressable onPress={() => handleDeleteSeason(season)} hitSlop={8} style={{ marginRight: 8 }}>
                  <Feather name="trash-2" size={15} color={colors.destructive} />
                </Pressable>
                <Feather name={expandedSeason === season.id ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
              </Pressable>

              {expandedSeason === season.id && (
                <>
                  <View style={s.divider} />
                  <Pressable
                    style={[s.addBtn, { margin: 12, alignSelf: "flex-start" }]}
                    onPress={() => { setGameSeasonId(season.id); setShowGameModal(true); }}
                  >
                    <Feather name="plus" size={13} color="#fff" />
                    <Text style={s.addBtnText}>Add Game</Text>
                  </Pressable>

                  {games.length === 0 ? (
                    <Text style={s.emptyText}>No games yet.</Text>
                  ) : (
                    games.map((game, i) => (
                      <View key={game.id}>
                        {i > 0 && <View style={s.divider} />}
                        <View style={s.gameRow}>
                          <Text style={s.gameTitle}>
                            {game.homeAway === "home" ? "vs" : "@"} {game.opponent ?? "TBD"}
                            {game.isPlayoff ? " 🏆" : ""}
                          </Text>
                          <Text style={s.gameMeta}>
                            {formatDate(game.date)} · {game.surface} · {game.homeAway}
                          </Text>
                          {game.weather && (
                            <Text style={s.gameMeta}>
                              {game.weather.conditions ?? ""}
                              {game.weather.windMph ? `  · ${game.weather.windMph} mph wind` : ""}
                            </Text>
                          )}
                          <Text style={[s.gameMeta, { color: game.myScore != null ? (game.myScore >= (game.opponentScore ?? 0) ? colors.success : colors.destructive) : colors.mutedForeground }]}>
                            {formatScore(game)}
                          </Text>
                          <View style={s.gameActions}>
                            <Pressable style={s.scoreBtn} onPress={() => { setScoringGame(game); setMyScore(game.myScore != null ? String(game.myScore) : ""); setOppScore(game.opponentScore != null ? String(game.opponentScore) : ""); setShowScoreModal(true); }}>
                              <Feather name="edit-2" size={12} color={colors.foreground} />
                              <Text style={s.scoreBtnText}>Score</Text>
                            </Pressable>
                            <Pressable style={s.scoreBtn} onPress={() => handleDeleteGame(game)}>
                              <Feather name="trash-2" size={12} color={colors.destructive} />
                              <Text style={[s.scoreBtnText, { color: colors.destructive }]}>Delete</Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* New Season Modal */}
      <Modal visible={showSeasonModal} transparent animationType="slide" onRequestClose={() => setShowSeasonModal(false)}>
        <Pressable style={s.overlay} onPress={() => setShowSeasonModal(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>New Season</Text>
            <View>
              <Text style={s.label}>Season Name</Text>
              <TextInput style={s.input} value={seasonName} onChangeText={setSeasonName} placeholder="e.g. 2025 Fall" placeholderTextColor={colors.mutedForeground} />
            </View>
            <View>
              <Text style={s.label}>Year</Text>
              <TextInput style={s.input} value={seasonYear} onChangeText={setSeasonYear} keyboardType="numeric" maxLength={4} placeholderTextColor={colors.mutedForeground} />
            </View>
            <Pressable style={s.saveBtn} onPress={handleCreateSeason}>
              <Text style={s.saveBtnText}>Create Season</Text>
            </Pressable>
            <Pressable style={s.cancelBtn} onPress={() => setShowSeasonModal(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* New Game Modal */}
      <Modal visible={showGameModal} transparent animationType="slide" onRequestClose={() => setShowGameModal(false)}>
        <Pressable style={s.overlay} onPress={() => setShowGameModal(false)}>
          <ScrollView>
            <Pressable style={[s.sheet, { paddingBottom: 40 }]} onPress={(e) => e.stopPropagation()}>
              <View style={s.sheetHandle} />
              <Text style={s.sheetTitle}>Add Game</Text>

              <View>
                <Text style={s.label}>Opponent</Text>
                <TextInput style={s.input} value={gameOpponent} onChangeText={setGameOpponent} placeholder="Opponent name" placeholderTextColor={colors.mutedForeground} />
              </View>

              <View>
                <Text style={s.label}>Date (YYYY-MM-DD)</Text>
                <TextInput style={s.input} value={gameDate} onChangeText={setGameDate} placeholder="2025-09-05" placeholderTextColor={colors.mutedForeground} />
              </View>

              <View>
                <Text style={s.label}>Home / Away</Text>
                <View style={s.toggleRow}>
                  {(["home", "away"] as HomeAway[]).map((v) => (
                    <Pressable key={v} style={[s.toggleBtn, { backgroundColor: gameHomeAway === v ? colors.primary : colors.secondary, borderColor: gameHomeAway === v ? colors.primary : colors.border }]} onPress={() => setGameHomeAway(v)}>
                      <Text style={[s.toggleBtnText, { color: gameHomeAway === v ? "#fff" : colors.mutedForeground }]}>{v === "home" ? "Home" : "Away"}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text style={s.label}>Surface</Text>
                <View style={s.toggleRow}>
                  {(["grass", "turf"] as Surface[]).map((v) => (
                    <Pressable key={v} style={[s.toggleBtn, { backgroundColor: gameSurface === v ? colors.primary : colors.secondary, borderColor: gameSurface === v ? colors.primary : colors.border }]} onPress={() => setGameSurface(v)}>
                      <Text style={[s.toggleBtnText, { color: gameSurface === v ? "#fff" : colors.mutedForeground }]}>{v === "grass" ? "Grass" : "Turf"}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text style={s.label}>Weather</Text>
                <View style={s.gridRow}>
                  {WEATHER_OPTIONS.map((w) => (
                    <Pressable key={w} style={[s.toggleBtn, { flex: 0, paddingHorizontal: 14, backgroundColor: gameWeatherCond === w ? colors.primary : colors.secondary, borderColor: gameWeatherCond === w ? colors.primary : colors.border }]} onPress={() => setGameWeatherCond(w)}>
                      <Text style={[s.toggleBtnText, { color: gameWeatherCond === w ? "#fff" : colors.mutedForeground }]}>{WEATHER_LABELS[w]}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text style={s.label}>Wind Speed (mph)</Text>
                <TextInput style={s.input} value={gameWindMph} onChangeText={setGameWindMph} keyboardType="numeric" maxLength={3} placeholder="0" placeholderTextColor={colors.mutedForeground} />
              </View>

              <Pressable style={s.playoffRow} onPress={() => setGameIsPlayoff(!gameIsPlayoff)}>
                <View style={[s.checkBox, { backgroundColor: gameIsPlayoff ? colors.primary : "transparent", borderColor: gameIsPlayoff ? colors.primary : colors.border }]}>
                  {gameIsPlayoff && <Feather name="check" size={14} color="#fff" />}
                </View>
                <Text style={s.playoffLabel}>Playoff Game</Text>
              </Pressable>

              <Pressable style={s.saveBtn} onPress={handleCreateGame}>
                <Text style={s.saveBtnText}>Add Game</Text>
              </Pressable>
              <Pressable style={s.cancelBtn} onPress={() => setShowGameModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </Pressable>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Modal>

      {/* Score Modal */}
      <Modal visible={showScoreModal} transparent animationType="slide" onRequestClose={() => setShowScoreModal(false)}>
        <Pressable style={s.overlay} onPress={() => setShowScoreModal(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Final Score</Text>
            <View style={s.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Our Score</Text>
                <TextInput style={s.input} value={myScore} onChangeText={setMyScore} keyboardType="numeric" maxLength={3} placeholder="0" placeholderTextColor={colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>Their Score</Text>
                <TextInput style={s.input} value={oppScore} onChangeText={setOppScore} keyboardType="numeric" maxLength={3} placeholder="0" placeholderTextColor={colors.mutedForeground} />
              </View>
            </View>
            <Pressable style={s.saveBtn} onPress={handleSaveScore}>
              <Text style={s.saveBtnText}>Save Score</Text>
            </Pressable>
            <Pressable style={s.cancelBtn} onPress={() => setShowScoreModal(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
