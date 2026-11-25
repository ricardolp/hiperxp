/**
 * Gera robots.txt, sitemap.xml e seo-routes.json a partir dos fixtures.
 * URLs canônicas: mapas públicos + missões (sem slugs embed drops-*).
 * Roda no prebuild; o postbuild injeta meta em HTML estático por rota.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const publicDir = path.join(webRoot, "public");
const fixturesDir = path.join(repoRoot, "data/fixtures");

const SITE_URL = (process.env.VITE_SITE_URL || "https://hiperxp.com").replace(
  /\/$/,
  "",
);
const SITE_NAME = "HiperXP";

/** Mapas com página pública /mapas/:slug */
const mapOrder = [
  "cidade-da-paz",
  "tianyu",
  "jingxuan",
  "continente-ocidental",
];

/** Catálogos de missões indexáveis (alinha com apps/web/src/lib/data.ts) */
const questMapOrder = [
  "cidade-da-paz",
  "tianyu",
  "continente-ocidental",
  "mundo-normal",
];

const dropSlugs = [
  "bau-da-aurora",
  "pergaminho-abissal",
  "pergaminho-de-tianyu",
];

/** Embed map_slug → URL canônica do guia (sem indexar o slug embed). */
const questEmbedRedirects = {
  "drops-reino-oriental": "/missoes/cidade-da-paz/alma-da-paz-eterna",
  "drops-tianyu": "/missoes/tianyu/alma-de-tianyu",
};

const ORIENTAL_MAPS = new Set(["cidade-da-paz", "tianyu", "jingxuan"]);

/** Páginas que devem consolidar no canônico (já indexadas com URL errada). */
const legacyRedirects = [
  {
    from: "/missoes/drops-reino-oriental/alma-da-paz-eterna",
    to: "/missoes/cidade-da-paz/alma-da-paz-eterna",
  },
  {
    from: "/missoes/drops-reino-oriental",
    to: "/missoes/cidade-da-paz/alma-da-paz-eterna",
  },
  {
    from: "/missoes/drops-reino-oriental/drops-de-mobs",
    to: "/missoes/cidade-da-paz/alma-da-paz-eterna",
  },
  {
    from: "/mapas/drops-reino-oriental",
    to: "/missoes/cidade-da-paz/alma-da-paz-eterna",
  },
  {
    from: "/missoes/drops-tianyu/alma-de-tianyu",
    to: "/missoes/tianyu/alma-de-tianyu",
  },
  {
    from: "/mapas/drops-tianyu",
    to: "/missoes/tianyu/alma-de-tianyu",
  },
];

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(fixturesDir, rel), "utf8"));
}

