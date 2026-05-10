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
import { AthleteBar } from "@/components/AthleteBar";
import { KickHistoryList } from "@/components/KickHistoryList";
import { KickTypeToggle } from "@/components/KickTypeToggle";
import { ModeSelector } from "@/components/ModeSelector";
import { StopwatchButton } from "@/components/StopwatchButton";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { SwipeableScreen } from "@/components/SwipeableScreen";
import { useStopwatch } from "@/hooks/useStopwatch";

type TouchbackType = "endzone" | "out_of_endzone";

// practice result: touchback_endzone | touchback_ooe | out_of_bounds | landed (landing yard)
type PracticeResult = "touchback_endzone" | "touchback_ooe" | "out_of_bounds" | null;

export default function KickoffScreen() {
  const colors = useColors();
  const { activeAthleteId, recordKick, kickMode, activeGame, activePracticeSession } = useApp();
  const stopwatch = useStopwatch();

  // --- shared ---
  const [landingYard, setLandingYard] = useState("");

  // --- practice-only state ---
  const [practiceResult, setPracticeResult] = useState<PracticeResult>(null);

  // --- game-only state ---
  const [touchback, setTouchback] = useState<boolean | null>(null);
  const [touchbackType, setTouchbackType] = useState<TouchbackType | null>(null);
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [returnYards, setReturnYards] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPractice = kickMode === "practice";

  const reset = () => {
    setLandingYard("");
    setPracticeResult(null);
    setTouchback(null);
    setTouchbackType(null);
    setOutOfBounds(false);
    setReturnYards("");
    stopwatch.reset();
  };

  const handleSubmit = async () => {
    if (!activeAthleteId) {
      Alert.alert("No Athlete", "Please select an athlete first.");
      return;
    }
    if (kickMode === "game" && !activeGame) {
      Alert.alert("No Game Selected", "Please select a game or switch to Practice mode.");
      return;
    }

    if (isPractice) {
      if (practiceResult === null && !landingYard) {
        Alert.alert("Missing Info", "Select a result or enter the landing yard line.");
        return;
      }
      if (practiceResult === "out_of_bounds" && !landingYard) {
        Alert.alert("Missing Info", "Enter the out-of-bounds yard line.");
        return;
      }
    } else {
      if (touchback === null && !outOfBounds) {
        Alert.alert("Missing Info", "Please select Touchback, Out of Bounds, or Returned.");
        return;
      }
      if (touchback === true && !touchbackType) {
        Alert.alert("Missing Info", "Please select the touchback type.");
        return;
      }
    }

    setSubmitting(true);
    const finalHangtime = stopwatch.isRunning ? stopwatch.stop() : stopwatch.elapsed;
    try {
      if (isPractice) {
        const isTouchback = practiceResult === "touchback_endzone" || practiceResult === "touchback_ooe";
        await recordKick({
          athleteId: activeAthleteId,
          gameId: null,
          practiceSessionId: activePracticeSession ? activePracticeSession.id : null,
          kickType: "kickoff",
          data: {
            touchback: isTouchback,
            touchbackType: practiceResult === "touchback_endzone" ? "endzone" : practiceResult === "touchback_ooe" ? "out_of_endzone" : null,
            outOfBounds: practiceResult === "out_of_bounds" ? true : null,
            hangtime: finalHangtime,
            landingYard: landingYard ? Number(landingYard) : null,
            returnYards: null,
          },
        });
      } else {
        await recordKick({
          athleteId: activeAthleteId,
          gameId: activeGame ? activeGame.id : null,
          practiceSessionId: null,
          kickType: "kickoff",
          data: {
            touchback: touchback ?? false,
            touchbackType: touchback ? touchbackType : null,
            outOfBounds: outOfBounds ? true : null,
            hangtime: finalHangtime,
            landingYard: landingYard ? Number(landingYard) : null,
            returnYards: !touchback && !outOfBounds && returnYards ? Number(returnYards) : null,
          },
        });
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      reset();
    } catch {
      Alert.alert("Error", "Failed to save kick.");
    } finally {
      setSubmitting(false);
    }
  };

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { padding: 16, gap: 16, paddingBottom: 120 },
    card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 16 },
    cardTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 1, textTransform: "uppercase" },
    input: { backgroundColor: colors.input, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" },
    toggleRow: { flexDirection: "row", gap: 10 },
    toggleBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: "center", borderWidth: 1.5 },
    toggleBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
    tbTypeRow: { flexDirection: "row", gap: 10 },
    tbTypeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", borderWidth: 1.5 },
    tbTypeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    practiceRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    practiceBtn: { flex: 1, minWidth: "45%", paddingVertical: 14, borderRadius: 12, alignItems: "center", borderWidth: 1.5 },
    practiceBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },
    stopwatchCenter: { alignItems: "center" },
    submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
    submitText: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  });

  const PRACTICE_RESULTS: { value: PracticeResult; label: string; color: string }[] = [
    { value: "touchback_endzone", label: "Touchback\nEndzone", color: colors.success },
    { value: "touchback_ooe", label: "Touchback\nOut of Endzone", color: colors.success },
    { value: "out_of_bounds", label: "Out of\nBounds", color: colors.primary },
  ];

  return (
  <SwipeableScreen tabIndex={2}>
    <View style={s.screen}>
      <AthleteBar />
      <KickTypeToggle active="kickoff" />
      <ModeSelector />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <Text style={s.cardTitle}>Kickoff</Text>

            <View style={s.stopwatchCenter}>
              <StopwatchButton elapsed={stopwatch.elapsed} isRunning={stopwatch.isRunning} onToggle={() => stopwatch.toggle()} onReset={stopwatch.reset} label="Hangtime" />
            </View>

            {/* ── PRACTICE MODE ── */}
            {isPractice && (
              <>
                <View>
                  <Text style={[s.cardTitle, { marginBottom: 10 }]}>Result</Text>
                  <View style={s.practiceRow}>
                    {PRACTICE_RESULTS.map((r) => {
                      const active = practiceResult === r.value;
                      return (
                        <Pressable
                          key={r.value!}
                          style={[s.practiceBtn, { backgroundColor: active ? r.color : colors.secondary, borderColor: active ? r.color : colors.border }]}
                          onPress={() => setPracticeResult(active ? null : r.value)}
                        >
                          <Text style={[s.practiceBtnText, { color: active ? "#fff" : colors.mutedForeground }]}>{r.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text style={[s.cardTitle, { marginBottom: 6 }]}>
                    {practiceResult === "out_of_bounds" ? "Out-of-Bounds Yard Line" : "Landing Yard Line (optional)"}
                  </Text>
                  <TextInput
                    style={s.input}
                    value={landingYard}
                    onChangeText={setLandingYard}
                    placeholder="—"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </>
            )}

            {/* ── GAME MODE ── */}
            {!isPractice && (
              <>
                <View>
                  <Text style={[s.cardTitle, { marginBottom: 10 }]}>Result</Text>
                  <View style={s.toggleRow}>
                    <Pressable
                      style={[s.toggleBtn, { backgroundColor: touchback === true ? colors.success : colors.secondary, borderColor: touchback === true ? colors.success : colors.border }]}
                      onPress={() => { setTouchback(true); setOutOfBounds(false); setReturnYards(""); }}
                    >
                      <Text style={[s.toggleBtnText, { color: touchback === true ? "#fff" : colors.mutedForeground }]}>Touchback</Text>
                    </Pressable>
                    <Pressable
                      style={[s.toggleBtn, { backgroundColor: outOfBounds ? colors.primary : colors.secondary, borderColor: outOfBounds ? colors.primary : colors.border }]}
                      onPress={() => { setOutOfBounds(!outOfBounds); setTouchback(null); setTouchbackType(null); setReturnYards(""); }}
                    >
                      <Text style={[s.toggleBtnText, { color: outOfBounds ? "#fff" : colors.mutedForeground }]}>Out of Bounds</Text>
                    </Pressable>
                    <Pressable
                      style={[s.toggleBtn, { backgroundColor: touchback === false && !outOfBounds ? colors.primary : colors.secondary, borderColor: touchback === false && !outOfBounds ? colors.primary : colors.border }]}
                      onPress={() => { setTouchback(false); setTouchbackType(null); setOutOfBounds(false); }}
                    >
                      <Text style={[s.toggleBtnText, { color: touchback === false && !outOfBounds ? "#fff" : colors.mutedForeground }]}>Returned</Text>
                    </Pressable>
                  </View>
                </View>

                {touchback === true && (
                  <View>
                    <Text style={[s.cardTitle, { marginBottom: 10 }]}>Touchback Type</Text>
                    <View style={s.tbTypeRow}>
                      {(["endzone", "out_of_endzone"] as TouchbackType[]).map((t) => (
                        <Pressable key={t} style={[s.tbTypeBtn, { backgroundColor: touchbackType === t ? colors.primary : colors.secondary, borderColor: touchbackType === t ? colors.primary : colors.border }]} onPress={() => setTouchbackType(t)}>
                          <Text style={[s.tbTypeBtnText, { color: touchbackType === t ? "#fff" : colors.mutedForeground }]}>{t === "endzone" ? "Endzone" : "Out of Endzone"}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                <View>
                  <Text style={[s.cardTitle, { marginBottom: 6 }]}>
                    {outOfBounds ? "Out-of-Bounds Yard Line (optional)" : "Landing Yard Line (optional)"}
                  </Text>
                  <TextInput
                    style={s.input}
                    value={landingYard}
                    onChangeText={setLandingYard}
                    placeholder="—"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>

                {touchback === false && !outOfBounds && (
                  <View>
                    <Text style={[s.cardTitle, { marginBottom: 6 }]}>Return Yards</Text>
                    <TextInput style={s.input} value={returnYards} onChangeText={setReturnYards} placeholder="—" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" maxLength={3} />
                  </View>
                )}
              </>
            )}
          </View>

          <Pressable style={[s.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]} onPress={handleSubmit} disabled={submitting}>
            <Text style={[s.submitText, { color: colors.primaryForeground }]}>{submitting ? "Saving..." : "Record Kickoff"}</Text>
          </Pressable>

          <KickHistoryList kickType="kickoff" gameId={kickMode === "game" && activeGame ? activeGame.id : undefined} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  </SwipeableScreen>
  );
}
