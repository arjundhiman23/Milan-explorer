import type { BaseLocation } from "@/types";

// Newest updatedAt wins per base id; tombstones (deletedAt) take part like any
// other edit, so a deletion beats an older server copy instead of being re-added.
export function mergeBases(local: BaseLocation[], incoming: BaseLocation[]): BaseLocation[] {
  const map = new Map(local.map((b) => [b.id, b]));
  for (const r of incoming) {
    const l = map.get(r.id);
    if (!l || (r.updatedAt ?? "") >= (l.updatedAt ?? "")) map.set(r.id, r);
  }
  return [...map.values()];
}

export function tombstoneBase(bases: BaseLocation[], id: string, at: string): BaseLocation[] {
  return bases.map((b) => (b.id === id ? { ...b, deletedAt: at, updatedAt: at } : b));
}
