import type { BaseLocation } from "@/types";

export const DEFAULT_BASES: BaseLocation[] = [
  { id: "santa-sofia", label: "Santa Sofia residence", lat: 45.4581, lng: 9.1938, isDefault: true },
  { id: "festa-del-perdono", label: "Campus · Festa del Perdono", lat: 45.4606, lng: 9.1943 },
  { id: "conservatorio", label: "Campus · Via Conservatorio", lat: 45.4648, lng: 9.2012 },
  { id: "comasina", label: "Comasina", lat: 45.5245, lng: 9.1625 },
];

export const MILAN_CENTER: [number, number] = [9.1900, 45.4642];
