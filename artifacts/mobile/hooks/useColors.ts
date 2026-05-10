import { useTheme } from "@/context/ThemeContext";
import colors from "@/constants/colors";

export function useColors() {
  const { resolvedTheme } = useTheme();
  const palette = resolvedTheme === "light" ? colors.light : colors.dark;
  return { ...palette, radius: colors.radius };
}
