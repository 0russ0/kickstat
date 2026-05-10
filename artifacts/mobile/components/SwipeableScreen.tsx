import React from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useRouter } from "expo-router";

const TAB_ROUTES = [
  "/(tabs)/",
  "/(tabs)/punt",
  "/(tabs)/kickoff",
  "/(tabs)/practice",
  "/(tabs)/more",
];

interface Props {
  children: React.ReactNode;
  tabIndex: number;
}

export function SwipeableScreen({ children, tabIndex }: Props) {
  const router = useRouter();

  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-25, 25])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      if (e.velocityX < -400 && e.translationX < -40 && tabIndex < TAB_ROUTES.length - 1) {
        router.navigate(TAB_ROUTES[tabIndex + 1] as never);
      } else if (e.velocityX > 400 && e.translationX > 40 && tabIndex > 0) {
        router.navigate(TAB_ROUTES[tabIndex - 1] as never);
      }
    });

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={styles.fill}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
