/**
 * Copia ícones extraídos do cliente para dist/database/icons após o vite build.
 * Em produção `serve -s dist` só entrega arquivos que estão no dist; o plugin
 * Vite de /database/icons só existe em dev/preview.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "../..");
const src = path.resolve(
  repoRoot,
  "data/fixtures/sources/client-br-levelup/icons-all",
);
const dest = path.resolve(webRoot, "dist/database/icons");

if (!fs.existsSync(src)) {
  console.warn(`[copy-database-icons] fonte ausente: ${src}`);
  process.exit(0);
}

if (!fs.existsSync(path.resolve(webRoot, "dist"))) {
  console.error("[copy-database-icons] dist/ não existe — rode vite build antes.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true, force: true });

const count = fs.readdirSync(dest).length;
console.log(`[copy-database-icons] ${count} arquivos → ${dest}`);
