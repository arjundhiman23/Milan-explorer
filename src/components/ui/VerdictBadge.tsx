import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { VERDICTS } from "@/data/categories";
import { verdictColors, colors } from "@/theme/tokens";
import type { Verdict } from "@/types";

export function VerdictBadge({ verdict, light }: { verdict: Verdict; light?: boolean }) {
  const v = VERDICTS.find((x) => x.id === verdict)!;
  const c = verdictColors[verdict];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: light ? colors.white : c + "22", paddingHorizontal: 10, height: 26, borderRadius: 999 }}>
      <Ionicons name={v.icon as any} size={13} color={c} />
      <Text v="label" color={c} style={{ marginLeft: 5 }}>{v.label}</Text>
    </View>
  );
}
