import type {
  DropTableFixture,
  MapFixture,
  QuestGuideFixture,
} from "@hiperxp/contracts";
import {
  listAllQuests,
  mapOrder,
  maps,
  questExcerpt,
  questKindLabel,
  simulatorChests,
} from "./data";

export type SearchHitKind = "quest" | "map" | "simulator";

export type SearchHit = {
  id: string;
  kind: SearchHitKind;
  title: string;
  subtitle: string;
  excerpt: string;
  to: string;
  score: number;
};

/** Lowercase, strip diacritics, collapse spaces — for contains matching. */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s,.\-_/]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchTokens(query: string): string[] {
  return normalizeSearch(query).split(" ").filter(Boolean);
}

function scoreHaystack(haystack: string, tokens: string[]): number {
  if (!tokens.length) return 0;
  let score = 0;
  for (const token of tokens) {
    if (!haystack.includes(token)) return 0;
    score += 1;
  }
  const phrase = tokens.join(" ");
  if (haystack.includes(phrase)) score += 8;
  return score;
}

function questHaystack(quest: QuestGuideFixture, mapName: string): string {
  const stepText = quest.steps
    .flatMap((step) => [
      step.title_pt_br,
      step.instruction_pt_br,
      step.npc ?? "",
      step.notes ?? "",
    ])
    .join(" ");
  return normalizeSearch(
    [
      quest.name_pt_br,
      ...(quest.aliases ?? []),
      questExcerpt(quest),
      quest.summary_pt_br ?? "",
      quest.prerequisite_pt_br ?? "",
      quest.rewards_pt_br ?? "",
      questKindLabel(quest.kind),
      mapName,
      quest.map_slug,
      stepText,
    ].join(" "),
  );
}

function mapHaystack(map: MapFixture, blurb: string): string {
  return normalizeSearch(
    [map.name_pt_br, map.slug, blurb, ...(map.aliases ?? [])].join(" "),
  );
}

function chestHaystack(table: DropTableFixture): string {
  return normalizeSearch([table.name_pt_br, table.slug].join(" "));
}

const MAP_BLURBS: Record<string, string> = {
  "cidade-da-paz": "Baús, relíquias, desafios e recursos diários.",
  tianyu: "Exploração com filtros e progresso local.",
  jingxuan: "Pontos, coordenadas e checklist no mapa.",
};

export function searchSite(query: string, limit = 40): SearchHit[] {
  const tokens = searchTokens(query);
  if (!tokens.length) return [];

  const hits: SearchHit[] = [];

  for (const slug of mapOrder) {
    const map = maps[slug];
    if (!map) continue;
    const blurb = MAP_BLURBS[slug] ?? "Mapa interativo.";
    const titleN = normalizeSearch(map.name_pt_br);
    let score = scoreHaystack(mapHaystack(map, blurb), tokens);
    if (!score) continue;
    if (tokens.every((t) => titleN.includes(t))) score += 12;
    hits.push({
      id: `map-${map.slug}`,
      kind: "map",
      title: map.name_pt_br,
      subtitle: "Mapa",
      excerpt: `${blurb} ${map.points.length} pontos.`,
      to: `/mapas/${map.slug}`,
      score,
    });
  }

  for (const quest of listAllQuests()) {
    const mapName = maps[quest.map_slug]?.name_pt_br ?? quest.map_slug;
    const titleN = normalizeSearch(
      [quest.name_pt_br, ...(quest.aliases ?? [])].join(" "),
    );
    let score = scoreHaystack(questHaystack(quest, mapName), tokens);
    if (!score) continue;
    if (tokens.every((t) => titleN.includes(t))) score += 14;
    hits.push({
      id: quest.id,
      kind: "quest",
      title: quest.name_pt_br,
      subtitle: `${questKindLabel(quest.kind)} · ${mapName}`,
      excerpt: questExcerpt(quest) || "Guia de missão com etapas e coordenadas.",
      to: `/missoes/${quest.map_slug}/${quest.slug}`,
      score,
    });
  }

  for (const table of simulatorChests) {
    const titleN = normalizeSearch(table.name_pt_br);
    let score = scoreHaystack(chestHaystack(table), tokens);
    if (!score) continue;
    if (tokens.every((t) => titleN.includes(t))) score += 10;
    hits.push({
      id: `drop-${table.slug}`,
      kind: "simulator",
      title: table.name_pt_br,
      subtitle: "Simulador",
      excerpt: "Simule aberturas e veja as chances de cada item.",
      to: `/simulador/${table.slug}`,
      score,
    });
  }

  return hits
    .sort(
      (a, b) =>
        b.score - a.score || a.title.localeCompare(b.title, "pt"),
    )
    .slice(0, limit);
}
