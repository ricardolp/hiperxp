import type {
  DatabaseItemEntry,
  DatabaseItemLinks,
  DatabaseManifest,
  DatabaseNpcCapabilities,
  DatabaseNpcEntry,
  DatabaseNpcLocation,
  DatabaseNpcService,
  DatabaseNpcShopPage,
  DatabaseQuestDetail,
  DatabaseQuestEntry,
  DatabaseRecipe,
} from "@hiperxp/contracts";
import { probeDatabaseApi } from "./database-api";
import { compareLocaleNames, normalizeSearch } from "./search";
import { dropTables, flattenExclusiveEntries } from "./data";

export type DatabaseTab = "itens" | "missoes";
export type DatabaseSourceMode = "api" | "static" | "unavailable";

type ItemsFile = {
  meta: { count: number; notice?: string };
  items: DatabaseItemEntry[];
};

type QuestsFile = {
  meta: { count: number; notice?: string };
  quests: DatabaseQuestEntry[];
};

type DescriptionsFile = {
  descriptions: Record<string, string>;
};

type QuestDetailsFile = {
  details: Record<string, DatabaseQuestDetail>;
};

type ItemLinksFile = {
  links: Record<string, DatabaseItemLinks>;
};

type RecipesFile = {
  recipes: Record<string, DatabaseRecipe>;
};

type NpcsFile = {
  npcs: Record<
    string,
    {
      id: number;
      name_pt_br: string;
      hello_pt_br?: string;
      capabilities?: DatabaseNpcCapabilities;
      service_labels?: string[];
      locations?: DatabaseNpcLocation[];
      shop_item_ids?: number[];
      shop_name_pt_br?: string;
      shop_pages?: DatabaseNpcShopPage[];
      shop_prices?: Record<string, number>;
    }
  >;
};

type ItemIndexRow = DatabaseItemEntry & { haystack: string };
type QuestIndexRow = DatabaseQuestEntry & { haystack: string };

let loadPromise: Promise<void> | null = null;
let detailsPromise: Promise<void> | null = null;
let sourcePromise: Promise<DatabaseSourceMode> | null = null;
let sourceMode: DatabaseSourceMode | null = null;
let manifest: DatabaseManifest | null = null;
let itemRows: ItemIndexRow[] = [];
let questRows: QuestIndexRow[] = [];
let descriptions = new Map<number, string>();
let itemsById = new Map<number, ItemIndexRow>();
let questsById = new Map<number, QuestIndexRow>();
let listLabels = new Map<number, string>();
let questDetails = new Map<number, DatabaseQuestDetail>();
let itemLinks = new Map<number, DatabaseItemLinks>();
let recipesById = new Map<number, DatabaseRecipe>();
/** major\\0sub → recipes sharing that forge category */
let recipesByCategory = new Map<string, DatabaseRecipe[]>();
let npcsById = new Map<number, DatabaseNpcEntry>();

function recipeCategoryKey(
  major: string | undefined,
  sub: string | undefined,
): string {
  return `${major ?? ""}\0${sub ?? ""}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar ${url} (${res.status})`);
  return (await res.json()) as T;
}

/**
 * Resolve catalog backend without crashing the rest of the app.
 * Prefers Postgres API when VITE_DATABASE_API_URL is set and healthy;
 * otherwise falls back to static /database/*.json.
 */
export function ensureDatabaseSource(): Promise<DatabaseSourceMode> {
  if (!sourcePromise) {
    sourcePromise = (async () => {
      const apiMeta = await probeDatabaseApi();
      if (apiMeta) {
        manifest = apiMeta;
        listLabels = new Map(
          Object.entries(apiMeta.list_labels ?? {}).map(([k, v]) => [
            Number(k),
            v,
          ]),
        );
        sourceMode = "api";
        return sourceMode;
      }
      try {
        await ensureDatabaseLoaded();
        sourceMode = "static";
        return sourceMode;
      } catch {
        sourceMode = "unavailable";
        return sourceMode;
      }
    })().catch(() => {
      sourceMode = "unavailable";
      return sourceMode as DatabaseSourceMode;
    });
  }
  return sourcePromise;
}

export function getDatabaseSourceMode(): DatabaseSourceMode | null {
  return sourceMode;
}

