import type { QuestGuideFixture } from "@hiperxp/contracts";
import {
  dropTables,
  getDropTable,
  getMap,
  getQuest,
  getQuestCatalog,
  listQuests,
  mapOrder,
  maps,
  questExcerpt,
  questGuidePath,
  questKindLabel,
  questMapOrder,
  simulatorChests,
} from "./data";
import {
  SITE_DEFAULT_DESCRIPTION,
  SITE_DEFAULT_TITLE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_OG_IMAGE,
  absoluteAsset,
  absoluteUrl,
} from "./site";

export type SeoPayload = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function withBrand(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DEFAULT_DESCRIPTION,
    inLanguage: "pt-BR",
  };
}

function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

function questHowToJsonLd(quest: QuestGuideFixture, mapName: string) {
  const description = clampDescription(
    questExcerpt(quest) ||
      `Guia passo a passo da missão ${quest.name_pt_br} em ${mapName}, Reino Oriental — Perfect World.`,
    300,
  );

  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `${quest.name_pt_br} — ${mapName}`,
    description,
    inLanguage: "pt-BR",
    datePublished: quest.published_at ?? undefined,
    step: quest.steps.map((step, index) => {
      const coords = step.coords?.[0];
      const coordHint = coords
        ? ` Coordenadas: ${coords.x}, ${coords.y}${
            coords.altitude != null ? ` (${coords.altitude})` : ""
          }.`
        : "";
      const text = `${step.instruction_pt_br}${
        step.npc ? ` NPC: ${step.npc}.` : ""
      }${coordHint}${step.dialog_hint ? ` Diálogo: ${step.dialog_hint}` : ""}`;

      return {
        "@type": "HowToStep",
        position: step.order || index + 1,
        name: step.title_pt_br,
        text: text.trim(),
        url: absoluteUrl(`/missoes/${quest.map_slug}/${quest.slug}#${step.id}`),
      };
    }),
  };
}

function homeSeo(): SeoPayload {
  return {
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    path: "/",
    type: "website",
    jsonLd: [
      websiteJsonLd(),
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: absoluteUrl("/"),
        logo: absoluteAsset("/brand/icones/hiperxp-gema-512.png"),
      },
    ],
  };
}

const ORIENTAL_MAPS = new Set([
  "cidade-da-paz",
  "tianyu",
  "jingxuan",
]);

function regionLabel(mapSlug: string): string {
  return ORIENTAL_MAPS.has(mapSlug) || mapSlug.startsWith("drops-")
    ? "Reino Oriental"
    : "Perfect World";
}

function mapSeo(slug: string): SeoPayload | null {
  const map = getMap(slug);
  if (!map) return null;
  // Embed-only maps don't get a public /mapas page.
  if (!(mapOrder as readonly string[]).includes(slug)) return null;
  const region = regionLabel(slug);
  const aliases = map.aliases?.slice(0, 3).join(", ");
  const description = clampDescription(
    `Mapa interativo de ${map.name_pt_br} (${region}): baús, desafios, relíquias, NPCs e coordenadas${
      aliases ? `. Também conhecido como ${aliases}` : ""
    }. ${map.points.length} pontos mapeados.`,
  );

  return {
    title: withBrand(`Mapa ${map.name_pt_br} — ${region} Perfect World`),
    description,
    path: `/mapas/${map.slug}`,
    image: map.asset ?? `/maps/${map.slug}.webp`,
    type: "website",
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Mapas", path: "/mapas/cidade-da-paz" },
        { name: map.name_pt_br, path: `/mapas/${map.slug}` },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `Mapa ${map.name_pt_br}`,
        description,
        url: absoluteUrl(`/mapas/${map.slug}`),
        inLanguage: "pt-BR",
        about: {
          "@type": "Place",
          name: `${map.name_pt_br} — ${region}`,
        },
      },
    ],
  };
}

function questListSeo(mapSlug: string): SeoPayload | null {
  const catalog = getQuestCatalog(mapSlug);
  if (!catalog) return null;
  const mapName = maps[mapSlug]?.name_pt_br ?? catalog.name_pt_br ?? mapSlug;
  const count = listQuests(mapSlug).length;
  const region = regionLabel(mapSlug);
  const description = clampDescription(
    `Guias de missões em ${mapName} (${region}): jornadas, diárias e missões com etapas e coordenadas. ${count} guias no HiperXP.`,
  );

  return {
    title: withBrand(`Missões de ${mapName} — ${region} Perfect World`),
    description,
    path: `/missoes/${mapSlug}`,
    type: "website",
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Missões", path: "/missoes/cidade-da-paz" },
        { name: mapName, path: `/missoes/${mapSlug}` },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `Missões — ${mapName}`,
        description,
        url: absoluteUrl(`/missoes/${mapSlug}`),
        inLanguage: "pt-BR",
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
      },
    ],
  };
}

