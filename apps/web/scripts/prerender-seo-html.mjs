/**
 * Pós-build: gera HTML estático por rota com title/description/canonical corretos.
 * O `serve -s` entrega esses arquivos ao Googlebot em vez do index.html genérico.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const distDir = path.join(webRoot, "dist");
const routesPath = path.join(webRoot, "public", "seo-routes.json");

function htmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function abs(siteUrl, p) {
  if (/^https?:\/\//i.test(p)) return p;
  return `${siteUrl}${p.startsWith("/") ? p : `/${p}`}`;
}

function replaceMeta(html, attr, key, content) {
  const re = new RegExp(
    `<meta\\s+${attr}=["']${key}["']\\s+content=["'][^"']*["']\\s*/?>`,
    "i",
  );
  const tag = `<meta ${attr}="${key}" content="${htmlEscape(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function replaceLinkCanonical(html, href) {
  const re = /<link\s+rel=["']canonical["']\s+href=["'][^"']*["']\s*\/?>/i;
  const tag = `<link rel="canonical" href="${htmlEscape(href)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function replaceTitle(html, title) {
  if (/<title>[^<]*<\/title>/i.test(html)) {
    return html.replace(/<title>[^<]*<\/title>/i, `<title>${htmlEscape(title)}</title>`);
  }
  return html.replace(/<\/head>/i, `    <title>${htmlEscape(title)}</title>\n  </head>`);
}

function injectNoscript(html, route, url) {
  const block = `<noscript>
  <main>
    <h1>${htmlEscape(route.title)}</h1>
    <p>${htmlEscape(route.description)}</p>
    <p><a href="${htmlEscape(url)}">${htmlEscape(url)}</a></p>
  </main>
</noscript>`;
  if (/<noscript[\s>]/i.test(html)) return html;
  return html.replace(/<div id="root"><\/div>/i, `<div id="root"></div>\n    ${block}`);
}

function buildRedirectHtml(siteUrl, route) {
  const target = abs(siteUrl, route.redirectTo);
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0;url=${htmlEscape(target)}" />
    <link rel="canonical" href="${htmlEscape(target)}" />
    <meta name="robots" content="noindex, follow" />
    <title>${htmlEscape(route.title)}</title>
    <script>location.replace(${JSON.stringify(target)});</script>
  </head>
  <body>
    <p>Redirecionando para <a href="${htmlEscape(target)}">${htmlEscape(target)}</a>…</p>
  </body>
</html>
`;
}

function applyRouteMeta(html, siteUrl, route) {
  const url = abs(siteUrl, route.path);
  const image = abs(siteUrl, route.image || "/brand/social/hiperxp-og-pw-1200x630.png");
  let out = html;
  out = replaceTitle(out, route.title);
  out = replaceMeta(out, "name", "description", route.description);
  out = replaceMeta(
    out,
    "name",
    "robots",
    route.noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large",
  );
  out = replaceMeta(
    out,
    "name",
    "keywords",
    "Perfect World, PW, quest Perfect World, Alma da Paz Eterna, mapa Reino Oriental, Cidade da Paz, Tianyu, Jingxuan, guia de missões, HiperXP",
  );
  out = replaceLinkCanonical(out, url);
  out = replaceMeta(out, "property", "og:type", route.type || "website");
  out = replaceMeta(out, "property", "og:url", url);
  out = replaceMeta(out, "property", "og:title", route.title);
  out = replaceMeta(out, "property", "og:description", route.description);
  out = replaceMeta(out, "property", "og:image", image);
  out = replaceMeta(out, "name", "twitter:title", route.title);
  out = replaceMeta(out, "name", "twitter:description", route.description);
  out = replaceMeta(out, "name", "twitter:image", image);
  out = injectNoscript(out, route, url);
  return out;
}

function routeToFile(routePath) {
  if (routePath === "/") return path.join(distDir, "index.html");
  const clean = routePath.replace(/\/+$/, "");
  return path.join(distDir, ...clean.split("/").filter(Boolean), "index.html");
}

if (!fs.existsSync(distDir)) {
  console.error("[seo:prerender] dist/ não encontrado — rode o vite build antes.");
  process.exit(1);
}

if (!fs.existsSync(routesPath)) {
  console.error("[seo:prerender] public/seo-routes.json ausente — rode seo:generate.");
  process.exit(1);
}

const payload = JSON.parse(fs.readFileSync(routesPath, "utf8"));
const template = fs.readFileSync(path.join(distDir, "index.html"), "utf8");
const siteUrl = payload.siteUrl || "https://hiperxp.com";

let written = 0;
for (const route of payload.routes || []) {
  const file = routeToFile(route.path);
  fs.mkdirSync(path.dirname(file), { recursive: true });

  if (route.redirectTo) {
    fs.writeFileSync(file, buildRedirectHtml(siteUrl, route), "utf8");
  } else if (route.path === "/") {
    fs.writeFileSync(file, applyRouteMeta(template, siteUrl, route), "utf8");
  } else {
    fs.writeFileSync(file, applyRouteMeta(template, siteUrl, route), "utf8");
  }
  written += 1;
}

console.log(`[seo:prerender] Wrote ${written} HTML shells under dist/`);
