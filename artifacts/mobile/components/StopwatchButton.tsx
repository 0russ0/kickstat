import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { formatHangtime } from "@/hooks/useStopwatch";

interface StopwatchButtonProps {
  elapsed: number;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  label?: string;
}

export function StopwatchButton({
  elapsed,
  isRunning,
  onToggle,
  onReset,
  label = "Hangtime",
}: StopwatchButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.92, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    onToggle();
  };

  const btnColor = isRunning ? colors.warning : colors.secondary;
  const textColor = isRunning ? "#000" : colors.foreground;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Animated.View style={animStyle}>
        <Pressable
          style={[
            styles.btn,
            {
              backgroundColor: btnColor,
              borderColor: isRunning ? colors.warning : colors.border,
            },
          ]}
          onPressIn={Platform.OS !== "web" ? handlePress : undefined}
          onPress={Platform.OS === "web" ? handlePress : undefined}
        >
          <Feather
            name={isRunning ? "square" : "play"}
            size={36}
            color={textColor}
          />
          <Text style={[styles.time, { color: textColor }]}>
            {formatHangtime(elapsed)}
          </Text>
        </Pressable>
      </Animated.View>
      {elapsed > 0 && !isRunning && (
        <Pressable style={styles.resetBtn} onPress={onReset}>
          <Feather name="refresh-ccw" size={14} color={colors.mutedForeground} />
          <Text style={[styles.resetText, { color: colors.mutedForeground }]}>Reset</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 24,
    paddingHorizontal: 42,
    borderRadius: 16,
    borderWidth: 1.5,
    minWidth: 270,
    justifyContent: "center",
  },
  time: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resetText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