export function ensureDatabaseLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      const [man, itemsFile, questsFile, descFile] = await Promise.all([
        fetchJson<DatabaseManifest>("/database/manifest.json"),
        fetchJson<ItemsFile>("/database/items.json"),
        fetchJson<QuestsFile>("/database/quests.json"),
        fetchJson<DescriptionsFile>("/database/descriptions.json"),
      ]);
      manifest = man;
      listLabels = new Map(
        Object.entries(man.list_labels ?? {}).map(([k, v]) => [Number(k), v]),
      );
      descriptions = new Map(
        Object.entries(descFile.descriptions ?? {}).map(([k, v]) => [
          Number(k),
          v,
        ]),
      );
      itemRows = itemsFile.items.map((item) => ({
        ...item,
        haystack: normalizeSearch(`${item.name_pt_br} ${item.id}`),
      }));
      questRows = questsFile.quests.map((quest) => ({
        ...quest,
        haystack: normalizeSearch(`${quest.name_pt_br} ${quest.id}`),
      }));
      itemsById = new Map(itemRows.map((row) => [row.id, row]));
      questsById = new Map(questRows.map((row) => [row.id, row]));
    })().catch((err) => {
      loadPromise = null;
      throw err;
    });
  }
  return loadPromise;
}

/** Lazy-load quest texts, rewards, recipes, NPCs and item links. */
export function ensureDatabaseDetailsLoaded(): Promise<void> {
  if (!detailsPromise) {
    detailsPromise = (async () => {
      await ensureDatabaseLoaded();
      const [detailsFile, linksFile, recipesFile, npcsFile] = await Promise.all([
        fetchJson<QuestDetailsFile>("/database/quest-details.json"),
        fetchJson<ItemLinksFile>("/database/item-links.json"),
        fetchJson<RecipesFile>("/database/recipes.json"),
        fetchJson<NpcsFile>("/database/npcs.json"),
      ]);
      questDetails = new Map(
        Object.entries(detailsFile.details ?? {}).map(([k, v]) => [
          Number(k),
          v,
        ]),
      );
      itemLinks = new Map(
        Object.entries(linksFile.links ?? {}).map(([k, v]) => [Number(k), v]),
      );
      recipesById = new Map(
        Object.entries(recipesFile.recipes ?? {}).map(([k, v]) => [
          Number(k),
          v,
        ]),
      );
      const byCat = new Map<string, DatabaseRecipe[]>();
      for (const recipe of recipesById.values()) {
        const key = recipeCategoryKey(
          recipe.major_name_pt_br,
          recipe.sub_name_pt_br,
        );
        const bucket = byCat.get(key);
        if (bucket) bucket.push(recipe);
        else byCat.set(key, [recipe]);
      }
      for (const bucket of byCat.values()) {
        bucket.sort(
          (a, b) =>
            compareLocaleNames(a.name_pt_br, b.name_pt_br) ||
            (a.level ?? 0) - (b.level ?? 0) ||
            a.id - b.id,
        );
      }
      recipesByCategory = byCat;
      npcsById = buildNpcIndex(recipesById, npcsFile.npcs ?? {});
    })().catch((err) => {
      detailsPromise = null;
      throw err;
    });
  }
  return detailsPromise;
}

