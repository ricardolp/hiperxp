import type {
  DatabaseItemEntry,
  DatabaseItemLinks,
  DatabaseManifest,
  DatabaseNpcEntry,
  DatabaseQuestDetail,
  DatabaseQuestEntry,
  DatabaseRecipe,
} from "@hiperxp/contracts";

export type DatabaseApiKind = "item" | "quest" | "npc" | "recipe";

export type PopularRow = {
  kind: DatabaseApiKind;
  id: number;
  views: number;
  name_pt_br: string;
};

export type SearchItemsResult = {
  tab: "itens";
  total: number;
  items: DatabaseItemEntry[];
};

export type SearchQuestsResult = {
  tab: "missoes";
  total: number;
  quests: DatabaseQuestEntry[];
};

export type CategoryRow = {
  list: number | null;
  label: string;
  count: number;
};

const META_TIMEOUT_MS = 2500;

function apiBase(): string | null {
  const raw = import.meta.env.VITE_DATABASE_API_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function databaseApiConfigured(): boolean {
  return apiBase() != null;
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<T> {
  const base = apiBase();
  if (!base) throw new Error("Database API URL not configured");
  const timeoutMs = init?.timeoutMs ?? 8_000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new Error(`API ${path} failed (${res.status})`);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Probe API; returns meta or null if unreachable. */
export async function probeDatabaseApi(): Promise<DatabaseManifest | null> {
  if (!apiBase()) return null;
  try {
    return await apiFetch<DatabaseManifest>("/api/v1/db/meta", {
      timeoutMs: META_TIMEOUT_MS,
    });
  } catch {
    return null;
  }
}

export async function apiSearchItems(options: {
  q?: string;
  list?: number | null;
  limit?: number;
  offset?: number;
}): Promise<SearchItemsResult> {
  const params = new URLSearchParams({ tab: "itens" });
  if (options.q) params.set("q", options.q);
  if (options.list != null) params.set("list_id", String(options.list));
  if (options.limit != null) params.set("limit", String(options.limit));
  if (options.offset != null) params.set("offset", String(options.offset));
  return apiFetch(`/api/v1/db/search?${params}`);
}

export async function apiSearchQuests(options: {
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<SearchQuestsResult> {
  const params = new URLSearchParams({ tab: "missoes" });
  if (options.q) params.set("q", options.q);
  if (options.limit != null) params.set("limit", String(options.limit));
  if (options.offset != null) params.set("offset", String(options.offset));
  return apiFetch(`/api/v1/db/search?${params}`);
}

export async function apiCategories(): Promise<CategoryRow[]> {
  const data = await apiFetch<{ categories: CategoryRow[] }>(
    "/api/v1/db/categories",
  );
  return data.categories;
}

export async function apiPopular(
  kind: DatabaseApiKind,
  limit = 12,
): Promise<PopularRow[]> {
  const data = await apiFetch<{ items: PopularRow[] }>(
    `/api/v1/db/popular?kind=${kind}&limit=${limit}`,
  );
  return data.items ?? [];
}

export async function apiGetItem(id: number): Promise<{
  item: DatabaseItemEntry & { description_pt_br?: string | null };
}> {
  return apiFetch(`/api/v1/db/items/${id}`);
}

export async function apiGetItemLinks(id: number): Promise<DatabaseItemLinks> {
  const data = await apiFetch<{ links: DatabaseItemLinks }>(
    `/api/v1/db/items/${id}/links`,
  );
  return data.links;
}

export async function apiGetQuest(id: number): Promise<{
  quest: DatabaseQuestEntry;
  detail: DatabaseQuestDetail | null;
}> {
  return apiFetch(`/api/v1/db/quests/${id}`);
}

export async function apiGetRecipe(id: number): Promise<DatabaseRecipe> {
  const data = await apiFetch<{ recipe: DatabaseRecipe }>(
    `/api/v1/db/recipes/${id}`,
  );
  return data.recipe;
}

export async function apiGetNpc(id: number): Promise<DatabaseNpcEntry> {
  const data = await apiFetch<{ npc: DatabaseNpcEntry }>(
    `/api/v1/db/npcs/${id}`,
  );
  return data.npc;
}

/** Fire-and-forget view beacon. Never throws to callers. */
export function recordDatabaseView(kind: DatabaseApiKind, id: number): void {
  const base = apiBase();
  if (!base || !Number.isFinite(id) || id <= 0) return;
  const url = `${base}/api/v1/db/view`;
  const body = JSON.stringify({ kind, id });
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch {
    // fall through
  }
  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
