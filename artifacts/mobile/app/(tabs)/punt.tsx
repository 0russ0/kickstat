import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { AthleteBar } from "@/components/AthleteBar";
import { KickHistoryList } from "@/components/KickHistoryList";
import { ModeSelector } from "@/components/ModeSelector";
import { StopwatchButton } from "@/components/StopwatchButton";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useStopwatch } from "@/hooks/useStopwatch";

type FieldSide = "own" | "opponent";
type PuntResult =
  | "out_of_bounds"
  | "touchback"
  | "blocked"
  | "fair_catch"
  | "downed"
  | "punt_return";

const RESULTS: { value: PuntResult; label: string }[] = [
  { value: "out_of_bounds", label: "Out of Bounds" },
  { value: "touchback", label: "Touchback" },
  { value: "fair_catch", label: "Fair Catch" },
  { value: "downed", label: "Downed" },
  { value: "punt_return", label: "Punt Return" },
  { value: "blocked", label: "Blocked" },
];

function calcDistance(
  snapYard: number,
  snapSide: FieldSide,
  landYard: number,
  landSide: FieldSide,
): number {
  const snapPos = snapSide === "own" ? snapYard : 100 - snapYard;
  const landPos = landSide === "own" ? landYard : 100 - landYard;
  return Math.max(0, landPos - snapPos);
}

