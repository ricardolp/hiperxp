import type {
  DropTableFixture,
  ItemFixture,
  MapFixture,
  QuestCatalogFixture,
  QuestGuideFixture,
  ReleaseFixture,
} from "@hiperxp/contracts";
import releaseJson from "@fixtures/release.json";
import cidadeDaPazJson from "@fixtures/maps/cidade-da-paz.json";
import tianyuJson from "@fixtures/maps/tianyu.json";
import jingxuanJson from "@fixtures/maps/jingxuan.json";
import itemsJson from "@fixtures/items.json";
import bauAuroraJson from "@fixtures/drop-tables/bau-da-aurora.json";
import pergaminhoAbissalJson from "@fixtures/drop-tables/pergaminho-abissal.json";
import pergaminhoTianyuJson from "@fixtures/drop-tables/pergaminho-de-tianyu.json";
import questsCidadeDaPazJson from "@fixtures/quests/cidade-da-paz.json";
import questsTianyuJson from "@fixtures/quests/tianyu.json";
import questsContinenteOcidentalJson from "@fixtures/quests/continente-ocidental.json";
import continenteOcidentalJson from "@fixtures/maps/continente-ocidental.json";
import questsMundoPrimitivoJson from "@fixtures/quests/mundo-primitivo.json";
import questsMundoNormalJson from "@fixtures/quests/mundo-normal.json";
import mundoPrimitivoJson from "@fixtures/maps/mundo-primitivo.json";
import mundoNormalJson from "@fixtures/maps/mundo-normal.json";
import dropsReinoOrientalJson from "@fixtures/maps/drops-reino-oriental.json";
import dropsTianyuJson from "@fixtures/maps/drops-tianyu.json";
import itemIconManifest from "./itemIconManifest.json";

export const release = releaseJson as ReleaseFixture;
export const maps: Record<string, MapFixture> = {
  "cidade-da-paz": cidadeDaPazJson as MapFixture,
  tianyu: tianyuJson as MapFixture,
  jingxuan: jingxuanJson as MapFixture,
  "drops-reino-oriental": dropsReinoOrientalJson as MapFixture,
  "drops-tianyu": dropsTianyuJson as MapFixture,
  "continente-ocidental": continenteOcidentalJson as MapFixture,
  "mundo-primitivo": mundoPrimitivoJson as MapFixture,
  "mundo-normal": mundoNormalJson as MapFixture,
};
/** Mapas com página pública /mapas/:slug (Reino Oriental). */
export const mapOrder = [
  "cidade-da-paz",
  "tianyu",
  "jingxuan",
] as const;

/**
 * Mapas só para dados de guia / embed — sem página em /mapas.
 * Quedanunca e Mundo Primitivo ficam de fora até haver arte de mapa real.
 */
export const embedOnlyMapSlugs = [
  "drops-reino-oriental",
  "drops-tianyu",
  "continente-ocidental",
  "mundo-primitivo",
  "mundo-normal",
] as const;

/** URLs /missoes/:slug que devem ir para o guia real (mapa embed ≠ catálogo). */
export const questEmbedRedirects: Record<string, string> = {
  "drops-reino-oriental": "/missoes/cidade-da-paz/alma-da-paz-eterna",
  "drops-tianyu": "/missoes/tianyu/alma-de-tianyu",
};

/** Caminho canônico do guia (catálogo), mesmo se quest.map_slug for mapa embed. */
export function questGuidePath(quest: {
  map_slug: string;
  slug: string;
}): string {
  const embed = questEmbedRedirects[quest.map_slug];
  if (embed) return embed;
  return `/missoes/${quest.map_slug}/${quest.slug}`;
}

export function hasPublicMapPage(slug: string): boolean {
  return (mapOrder as readonly string[]).includes(slug);
}
export const items = itemsJson as ItemFixture[];

export const questCatalogs: Record<string, QuestCatalogFixture> = {
  "cidade-da-paz": questsCidadeDaPazJson as QuestCatalogFixture,
  tianyu: questsTianyuJson as QuestCatalogFixture,
  "continente-ocidental": questsContinenteOcidentalJson as QuestCatalogFixture,
  "mundo-primitivo": questsMundoPrimitivoJson as QuestCatalogFixture,
  "mundo-normal": questsMundoNormalJson as QuestCatalogFixture,
};

const itemsById = new Map(items.map((item) => [item.id, item]));

/** Os 3 baús do template spoiler (UI do simulador). */
export const simulatorChests: DropTableFixture[] = [
  bauAuroraJson as DropTableFixture,
  pergaminhoAbissalJson as DropTableFixture,
  pergaminhoTianyuJson as DropTableFixture,
];

export const dropTables: DropTableFixture[] = [...simulatorChests];

export function getMap(slug: string): MapFixture | undefined {
  return maps[slug];
}

export function getQuestCatalog(mapSlug: string): QuestCatalogFixture | undefined {
  return questCatalogs[mapSlug];
}

