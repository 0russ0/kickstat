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
import { useStopwatch } from "@/hooks/useStopwatch";

type TouchbackType = "endzone" | "out_of_endzone";

export default function KickoffScreen() {
  const colors = useColors();
  const { activeAthleteId, recordKick, kickMode, activeGame, activePracticeSession } = useApp();
  const stopwatch = useStopwatch();

  const [touchback, setTouchback] = useState<boolean | null>(null);
  const [touchbackType, setTouchbackType] = useState<TouchbackType | null>(null);
  const [landingYard, setLandingYard] = useState("");
  const [returnYards, setReturnYards] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTouchback(null);
    setTouchbackType(null);
    setLandingYard("");
    setReturnYards("");
    stopwatch.reset();
  };

  const handleSubmit = async () => {
    if (!activeAthleteId) { Alert.alert("No Athlete", "Please select an athlete first."); return; }
    if (touchback === null) { Alert.alert("Missing Info", "Please select Touchback or Returned."); return; }
    if (touchback && !touchbackType) { Alert.alert("Missing Info", "Please select the touchback type."); return; }
    if (kickMode === "game" && !activeGame) { Alert.alert("No Game Selected", "Please select a game or switch to Practice mode."); return; }

    setSubmitting(true);
    const finalHangtime = stopwatch.isRunning ? stopwatch.stop() : stopwatch.elapsed;
    try {
      await recordKick({
        athleteId: activeAthleteId,
        gameId: kickMode === "game" && activeGame ? activeGame.id : null,
        practiceSessionId: kickMode === "practice" && activePracticeSession ? activePracticeSession.id : null,
        kickType: "kickoff",
        data: {
          touchback,
          touchbackType: touchback ? touchbackType : null,
          hangtime: finalHangtime,
          landingYard: landingYard ? Number(landingYard) : null,
          returnYards: !touchback && returnYards ? Number(returnYards) : null,
        },
      });
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
    content: { padding: 16, gap: 16, paddingBottom: 40 },
    card: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 16 },
    cardTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 1, textTransform: "uppercase" },
    input: { backgroundColor: colors.input, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 22, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" },
    toggleRow: { flexDirection: "row", gap: 10 },
    toggleBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: "center", borderWidth: 1.5 },
    toggleBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
    tbTypeRow: { flexDirection: "row", gap: 10 },
    tbTypeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center", borderWidth: 1.5 },
    tbTypeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    stopwatchCenter: { alignItems: "center" },
    submitBtn: { paddingVertical: 16, borderRadius: 14, alignItems: "center" },
    submitText: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  });

  return (
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

            <View>
              <Text style={[s.cardTitle, { marginBottom: 6 }]}>Landing Yard Line</Text>
              <TextInput style={s.input} value={landingYard} onChangeText={setLandingYard} placeholder="—" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" maxLength={3} />
            </View>

            <View>
              <Text style={[s.cardTitle, { marginBottom: 10 }]}>Result</Text>
              <View style={s.toggleRow}>
                <Pressable style={[s.toggleBtn, { backgroundColor: touchback === true ? colors.success : colors.secondary, borderColor: touchback === true ? colors.success : colors.border }]} onPress={() => { setTouchback(true); setReturnYards(""); }}>
                  <Text style={[s.toggleBtnText, { color: touchback === true ? "#fff" : colors.mutedForeground }]}>Touchback</Text>
                </Pressable>
                <Pressable style={[s.toggleBtn, { backgroundColor: touchback === false ? colors.primary : colors.secondary, borderColor: touchback === false ? colors.primary : colors.border }]} onPress={() => { setTouchback(false); setTouchbackType(null); }}>
                  <Text style={[s.toggleBtnText, { color: touchback === false ? "#fff" : colors.mutedForeground }]}>Returned</Text>
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

            {touchback === false && (
              <View>
                <Text style={[s.cardTitle, { marginBottom: 6 }]}>Return Yards</Text>
                <TextInput style={s.input} value={returnYards} onChangeText={setReturnYards} placeholder="—" placeholderTextColor={colors.mutedForeground} keyboardType="numeric" maxLength={3} />
              </View>
            )}
          </View>

          <Pressable style={[s.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]} onPress={handleSubmit} disabled={submitting}>
            <Text style={[s.submitText, { color: colors.primaryForeground }]}>{submitting ? "Saving..." : "Record Kickoff"}</Text>
          </Pressable>

          <KickHistoryList kickType="kickoff" gameId={kickMode === "game" && activeGame ? activeGame.id : undefined} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
