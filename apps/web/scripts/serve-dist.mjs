/**
 * Serve dist/ preferindo HTML pré-renderizado por rota (SEO).
 * O `serve -s` devolvia o index da home em toda URL — o Google via
 * canonical "/" em missões/mapas e as páginas saíam do ranking.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");
const port = Number(process.env.PORT || 3000);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function normalizePathname(raw) {
  try {
    const url = new URL(raw || "/", "http://localhost");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return pathname || "/";
  } catch {
    return "/";
  }
}

function safeJoin(root, relPath) {
  const resolved = path.resolve(root, relPath);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function cacheControl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html" || ext === ".xml" || ext === ".txt" || ext === ".json") {
    return "public, max-age=0, must-revalidate";
  }
  if (filePath.includes(`${path.sep}assets${path.sep}`)) {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=86400";
}

function sendFile(res, filePath, method) {
  const stat = fs.statSync(filePath);
  const headers = {
    "Content-Type": contentType(filePath),
    "Content-Length": stat.size,
    "Cache-Control": cacheControl(filePath),
  };
  if (method === "HEAD") {
    res.writeHead(200, headers);
    res.end();
    return;
  }
  res.writeHead(200, headers);
  fs.createReadStream(filePath).pipe(res);
}

function existsFile(filePath) {
  try {
    return Boolean(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveAsset(pathname) {
  if (pathname === "/") return null;
  const rel = pathname.replace(/^\/+/, "");
  return safeJoin(distDir, rel);
}

function resolveRouteHtml(pathname) {
  if (pathname === "/") return path.join(distDir, "index.html");
  const rel = pathname.replace(/^\/+/, "");
  return safeJoin(distDir, path.join(rel, "index.html"));
}

const server = http.createServer((request, response) => {
  const method = (request.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method Not Allowed");
    return;
  }

  const pathname = normalizePathname(request.url);

  try {
    // 1) Exact asset (js/css/images/sitemap/robots/…)
    const asset = resolveAsset(pathname);
    if (existsFile(asset) && path.extname(asset)) {
      sendFile(response, asset, method);
      return;
    }

    // 2) Prerendered route shell: /missoes/.../index.html
    const routeHtml = resolveRouteHtml(pathname);
    if (existsFile(routeHtml)) {
      sendFile(response, routeHtml, method);
      return;
    }

    // 3) SPA fallback
    const fallback = path.join(distDir, "index.html");
    if (existsFile(fallback)) {
      sendFile(response, fallback, method);
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
  } catch (error) {
    console.error("[serve-dist]", error);
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal Server Error");
  }
});

if (!fs.existsSync(distDir)) {
  console.error(`[serve-dist] dist/ não encontrado: ${distDir}`);
  process.exit(1);
}

server.listen(port, "0.0.0.0", () => {
  console.log(`[serve-dist] http://0.0.0.0:${port} → ${distDir}`);
});
