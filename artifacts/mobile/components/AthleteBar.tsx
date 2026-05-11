import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { CloudSyncIndicator } from "./CloudSyncIndicator";
import type { Athlete } from "@workspace/api-client-react";

type ModalMode = "add" | "edit";

export function AthleteBar() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { athletes, activeAthleteId, setActiveAthleteId, addAthlete, editAthlete, removeAthlete } = useApp();

  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [showModal, setShowModal] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const openAdd = () => {
    setModalMode("add");
    setEditingAthlete(null);
    setNameInput("");
    setShowModal(true);
  };

  const openEdit = (athlete: Athlete) => {
    setModalMode("edit");
    setEditingAthlete(athlete);
    setNameInput(athlete.name);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setNameInput("");
    setEditingAthlete(null);
  };

  const handleSave = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    if (modalMode === "add" && athletes.length >= 3) {
      Alert.alert("Max Athletes", "You can only have 3 athletes.");
      return;
    }
    setSaving(true);
    try {
      if (modalMode === "add") {
        await addAthlete(trimmed);
      } else if (editingAthlete) {
        await editAthlete(editingAthlete.id, trimmed);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleLongPress = (athlete: Athlete) => {
    Alert.alert(
      athlete.name,
      "What would you like to do?",
      [
        { text: "Edit Name", onPress: () => openEdit(athlete) },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Delete Athlete",
              `Remove "${athlete.name}" and all their kicks, sessions, and games? This cannot be undone.`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => removeAthlete(athlete.id) },
              ],
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const styles = StyleSheet.create({
    container: {
      paddingTop: topPadding,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
    },
    athleteBtn: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: colors.radius,
      borderWidth: 1.5,
      alignItems: "center",
    },
    athleteBtnText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.2,
    },
    addBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    hint: {
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      opacity: 0.6,
      textAlign: "center",
      marginTop: 4,
    },
  });

  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center", backgroundColor: colors.background }}>
        <Image
          source={require("../assets/images/logo_Final.png")}
          style={{ width: 200, height: 200 }}
          resizeMode="contain"
        />
      </View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Athlete</Text>
        <CloudSyncIndicator />
      </View>
      <View style={styles.row}>
        {athletes.map((a) => {
          const isActive = a.id === activeAthleteId;
          return (
            <Pressable
              key={a.id}
              style={[
                styles.athleteBtn,
                {
                  backgroundColor: isActive ? colors.primary : colors.secondary,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setActiveAthleteId(a.id)}
              onLongPress={() => handleLongPress(a)}
              delayLongPress={400}
            >
              <Text
                style={[
                  styles.athleteBtnText,
                  { color: isActive ? colors.primaryForeground : colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {a.name}
              </Text>
            </Pressable>
          );
        })}
        {athletes.length < 3 && (
          <Pressable style={styles.addBtn} onPress={openAdd}>
            <Feather name="plus" size={20} color={colors.foreground} />
          </Pressable>
        )}
      </View>
      {athletes.length > 0 && (
        <Text style={styles.hint}>Hold an athlete name to edit or remove</Text>
      )}

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>
              {modalMode === "add" ? "Add Athlete" : "Edit Name"}
            </Text>
            <TextInput
              style={[modalStyles.input, { backgroundColor: colors.input, color: colors.foreground, borderColor: colors.border }]}
              placeholder="Athlete name"
              placeholderTextColor={colors.mutedForeground}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              onSubmitEditing={handleSave}
              returnKeyType="done"
            />
            <View style={modalStyles.row}>
              <Pressable style={[modalStyles.btn, { backgroundColor: colors.secondary }]} onPress={closeModal}>
                <Text style={[modalStyles.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[modalStyles.btn, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving}>
                <Text style={[modalStyles.btnText, { color: colors.primaryForeground }]}>
                  {saving ? "Saving…" : modalMode === "add" ? "Add" : "Save"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
