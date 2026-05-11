import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = Platform.OS === "web" ? 84 : 49;
const EXTRA_BUFFER = 16;

export function useTabBarHeight(): number {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom + EXTRA_BUFFER;
}
