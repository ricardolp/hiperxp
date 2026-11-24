/**
 * Importa baús, itens e ícones de sources/simulador-de-baus.html para fixtures do monorepo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = path.join(root, "sources/simulador-de-baus.html");
const html = fs.readFileSync(htmlPath, "utf8");

function extractConst(name) {
  const re = new RegExp(
    `const ${name} = \\\`([\\s\\S]*?)\\\`;`,
  );
  const m = html.match(re);
  if (!m) throw new Error(`const ${name} not found`);
  return m[1];
}

function parseRows(value) {
  return value.split(/\r?\n/).flatMap((line, index) => {
    if (!line.trim()) return [];
    const parts = line.split(line.includes("\t") ? "\t" : ";").map((p) => p.trim());
    const [id, name, raw, rawQuantity, ...extra] = parts;
    const number = raw?.replace(/\s*%$/, "").replace(",", ".");
    const chance = Number(number);
    if (
      !id ||
      !name ||
      !number ||
      extra.length ||
      !/^\d+(\.\d+)?$/.test(number) ||
      chance < 0 ||
      chance > 100
    ) {
      throw new Error(`Linha ${index + 1}: chance inválida (${line})`);
    }
    const quantity =
      rawQuantity === undefined
        ? 1
        : Number(rawQuantity.replace(/[.\s]/g, ""));
    if (
      (rawQuantity !== undefined &&
        !/^\d+(?:[.\s]\d{3})*$/.test(rawQuantity)) ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error(`Linha ${index + 1}: quantidade inválida`);
    }
    const decimals = (number.split(".")[1] ?? "").length;
    return [{ id, name, chance, input: number, quantity, decimals }];
  });
}

function toWeights(items) {
  // chance is percent with up to N decimals → weight units of 10^-N %, denom = 100 * 10^N
  const scale = 10 ** Math.max(0, ...items.map((i) => i.decimals));
  const weights = items.map((i) => Math.round(i.chance * scale));
  const denominator = 100 * scale;
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum !== denominator) {
    throw new Error(
      `Soma dos pesos ${sum} !== denominador ${denominator} (ajuste necessário)`,
    );
  }
  return { weights, denominator };
}

function extractOfflineIcons() {
  const m = html.match(/const offlineIcons = (\{[\s\S]*?\});/);
  if (!m) throw new Error("offlineIcons not found");
  return JSON.parse(m[1]);
}

function extractDataUrl(label, re) {
  const m = html.match(re);
  if (!m) throw new Error(`${label} not found`);
  return m[1];
}

function writeDataUrl(dataUrl, outPath) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error(`bad data url for ${outPath}`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, Buffer.from(match[2], "base64"));
  return { mime: match[1], bytes: Buffer.byteLength(match[2], "base64") };
}

const chests = [
  {
    key: "aurora",
    slug: "bau-da-aurora",
    name: "Baú da Aurora",
    rows: parseRows(extractConst("auroraRows")),
  },
  {
    key: "abissal",
    slug: "pergaminho-abissal",
    name: "Pergaminho Abissal",
    rows: parseRows(extractConst("abissalRows")),
  },
  {
    key: "tianyu",
    slug: "pergaminho-de-tianyu",
    name: "Pergaminho de Tianyu",
    rows: parseRows(extractConst("tianyuRows")),
  },
];

const itemsById = new Map();
const dropDir = path.join(root, "data/fixtures/drop-tables");
fs.mkdirSync(dropDir, { recursive: true });

const tableSlugs = [];

for (const chest of chests) {
  const { weights, denominator } = toWeights(chest.rows);
  const entries = chest.rows.map((item, index) => {
    const itemId = `pw-${item.id}`;
    if (!itemsById.has(itemId)) {
      itemsById.set(itemId, {
        id: itemId,
        name_pt_br: item.name,
        aliases: [item.id],
      });
    }
    return {
      id: `e${index + 1}`,
      order: index + 1,
      weight: weights[index],
      rewards: [{ item_id: itemId, quantity: item.quantity }],
    };
  });

  const table = {
    schema_version: 1,
    synthetic: false,
    publication_allowed: false,
    notice:
      "Tabela importada do simulador comunitário (spoiler). Chances estimadas/observadas — não confirmadas no cliente BR. Simulação local sem efeito no jogo.",
    id: `chest-${chest.key}`,
    slug: chest.slug,
    name_pt_br: chest.name,
    revision: "spoiler-import-v1",
    model_version: "groups-v1",
    probability_status: "estimated",
    game_build_id: null,
    groups: [
      {
        id: "exclusive",
        order: 1,
        type: "exclusive_weighted",
        rolls: 1,
        weight_kind: "declared_probability",
        probability_denominator: denominator,
        entries,
      },
    ],
  };

  const out = path.join(dropDir, `${chest.slug}.json`);
  fs.writeFileSync(out, JSON.stringify(table, null, 2) + "\n");
  tableSlugs.push(chest.slug);
  console.log(
    `wrote ${chest.slug}: ${entries.length} entries, denom=${denominator}`,
  );
}

// Merge items: keep fixtures + new PW items
const itemsPath = path.join(root, "data/fixtures/items.json");
const existing = JSON.parse(fs.readFileSync(itemsPath, "utf8"));
const keep = existing.filter((i) => String(i.id).startsWith("fixture-"));
const merged = [...keep, ...[...itemsById.values()].sort((a, b) => a.id.localeCompare(b.id))];
fs.writeFileSync(itemsPath, JSON.stringify(merged, null, 2) + "\n");
console.log(`items: ${merged.length}`);

// Icons
const icons = extractOfflineIcons();
const iconDir = path.join(root, "apps/web/public/icons/items");
fs.mkdirSync(iconDir, { recursive: true });
let iconCount = 0;
for (const [id, dataUrl] of Object.entries(icons)) {
  const ext = dataUrl.includes("image/webp")
    ? "webp"
    : dataUrl.includes("image/jpeg")
      ? "jpg"
      : "png";
  writeDataUrl(dataUrl, path.join(iconDir, `${id}.${ext}`));
  iconCount += 1;
}
console.log(`icons: ${iconCount}`);

// Manifest of icon extensions for the UI
const iconManifest = {};
for (const id of Object.keys(icons)) {
  const dataUrl = icons[id];
  iconManifest[id] = dataUrl.includes("image/webp")
    ? "webp"
    : dataUrl.includes("image/jpeg")
      ? "jpg"
      : "png";
}
fs.writeFileSync(
  path.join(root, "apps/web/src/lib/itemIconManifest.json"),
  JSON.stringify(iconManifest, null, 2) + "\n",
);

// Hero + page art + chest card icons from CSS/JS (best-effort)
const artDir = path.join(root, "apps/web/public/sim");
fs.mkdirSync(artDir, { recursive: true });

// body page background (second url in body background)
const bodyBg = html.match(
  /body\s*\{[\s\S]*?url\("(data:image\/jpeg;base64,[^"]+)"\)/,
);
if (bodyBg) {
  writeDataUrl(bodyBg[1], path.join(artDir, "page-art.jpg"));
  console.log("page-art.jpg");
}

const heroBg = html.match(
  /\.hero\{[^}]*url\("(data:image\/jpeg;base64,[^"]+)"\)/,
);
if (heroBg) {
  writeDataUrl(heroBg[1], path.join(artDir, "hero.jpg"));
  console.log("hero.jpg");
}

// Chest card images appear as image.src = index === 2 ? "..." : "..."
const cardImgs = [...html.matchAll(/image\.src = index === 2 \? "(data:[^"]+)" : "(data:[^"]+)"/g)];
if (cardImgs[0]) {
  writeDataUrl(cardImgs[0][2], path.join(artDir, "chest-default.png"));
  writeDataUrl(cardImgs[0][1], path.join(artDir, "chest-tianyu.png"));
  console.log("chest icons");
}

// Update release.json drop_tables
const releasePath = path.join(root, "data/fixtures/release.json");
const release = JSON.parse(fs.readFileSync(releasePath, "utf8"));
release.drop_tables = [...tableSlugs];
fs.writeFileSync(releasePath, JSON.stringify(release, null, 2) + "\n");

console.log("done", tableSlugs);