function buildNpcIndex(
  recipes: Map<number, DatabaseRecipe>,
  essence: NpcsFile["npcs"],
): Map<number, DatabaseNpcEntry> {
  type Acc = {
    id: number;
    name_pt_br: string;
    services: Map<string, Set<number>>;
    recipe_ids: Set<number>;
  };
  const acc = new Map<number, Acc>();

  for (const recipe of recipes.values()) {
    for (const npc of recipe.npcs ?? []) {
      const row =
        acc.get(npc.id) ??
        ({
          id: npc.id,
          name_pt_br: npc.name_pt_br,
          services: new Map(),
          recipe_ids: new Set(),
        } satisfies Acc);
      row.name_pt_br = npc.name_pt_br || row.name_pt_br;
      row.recipe_ids.add(recipe.id);
      const serviceName = npc.service_name_pt_br?.trim() || "Fabricar";
      const bucket = row.services.get(serviceName) ?? new Set<number>();
      bucket.add(recipe.id);
      row.services.set(serviceName, bucket);
      acc.set(npc.id, row);
    }
  }

  const out = new Map<number, DatabaseNpcEntry>();
  for (const row of acc.values()) {
    const services: DatabaseNpcService[] = [...row.services.entries()]
      .map(([name_pt_br, ids]) => ({
        name_pt_br,
        recipe_ids: [...ids].sort((a, b) => a - b),
      }))
      .sort((a, b) => compareLocaleNames(a.name_pt_br, b.name_pt_br));
    const recipe_ids = [...row.recipe_ids].sort((a, b) => a - b);
    const extra = essence[String(row.id)];
    const entry: DatabaseNpcEntry = {
      id: row.id,
      name_pt_br: extra?.name_pt_br || row.name_pt_br,
      services,
      recipe_ids,
      recipe_count: recipe_ids.length,
    };
    if (extra?.hello_pt_br) entry.hello_pt_br = extra.hello_pt_br;
    if (extra?.capabilities) entry.capabilities = extra.capabilities;
    if (extra?.service_labels?.length) {
      entry.service_labels = extra.service_labels;
    }
    if (extra?.locations?.length) entry.locations = extra.locations;
    if (extra?.shop_item_ids?.length) {
      entry.shop_item_ids = extra.shop_item_ids;
    }
    if (extra?.shop_name_pt_br) entry.shop_name_pt_br = extra.shop_name_pt_br;
    if (extra?.shop_pages?.length) entry.shop_pages = extra.shop_pages;
    if (extra?.shop_prices && Object.keys(extra.shop_prices).length) {
      entry.shop_prices = extra.shop_prices;
    }
    out.set(row.id, entry);
  }

  // NPCs with loja but no craft recipes still appear in the index.
  for (const [key, extra] of Object.entries(essence)) {
    const nid = Number(key);
    if (!Number.isFinite(nid) || out.has(nid)) continue;
    if (!extra.shop_item_ids?.length && !extra.capabilities) continue;
    const entry: DatabaseNpcEntry = {
      id: nid,
      name_pt_br: extra.name_pt_br || `NPC #${nid}`,
      services: [],
      recipe_ids: [],
      recipe_count: 0,
    };
    if (extra.hello_pt_br) entry.hello_pt_br = extra.hello_pt_br;
    if (extra.capabilities) entry.capabilities = extra.capabilities;
    if (extra.service_labels?.length) entry.service_labels = extra.service_labels;
    if (extra.locations?.length) entry.locations = extra.locations;
    if (extra.shop_item_ids?.length) entry.shop_item_ids = extra.shop_item_ids;
    if (extra.shop_name_pt_br) entry.shop_name_pt_br = extra.shop_name_pt_br;
    if (extra.shop_pages?.length) entry.shop_pages = extra.shop_pages;
    if (extra.shop_prices && Object.keys(extra.shop_prices).length) {
      entry.shop_prices = extra.shop_prices;
    }
    out.set(nid, entry);
  }
  return out;
}

export function getDatabaseManifest(): DatabaseManifest | null {
  return manifest;
}

export function databaseListLabel(listId: number): string {
  return listLabels.get(listId) ?? `Lista ${listId}`;
}

export function getDatabaseItem(id: number): DatabaseItemEntry | undefined {
  return itemsById.get(id);
}

export function getDatabaseQuest(id: number): DatabaseQuestEntry | undefined {
  return questsById.get(id);
}

export function getItemDescription(id: number): string | null {
  return descriptions.get(id) ?? null;
}

/** Compacta quebras excessivas das descrições do cliente pra UI. */
export function compactDescription(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function getQuestDetail(id: number): DatabaseQuestDetail | null {
  return questDetails.get(id) ?? null;
}

export function getItemQuestLinks(id: number): DatabaseItemLinks {
  return (
    itemLinks.get(id) ?? {
      rewarded_by: [],
      required_by: [],
      crafted_by: [],
      material_in: [],
    }
  );
}

export function getRecipe(id: number): DatabaseRecipe | undefined {
  return recipesById.get(id);
}

export function getDatabaseNpc(id: number): DatabaseNpcEntry | undefined {
  return npcsById.get(id);
}

export function listRecipesForNpc(npcId: number): DatabaseRecipe[] {
  const npc = npcsById.get(npcId);
  if (!npc) return [];
  return resolveRecipes(npc.recipe_ids);
}

export function resolveRecipes(ids: Iterable<number>): DatabaseRecipe[] {
  const out: DatabaseRecipe[] = [];
  const seen = new Set<number>();
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const recipe = recipesById.get(id);
    if (recipe) out.push(recipe);
  }
  out.sort((a, b) => {
    const aNpcs = a.npcs?.length ? 0 : 1;
    const bNpcs = b.npcs?.length ? 0 : 1;
    if (aNpcs !== bNpcs) return aNpcs - bNpcs;
    return compareLocaleNames(a.name_pt_br, b.name_pt_br);
  });
  return out;
}

