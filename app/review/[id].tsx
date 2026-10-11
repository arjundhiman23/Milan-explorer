import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Stars } from "@/components/ui/Stars";
import { useToast } from "@/components/ui/Toast";
import { usePlace } from "@/hooks/usePlaces";
import { useStore } from "@/store/useStore";
import { SUGGESTED_TAGS, VERDICTS } from "@/data/categories";
import { colors, radius, space, verdictColors } from "@/theme/tokens";
import { pickPhotos, resolvePhoto } from "@/lib/photos";
import type { Verdict } from "@/types";
import { useEffect } from "react";

type V = Exclude<Verdict, "want">;
const today = () => new Date().toISOString().slice(0, 10);

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const item = usePlace(id);
  const logVisit = useStore((s) => s.logVisit);
  const setStamp = useStore((s) => s.setStamp);
  const u = item?.user;

  const [rating, setRating] = useState(u?.rating ?? 0);
  const [verdict, setVerdict] = useState<V | null>(u && u.verdict !== "want" ? (u.verdict as V) : null);
  const [date, setDate] = useState(u?.visitedAt ? u.visitedAt.slice(0, 10) : today());
  const [note, setNote] = useState(u?.note ?? "");
  const [tags, setTags] = useState<string[]>(u?.tags ?? []);
  const [photos, setPhotos] = useState<string[]>(u?.photoUris ?? []);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    photos.forEach((p) => { if (!previews[p]) resolvePhoto(p).then((r) => r && setPreviews((prev) => ({ ...prev, [p]: r }))); });
  }, [photos]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) return null;
  const canSave = rating > 0 && !!verdict && /^\d{4}-\d{2}-\d{2}$/.test(date);

  const save = () => {
    if (!canSave || !verdict) return;
    const visitedAt = new Date(`${date}T12:00:00`).toISOString();
    logVisit(item.place.id, { rating, verdict, note, tags, photoUris: photos, visitedAt });
    setStamp(item.place.id);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast(u?.visitedAt ? "Visit updated" : "Visit logged", "checkmark-circle");
    router.back();
  };

  const addPhotos = async () => {
    const picked = await pickPhotos();
    if (picked.length) setPhotos((p) => [...p, ...picked].slice(0, 6));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.marble }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancel"><Text v="bodyMedium" color={colors.inkMuted}>Cancel</Text></Pressable>
        <Text v="label" color={colors.inkMuted}>{u?.visitedAt ? "Edit visit" : "Log a visit"}</Text>
        <Pressable onPress={save} disabled={!canSave} hitSlop={10} accessibilityRole="button" accessibilityLabel="Save visit"><Text v="bodyMedium" color={canSave ? colors.ink : colors.inkFaint}>Save</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: space.xl, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Text v="heading">{item.place.name}</Text>
        <Text v="small" color={colors.inkMuted} style={{ marginTop: 4 }}>How was it, honestly?</Text>

        <View style={styles.block}>
          <Text v="label" color={colors.inkMuted} style={styles.blockLabel}>Rating</Text>
          <Stars value={rating} onChange={(v) => { setRating(v); if (Platform.OS !== "web") Haptics.selectionAsync(); }} size={34} />
        </View>

        <View style={styles.block}>
          <Text v="label" color={colors.inkMuted} style={styles.blockLabel}>Verdict</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {VERDICTS.filter((v) => v.id !== "want").map((v) => {
              const on = verdict === v.id;
              const c = verdictColors[v.id];
              return (
                <Pressable key={v.id} onPress={() => setVerdict(v.id as V)} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={[styles.verdict, { borderColor: on ? c : colors.line, backgroundColor: on ? c : colors.white }]}>
                  <Ionicons name={v.icon as any} size={20} color={on ? colors.white : c} />
                  <Text v="smallMedium" color={on ? colors.white : colors.ink} style={{ marginTop: 6 }} center>{v.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.block}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text v="label" color={colors.inkMuted} style={styles.blockLabel}>Visit date</Text>
            {date !== today() && <Pressable onPress={() => setDate(today())}><Text v="smallMedium" color={colors.slate}>Today</Text></Pressable>}
          </View>
          <Field value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" accessibilityLabel="Visit date" />
        </View>

        <View style={styles.block}>
          <Text v="label" color={colors.inkMuted} style={styles.blockLabel}>Private note</Text>
          <Field value={note} onChangeText={setNote} multiline placeholder="What you'd tell yourself next time: what to order, where to sit, who to bring…" accessibilityLabel="Note" />
        </View>

        <View style={styles.block}>
          <Text v="label" color={colors.inkMuted} style={styles.blockLabel}>Tags</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {[...new Set([...SUGGESTED_TAGS, ...tags])].map((t) => {
              const on = tags.includes(t);
              return (
                <Pressable key={t} onPress={() => setTags((x) => (on ? x.filter((y) => y !== t) : [...x, t]))} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={[styles.tag, on && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
                  <Text v="smallMedium" color={on ? colors.marble : colors.ink}>{t}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.block}>
          <Text v="label" color={colors.inkMuted} style={styles.blockLabel}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {photos.map((p) => (
              <Pressable key={p} onPress={() => setPhotos((x) => x.filter((y) => y !== p))} accessibilityRole="button" accessibilityLabel="Remove photo" style={styles.photoWrap}>
                {previews[p] ? <Image source={{ uri: previews[p] }} style={styles.photo} /> : <View style={styles.photo} />}
                <View style={styles.photoX}><Ionicons name="close" size={12} color={colors.white} /></View>
              </Pressable>
            ))}
            {photos.length < 6 && (
              <Pressable onPress={addPhotos} accessibilityRole="button" accessibilityLabel="Add photos" style={[styles.photo, styles.addPhoto]}>
                <Ionicons name="image-outline" size={22} color={colors.inkMuted} />
                <Text v="label" color={colors.inkMuted} style={{ marginTop: 4 }}>Add</Text>
              </Pressable>
            )}
          </ScrollView>
          <Text v="small" color={colors.inkFaint} style={{ marginTop: 8 }}>Photos stay private to your account. The photo library is only opened when you tap Add.</Text>
        </View>

        <Button title={u?.visitedAt ? "Save changes" : "Save visit"} onPress={save} disabled={!canSave} style={{ marginTop: space.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.xl, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  block: { marginTop: space.xl },
  blockLabel: { marginBottom: 10 },
  verdict: { flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: radius.md, borderWidth: 1 },
  tag: { height: 34, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, justifyContent: "center" },
  photoWrap: { position: "relative" },
  photo: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.marbleDeep },
  photoX: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  addPhoto: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line, borderStyle: "dashed", backgroundColor: colors.white },
});
