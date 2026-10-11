export function uid(prefix = ""): string {
  const rnd = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return prefix ? `${prefix}_${rnd}` : rnd;
}
export const nowIso = () => new Date().toISOString();
