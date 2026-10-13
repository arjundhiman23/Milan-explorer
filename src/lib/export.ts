import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useStore, activeUserPlaces } from "@/store/useStore";
import { VERDICTS } from "@/data/categories";

export function buildExportJson(): string {
  const s = useStore.getState();
  const ups = activeUserPlaces(s);
  const places = ups.map((u) => s.places[u.placeId]).filter(Boolean);
  return JSON.stringify({ app: "milan-explorer", version: 1, exportedAt: new Date().toISOString(), bases: s.bases.filter((b) => !b.deletedAt), places, userPlaces: ups }, null, 2);
}

export function buildExportCsv(): string {
  const s = useStore.getState();
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["name", "category", "neighbourhood", "address", "lat", "lng", "status", "rating", "visited_at", "saved_at", "note", "tags"];
  const rows = activeUserPlaces(s).map((u) => {
    const p = s.places[u.placeId];
    return [p?.name, p?.category, p?.neighbourhood, p?.address, p?.lat, p?.lng,
      VERDICTS.find((v) => v.id === u.verdict)?.label, u.rating, u.visitedAt, u.savedAt, u.note, u.tags?.join("; ")].map(esc).join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

export async function exportData(format: "json" | "csv") {
  const content = format === "json" ? buildExportJson() : buildExportCsv();
  const name = `milan-explorer-${new Date().toISOString().slice(0, 10)}.${format}`;
  const mime = format === "json" ? "application/json" : "text/csv";
  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new File(Paths.cache, name);
  file.write(content);
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: mime, dialogTitle: "Export Milan Explorer data" });
}

export function parseImport(text: string) {
  const json = JSON.parse(text);
  if (json?.app !== "milan-explorer") throw new Error("Not a Milan Explorer export");
  return { userPlaces: json.userPlaces ?? [], places: json.places ?? [], bases: json.bases ?? [] };
}