function questPostSeo(mapSlug: string, questSlug: string): SeoPayload | null {
  const quest = getQuest(mapSlug, questSlug);
  if (!quest) return null;
  // Embed maps (drops-*) keep the parent city name in titles/breadcrumbs.
  const mapName =
    maps[mapSlug]?.name_pt_br ??
    maps[quest.map_slug]?.name_pt_br ??
    quest.map_slug;
  const kind = questKindLabel(quest.kind);
  const excerpt = questExcerpt(quest);
  const region = regionLabel(mapSlug);
  const description = clampDescription(
    excerpt
      ? `${excerpt} Guia ${kind.toLowerCase()} em ${mapName}, ${region} — Perfect World.`
      : `Guia completo da missão ${quest.name_pt_br} (${kind}) em ${mapName}, ${region} — Perfect World. Etapas e coordenadas.`,
  );

  return {
    title: withBrand(
      `${quest.name_pt_br} — missão ${mapName} (${region})`,
    ),
    description,
    path: questGuidePath(quest),
    image: quest.cover_image || maps[quest.map_slug]?.asset,
    type: "article",
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Missões", path: "/missoes/cidade-da-paz" },
        { name: mapName, path: `/missoes/${mapSlug}` },
        {
          name: quest.name_pt_br,
          path: questGuidePath(quest),
        },
      ]),
      questHowToJsonLd(quest, mapName),
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: quest.name_pt_br,
        description,
        datePublished: quest.published_at ?? undefined,
        inLanguage: "pt-BR",
        mainEntityOfPage: absoluteUrl(questGuidePath(quest)),
        author: { "@type": "Organization", name: SITE_NAME },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          logo: {
            "@type": "ImageObject",
            url: absoluteAsset("/brand/icones/hiperxp-gema-512.png"),
          },
        },
      },
    ],
  };
}

function databaseIndexSeo(): SeoPayload {
  return {
    title: withBrand("Database Perfect World — itens e missões"),
    description: clampDescription(
      "Enciclopédia do cliente BR (Level Up): busque itens e missões do Perfect World, veja descrições e prepare o terreno para receitas e dependências — sucessor comunitário do PWDatabase.",
    ),
    path: "/database",
    type: "website",
    jsonLd: [
      breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Database", path: "/database" },
      ]),
    ],
  };
}

function simulatorIndexSeo(): SeoPayload {
  const names = simulatorChests.map((c) => c.name_pt_br).join(", ");
  return {
    title: withBrand("Simulador de baús Perfect World"),
    description: clampDescription(
      `Simule aberturas de ${names} e compare chances teóricas com a amostra. Sem gastar itens do jogo.`,
    ),
    path: "/simulador",
    type: "website",
  };
}

function simulatorDetailSeo(slug: string): SeoPayload | null {
  const table = getDropTable(slug);
  if (!table || !simulatorChests.some((c) => c.slug === slug)) return null;
  return {
    title: withBrand(`${table.name_pt_br} — simulador de drops`),
    description: clampDescription(
      `Tabela e simulador do ${table.name_pt_br} no Perfect World: taxas, recompensas e simulação de aberturas no HiperXP.`,
    ),
    path: `/simulador/${table.slug}`,
    type: "website",
  };
}

