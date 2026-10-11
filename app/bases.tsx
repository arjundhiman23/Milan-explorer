import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/store/useStore";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import { searchPhoton } from "@/lib/photon";
import { colors, radius, space } from "@/theme/tokens";
import type { Place } from "@/types";

export default function BasesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const bases = useStore((s) => s.bases);
  const activeId = useStore((s) => s.settings.activeBaseId);
  const addBase = useStore((s) => s.addBase);
  const updateBase = useStore((s) => s.updateBase);
  const removeBase = useStore((s) => s.removeBase);
  const setActiveBase = useStore((s) => s.setActiveBase);
  const { locate } = useLiveLocation();

  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [label, setLabel] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addr, setAddr] = useState("");
  const [hits, setHits] = useState<Place[]>([]);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    abort.current?.abort();
    if (addr.trim().length < 3) { setHits([]); return; }
    const c = new AbortController(); abort.current = c;
    const t = setTimeout(() => searchPhoton(addr, undefined, 6, c.signal).then((r) => !c.signal.aborted && setHits(r)).catch(() => {}), 350);
    return () => { clearTimeout(t); c.abort(); };
  }, [addr]);

  const startEdit = (id: string | "new") => {
    const b = bases.find((x) => x.id === id);
    setEditing(id); setLabel(b?.label ?? ""); setCoords(b ? { lat: b.lat, lng: b.lng } : null); setAddr(""); setHits([]);
  };
  const save = () => {
    if (!label.trim() || !coords) return;
    if (editing === "new") { const id = addBase({ label: label.trim(), ...coords }); setActiveBase(id); toast("Base added", "home"); }
    else if (editing) { updateBase(editing, { label: label.trim(), ...coords }); toast("Base updated"); }
    setEditing(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.marble }}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => (editing ? setEditing(null) : router.back())} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close"><Ionicons name={editing ? "arrow-back" : "close"} size={22} color={colors.ink} /></Pressable>
        <Text v="heading">{editing === "new" ? "New base" : editing ? "Edit base" : "Bases"}</Text>
        <View style={{ width: 22 }} />
      </View>

      {editing ? (
        <ScrollView contentContainerStyle={{ padding: space.xl, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          <Field label="Name" value={label} onChangeText={setLabel} placeholder="e.g. Nonna's flat, Comasina" />
          <Text v="label" color={colors.inkMuted} style={{ marginBottom: 6 }}>Where is it?</Text>
          <View style={[styles.coordBox, coords && { borderColor: colors.verdigris }]}>
            <Ionicons name={coords ? "checkmark-circle" : "location-outline"} size={18} color={coords ? colors.verdigris : colors.inkMuted} />
            <Text v="small" color={coords ? colors.ink : colors.inkMuted} style={{ marginLeft: 8, flex: 1 }}>{coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : "Pick an address below or use your current location"}</Text>
          </View>
          <Button small title="Use current location" icon="navigate-outline" variant="secondary" style={{ alignSelf: "flex-start", marginVertical: 12 }}
            onPress={async () => { const l = await locate(); if (l) setCoords(l); else toast("Location unavailable"); }} />
          <Field label="Search an address" value={addr} onChangeText={setAddr} placeholder="Via Santa Sofia 9" />
          {hits.map((h) => (
            <Pressable key={h.id} onPress={() => { setCoords({ lat: h.lat, lng: h.lng }); if (!label) setLabel(h.name); setHits([]); setAddr(""); }} style={styles.hit} accessibilityRole="button">
              <Text v="bodyMedium">{h.name}</Text>
              <Text v="small" color={colors.inkMuted}>{[h.address, h.neighbourhood].filter(Boolean).join(", ")}</Text>
            </Pressable>
          ))}
          <Button title="Save base" onPress={save} disabled={!label.trim() || !coords} style={{ marginTop: space.xl }} />
          {editing !== "new" && bases.length > 1 && (
            <Button title="Delete this base" variant="danger" onPress={() => { removeBase(editing); setEditing(null); }} style={{ marginTop: 10 }} />
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: space.xl, paddingBottom: insets.bottom + 32 }}>
          <Text v="small" color={colors.inkMuted} style={{ marginBottom: 12 }}>A base is where distances are measured from. Switch between them from the map.</Text>
          {bases.map((b) => (
            <View key={b.id} style={styles.baseRow}>
              <Pressable onPress={() => { setActiveBase(b.id); toast(`Now exploring from ${b.label}`); }} style={{ flexDirection: "row", alignItems: "center", flex: 1 }} accessibilityRole="button" accessibilityLabel={`Use ${b.label}`}>
                <Ionicons name={b.id === activeId ? "radio-button-on" : "radio-button-off"} size={20} color={colors.ink} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text v="bodyMedium">{b.label}</Text>
                  <Text v="small" color={colors.inkFaint}>{b.lat.toFixed(4)}, {b.lng.toFixed(4)}</Text>
                </View>
              </Pressable>
              <Pressable onPress={() => startEdit(b.id)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Edit ${b.label}`}><Ionicons name="create-outline" size={20} color={colors.inkMuted} /></Pressable>
            </View>
          ))}
          <Button title="Add a base" icon="add" variant="secondary" onPress={() => startEdit("new")} style={{ marginTop: space.lg }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.xl, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  baseRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.line },
  coordBox: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 12 },
  hit: { backgroundColor: colors.white, borderRadius: radius.md, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.line },
});
