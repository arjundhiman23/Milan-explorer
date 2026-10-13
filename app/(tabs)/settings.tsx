import { useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useShallow } from "zustand/react/shallow";
import { useStore, activeBases } from "@/store/useStore";
import { CATEGORIES } from "@/data/categories";
import { colors, radius, space } from "@/theme/tokens";
import { getSupabase } from "@/lib/supabase";
import { syncNow } from "@/lib/sync";
import { exportData, parseImport } from "@/lib/export";
import { formatRadius } from "@/lib/geo";
import { RADII } from "@/types";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { session, configured } = useAuth();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const setRadius = useStore((s) => s.setRadius);
  const bases = useStore(useShallow(activeBases));
  const lastSyncAt = useStore((s) => s.lastSyncAt);
  const dirty = useStore((s) => s.dirty);
  const importData = useStore((s) => s.importData);
  const clearPersonalData = useStore((s) => s.clearPersonalData);
  const [syncing, setSyncing] = useState(false);

  const toggleHidden = (id: (typeof CATEGORIES)[number]["id"]) =>
    setSettings({ hiddenCategories: settings.hiddenCategories.includes(id) ? settings.hiddenCategories.filter((c) => c !== id) : [...settings.hiddenCategories, id] });

  const onSync = async () => {
    setSyncing(true);
    try { await syncNow(); toast("Backed up to your account", "cloud-done-outline"); }
    catch (e: any) { toast(`Sync failed: ${e?.message ?? "check your connection"}`); }
    finally { setSyncing(false); }
  };

  const onImport = async () => {
    if (Platform.OS !== "web") { toast("Import is available on the web build for now"); return; }
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json,application/json";
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return;
      try { importData(parseImport(await f.text())); toast("Import complete", "checkmark-circle"); }
      catch (e: any) { toast(e?.message ?? "Could not read that file"); }
    };
    input.click();
  };

  const confirm = (title: string, body: string, onOk: () => void) => {
    if (Platform.OS === "web") { if (window.confirm(`${title}\n\n${body}`)) onOk(); return; }
    Alert.alert(title, body, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: onOk }]);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40, paddingHorizontal: space.xl }} showsVerticalScrollIndicator={false}>
      <Text v="title">Settings</Text>

      <Section title="Account & backup">
        {!configured ? (
          <Text v="small" color={colors.inkMuted}>Cloud backup is off: no Supabase keys in this build. Everything is saved on this device. Add keys to .env to enable sign-in and sync.</Text>
        ) : session ? (
          <>
            <Row icon="person-circle-outline" label={session.user.email ?? "Signed in"} sub={lastSyncAt ? `Last backed up ${new Date(lastSyncAt).toLocaleString()}${dirty ? " · changes pending" : ""}` : "Not backed up yet"} />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Button small title="Back up now" icon="cloud-upload-outline" variant="secondary" loading={syncing} onPress={onSync} />
              <Button small title="Sign out" variant="ghost" onPress={async () => { await getSupabase()?.auth.signOut(); toast("Signed out"); }} />
            </View>
          </>
        ) : (
          <>
            <Text v="small" color={colors.inkMuted} style={{ marginBottom: 10 }}>Sign in to back up your places, notes and photos and restore them on another phone.</Text>
            <Button small title="Sign in or create account" icon="log-in-outline" onPress={() => router.push("/auth")} style={{ alignSelf: "flex-start" }} />
          </>
        )}
      </Section>

      <Section title="Bases">
        {bases.map((b) => <Row key={b.id} icon="home-outline" label={b.label} sub={b.id === settings.activeBaseId ? "Active" : undefined} />)}
        <Button small title="Manage bases" variant="secondary" icon="create-outline" onPress={() => router.push("/bases")} style={{ alignSelf: "flex-start", marginTop: 8 }} />
      </Section>

      <Section title="Map">
        <Text v="small" color={colors.inkMuted} style={{ marginBottom: 8 }}>Default search radius</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {RADII.map((r) => (
            <Pressable key={r} onPress={() => { setSettings({ defaultRadius: r }); setRadius(r); }} accessibilityRole="button" accessibilityState={{ selected: settings.defaultRadius === r }}
              style={[styles.pill, settings.defaultRadius === r && styles.pillOn]}>
              <Text v="smallMedium" color={settings.defaultRadius === r ? colors.marble : colors.ink}>{formatRadius(r)}</Text>
            </Pressable>
          ))}
        </View>
        <Text v="small" color={colors.inkMuted} style={{ marginTop: 16, marginBottom: 4 }}>Hide categories you don't care about</Text>
        {CATEGORIES.map((c) => (
          <View key={c.id} style={styles.switchRow}>
            <Ionicons name={c.icon as any} size={18} color={colors.inkMuted} />
            <Text v="body" style={{ flex: 1, marginLeft: 12 }}>{c.label}</Text>
            <Switch value={!settings.hiddenCategories.includes(c.id)} onValueChange={() => toggleHidden(c.id)} trackColor={{ true: colors.ink, false: colors.line }} thumbColor={colors.white} accessibilityLabel={`Show ${c.label}`} />
          </View>
        ))}
      </Section>

      <Section title="Motion & accessibility">
        <View style={styles.switchRow}>
          <Ionicons name="pulse-outline" size={18} color={colors.inkMuted} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text v="body">Reduce motion</Text>
            <Text v="small" color={colors.inkMuted}>Turns off camera easing, pulses and the visit stamp.</Text>
          </View>
          <Switch value={settings.reducedMotion} onValueChange={(v) => setSettings({ reducedMotion: v })} trackColor={{ true: colors.ink, false: colors.line }} thumbColor={colors.white} accessibilityLabel="Reduce motion" />
        </View>
      </Section>

      <Section title="Privacy">
        <Text v="small" color={colors.inkMuted}>
          Location is used only when you tap the locate button, to centre the map near you — never in the background. Photos are read only when you choose to attach one. Your notes, ratings and photos are private to your account and never shared. Map tiles come from OpenFreeMap and search from Photon (OpenStreetMap data); those services see the map area and text you search, nothing else.
        </Text>
      </Section>

      <Section title="Your data">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button small title="Export JSON" icon="download-outline" variant="secondary" onPress={() => exportData("json")} />
          <Button small title="Export CSV" icon="grid-outline" variant="secondary" onPress={() => exportData("csv")} />
          <Button small title="Import JSON" icon="push-outline" variant="secondary" onPress={onImport} />
        </View>
        <Button small title="Delete all my places and notes" icon="trash-outline" variant="danger" style={{ alignSelf: "flex-start", marginTop: 12 }}
          onPress={() => confirm("Delete everything?", "All saved places, ratings, notes and photos will be removed from this device and, if signed in, from your backup.", () => { clearPersonalData(); toast("Your places were deleted"); })} />
      </Section>

      <Section title="About">
        <Text v="small" color={colors.inkMuted}>Milan Explorer 1.0 · a personal map, not a directory. Map © <Text v="small" color={colors.slate} onPress={() => Linking.openURL("https://openfreemap.org")}>OpenFreeMap</Text>, data © <Text v="small" color={colors.slate} onPress={() => Linking.openURL("https://www.openstreetmap.org/copyright")}>OpenStreetMap contributors</Text>.</Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text v="heading" style={{ marginBottom: 12 }}>{title}</Text>
      {children}
    </View>
  );
}
function Row({ icon, label, sub }: { icon: any; label: string; sub?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
      <Ionicons name={icon} size={18} color={colors.inkMuted} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text v="body">{label}</Text>
        {sub && <Text v="small" color={colors.inkMuted}>{sub}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: space.xxl, backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: colors.line },
  switchRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  pill: { height: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, justifyContent: "center" },
  pillOn: { backgroundColor: colors.ink, borderColor: colors.ink },
});