/** Recipes in the same major/sub category (NPC-style forge tab). */
export function listRecipeCategory(
  recipe: Pick<DatabaseRecipe, "major_name_pt_br" | "sub_name_pt_br">,
  limit = 48,
): DatabaseRecipe[] {
  const key = recipeCategoryKey(recipe.major_name_pt_br, recipe.sub_name_pt_br);
  const bucket = recipesByCategory.get(key) ?? [];
  return [...bucket]
    .sort((a, b) => compareLocaleNames(a.name_pt_br, b.name_pt_br))
    .slice(0, Math.max(1, limit));
}

export function recipePrimaryTarget(
  recipe: DatabaseRecipe,
): { id: number; quantity?: number; probability?: number } | null {
  if (!recipe.targets.length) return null;
  let best = recipe.targets[0]!;
  for (const target of recipe.targets) {
    const p = target.probability ?? 0;
    const bestP = best.probability ?? 0;
    if (p > bestP) best = target;
  }
  return best;
}

export function databaseItemIconSrc(id: number): string {
  return `/database/icons/${id}.png`;
}

export type DatabaseSearchHit = {
  kind: "item" | "quest";
  id: number;
  title: string;
  subtitle: string;
  to: string;
  list?: number;
};

function scoreHay(haystack: string, tokens: string[], titleHay: string): number {
  if (!tokens.length) return 0;
  let score = 0;
  for (const token of tokens) {
    if (!haystack.includes(token)) return 0;
    score += 1;
    if (titleHay.startsWith(token)) score += 4;
    else if (titleHay.includes(token)) score += 2;
  }
  const phrase = tokens.join(" ");
  if (haystack.includes(phrase)) score += 8;
  if (/^\d+$/.test(tokens[0]!) && haystack.includes(tokens[0]!)) score += 20;
  return score;
}

export function searchDatabase(
  query: string,
  tab: DatabaseTab | "all" = "all",
  limit = 60,
): DatabaseSearchHit[] {
  const tokens = normalizeSearch(query).split(" ").filter(Boolean);
  if (!tokens.length) return [];

  type Scored = DatabaseSearchHit & { score: number };
  const hits: Scored[] = [];

  if (tab === "itens" || tab === "all") {
    for (const item of itemRows) {
      const titleHay = normalizeSearch(item.name_pt_br);
      const score = scoreHay(item.haystack, tokens, titleHay);
      if (!score) continue;
      hits.push({
        kind: "item",
        id: item.id,
        title: item.name_pt_br,
        subtitle: `${databaseListLabel(item.list)} · ID ${item.id}`,
        to: `/database/itens/${item.id}`,
        list: item.list,
        score,
      });
    }
  }

  if (tab === "missoes" || tab === "all") {
    for (const quest of questRows) {
      const titleHay = normalizeSearch(quest.name_pt_br);
      const score = scoreHay(quest.haystack, tokens, titleHay);
      if (!score) continue;
      hits.push({
        kind: "quest",
        id: quest.id,
        title: quest.name_pt_br,
        subtitle: `Missão · ID ${quest.id}`,
        to: `/database/missoes/${quest.id}`,
        score,
      });
    }
  }

  return hits
    .sort(
      (a, b) => b.score - a.score || a.title.localeCompare(b.title, "pt"),
    )
    .slice(0, limit)
    .map(({ kind, id, title, subtitle, to, list }) => ({
      kind,
      id,
      title,
      subtitle,
      to,
      list,
    }));
}

/** Preferred inventory sheets shown as category filters (list id order). */
const CATEGORY_LISTS = [
  3, 6, 9, 12, 15, 21, 22, 28, 58, 62, 73, 74, 82, 93, 94,
] as const;

export type DatabaseCategory = {
  list: number | null;
  label: string;
  count: number;
};