export default function PuntScreen() {
  const colors = useColors();
  const { activeAthleteId, recordKick, kickMode, activeGame, activePracticeSession } = useApp();
  const stopwatch = useStopwatch();

  const [snapYard, setSnapYard] = useState("");
  const [snapSide, setSnapSide] = useState<FieldSide>("own");

  // Landing yard — used for everything except out_of_bounds
  const [landingYard, setLandingYard] = useState("");
  const [landingSide, setLandingSide] = useState<FieldSide>("opponent");

  // OB yard line — only shown when result === "out_of_bounds"
  const [obYard, setObYard] = useState("");
  const [obSide, setObSide] = useState<FieldSide>("opponent");

  const [result, setResult] = useState<PuntResult | null>(null);
  const [badSnap, setBadSnap] = useState(false);
  const [returnYards, setReturnYards] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const snapN = snapYard ? Number(snapYard) : null;
  const isOB = result === "out_of_bounds";

  // Use OB yard when applicable, otherwise landing yard
  const activeLandYard = isOB ? obYard : landingYard;
  const activeLandSide = isOB ? obSide : landingSide;
  const landN = activeLandYard ? Number(activeLandYard) : null;
  const distance =
    snapN !== null && landN !== null && !isNaN(snapN) && !isNaN(landN)
      ? calcDistance(snapN, snapSide, landN, activeLandSide)
      : null;

  const handleResultToggle = (val: PuntResult) => {
    setResult(result === val ? null : val);
    // Clear OB yard when deselecting OB
    if (result === "out_of_bounds" && val === "out_of_bounds") {
      setObYard("");
    }
    // Clear return yards when deselecting punt_return
    if (result === "punt_return" && val === "punt_return") {
      setReturnYards("");
    }
  };

  const reset = () => {
    setSnapYard("");
    setSnapSide("own");
    setLandingYard("");
    setLandingSide("opponent");
    setObYard("");
    setObSide("opponent");
    setResult(null);
    setBadSnap(false);
    setReturnYards("");
    stopwatch.reset();
  };

  const handleSubmit = async () => {
    if (!activeAthleteId) {
      Alert.alert("No Athlete", "Please select an athlete first.");
      return;
    }
    if (!snapYard || snapN === null || isNaN(snapN)) {
      Alert.alert("Missing Info", "Please enter the snap yard line.");
      return;
    }
    if (kickMode === "game" && !activeGame) {
      Alert.alert("No Game Selected", "Please select a game or switch to Practice mode.");
      return;
    }
    if (result === "punt_return" && (!returnYards || isNaN(Number(returnYards)))) {
      Alert.alert("Missing Info", "Please enter the return yards.");
      return;
    }
    if (result === "out_of_bounds" && (!obYard || isNaN(Number(obYard)))) {
      Alert.alert("Missing Info", "Please enter the out-of-bounds yard line.");
      return;
    }

    setSubmitting(true);
    const finalHangtime = stopwatch.isRunning ? stopwatch.stop() : stopwatch.elapsed;
    try {
      await recordKick({
        athleteId: activeAthleteId,
        gameId: kickMode === "game" && activeGame ? activeGame.id : null,
        practiceSessionId: kickMode === "practice" && activePracticeSession ? activePracticeSession.id : null,
        kickType: "punt",
        data: {
          snapYard: snapN,
          snapSide,
          landingYard: isOB ? null : (landN ?? null),
          landingSide: !isOB && landN !== null ? landingSide : null,
          obYard: isOB ? (landN ?? null) : null,
          obSide: isOB ? obSide : null,
          distance: distance ?? null,
          hangtime: finalHangtime,
          result: result ?? null,
          badSnap,
          returnYards: result === "punt_return" && returnYards ? Number(returnYards) : null,
        },
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      reset();
    } catch {
      Alert.alert("Error", "Failed to save punt.");
    } finally {
      setSubmitting(false);
    }
  };

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    },
    cardTitle: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    sideRow: { flexDirection: "row", gap: 8 },
    sideBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 1.5,
    },
    sideBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    yardBox: { gap: 6 },
    input: {
      backgroundColor: colors.input,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      textAlign: "center",
    },
    distanceCard: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      gap: 2,
    },
    distanceValue: {
      fontSize: 34,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
      letterSpacing: -1,
    },
    distanceUnit: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    resultGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    resultBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1.5,
    },
    resultBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    stopwatchCenter: { alignItems: "center" },
    badSnapRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingTop: 4,
    },
    checkBox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    badSnapLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
    submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
    submitText: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  });

  return (
    <View style={s.screen}>
      <AthleteBar />
      <ModeSelector />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.card}>
            <Text style={s.cardTitle}>Punt</Text>

            {/* Snap yard */}
            <View style={s.yardBox}>
              <Text style={s.cardTitle}>Snap Yard Line</Text>
              <View style={[s.sideRow, { marginBottom: 8 }]}>
                {(["own", "opponent"] as FieldSide[]).map((side) => (
                  <Pressable
                    key={side}
                    style={[
                      s.sideBtn,
                      {
                        backgroundColor: snapSide === side ? colors.primary : colors.secondary,
                        borderColor: snapSide === side ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSnapSide(side)}
                  >
                    <Text
                      style={[
                        s.sideBtnText,
                        { color: snapSide === side ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {side === "own" ? "Own Side" : "Opp Side"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={s.input}
                value={snapYard}
                onChangeText={setSnapYard}
                placeholder="—"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            {/* OB yard line — only when out_of_bounds selected */}
            {isOB ? (
              <View style={s.yardBox}>
                <Text style={s.cardTitle}>Out-of-Bounds Yard Line</Text>
                <View style={[s.sideRow, { marginBottom: 8 }]}>
                  {(["own", "opponent"] as FieldSide[]).map((side) => (
                    <Pressable
                      key={side}
                      style={[
                        s.sideBtn,
                        {
                          backgroundColor: obSide === side ? colors.primary : colors.secondary,
                          borderColor: obSide === side ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setObSide(side)}
                    >
                      <Text
                        style={[
                          s.sideBtnText,
                          { color: obSide === side ? "#fff" : colors.mutedForeground },
                        ]}
                      >
                        {side === "own" ? "Own Side" : "Opp Side"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={s.input}
                  value={obYard}
                  onChangeText={setObYard}
                  placeholder="—"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            ) : (
              /* Landing yard — shown for all other results */
              <View style={s.yardBox}>
                <Text style={s.cardTitle}>Landing Yard Line</Text>
                <View style={[s.sideRow, { marginBottom: 8 }]}>
                  {(["own", "opponent"] as FieldSide[]).map((side) => (
                    <Pressable
                      key={side}
                      style={[
                        s.sideBtn,
                        {
                          backgroundColor:
                            landingSide === side ? colors.primary : colors.secondary,
                          borderColor: landingSide === side ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setLandingSide(side)}
                    >
                      <Text
                        style={[
                          s.sideBtnText,
                          { color: landingSide === side ? "#fff" : colors.mutedForeground },
                        ]}
                      >
                        {side === "own" ? "Own Side" : "Opp Side"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={s.input}
                  value={landingYard}
                  onChangeText={setLandingYard}
                  placeholder="—"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            )}

            {/* Distance display */}
            {distance !== null && (
              <View style={s.distanceCard}>
                <Text style={s.distanceUnit}>
                  {isOB ? "Out-of-Bounds Distance" : "Punt Distance"}
                </Text>
                <Text style={s.distanceValue}>{distance}yd</Text>
              </View>
            )}

            {/* Hangtime */}
            <View style={s.stopwatchCenter}>
              <StopwatchButton
                elapsed={stopwatch.elapsed}
                isRunning={stopwatch.isRunning}
                onToggle={() => stopwatch.toggle()}
                onReset={stopwatch.reset}
                label="Hangtime"
              />
            </View>

            {/* Result — Bad Snap removed, now a separate toggle below */}
            <View>
              <Text style={[s.cardTitle, { marginBottom: 10 }]}>Result</Text>
              <View style={s.resultGrid}>
                {RESULTS.map((r) => (
                  <Pressable
                    key={r.value}
                    style={[
                      s.resultBtn,
                      {
                        backgroundColor:
                          result === r.value ? colors.primary : colors.secondary,
                        borderColor: result === r.value ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleResultToggle(r.value)}
                  >
                    <Text
                      style={[
                        s.resultBtnText,
                        { color: result === r.value ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Bad Snap — stackable toggle */}
            <Pressable style={s.badSnapRow} onPress={() => setBadSnap(!badSnap)}>
              <View
                style={[
                  s.checkBox,
                  {
                    backgroundColor: badSnap ? colors.warning : "transparent",
                    borderColor: badSnap ? colors.warning : colors.border,
                  },
                ]}
              >
                {badSnap && <Feather name="check" size={14} color="#fff" />}
              </View>
              <Text style={[s.badSnapLabel, { color: badSnap ? colors.warning : colors.foreground }]}>
                Bad Snap
              </Text>
            </Pressable>

            {/* Return yards — only when punt_return */}
            {result === "punt_return" && (
              <View style={s.yardBox}>
                <Text style={s.cardTitle}>Return Yards</Text>
                <TextInput
                  style={s.input}
                  value={returnYards}
                  onChangeText={setReturnYards}
                  placeholder="—"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            )}
          </View>

          <Pressable
            style={[
              s.submitBtn,
              { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={[s.submitText, { color: colors.primaryForeground }]}>
              {submitting ? "Saving..." : "Record Punt"}
            </Text>
          </Pressable>

          <KickHistoryList
            kickType="punt"
            gameId={kickMode === "game" && activeGame ? activeGame.id : undefined}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
