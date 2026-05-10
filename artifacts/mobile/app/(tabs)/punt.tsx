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
import { StopwatchButton } from "@/components/StopwatchButton";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useStopwatch } from "@/hooks/useStopwatch";

type SnapSide = "own" | "opponent";

export default function PuntScreen() {
  const colors = useColors();
  const { activeAthleteId, recordKick } = useApp();
  const stopwatch = useStopwatch();

  const [snapYard, setSnapYard] = useState("");
  const [landingYard, setLandingYard] = useState("");
  const [snapSide, setSnapSide] = useState<SnapSide>("own");
  const [submitting, setSubmitting] = useState(false);

  const snapN = Number(snapYard);
  const landN = Number(landingYard);
  const distance =
    snapYard && landingYard && !isNaN(snapN) && !isNaN(landN)
      ? Math.abs(landN - snapN)
      : null;

  const reset = () => {
    setSnapYard("");
    setLandingYard("");
    setSnapSide("own");
    stopwatch.reset();
  };

  const handleSubmit = async () => {
    if (!activeAthleteId) {
      Alert.alert("No Athlete", "Please select an athlete first.");
      return;
    }
    if (!snapYard || isNaN(snapN)) {
      Alert.alert("Missing Info", "Please enter the snap yard line.");
      return;
    }
    if (!landingYard || isNaN(landN)) {
      Alert.alert("Missing Info", "Please enter the landing yard.");
      return;
    }

    setSubmitting(true);
    const finalHangtime = stopwatch.isRunning ? stopwatch.stop() : stopwatch.elapsed;
    try {
      await recordKick({
        athleteId: activeAthleteId,
        kickType: "punt",
        data: {
          snapYard: snapN,
          snapSide,
          landingYard: landN,
          distance: Math.abs(landN - snapN),
          hangtime: finalHangtime,
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
    content: { padding: 16, gap: 20, paddingBottom: 40 },
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
    toggleRow: { flexDirection: "row", gap: 8 },
    toggleBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 1.5,
    },
    toggleBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    yardRow: { flexDirection: "row", gap: 12 },
    yardBox: { flex: 1, gap: 6 },
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
      padding: 16,
      alignItems: "center",
      gap: 4,
    },
    distanceValue: {
      fontSize: 36,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
      letterSpacing: -1,
    },
    distanceUnit: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    submitBtn: {
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
    },
    submitText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.3,
    },
    stopwatchCenter: { alignItems: "center" },
  });

  return (
    <View style={s.screen}>
      <AthleteBar />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <Text style={s.cardTitle}>Punt</Text>

            <View>
              <Text style={[s.cardTitle, { marginBottom: 8 }]}>Snap Side</Text>
              <View style={s.toggleRow}>
                {(["own", "opponent"] as SnapSide[]).map((side) => (
                  <Pressable
                    key={side}
                    style={[
                      s.toggleBtn,
                      {
                        backgroundColor: snapSide === side ? colors.primary : colors.secondary,
                        borderColor: snapSide === side ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSnapSide(side)}
                  >
                    <Text style={[s.toggleBtnText, { color: snapSide === side ? "#fff" : colors.mutedForeground }]}>
                      {side === "own" ? "Own Side" : "Opp Side"}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={s.yardRow}>
              <View style={s.yardBox}>
                <Text style={s.cardTitle}>Snap Yard</Text>
                <TextInput
                  style={s.input}
                  value={snapYard}
                  onChangeText={setSnapYard}
                  placeholder="—"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
              <View style={s.yardBox}>
                <Text style={s.cardTitle}>Landing Yard</Text>
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
            </View>

            {distance !== null && (
              <View style={s.distanceCard}>
                <Text style={s.distanceUnit}>Punt Distance</Text>
                <Text style={s.distanceValue}>{distance}yd</Text>
              </View>
            )}

            <View style={s.stopwatchCenter}>
              <StopwatchButton
                elapsed={stopwatch.elapsed}
                isRunning={stopwatch.isRunning}
                onToggle={() => stopwatch.toggle()}
                onReset={stopwatch.reset}
                label="Hangtime"
              />
            </View>
          </View>

          <Pressable
            style={[s.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={[s.submitText, { color: colors.primaryForeground }]}>
              {submitting ? "Saving..." : "Record Punt"}
            </Text>
          </Pressable>

          <KickHistoryList kickType="punt" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
