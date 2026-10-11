import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";
import { Text } from "./Text";
import { colors, fonts, radius, space } from "@/theme/tokens";

interface Props extends TextInputProps { label?: string }
export function Field({ label, style, ...rest }: Props) {
  return (
    <View style={{ marginBottom: space.md }}>
      {label && <Text v="label" color={colors.inkMuted} style={{ marginBottom: 6 }}>{label}</Text>}
      <TextInput placeholderTextColor={colors.inkFaint} {...rest} style={[styles.input, rest.multiline && { minHeight: 96, textAlignVertical: "top", paddingTop: 12 }, style]} />
    </View>
  );
}
const styles = StyleSheet.create({
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, height: 48, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 15, color: colors.ink },
});
