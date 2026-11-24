export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export type EntityKind = "item" | "quest" | "npc" | "recipe";

const KINDS = new Set<EntityKind>(["item", "quest", "npc", "recipe"]);

export function parseKind(value: string | undefined | null): EntityKind | null {
  if (!value) return null;
  const v = value.toLowerCase() as EntityKind;
  return KINDS.has(v) ? v : null;
}

export function parsePositiveInt(value: string | undefined | null): number | null {
  if (value == null || value === "") return null;
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) return null;
  return n;
}

export function clampLimit(value: string | undefined | null, fallback = 24, max = 50): number {
  const n = value != null && value !== "" ? Number(value) : fallback;
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.floor(n));
}
