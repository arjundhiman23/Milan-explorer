import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./ui/Text";
import { Stars } from "./ui/Stars";
import { VerdictBadge } from "./ui/VerdictBadge";
import { CATEGORIES } from "@/data/categories";
import { categoryColors, colors, radius, shadow, space } from "@/theme/tokens";
import { formatDistance, walkMinutes } from "@/lib/geo";
import type { PlaceWithMeta } from "@/hooks/usePlaces";

interface Props {
  item: PlaceWithMeta;
  onOpen: () => void;
  onSave?: () => void;
  onVisited?: () => void;
  width?: number;
  compact?: boolean;
}

export const PlaceCard = memo(function PlaceCard({ item, onOpen, onSave, onVisited, width, compact }: Props) {
  const { place, user, distance } = item;
  const cat = CATEGORIES.find((c) => c.id === place.category)!;
  const color = categoryColors[place.category];
  return (
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${place.name}, ${cat.label}, ${formatDistance(distance)} away`}
      style={({ pressed }) => [styles.card, width ? { width } : null, pressed && { transform: [{ scale: 0.985 }] }]}>
      <View style={[styles.band, { backgroundColor: color }]} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons name={cat.icon as any} size={13} color={color} />
            <Text v="label" color={color} style={{ marginLeft: 5 }}>{cat.label}</Text>
            {place.neighbourhood && <Text v="small" color={colors.inkMuted} numberOfLines={1} style={{ marginLeft: 8, flexShrink: 1 }}>{place.neighbourhood}</Text>}
          </View>
          <Text v="smallMedium" color={colors.inkSoft}>{formatDistance(distance)} · {walkMinutes(distance)} min</Text>
        </View>
        <Text v="cardTitle" numberOfLines={1} style={{ marginTop: 6 }}>{place.name}</Text>
        {!compact && place.shortDescription && (
          <Text v="small" color={colors.inkMuted} numberOfLines={2} style={{ marginTop: 4 }}>{place.shortDescription}</Text>
        )}
        <View style={styles.footer}>
          {user ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
              <VerdictBadge verdict={user.verdict} />
              {user.rating ? <Stars value={user.rating} size={13} /> : null}
            </View>
          ) : (
            <Text v="small" color={colors.inkFaint} style={{ flex: 1 }}>Not saved yet</Text>
          )}
          {onSave && !user && (
            <Pressable onPress={onSave} hitSlop={8} accessibilityRole="button" accessibilityLabel="Save to Want to go" style={styles.action}>
              <Ionicons name="bookmark-outline" size={16} color={colors.ink} />
              <Text v="smallMedium" style={{ marginLeft: 5 }}>Save</Text>
            </Pressable>
          )}
          {onVisited && !user?.visitedAt && (
            <Pressable onPress={onVisited} hitSlop={8} accessibilityRole="button" accessibilityLabel="Mark as visited" style={[styles.action, styles.actionDark]}>
              <Ionicons name="checkmark" size={16} color={colors.marble} />
              <Text v="smallMedium" color={colors.marble} style={{ marginLeft: 5 }}>Visited</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: radius.lg, overflow: "hidden", flexDirection: "row", ...shadow.card },
  band: { width: 6 },
  body: { flex: 1, padding: space.lg, paddingLeft: space.md },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footer: { flexDirection: "row", alignItems: "center", marginTop: space.md, gap: 8 },
  action: { flexDirection: "row", alignItems: "center", height: 34, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.marbleDeep },
  actionDark: { backgroundColor: colors.ink },
});
