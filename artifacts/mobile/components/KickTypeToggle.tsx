import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";

type KickType = "fg" | "kickoff";

interface Props {
  active: KickType;
}

export function KickTypeToggle({ active }: Props) {
  const colors = useColors();
  const router = useRouter();

  const s = StyleSheet.create({
    container: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginBottom: 12,
      backgroundColor: colors.secondary,
      borderRadius: 12,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pill: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 0.2,
    },
  });

  return (
    <View style={s.container}>
      <Pressable
        style={[
          s.pill,
          { backgroundColor: active === "fg" ? colors.primary : "transparent" },
        ]}
        onPress={() => active !== "fg" && router.replace("/(tabs)")}
      >
        <Text
          style={[
            s.label,
            { color: active === "fg" ? colors.primaryForeground : colors.mutedForeground },
          ]}
        >
          Field Goal
        </Text>
      </Pressable>
      <Pressable
        style={[
          s.pill,
          { backgroundColor: active === "kickoff" ? colors.primary : "transparent" },
        ]}
        onPress={() => active !== "kickoff" && router.replace("/(tabs)/kickoff")}
      >
        <Text
          style={[
            s.label,
            { color: active === "kickoff" ? colors.primaryForeground : colors.mutedForeground },
          ]}
        >
          Kickoff
        </Text>
      </Pressable>
    </View>
  );
}