export function getQuest(mapSlug: string, questSlug: string): QuestGuideFixture | undefined {
  return questCatalogs[mapSlug]?.quests.find((q) => q.slug === questSlug);
}

export function listQuests(mapSlug: string): QuestGuideFixture[] {
  const catalog = questCatalogs[mapSlug];
  if (!catalog) return [];
  return [...catalog.quests].sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
}

export const questMapOrder = [
  "cidade-da-paz",
  "tianyu",
  "continente-ocidental",
  "mundo-normal",
] as const;

export function listAllQuests(): QuestGuideFixture[] {
  return questMapOrder.flatMap((slug) => listQuests(slug));
}

export function questExcerpt(quest: QuestGuideFixture): string {
  return (quest.excerpt_pt_br || quest.summary_pt_br || "").trim();
}

export function questKindLabel(kind: QuestGuideFixture["kind"]): string {
  switch (kind) {
    case "journey":
      return "Jornada";
    case "anecdote":
      return "Anedota";
    case "daily":
      return "Diária";
    default:
      return "Missão global";
  }
}

/** Posts recentes para a home (por published_at, senão order). */
export function featuredQuestPosts(limit = 6): QuestGuideFixture[] {
  return [...listAllQuests()]
    .sort((a, b) => {
      const da = a.published_at ?? "";
      const db = b.published_at ?? "";
      if (da !== db) return db.localeCompare(da);
      if (a.map_slug !== b.map_slug) {
        return questMapOrder.indexOf(a.map_slug as (typeof questMapOrder)[number]) -
          questMapOrder.indexOf(b.map_slug as (typeof questMapOrder)[number]);
      }
      return a.order - b.order;
    })
    .slice(0, limit);
}

export function getDropTable(slug: string): DropTableFixture | undefined {
  return dropTables.find((t) => t.slug === slug);
}

export function getItem(id: string): ItemFixture | undefined {
  return itemsById.get(id);
}

export function itemName(id: string): string {
  return itemsById.get(id)?.name_pt_br ?? id;
}

export function itemDescription(id: string): string | null {
  const text = itemsById.get(id)?.description_pt_br?.trim();
  return text ? text : null;
}

/** ID numérico do cliente (alias) a partir do id interno `pw-123`. */
export function gameItemId(itemId: string): string | null {
  if (itemId.startsWith("pw-")) return itemId.slice(3);
  const item = itemsById.get(itemId);
  const alias = item?.aliases.find((a) => /^\d+$/.test(a));
  return alias ?? null;
}

export function itemIconSrc(itemId: string): string | null {
  const gameId = gameItemId(itemId);
  if (!gameId) return null;
  const ext = (itemIconManifest as Record<string, string>)[gameId];
  if (!ext) return null;
  return `/icons/items/${gameId}.${ext}`;
}

export type FlatDropEntry = {
  entryId: string;
  itemId: string;
  name: string;
  quantity: number;
  chancePercent: number;
  groupType: "guaranteed" | "exclusive_weighted" | "independent_bernoulli";
};

/** Achata grupos da tabela em linhas de chance para a UI. */
export function flattenExclusiveEntries(table: DropTableFixture): FlatDropEntry[] {
  const rows: FlatDropEntry[] = [];
  for (const group of [...table.groups].sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id),
  )) {
    if (group.type === "guaranteed") {
      for (const entry of group.entries) {
        for (const reward of entry.rewards) {
          rows.push({
            entryId: entry.id,
            itemId: reward.item_id,
            name: itemName(reward.item_id),
            quantity: reward.quantity,
            chancePercent: 100,
            groupType: "guaranteed",
          });
        }
      }
      continue;
    }
    if (group.type === "exclusive_weighted") {
      const denominator =
        group.weight_kind === "declared_probability"
          ? group.probability_denominator!
          : group.entries.reduce((s, e) => s + e.weight, 0);
      for (const entry of group.entries) {
        for (const reward of entry.rewards) {
          rows.push({
            entryId: entry.id,
            itemId: reward.item_id,
            name: itemName(reward.item_id),
            quantity: reward.quantity,
            chancePercent: (entry.weight / denominator) * 100,
            groupType: "exclusive_weighted",
          });
        }
      }
      continue;
    }
    if (group.type === "independent_bernoulli") {
      for (const entry of group.entries) {
        for (const reward of entry.rewards) {
          rows.push({
            entryId: entry.id,
            itemId: reward.item_id,
            name: itemName(reward.item_id),
            quantity: reward.quantity,
            chancePercent: (entry.numerator / entry.denominator) * 100,
            groupType: "independent_bernoulli",
          });
        }
      }
    }
  }
  return rows;
}

/** Soma das chances do primeiro grupo exclusive_weighted (esperado ≈ 100%). */
export function exclusiveChanceTotal(table: DropTableFixture): number {
  return flattenExclusiveEntries(table)
    .filter((r) => r.groupType === "exclusive_weighted")
    .reduce((s, r) => s + r.chancePercent, 0);
}
