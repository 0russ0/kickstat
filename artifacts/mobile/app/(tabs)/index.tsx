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
import { KickTypeToggle } from "@/components/KickTypeToggle";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Outcome = "made" | "missed" | null;
type MissType = "left" | "right" | "short" | "blocked" | "bad_snap";

const MISS_TYPES: { value: MissType; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "short", label: "Short" },
  { value: "blocked", label: "Blocked" },
  { value: "bad_snap", label: "Bad Snap" },
];

export default function FieldGoalScreen() {
  const colors = useColors();
  const { activeAthleteId, recordKick } = useApp();

  const [los, setLos] = useState("");
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [missType, setMissType] = useState<MissType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalDistance = los ? Number(los) + 17 : null;

  const reset = () => {
    setLos("");
    setOutcome(null);
    setMissType(null);
  };

  const handleSubmit = async () => {
    if (!activeAthleteId) {
      Alert.alert("No Athlete", "Please select an athlete first.");
      return;
    }
    if (!los || isNaN(Number(los))) {
      Alert.alert("Missing Info", "Please enter the line of scrimmage.");
      return;
    }
    if (!outcome) {
      Alert.alert("Missing Info", "Please select an outcome.");
      return;
    }
    if (outcome === "missed" && !missType) {
      Alert.alert("Missing Info", "Please select a miss type.");
      return;
    }

    setSubmitting(true);
    try {
      await recordKick({
        athleteId: activeAthleteId,
        kickType: "field_goal",
        data: {
          los: Number(los),
          totalDistance: Number(los) + 17,
          outcome,
          missType: outcome === "missed" ? missType : null,
        },
      });
      Haptics.notificationAsync(
        outcome === "made"
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
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
    losRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    input: {
      flex: 1,
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
    arrow: {
      fontSize: 18,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    distanceBox: {
      flex: 1,
      backgroundColor: colors.secondary,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    distanceLabel: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    distanceValue: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
    },
    outcomesRow: { flexDirection: "row", gap: 10 },
    outcomeBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1.5,
    },
    outcomeBtnText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.3,
    },
    missGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    missBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
    },
    missBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    submitBtn: {
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    submitText: {
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.3,
    },
  });

  return (
    <View style={s.screen}>
      <AthleteBar />
      <KickTypeToggle active="fg" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <Text style={s.cardTitle}>Field Goal</Text>

            <View>
              <Text style={[s.cardTitle, { marginBottom: 6 }]}>LOS</Text>
              <TextInput
                style={s.input}
                value={los}
                onChangeText={setLos}
                placeholder="—"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            <View>
              <Text style={[s.cardTitle, { marginBottom: 8 }]}>Outcome</Text>
              <View style={s.outcomesRow}>
                <Pressable
                  style={[
                    s.outcomeBtn,
                    {
                      backgroundColor: outcome === "made" ? colors.success : colors.secondary,
                      borderColor: outcome === "made" ? colors.success : colors.border,
                    },
                  ]}
                  onPress={() => { setOutcome("made"); setMissType(null); }}
                >
                  <Text style={[s.outcomeBtnText, { color: outcome === "made" ? "#fff" : colors.mutedForeground }]}>
                    Made
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    s.outcomeBtn,
                    {
                      backgroundColor: outcome === "missed" ? colors.destructive : colors.secondary,
                      borderColor: outcome === "missed" ? colors.destructive : colors.border,
                    },
                  ]}
                  onPress={() => setOutcome("missed")}
                >
                  <Text style={[s.outcomeBtnText, { color: outcome === "missed" ? "#fff" : colors.mutedForeground }]}>
                    Missed
                  </Text>
                </Pressable>
              </View>
            </View>

            {outcome === "missed" && (
              <View>
                <Text style={[s.cardTitle, { marginBottom: 8 }]}>Miss Type</Text>
                <View style={s.missGrid}>
                  {MISS_TYPES.map((m) => (
                    <Pressable
                      key={m.value}
                      style={[
                        s.missBtn,
                        {
                          backgroundColor: missType === m.value ? colors.primary : colors.secondary,
                          borderColor: missType === m.value ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setMissType(m.value)}
                    >
                      <Text style={[s.missBtnText, { color: missType === m.value ? "#fff" : colors.mutedForeground }]}>
                        {m.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
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
              {submitting ? "Saving..." : "Record Kick"}
            </Text>
          </Pressable>

          <KickHistoryList kickType="field_goal" />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