/** Resolve título, description e JSON-LD a partir do pathname atual. */
export function resolveSeo(pathname: string): SeoPayload {
  const path = pathname.replace(/\/+$/, "") || "/";

  if (path === "/") return homeSeo();

  const mapMatch = path.match(/^\/mapas\/([^/]+)$/);
  if (mapMatch) {
    const mapSlug = mapMatch[1];
    // Embed-only maps redirect to their guide; reuse that SEO while navigating.
    if (mapSlug === "drops-reino-oriental") {
      return (
        questPostSeo("cidade-da-paz", "alma-da-paz-eterna") ?? {
          title: withBrand("Alma da Paz Eterna"),
          description: SITE_DEFAULT_DESCRIPTION,
          path: "/missoes/cidade-da-paz/alma-da-paz-eterna",
        }
      );
    }
    if (mapSlug === "drops-tianyu") {
      return (
        questPostSeo("tianyu", "alma-de-tianyu") ?? {
          title: withBrand("Alma de Tianyu"),
          description: SITE_DEFAULT_DESCRIPTION,
          path: "/missoes/tianyu/alma-de-tianyu",
        }
      );
    }
    return (
      mapSeo(mapSlug) ?? {
        title: withBrand("Mapa não encontrado"),
        description: SITE_DEFAULT_DESCRIPTION,
        path,
        noindex: true,
      }
    );
  }

  const questPostMatch = path.match(/^\/missoes\/([^/]+)\/([^/]+)$/);
  if (questPostMatch) {
    return (
      questPostSeo(questPostMatch[1], questPostMatch[2]) ?? {
        title: withBrand("Missão não encontrada"),
        description: SITE_DEFAULT_DESCRIPTION,
        path,
        noindex: true,
      }
    );
  }

  const questListMatch = path.match(/^\/missoes\/([^/]+)$/);
  if (questListMatch) {
    return (
      questListSeo(questListMatch[1]) ?? {
        title: withBrand("Missões do Reino Oriental"),
        description: SITE_DEFAULT_DESCRIPTION,
        path,
        noindex: true,
      }
    );
  }

  if (path === "/missoes") {
    return questListSeo(questMapOrder[0]) ?? homeSeo();
  }

  const simMatch = path.match(/^\/simulador\/([^/]+)$/);
  if (simMatch) {
    return (
      simulatorDetailSeo(simMatch[1]) ?? {
        title: withBrand("Baú não encontrado"),
        description: SITE_DEFAULT_DESCRIPTION,
        path,
        noindex: true,
      }
    );
  }

  if (path === "/simulador") return simulatorIndexSeo();

  const dbItemMatch = path.match(/^\/database\/itens\/([^/]+)$/);
  if (dbItemMatch) {
    return {
      title: withBrand(`Item ${dbItemMatch[1]} — Database Perfect World`),
      description: clampDescription(
        `Ficha do item ${dbItemMatch[1]} no Database HiperXP, extraído do cliente BR do Perfect World.`,
      ),
      path,
      type: "website",
    };
  }

  const dbQuestMatch = path.match(/^\/database\/missoes\/([^/]+)$/);
  if (dbQuestMatch) {
    return {
      title: withBrand(`Missão ${dbQuestMatch[1]} — Database Perfect World`),
      description: clampDescription(
        `Ficha da missão ${dbQuestMatch[1]} no Database HiperXP (tasks.data do cliente BR).`,
      ),
      path,
      type: "website",
    };
  }

  if (path === "/database") return databaseIndexSeo();

  return {
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    path,
    noindex: true,
  };
}

export function buildSitemapEntries(now = new Date()): {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}[] {
  const lastmod = now.toISOString().slice(0, 10);
  const entries: {
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  }[] = [
    {
      loc: absoluteUrl("/"),
      lastmod,
      changefreq: "weekly",
      priority: "1.0",
    },
    {
      loc: absoluteUrl("/missoes/cidade-da-paz"),
      lastmod,
      changefreq: "weekly",
      priority: "0.9",
    },
    {
      loc: absoluteUrl("/simulador"),
      lastmod,
      changefreq: "weekly",
      priority: "0.8",
    },
    {
      loc: absoluteUrl("/database"),
      lastmod,
      changefreq: "weekly",
      priority: "0.9",
    },
  ];

  for (const slug of mapOrder) {
    entries.push({
      loc: absoluteUrl(`/mapas/${slug}`),
      lastmod,
      changefreq: "weekly",
      priority: "0.9",
    });
  }

  for (const mapSlug of questMapOrder) {
    entries.push({
      loc: absoluteUrl(`/missoes/${mapSlug}`),
      lastmod,
      changefreq: "weekly",
      priority: "0.85",
    });
    for (const quest of listQuests(mapSlug)) {
      entries.push({
        loc: absoluteUrl(questGuidePath(quest)),
        lastmod: quest.published_at ?? lastmod,
        changefreq: "monthly",
        priority: "0.8",
      });
    }
  }

  for (const table of dropTables) {
    if (!simulatorChests.some((c) => c.slug === table.slug)) continue;
    entries.push({
      loc: absoluteUrl(`/simulador/${table.slug}`),
      lastmod,
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  return entries;
}

export const SEO_DEFAULTS = {
  title: SITE_DEFAULT_TITLE,
  description: SITE_DEFAULT_DESCRIPTION,
  image: SITE_OG_IMAGE,
  locale: SITE_LOCALE,
  siteName: SITE_NAME,
} as const;
