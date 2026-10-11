import type { Category, Verdict } from "@/types";

export const CATEGORIES: Category[] = [
  { id: "cafes", label: "Cafés & study", icon: "cafe-outline", sortOrder: 0 },
  { id: "food", label: "Food", icon: "restaurant-outline", sortOrder: 1 },
  { id: "culture", label: "Culture", icon: "color-palette-outline", sortOrder: 2 },
  { id: "outdoors", label: "Outdoors", icon: "leaf-outline", sortOrder: 3 },
  { id: "shopping", label: "Shopping", icon: "bag-handle-outline", sortOrder: 4 },
  { id: "essentials", label: "Essentials", icon: "medkit-outline", sortOrder: 5 },
  { id: "gems", label: "Hidden gems", icon: "sparkles-outline", sortOrder: 6 },
];

export const VERDICTS: { id: Verdict; label: string; short: string; icon: string }[] = [
  { id: "want", label: "Want to go", short: "Want to go", icon: "bookmark" },
  { id: "again", label: "Visit again", short: "Again", icon: "heart" },
  { id: "once", label: "Worth once", short: "Once", icon: "checkmark-circle" },
  { id: "never", label: "Not for me", short: "Not for me", icon: "close-circle" },
];

export const SUGGESTED_TAGS = [
  "good for studying", "cheap eats", "quiet", "great coffee", "outdoor seating",
  "date spot", "bring friends", "rainy day", "sunset", "late opening",
];
