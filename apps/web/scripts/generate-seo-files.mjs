/**
 * Gera robots.txt e sitemap.xml em public/ a partir dos fixtures.
 * Roda no build para listar mapas, missões e baús indexáveis.
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

const mapOrder = ["cidade-da-paz", "tianyu", "jingxuan"];
const questMapOrder = ["cidade-da-paz", "tianyu"];
const dropSlugs = [
  "bau-da-aurora",
  "pergaminho-abissal",
  "pergaminho-de-tianyu",
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

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${xmlEscape(lastmod)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const today = new Date().toISOString().slice(0, 10);
const entries = [
  {
    loc: abs("/"),
    lastmod: today,
    changefreq: "weekly",
    priority: "1.0",
  },
  {
    loc: abs("/simulador"),
    lastmod: today,
    changefreq: "weekly",
    priority: "0.8",
  },
];

for (const slug of mapOrder) {
  entries.push({
    loc: abs(`/mapas/${slug}`),
    lastmod: today,
    changefreq: "weekly",
    priority: "0.9",
  });
}

for (const mapSlug of questMapOrder) {
  entries.push({
    loc: abs(`/missoes/${mapSlug}`),
    lastmod: today,
    changefreq: "weekly",
    priority: "0.85",
  });

  const catalog = readJson(`quests/${mapSlug}.json`);
  for (const quest of catalog.quests ?? []) {
    entries.push({
      loc: abs(`/missoes/${quest.map_slug}/${quest.slug}`),
      lastmod: quest.published_at || today,
      changefreq: "monthly",
      priority: "0.8",
    });
  }
}

for (const slug of dropSlugs) {
  entries.push({
    loc: abs(`/simulador/${slug}`),
    lastmod: today,
    changefreq: "monthly",
    priority: "0.7",
  });
}

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

fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap, "utf8");
fs.writeFileSync(path.join(publicDir, "robots.txt"), robots, "utf8");

console.log(
  `[seo] Wrote robots.txt + sitemap.xml (${entries.length} urls) → ${SITE_URL}`,
);