export function listDatabaseCategories(): DatabaseCategory[] {
  const counts = new Map<number, number>();
  for (const row of itemRows) {
    counts.set(row.list, (counts.get(row.list) ?? 0) + 1);
  }
  const cats: DatabaseCategory[] = [
    { list: null, label: "Todos", count: itemRows.length },
  ];
  for (const listId of CATEGORY_LISTS) {
    const count = counts.get(listId) ?? 0;
    if (!count) continue;
    cats.push({
      list: listId,
      label: databaseListLabel(listId),
      count,
    });
  }
  return cats;
}

export function browseDatabaseItems(options: {
  list?: number | null;
  query?: string;
  offset?: number;
  limit?: number;
}): { items: DatabaseItemEntry[]; total: number } {
  const list = options.list ?? null;
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.max(1, options.limit ?? 96);
  const tokens = normalizeSearch(options.query ?? "")
    .split(" ")
    .filter(Boolean);

  const matched: { row: ItemIndexRow; score: number }[] = [];
  for (const row of itemRows) {
    if (list != null && row.list !== list) continue;
    if (!tokens.length) {
      matched.push({ row, score: 0 });
      continue;
    }
    const titleHay = normalizeSearch(row.name_pt_br);
    const score = scoreHay(row.haystack, tokens, titleHay);
    if (!score) continue;
    matched.push({ row, score });
  }

  matched.sort((a, b) => {
    if (tokens.length && b.score !== a.score) return b.score - a.score;
    const byLocale = compareLocaleNames(a.row.name_pt_br, b.row.name_pt_br);
    if (byLocale) return byLocale;
    return a.row.id - b.row.id;
  });

  return {
    total: matched.length,
    items: matched.slice(offset, offset + limit).map(({ row }) => row),
  };
}

export function browseDatabaseQuests(options: {
  query?: string;
  offset?: number;
  limit?: number;
}): { quests: DatabaseQuestEntry[]; total: number } {
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.max(1, options.limit ?? 80);
  const tokens = normalizeSearch(options.query ?? "")
    .split(" ")
    .filter(Boolean);

  const matched: { row: QuestIndexRow; score: number }[] = [];
  for (const row of questRows) {
    const n = row.name_pt_br;
    if (!n || n.length < 2) continue;
    const low = n.toLowerCase();
    if (low.startsWith("gm") || low.includes("título brasileiro")) continue;
    if (!tokens.length) {
      // Prefer rich quests first when browsing without query
      const score =
        (row.has_description ? 4 : 0) +
        (row.has_rewards ? 2 : 0) +
        (row.has_series ? 1 : 0);
      matched.push({ row, score });
      continue;
    }
    const titleHay = normalizeSearch(row.name_pt_br);
    const score = scoreHay(row.haystack, tokens, titleHay);
    if (!score) continue;
    matched.push({ row, score });
  }

  matched.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return compareLocaleNames(a.row.name_pt_br, b.row.name_pt_br);
  });

  return {
    total: matched.length,
    quests: matched.slice(offset, offset + limit).map(({ row }) => row),
  };
}

/** @deprecated Prefer browseDatabaseItems */
export function listDatabaseBrowseItems(limit = 60): DatabaseItemEntry[] {
  return browseDatabaseItems({ limit }).items;
}

/** @deprecated Prefer browseDatabaseQuests */
export function listDatabaseBrowseQuests(limit = 40): DatabaseQuestEntry[] {
  return browseDatabaseQuests({ limit }).quests;
}

export function databaseCounts(): { items: number; quests: number } {
  return { items: itemRows.length, quests: questRows.length };
}

export type ItemDropTableHit = {
  slug: string;
  name_pt_br: string;
  quantity: number;
  chancePercent: number;
  /** Índice estável do baú no simulador (ícone). */
  chestIndex: number;
};

export function dropTablesForItem(itemId: number): ItemDropTableHit[] {
  const key = `pw-${itemId}`;
  const out: ItemDropTableHit[] = [];
  dropTables.forEach((table, chestIndex) => {
    const matches = flattenExclusiveEntries(table).filter(
      (row) => row.itemId === key,
    );
    if (!matches.length) return;
    const best = matches.reduce((a, b) =>
      b.chancePercent > a.chancePercent ? b : a,
    );
    out.push({
      slug: table.slug,
      name_pt_br: table.name_pt_br,
      quantity: best.quantity,
      chancePercent: best.chancePercent,
      chestIndex,
    });
  });
  return out;
}

export function chestIconSrc(chestIndex: number): string {
  return chestIndex === 2 ? "/sim/chest-tianyu.png" : "/sim/chest-default.png";
}
