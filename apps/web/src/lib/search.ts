import { normalizeSearch, type MapPointFixture } from "@hiperxp/contracts";

export function matchesPointQuery(point: MapPointFixture, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  if (normalizeSearch(point.name).includes(q)) return true;
  if (point.aliases.some((a) => normalizeSearch(a).includes(q))) return true;
  if (normalizeSearch(point.id).includes(q)) return true;
  if (`${point.x},${point.y}`.includes(q.replace(/\s/g, ""))) return true;
  return false;
}
