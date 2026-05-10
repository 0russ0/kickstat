import React, { useState } from "react";
import {
  Alert,
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

export function AthleteBar() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { athletes, activeAthleteId, setActiveAthleteId, isSyncing, addAthlete } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (athletes.length >= 3) {
      Alert.alert("Max Athletes", "You can only have 3 athletes.");
      return;
    }
    await addAthlete(trimmed);
    setNewName("");
    setShowAddModal(false);
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
    syncRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginTop: 4,
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
  });

  return (
    <View style={styles.container}>
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
          <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)}>
            <Feather name="plus" size={20} color={colors.foreground} />
          </Pressable>
        )}
      </View>

      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={[modalStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[modalStyles.title, { color: colors.foreground }]}>Add Athlete</Text>
            <TextInput
              style={[
                modalStyles.input,
                {
                  backgroundColor: colors.input,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Athlete name"
              placeholderTextColor={colors.mutedForeground}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <View style={modalStyles.row}>
              <Pressable
                style={[modalStyles.btn, { backgroundColor: colors.secondary }]}
                onPress={() => { setShowAddModal(false); setNewName(""); }}
              >
                <Text style={[modalStyles.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[modalStyles.btn, { backgroundColor: colors.primary }]}
                onPress={handleAdd}
              >
                <Text style={[modalStyles.btnText, { color: colors.primaryForeground }]}>Add</Text>
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
