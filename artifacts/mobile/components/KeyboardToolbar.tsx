import React from "react";
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  nativeID: string;
}

export function KeyboardToolbar({ nativeID }: Props) {
  const colors = useColors();

  if (Platform.OS !== "ios") return null;

  return (
    <InputAccessoryView nativeID={nativeID}>
      <View style={[s.bar, { backgroundColor: colors.secondary, borderTopColor: colors.border }]}>
        <Pressable style={s.doneBtn} onPress={() => Keyboard.dismiss()} hitSlop={8}>
          <Text style={[s.doneTxt, { color: colors.primary }]}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  doneBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  doneTxt: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
