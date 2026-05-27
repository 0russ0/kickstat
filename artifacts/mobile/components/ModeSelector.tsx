import React, { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useGetSeasons, useGetGames, getGetSeasonsQueryKey, getGetGamesQueryKey } from "@workspace/api-client-react";
import type { Game } from "@workspace/api-client-react";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function formatGameLabel(game: Game): string {
  const opp = game.opponent ?? "Unknown Opponent";
  const ha = game.homeAway === "home" ? "vs" : "@";
  const score =
    game.myScore != null && game.opponentScore != null
      ? `  ${game.myScore}-${game.opponentScore}`
      : "";
  return `${ha} ${opp}${score}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ModeSelector() {
  const colors = useColors();
  const { activeAthleteId, kickMode, setKickMode, activeGame, setActiveGame } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);

  const { data: seasons = [] } = useGetSeasons(
    { athleteId: activeAthleteId ?? "" },
    {
      query: {
        queryKey: getGetSeasonsQueryKey({ athleteId: activeAthleteId ?? "" }),
        enabled: !!activeAthleteId && showModal,
      },
    },
  );

  const { data: games = [] } = useGetGames(
    { seasonId: expandedSeason ?? "" },
    {
      query: {
        queryKey: getGetGamesQueryKey({ seasonId: expandedSeason ?? "" }),
        enabled: !!expandedSeason,
      },
    },
  );

  const s = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 10,
      gap: 8,
    },
    toggle: {
      flexDirection: "row",
      backgroundColor: colors.secondary,
      borderRadius: 10,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pill: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 7,
    },
    pillText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
    gameChip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.secondary,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    gameChipText: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.foreground,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    sheet: {
      backgroundColor: colors.card,
      borderRadius: 20,
      maxHeight: "70%",
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    sheetHandle: {
      display: "none",
      width: 0,
      height: 0,
    },
    sheetTitle: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    seasonRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    seasonName: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    gameRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    gameLabel: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    gameDate: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginRight: 8,
    },
    emptyText: {
      padding: 20,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });

  const handleSelectGame = (game: Game) => {
    setActiveGame(game);
    setShowModal(false);
  };

  return (
    <>
      <View style={s.row}>
        {/* Practice / Game toggle */}
        <View style={s.toggle}>
          <Pressable
            style={[s.pill, { backgroundColor: kickMode === "practice" ? colors.primary : "transparent" }]}
            onPress={() => setKickMode("practice")}
          >
            <Text style={[s.pillText, { color: kickMode === "practice" ? "#fff" : colors.mutedForeground }]}>
              Practice
            </Text>
          </Pressable>
          <Pressable
            style={[s.pill, { backgroundColor: kickMode === "game" ? colors.primary : "transparent" }]}
            onPress={() => { setKickMode("game"); if (!activeGame) setShowModal(true); }}
          >
            <Text style={[s.pillText, { color: kickMode === "game" ? "#fff" : colors.mutedForeground }]}>
              Game
            </Text>
          </Pressable>
        </View>

        {/* Active game chip */}
        {kickMode === "game" && (
          <Pressable style={s.gameChip} onPress={() => setShowModal(true)}>
            <Feather name="zap" size={13} color={activeGame ? colors.primary : colors.mutedForeground} />
            <Text style={s.gameChipText} numberOfLines={1}>
              {activeGame ? formatGameLabel(activeGame) : "Select a game…"}
            </Text>
            <Feather name="chevron-down" size={13} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Game picker modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <Pressable style={s.overlay} onPress={() => setShowModal(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Select a Game</Text>
            <ScrollView>
              {seasons.length === 0 ? (
                <Text style={s.emptyText}>No seasons found. Create one in the Games tab.</Text>
              ) : (
                seasons.map((season) => (
                  <View key={season.id}>
                    <Pressable
                      style={s.seasonRow}
                      onPress={() => setExpandedSeason(expandedSeason === season.id ? null : season.id)}
                    >
                      <Text style={s.seasonName}>{season.name}</Text>
                      <Feather
                        name={expandedSeason === season.id ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                    {expandedSeason === season.id && (
                      games.length === 0 ? (
                        <Text style={s.emptyText}>No games in this season yet.</Text>
                      ) : (
                        games.map((game) => (
                          <Pressable
                            key={game.id}
                            style={s.gameRow}
                            onPress={() => handleSelectGame(game)}
                          >
                            <Text style={s.gameDate}>{formatDate(game.date)}</Text>
                            <Text
                              style={[
                                s.gameLabel,
                                { color: activeGame?.id === game.id ? colors.primary : colors.foreground },
                              ]}
                              numberOfLines={1}
                            >
                              {formatGameLabel(game)}
                              {game.isPlayoff ? " 🏆" : ""}
                            </Text>
                            {activeGame?.id === game.id && (
                              <Feather name="check" size={16} color={colors.primary} />
                            )}
                          </Pressable>
                        ))
                      )
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