function abs(p) {
  return `${SITE_URL}${p.startsWith("/") ? p : `/${p}`}`;
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function clampDescription(text, max = 160) {
  const clean = String(text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function withBrand(title) {
  return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

const SITE_DEFAULT_KEYWORDS =
  "Perfect World, PW, mapa Reino Oriental, Cidade da Paz, Tianyu, Jingxuan, guia de missões Perfect World, HiperXP";

function joinKeywords(...parts) {
  const seen = new Set();
  const out = [];
  for (const part of parts) {
    if (!part) continue;
    for (const raw of String(part).split(",")) {
      const term = raw.trim();
      if (!term) continue;
      const key = term.toLocaleLowerCase("pt-BR");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(term);
    }
  }
  return out.slice(0, 16).join(", ");
}

function questShortName(name) {
  return String(name || "")
    .replace(/\s*\(Diária I–V\)\s*/i, "")
    .trim();
}

function questKeywords(quest, mapName) {
  const shortName = questShortName(quest.name_pt_br);
  const searchAliases = (quest.aliases || [])
    .filter((a) => /pw|perfect world|guia|missão|quest|diária|alma/i.test(a))
    .slice(0, 6);
  return joinKeywords(
    shortName,
    `${shortName} PW`,
    `${shortName} Perfect World`,
    `guia ${shortName}`,
    `missão ${shortName}`,
    `quest ${shortName}`,
    quest.kind === "daily" ? `diária ${shortName}` : null,
    mapName,
    ...searchAliases,
    "Perfect World",
    "PW",
    "HiperXP",
  );
}

function questGuidePath(quest) {
  const embed = questEmbedRedirects[quest.map_slug];
  if (embed) return embed;
  return `/missoes/${quest.map_slug}/${quest.slug}`;
}

function regionLabel(mapSlug) {
  return ORIENTAL_MAPS.has(mapSlug) || String(mapSlug).startsWith("drops-")
    ? "Reino Oriental"
    : "Perfect World";
}

function kindLabel(kind) {
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

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${xmlEscape(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const mapsBySlug = Object.fromEntries(
  mapOrder.map((slug) => [slug, readJson(`maps/${slug}.json`)]),
);

const catalogs = Object.fromEntries(
  questMapOrder.map((slug) => [slug, readJson(`quests/${slug}.json`)]),
);

const today = new Date().toISOString().slice(0, 10);

const SITE_DEFAULT_TITLE = withBrand(
  "Mapa Reino Oriental e guias de quest Perfect World (PW)",
);
const SITE_DEFAULT_DESCRIPTION = clampDescription(
  "Mapa interativo do Reino Oriental (Cidade da Paz, Tianyu, Jingxuan), guia de quests PW com coordenadas — Alma da Paz Eterna, Alma de Tianyu — e simulador de baús do Perfect World.",
);
const SITE_OG_IMAGE = "/brand/social/hiperxp-og-pw-1200x630.png";

/** @type {{ path: string, title: string, description: string, image?: string, type?: string, priority?: string, changefreq?: string, lastmod?: string, noindex?: boolean, redirectTo?: string }[]} */
const routes = [];

function pushRoute(route) {
  routes.push(route);
}

pushRoute({
  path: "/",
  title: SITE_DEFAULT_TITLE,
  description: SITE_DEFAULT_DESCRIPTION,
  image: SITE_OG_IMAGE,
  type: "website",
  keywords: joinKeywords(
    SITE_DEFAULT_KEYWORDS,
    "Alma da Paz Eterna",
    "Alma da Paz Eterna PW",
    "Alma de Tianyu",
    "simulador de baús Perfect World",
  ),
  priority: "1.0",
  changefreq: "weekly",
  lastmod: today,
});

pushRoute({
  path: "/simulador",
  title: withBrand("Simulador de baús Perfect World (PW)"),
  description: clampDescription(
    "Simule aberturas de baús do Perfect World (Baú da Aurora, Pergaminho Abissal, Pergaminho de Tianyu) e compare chances teóricas — HiperXP.",
  ),
  image: SITE_OG_IMAGE,
  type: "website",
  keywords: joinKeywords(
    "simulador de baús Perfect World",
    "simulador baús PW",
    "Baú da Aurora",
    "Pergaminho Abissal",
    "Pergaminho de Tianyu",
    "Perfect World",
    "PW",
    "HiperXP",
  ),
  priority: "0.8",
  changefreq: "weekly",
  lastmod: today,
});

pushRoute({
  path: "/database",
  title: withBrand("Database Perfect World — itens e missões PW"),
  description: clampDescription(
    "Enciclopédia do cliente BR (Level Up): busque itens e missões do Perfect World, descrições e base para receitas — sucessor comunitário do PWDatabase.",
  ),
  image: SITE_OG_IMAGE,
  type: "website",
  keywords: joinKeywords(
    "database Perfect World",
    "PWDatabase",
    "itens Perfect World",
    "missões PW",
    "Perfect World",
    "PW",
    "HiperXP",
  ),
  priority: "0.9",
  changefreq: "weekly",
  lastmod: today,
});

for (const slug of mapOrder) {
  const map = mapsBySlug[slug];
  const region = regionLabel(slug);
  const aliases = (map.aliases || []).slice(0, 3).join(", ");
  const description = clampDescription(
    `Mapa interativo do Reino Oriental — ${map.name_pt_br}: baús, desafios, relíquias, NPCs e coordenadas do Perfect World (PW)${
      aliases ? `. Também: ${aliases}` : ""
    }. ${(map.points || []).length} pontos mapeados no HiperXP.`,
  );
  pushRoute({
    path: `/mapas/${slug}`,
    title: withBrand(`Mapa ${map.name_pt_br} — Reino Oriental Perfect World`),
    description,
    image: map.asset || `/maps/${slug}.webp`,
    type: "website",
    keywords: joinKeywords(
      `mapa ${map.name_pt_br}`,
      map.name_pt_br,
      ...(map.aliases || []).slice(0, 3),
      region,
      "Perfect World",
      "PW",
      "HiperXP",
    ),
    priority: slug === "cidade-da-paz" ? "1.0" : "0.9",
    changefreq: "weekly",
    lastmod: today,
  });
}

for (const mapSlug of questMapOrder) {
  const catalog = catalogs[mapSlug];
  const mapName =
    mapsBySlug[mapSlug]?.name_pt_br ?? catalog.name_pt_br ?? mapSlug;
  const region = regionLabel(mapSlug);
  const quests = [...(catalog.quests || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );
  const highlight =
    mapSlug === "cidade-da-paz"
      ? "Alma da Paz Eterna, jornadas e diárias"
      : mapSlug === "tianyu"
        ? "Alma de Tianyu, jornadas e diárias"
        : "jornadas, anedotas e diárias";
  const listDescription = clampDescription(
    `Guias de quest Perfect World (PW) em ${mapName} (${region}): etapas, NPCs e coordenadas. ${quests.length} missões no HiperXP — ${highlight}.`,
  );

  pushRoute({
    path: `/missoes/${mapSlug}`,
    title: withBrand(`Quests ${mapName} — ${region} Perfect World (PW)`),
    description: listDescription,
    image: mapsBySlug[mapSlug]?.asset || SITE_OG_IMAGE,
    type: "website",
    keywords: joinKeywords(
      `quests ${mapName}`,
      `missões ${mapName}`,
      mapSlug === "cidade-da-paz" ? "Alma da Paz Eterna PW" : null,
      mapSlug === "tianyu" ? "Alma de Tianyu PW" : null,
      mapName,
      region,
      "Perfect World",
      "PW",
      "HiperXP",
    ),
    priority: mapSlug === "cidade-da-paz" ? "0.95" : "0.85",
    changefreq: "weekly",
    lastmod: today,
  });

  for (const quest of quests) {
    const canonical = questGuidePath(quest);
    // Skip duplicate entries when catalog quest already redirects elsewhere
    // (e.g. alma lives in cidade-da-paz catalog with embed map_slug).
    if (canonical !== `/missoes/${mapSlug}/${quest.slug}`) {
      // Still ensure the canonical path is registered once below.
      const already = routes.some((r) => r.path === canonical);
      if (already) continue;
    }

    const kind = kindLabel(quest.kind);
    const displayMap =
      mapsBySlug[mapSlug]?.name_pt_br ||
      mapsBySlug[quest.map_slug]?.name_pt_br ||
      mapName;
    const regionQ = regionLabel(mapSlug);
    const excerpt = (quest.excerpt_pt_br || quest.summary_pt_br || "").trim();
    const shortName = questShortName(quest.name_pt_br);
    const description = clampDescription(
      excerpt
        ? `${excerpt} ${displayMap}, ${regionQ}.`
        : `Guia ${shortName} PW (Perfect World): etapas, NPCs e coordenadas em ${displayMap} (${regionQ}).`,
    );

    const isPriorityQuest =
      quest.slug === "alma-da-paz-eterna" || quest.slug === "alma-de-tianyu";

    pushRoute({
      path: canonical,
      title: isPriorityQuest
        ? withBrand(`${shortName} PW — guia diária Perfect World`)
        : withBrand(
            `${shortName} — guia quest PW (${kind.toLowerCase()}) | ${displayMap}`,
          ),
      description,
      image:
        quest.cover_image ||
        mapsBySlug[mapSlug]?.asset ||
        mapsBySlug[quest.map_slug]?.asset ||
        SITE_OG_IMAGE,
      type: "article",
      keywords: questKeywords(quest, displayMap),
      priority: isPriorityQuest ? "1.0" : "0.8",
      changefreq: isPriorityQuest ? "weekly" : "monthly",
      lastmod: quest.published_at || today,
    });
  }
}

for (const slug of dropSlugs) {
  const table = readJson(`drop-tables/${slug}.json`);
  pushRoute({
    path: `/simulador/${slug}`,
    title: withBrand(`${table.name_pt_br} — simulador de drops PW`),
    description: clampDescription(
      `Tabela e simulador do ${table.name_pt_br} no Perfect World: taxas, recompensas e simulação de aberturas no HiperXP.`,
    ),
    image: SITE_OG_IMAGE,
    type: "website",
    keywords: joinKeywords(
      table.name_pt_br,
      `simulador ${table.name_pt_br}`,
      "simulador de baús Perfect World",
      "Perfect World",
      "PW",
      "HiperXP",
    ),
    priority: "0.7",
    changefreq: "monthly",
    lastmod: today,
  });
}

for (const legacy of legacyRedirects) {
  pushRoute({
    path: legacy.from,
    title: withBrand("Redirecionando…"),
    description: SITE_DEFAULT_DESCRIPTION,
    image: SITE_OG_IMAGE,
    type: "website",
    keywords: SITE_DEFAULT_KEYWORDS,
    noindex: true,
    redirectTo: legacy.to,
  });
}

// Deduplicate by path (first wins — canonicals before legacy)
const seen = new Set();
const uniqueRoutes = [];
for (const route of routes) {
  if (seen.has(route.path)) continue;
  seen.add(route.path);
  uniqueRoutes.push(route);
}

const sitemapRoutes = uniqueRoutes.filter(
  (r) => !r.noindex && !r.redirectTo && r.priority,
);

const entries = sitemapRoutes.map((r) => ({
  loc: abs(r.path),
  lastmod: r.lastmod || today,
  changefreq: r.changefreq || "monthly",
  priority: r.priority || "0.5",
}));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(urlEntry).join("\n")}
</urlset>
`;

const robots = `User-agent: *
Allow: /

# SPA assets — indexar páginas, não chunks de build
Disallow: /assets/

Sitemap: ${SITE_URL}/sitemap.xml
`;

const seoRoutesPayload = {
  siteUrl: SITE_URL,
  siteName: SITE_NAME,
  generatedAt: new Date().toISOString(),
  defaults: {
    title: SITE_DEFAULT_TITLE,
    description: SITE_DEFAULT_DESCRIPTION,
    image: SITE_OG_IMAGE,
    keywords: SITE_DEFAULT_KEYWORDS,
  },
  routes: uniqueRoutes.map((r) => ({
    path: r.path,
    title: r.title,
    description: r.description,
    image: r.image || SITE_OG_IMAGE,
    type: r.type || "website",
    keywords: r.keywords || SITE_DEFAULT_KEYWORDS,
    noindex: Boolean(r.noindex),
    redirectTo: r.redirectTo || null,
  })),
};

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap, "utf8");
fs.writeFileSync(path.join(publicDir, "robots.txt"), robots, "utf8");
fs.writeFileSync(
  path.join(publicDir, "seo-routes.json"),
  JSON.stringify(seoRoutesPayload, null, 2),
  "utf8",
);

console.log(
  `[seo] Wrote robots.txt + sitemap.xml (${entries.length} urls) + seo-routes.json (${uniqueRoutes.length} routes) → ${SITE_URL}`,
);
