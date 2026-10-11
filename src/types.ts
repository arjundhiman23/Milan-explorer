export type CategoryId =
  | "cafes" | "food" | "culture" | "outdoors" | "shopping" | "essentials" | "gems";

export type Verdict = "want" | "again" | "once" | "never";

export interface Place {
  id: string;
  name: string;
  category: CategoryId;
  lat: number;
  lng: number;
  address?: string;
  shortDescription?: string;
  neighbourhood?: string;
  hours?: string;
  website?: string;
  priceLevel?: 1 | 2 | 3;
  photo?: string;
  source: "curated" | "photon" | "user";
  sourceUpdatedAt?: string;
  tags?: string[];
}

export interface UserPlace {
  id: string;
  placeId: string;
  verdict: Verdict;
  savedAt?: string;
  visitedAt?: string;
  rating?: number;
  note?: string;
  tags?: string[];
  photoUris?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface BaseLocation {
  id: string;
  label: string;
  lat: number;
  lng: number;
  isDefault?: boolean;
}

export interface Settings {
  reducedMotion: boolean;
  defaultRadius: number;
  hiddenCategories: CategoryId[];
  onboarded: boolean;
  activeBaseId: string;
  locationMode: "base" | "live";
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  sortOrder: number;
}

export const RADII = [500, 1000, 3000, 5000] as const;
