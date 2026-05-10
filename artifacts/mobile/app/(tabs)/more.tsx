import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import { SwipeableScreen } from "@/components/SwipeableScreen";

function NavRow({
  icon,
  label,
  onPress,
  accent,
  last,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  accent?: string;
  last?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={[
        rowStyles.row,
        { borderBottomColor: colors.border, borderBottomWidth: last ? 0 : 1 },
      ]}
      onPress={onPress}
    >
      <View style={[rowStyles.iconWrap, { backgroundColor: (accent ?? colors.primary) + "22" }]}>
        <Feather name={icon as never} size={18} color={accent ?? colors.primary} />
      </View>
      <Text style={[rowStyles.label, { color: colors.foreground }]}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});

export default function MoreScreen() {
  const colors = useColors();
  const { resolvedTheme, toggleTheme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const isDark = resolvedTheme === "dark";

  const s = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPadding + 8,
      paddingHorizontal: 20,
      paddingBottom: 14,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    content: { padding: 16, gap: 24, paddingBottom: 120 },
    sectionLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    themeRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
    },
    themeIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    themeLabel: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_500Medium",
    },
    pill: {
      flexDirection: "row",
      backgroundColor: colors.secondary,
      borderRadius: 20,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 2,
    },
    pillBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      alignItems: "center",
    },
    pillBtnText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
  });

  return (
    <SwipeableScreen tabIndex={4}>
      <View style={s.screen}>
        <View style={s.header}>
          <Text style={s.headerTitle}>More</Text>
        </View>
        <ScrollView contentContainerStyle={s.content}>

          <View>
            <Text style={s.sectionLabel}>Manage</Text>
            <View style={s.card}>
              <NavRow
                icon="calendar"
                label="Games & Seasons"
                onPress={() => router.navigate("/(tabs)/games" as never)}
              />
              <NavRow
                icon="list"
                label="History & Stats"
                onPress={() => router.navigate("/(tabs)/history" as never)}
                last
              />
            </View>
          </View>

          <View>
            <Text style={s.sectionLabel}>Appearance</Text>
            <View style={s.card}>
              <View style={s.themeRow}>
                <View
                  style={[
                    s.themeIconWrap,
                    { backgroundColor: isDark ? "#1e293b" : "#fef9c3" },
                  ]}
                >
                  <Feather
                    name={isDark ? "moon" : "sun"}
                    size={18}
                    color={isDark ? "#94a3b8" : "#d97706"}
                  />
                </View>
                <Text style={[s.themeLabel, { color: colors.foreground }]}>
                  {isDark ? "Dark Mode" : "Light Mode"}
                </Text>
                <View style={s.pill}>
                  <Pressable
                    style={[
                      s.pillBtn,
                      { backgroundColor: !isDark ? colors.primary : "transparent" },
                    ]}
                    onPress={() => isDark && toggleTheme()}
                  >
                    <Text
                      style={[
                        s.pillBtnText,
                        { color: !isDark ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      Light
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      s.pillBtn,
                      { backgroundColor: isDark ? colors.primary : "transparent" },
                    ]}
                    onPress={() => !isDark && toggleTheme()}
                  >
                    <Text
                      style={[
                        s.pillBtnText,
                        { color: isDark ? "#fff" : colors.mutedForeground },
                      ]}
                    >
                      Dark
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

        </ScrollView>
      </View>
    </SwipeableScreen>
  );
}
