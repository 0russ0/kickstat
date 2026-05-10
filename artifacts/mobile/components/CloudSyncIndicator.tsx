import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export function CloudSyncIndicator() {
  const { isSyncing } = useApp();
  const colors = useColors();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isSyncing) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
        false,
      );
    } else {
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [isSyncing, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: isSyncing ? colors.warning : colors.success,
          },
          animStyle,
        ]}
      />
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {isSyncing ? "Syncing" : "Synced"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
