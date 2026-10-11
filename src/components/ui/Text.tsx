import { Text as RNText, type TextProps, StyleSheet } from "react-native";
import { colors, type as typeScale } from "@/theme/tokens";

type Variant = keyof typeof typeScale;
interface Props extends TextProps { v?: Variant; color?: string; center?: boolean }

export function Text({ v = "body", color = colors.ink, center, style, ...rest }: Props) {
  return <RNText {...rest} style={[typeScale[v], { color }, center && styles.center, style]} />;
}
const styles = StyleSheet.create({ center: { textAlign: "center" } });
