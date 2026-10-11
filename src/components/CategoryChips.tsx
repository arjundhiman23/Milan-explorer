import { ScrollView } from "react-native";
import { Chip } from "./ui/Chip";
import { CATEGORIES } from "@/data/categories";
import { useStore } from "@/store/useStore";
import { categoryColors } from "@/theme/tokens";

export function CategoryChips() {
  const active = useStore((s) => s.activeCategories);
  const hidden = useStore((s) => s.settings.hiddenCategories);
  const toggle = useStore((s) => s.toggleCategory);
  const setCategories = useStore((s) => s.setCategories);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }} keyboardShouldPersistTaps="handled">
      <Chip label="All" active={active.length === 0} onPress={() => setCategories([])} />
      {CATEGORIES.filter((c) => !hidden.includes(c.id)).map((c) => (
        <Chip key={c.id} label={c.label} icon={c.icon as any} active={active.includes(c.id)} onPress={() => toggle(c.id)} color={categoryColors[c.id]} />
      ))}
    </ScrollView>
  );
}
