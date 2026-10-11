import { useStore } from "@/store/useStore";
export const useReducedMotion = () => useStore((s) => s.settings.reducedMotion);
