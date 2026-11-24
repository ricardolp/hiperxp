import type { QuestGuideFixture } from "@hiperxp/contracts";
import { getQuest, listAllQuests } from "./data";

/** Capas oficiais/PW para listas da home (sem stock genérico). */
const POST_THUMBS = [
  "/maps/cidade-da-paz.webp",
  "/maps/tianyu.webp",
  "/maps/jingxuan.webp",
  "/home/pw-card-2.webp",
  "/home/pw-card-3.webp",
  "/home/pw-tianyu-1.webp",
  "/home/pw-tianyu-2.webp",
  "/quests/esforco-da-guerra/cover.png",
  "/quests/esforco-da-guerra/photo-01.png",
  "/quests/esforco-da-guerra/photo-05.png",
  "/quests/esforco-da-guerra/photo-10.png",
  "/quests/esforco-da-guerra/photo-15.png",
] as const;

export type HomeVideo = {
  id: string;
  title: string;
  channel: string;
  youtubeId: string;
  /** Capa horizontal de PW (evita Short vertical / meme). */
  thumb: string;
};

/** Criadores da comunidade PWBR (não usa o canal oficial Level Up). */
export const HOME_VIDEOS: HomeVideo[] = [
  {
    id: "guia-ceifador",
    title: "Guia definitivo do Ceifador — skills e dicas",
    channel: "Kentaro · comunidade PWBR",
    youtubeId: "1PkGisQTWeA",
    thumb: "/home/yt-1PkGisQTWeA.jpg",
  },
  {
    id: "desafios-tianyu",
    title: "Guia completo de todos os desafios da Cidade de Tianyu",
    channel: "Reehatsune · comunidade PWBR",
    youtubeId: "NX9GWgRxeMs",
    thumb: "/home/yt-NX9GWgRxeMs.jpg",
  },
  {
    id: "diaria-tianyu",
    title: "Como fazer a Diária de Tianyu — quest das relíquias",
    channel: "Reehatsune · comunidade PWBR",
    youtubeId: "ZxlMulDmIPM",
    thumb: "/home/yt-ZxlMulDmIPM.jpg",
  },
];

export const PWBR_COMMUNITY_SEARCH_URL =
  "https://www.youtube.com/results?search_query=PWBR+Perfect+World&sp=CAI%253D";

/** Guias mais buscados do Reino Oriental (ordem = ranking). */
const POPULAR_QUEST_KEYS = [
  "cidade-da-paz/alma-da-paz-eterna",
  "tianyu/alma-de-tianyu",
  "tianyu/canglan-sob-neve-serena",
  "tianyu/montanha-espiritual",
  "tianyu/desembainhar-a-espada",
  "cidade-da-paz/correntes-ocultas",
] as const;

export function popularQuestPosts(limit = 5): QuestGuideFixture[] {
  const curated = POPULAR_QUEST_KEYS.map((key) => {
    const [mapSlug, questSlug] = key.split("/");
    return getQuest(mapSlug!, questSlug!);
  }).filter((q): q is QuestGuideFixture => Boolean(q));

  if (curated.length >= limit) return curated.slice(0, limit);

  const seen = new Set(curated.map((q) => `${q.map_slug}/${q.slug}`));
  const fallback = listAllQuests().filter(
    (q) => !seen.has(`${q.map_slug}/${q.slug}`),
  );
  return [...curated, ...fallback].slice(0, limit);
}

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i += 1) {
    h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function questListThumb(quest: QuestGuideFixture): string {
  if (quest.cover_image) return quest.cover_image;
  return POST_THUMBS[hashSlug(`${quest.map_slug}/${quest.slug}`) % POST_THUMBS.length]!;
}

export function youtubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`;
}
