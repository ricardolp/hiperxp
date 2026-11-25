/**
 * Gera o mapa e o guia de drops de mobs da Alma da Paz (Reino Oriental).
 * Coords do print do usuário têm prioridade; o guia Trivia completa o que falta
 * e diz qual mob dropa qual item.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SNAP = 3.2;

/** @type {Array<{x:number,y:number}>} */
const shots = `
151,429 114,439 89,465 157,467 88,493
122,443 94,440 100,486 171,496 194,493
182,495 219,491 241,457 257,446 271,473
256,492 254,469 249,447
242,494 243,443 274,464 291,496 195,461
127,480
134,453 131,301 104,312 110,342 120,358 128,377
294,453 293,487 255,417
337,494 309,461 345,447 321,412 283,413
272,409 336,381 277,359 301,376 257,394 261,368
345,476 328,435 332,413 312,424 347,368 292,388
348,390 323,373 264,341 281,386 281,310
343,406
315,345 291,326 289,366 259,359 259,319
331,367 334,341 302,321 274,333 289,357
`
  .trim()
  .split(/\s+/)
  .map((pair) => {
    const [x, y] = pair.split(",").map(Number);
    return { x, y };
  });

const CAVE = new Set([
  "265,341",
  "273,333",
  "292,327",
  "302,321",
  "280,310",
  "260,320",
]);

function parseList(raw) {
  return raw
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const altMatch = token.match(/\((\d+)\)$/);
      const altitude = altMatch ? Number(altMatch[1]) : null;
      const [x, y] = token.replace(/\(\d+\)$/, "").split(",").map(Number);
      const key = `${x},${y}`;
      return {
        x,
        y,
        altitude,
        cave: CAVE.has(key),
      };
    });
}

const families = [
  {
    key: "drop-guerreiro",
    file: "guerreiro",
    legend: "Fera Guerreiro",
    letter: "G",
    color: "#c4783a",
    name: "Fera Selvagem Guerreiro",
    also: "Guarda Fera Selvagem Guerreiro",
    item: "Elmo de Lobo Cinzento",
    itemId: 1000016,
    qty: 1,
    turnIn: "Três Pássaros Azuis (207, 488)",
    level1: null,
    coords: parseList(
      "242,494 194,463 157,468 243,443 274,464 291,496 151,429 113,439 90,466 88,494",
    ),
  },
  {
    key: "drop-cavaleiro",
    file: "cavaleiro",
    legend: "Fera Cavaleiro",
    letter: "C",
    color: "#3d6fbf",
    name: "Fera Selvagem Cavaleiro",
    also: "Guarda Fera Selvagem Cavaleiro",
    item: "Peitoral de Padrão Místico",
    itemId: 1000015,
    qty: 2,
    turnIn: "Três Pássaros Azuis (207, 488)",
    level1: 1,
    coords: parseList(
      "219,491 182,495 157,468 241,456 271,472 257,445 151,429 113,439 90,466 88,494",
    ),
  },
  {
    key: "drop-mutante",
    file: "mutante",
    legend: "Fera Mutante",
    letter: "M",
    color: "#c45a8a",
    name: "Fera Selvagem Mutante",
    also: "Guarda Fera Selvagem Mutante",
    item: "Crina Vermelha",
    itemId: 1000014,
    qty: 2,
    turnIn: "Guardião do Mar-Sem-Fim (76, 433)",
    level1: 1,
    coords: parseList(
      "94,439 122,443 128,479 100,486 172,497 195,493 256,492 292,484 255,469 293,453 249,446 255,417",
    ),
  },
  {
    key: "drop-armada",
    file: "armada",
    legend: "Fera Armada",
    letter: "A",
    color: "#8a5a32",
    name: "Fera Selvagem Armada",
    also: "Guarda Fera Selvagem Armada",
    item: "Chifre Afiado",
    itemId: 1000013,
    qty: 1,
    turnIn: "Guardião do Mar-Sem-Fim (76, 433)",
    level1: 2,
    coords: parseList(
      "94,439 122,443 134,452 128,479 100,486 128,377 121,359 110,341 104,313 130,302 172,497 195,493",
    ),
  },
  {
    key: "drop-fera",
    file: "fera",
    legend: "Fera Selvagem",
    letter: "F",
    color: "#2f8f62",
    name: "Fera Selvagem",
    also: "Guarda Fera Selvagem",
    item: "Cordão de Presas",
    itemId: 1000012,
    qty: 5,
    turnIn: "Guardião do Mar-Sem-Fim (76, 433)",
    level1: 3,
    coords: parseList(
      "134,452 128,377 121,359 110,341 104,313 130,302 182,495 194,463 219,491 242,494 256,492 255,469 241,456 243,443 249,446 257,445 274,464 271,472 292,484 291,496 255,417 293,453",
    ),
  },
  {
    key: "drop-sombrio",
    file: "sombrio",
    legend: "Arqueiro Sombrio",
    letter: "S",
    color: "#c4472f",
    name: "Arqueiro Sombrio Viajante",
    also: "Arqueiro Guardião da Floresta",
    item: "Cauda de Sangue",
    itemId: 1000021,
    qty: 1,
    turnIn: "Jovem Andarilho (300, 417)",
    level1: 1,
    coords: parseList(
      "321,413 284,412 310,461 345,447 338,493 289,366 260,360 315,346 292,327 260,320",
    ),
  },
  {
    key: "drop-arqueiros",
    file: "arqueiros",
    legend: "Arqueiros Viajante",
    letter: "Q",
    color: "#c4a24a",
    name: "Arqueiros Viajante",
    also: "Guarda Arqueiros Viajante",
    item: "Asas Cortadas de Mosca",
    itemId: 1000020,
    qty: 2,
    turnIn: "Jovem Andarilho (300, 417)",
    level1: 1,
    coords: parseList(
      "321,413 284,412 282,386 323,374 348,389 265,341 280,310 345,447 310,461 338,493",
    ),
  },
  {
    key: "drop-predador",
    file: "predador",
    legend: "Predador Viajante",
    letter: "P",
    color: "#6b4ea8",
    name: "Predador Viajante",
    also: "Guarda Predador Viajante",
    item: "Inscrição de Bênção na Pedra",
    itemId: 1000019,
    qty: 2,
    turnIn: "Jovem Andarilho (300, 417)",
    level1: 1,
    coords: parseList(
      "311,425 292,388 333,413 343,406 328,435 346,475 332,366 346,368 334,341 288,356(70) 273,333 302,321",
    ),
  },
  {
    key: "drop-cacador",
    file: "cacador",
    legend: "Caçador Viajante",
    letter: "H",
    color: "#3d8eb8",
    name: "Caçador Viajante",
    also: "Guarda Caçador Viajante",
    item: "Máscara Ritualística",
    itemId: 1000018,
    qty: 2,
    turnIn: "Jovem Andarilho (300, 417)",
    level1: 2,
    coords: parseList(
      "311,425 333,413 328,435 346,475 272,409 257,394 292,388 300,377 277,359 260,368 336,381 346,368",
    ),
  },
  {
    key: "drop-ceifador",
    file: "ceifador",
    legend: "Ceifador Viajante",
    letter: "R",
    color: "#6e7580",
    name: "Ceifador Viajante",
    also: "Guarda Ceifador Viajante",
    item: "Xale Clã dos Viajantes",
    itemId: 1000017,
    qty: 5,
    turnIn: "Jovem Andarilho (300, 417)",
    level1: 3,
    coords: parseList(
      "272,409 257,394 282,386 260,368 260,360 300,377 323,374 332,366 336,381 348,389 343,406 334,341 315,346 289,366 277,359 288,356(70) 265,341 273,333 292,327 302,321 280,310 260,320",
    ),
  },
];

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

const trivia = families.flatMap((family) =>
  family.coords.map((coord, index) => ({
    family,
    ...coord,
    id: `${family.file}-${index}`,
    used: false,
  })),
);

/** @type {typeof trivia} */
const placed = [];

for (const shot of shots) {
  const near = trivia.filter((point) => !point.used && dist(point, shot) <= SNAP);
  if (!near.length) {
    console.warn("shot sem mob", shot.x, shot.y);
    continue;
  }
  const byFamily = new Map();
  for (const point of near) {
    point.used = true;
    const prev = byFamily.get(point.family.key);
    if (!prev || (point.altitude != null && prev.altitude == null)) {
      byFamily.set(point.family.key, point);
    } else if (point.cave) {
      prev.cave = true;
    }
    if (dist(point, shot) > 1.6) {
      console.log(
        `snap ${shot.x},${shot.y} <- ${point.family.file} ${point.x},${point.y} d=${dist(point, shot).toFixed(2)}`,
      );
    }
  }
  for (const point of byFamily.values()) {
    placed.push({
      ...point,
      x: shot.x,
      y: shot.y,
      altitude: point.altitude,
      cave: point.cave || CAVE.has(`${shot.x},${shot.y}`),
    });
  }
}

for (const point of trivia) {
  if (!point.used) placed.push(point);
}

const iconDir = path.join(root, "apps/web/public/icons/drops");
fs.mkdirSync(iconDir, { recursive: true });
for (const family of families) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="28" fill="${family.color}" stroke="#ffffff" stroke-width="4"/>
  <text x="32" y="43" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="700" fill="#ffffff">${family.letter}</text>
</svg>
`;
  fs.writeFileSync(path.join(iconDir, `${family.file}.svg`), svg);
}

const entregaSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="28" fill="#1f6b4a" stroke="#ffffff" stroke-width="4"/>
  <path d="M20 34.5 28 42.5 45 24" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
fs.writeFileSync(path.join(iconDir, "entrega.svg"), entregaSvg);

function pointId(prefix, x, y) {
  return `${prefix}-${x}-${y}`;
}

const mobPoints = placed.map((point) => {
  const family = point.family;
  const where = point.cave ? " Dentro da caverna." : "";
  return {
    id: pointId(family.file, point.x, point.y),
    name: family.name,
    aliases: [family.also, family.item],
    category: "challenge",
    icon_key: family.key,
    icon: `/icons/drops/badges/${family.itemId}.png`,
    x: point.x,
    y: point.y,
    altitude: point.altitude,
    zone: "Cidade da Paz Eterna",
    reset_policy: "daily",
    tip: `Drop: ${family.item} ×${family.qty}. Também: ${family.also}. Entrega em ${family.turnIn}.${where}`,
    access_conditions: null,
    review_status: "foreign_reference",
    origin: "community_observed",
    type_label: family.item,
  };
});

const npcs = [
  {
    id: "entrega-mar-sem-fim",
    name: "Guardião do Mar-Sem-Fim",
    aliases: ["Entrega de drops"],
    x: 76,
    y: 433,
    altitude: null,
    tip: "Entrega: Cordão de Presas ×5, Chifre Afiado ×1 e Crina Vermelha ×2.",
  },
  {
    id: "entrega-tres-passaros",
    name: "Três Pássaros Azuis",
    aliases: ["Entrega de drops"],
    x: 207,
    y: 488,
    altitude: null,
    tip: "Entrega: Peitoral de Padrão Místico ×2 e Elmo de Lobo Cinzento ×1.",
  },
  {
    id: "entrega-jovem-andarilho",
    name: "Jovem Andarilho",
    aliases: ["Entrega de drops"],
    x: 300,
    y: 417,
    altitude: 95,
    tip: "Entrega: Xale ×5, Máscara Ritualística ×2, Inscrição de Bênção ×2, Asas Cortadas de Mosca ×2 e Cauda de Sangue ×1.",
  },
].map((npc) => ({
  id: npc.id,
  name: npc.name,
  aliases: npc.aliases,
  category: "npc",
  icon_key: "drop-entrega",
  icon: "/icons/drops/badges/entrega.png",
  x: npc.x,
  y: npc.y,
  altitude: npc.altitude,
  zone: "Cidade da Paz Eterna",
  reset_policy: "daily",
  tip: npc.tip,
  access_conditions: null,
  review_status: "foreign_reference",
  origin: "community_observed",
  type_label: "Entrega",
}));

const map = {
  id: "map-drops-reino-oriental",
  slug: "drops-reino-oriental",
  name_pt_br: "Drops do Reino Oriental",
  aliases: [
    "Drops Alma da Paz",
    "Farm de mobs Cidade da Paz",
    "Mochila Oriental",
  ],
  coverage_status: "partial",
  width: 3071,
  height: 2047,
  asset: "/maps/cidade-da-paz.webp",
  transform: {
    a: 9.970779220779221,
    b: 0,
    c: -408.80194805194805,
    d: 0,
    e: 9.936893203883495,
    f: -2921.4466019417473,
  },
  notice:
    "Mesma arte da Cidade da Paz Eterna, só com os mobs que dropam itens da Alma da Paz (Parte III). Coordenadas do print comunitário, completadas pelo guia Trivia PW. foreign_reference — conferir no cliente.",
  synthetic: false,
  origin: "community_observed",
  source_url:
    "https://triviapw.com.br/2025/10/31/nova-missao-diaria-alma-da-paz-eterna-1-5/",
  points: [...npcs, ...mobPoints],
};

function coordBullet(point) {
  const alt = point.altitude != null ? `(${point.altitude})` : "";
  const cave = point.cave ? " — caverna" : "";
  return `• ${point.x},${point.y}${alt}${cave}`;
}

const steps = [
  {
    id: "step-01-como-farmar",
    order: 1,
    title_pt_br: "Parte III — o que dropar e onde entregar",
    instruction_pt_br:
      "Na variante de combate da Alma da Paz, abra a Mochila Oriental, selecione o item e use Rastrear. O mapa acima marca só esses mobs, com o ícone do drop em cada spawn.\n\nEntrega:\n• Guardião do Mar-Sem-Fim — 76,433 — Cordão de Presas ×5, Chifre Afiado ×1, Crina Vermelha ×2\n• Três Pássaros Azuis — 207,488 — Peitoral de Padrão Místico ×2, Elmo de Lobo Cinzento ×1\n• Jovem Andarilho — 300,417(95) — Xale ×5, Máscara Ritualística ×2, Inscrição de Bênção na Pedra ×2, Asas Cortadas de Mosca ×2, Cauda de Sangue ×1",
    npc: null,
    coords: [
      { x: 76, y: 433, altitude: null },
      { x: 207, y: 488, altitude: null },
      { x: 300, y: 417, altitude: 95 },
    ],
    dialog_hint: null,
    notes:
      "O Guarda de cada fera e o Arqueiro Guardião da Floresta compartilham o drop do mob principal. Vários tipos podem dividir a mesma coordenada.",
    image_url: null,
    image_alt: null,
  },
];

let order = 2;
for (const family of families) {
  const rows = placed
    .filter((point) => point.family.key === family.key)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  steps.push({
    id: `step-${String(order).padStart(2, "0")}-${family.file}`,
    order,
    title_pt_br: `${family.name} — ${family.item}`,
    instruction_pt_br: `${family.name} e ${family.also} dropam ${family.item} ×${family.qty}. Entregue em ${family.turnIn}.\n${rows.map(coordBullet).join("\n")}`,
    npc: null,
    coords: rows.map((point) => ({
      x: point.x,
      y: point.y,
      altitude: point.altitude,
    })),
    dialog_hint: null,
    notes: rows.some((point) => point.cave)
      ? "Pontos marcados como caverna ficam no subterrâneo."
      : null,
    image_url: null,
    image_alt: null,
  });
  order += 1;
}

steps.push({
  id: "step-12-nivel-1",
  order,
  title_pt_br: "Nível 1 — o que o Oficial Sagrado pede",
  instruction_pt_br:
    "Se a diária estiver no Nível 1, a entrega final no Oficial Sagrado (183,403) pede um conjunto, não só o objetivo do NPC:\n• Cordão de Presas ×3\n• Chifre Afiado ×2\n• Crina Vermelha ×1\n• Peitoral de Padrão Místico ×1\n• Elmo de Lobo Cinzento ×1\n• Xale Clã dos Viajantes ×3\n• Máscara Ritualística ×2\n• Inscrição de Bênção na Pedra ×1\n• Asas Cortadas de Mosca ×1\n• Cauda de Sangue ×1\n• e os recursos de coleta (Lótus Noturna, Concha, Pena de Fênix, Jade da Essência Espiritual, Cogumelinho).\n\nNíveis 2 a 5 pedem uma Relíquia da Alma da Paz um nível abaixo, em vez desse conjunto.",
  npc: "Oficial Sagrado",
  coords: [{ x: 183, y: 403, altitude: 69 }],
  dialog_hint: null,
  notes: "Quantidades do guia Trivia (servidor de testes). Confira o pedido na janela da missão.",
  image_url: null,
  image_alt: null,
});

const quest = {
  schema_version: 1,
  id: "quest-catalog-drops-reino-oriental",
  map_slug: "drops-reino-oriental",
  name_pt_br: "Drops do Reino Oriental",
  generated_at: "2026-11-24",
  synthetic: false,
  origin: "community_observed",
  review_status: "foreign_reference",
  notice:
    "Guia de drops da Parte III da Alma da Paz. Coords do print comunitário + Trivia PW. foreign_reference — validar no cliente BR.",
  sources: [
    "https://triviapw.com.br/2025/10/31/nova-missao-diaria-alma-da-paz-eterna-1-5/",
    "prints comunitários de drops (Feras Selvagens e Viajantes)",
  ],
  quests: [
    {
      id: "quest-drops-reino-oriental-drops-de-mobs",
      slug: "drops-de-mobs",
      map_slug: "drops-reino-oriental",
      kind: "daily",
      order: 1,
      name_pt_br: "Drops de Mobs da Alma da Paz",
      aliases: [
        "Mochila Oriental",
        "Farm Alma da Paz",
        "Elmo de Lobo Cinzento",
        "Cordão de Presas",
        "Xale Clã dos Viajantes",
      ],
      excerpt_pt_br:
        "Onde farmar os itens de monstro da Parte III da Alma da Paz, com um mapa só desses mobs.",
      summary_pt_br:
        "Na variante de combate, cada item da Mochila Oriental cai de um tipo de mob na Cidade da Paz. O mapa Drops do Reino Oriental marca o spawn e a legenda diz qual item sai de qual monstro.",
      prerequisite_pt_br:
        "Alma da Paz Eterna, Parte III em variante de combate. Nv 100+, Reborn II, meridiano completo.",
      rewards_pt_br:
        "Itens de missão da Mochila Oriental (quantidade pedida pelo NPC da etapa).",
      rewards: families.map((family) => ({
        label_pt_br: family.item,
        item_id: family.itemId,
        quantity: family.qty,
        note_pt_br: family.name,
      })),
      cover_image: null,
      published_at: "2026-11-24",
      coverage_status: "partial",
      review_status: "foreign_reference",
      origin: "community_observed",
      source_url:
        "https://triviapw.com.br/2025/10/31/nova-missao-diaria-alma-da-paz-eterna-1-5/",
      notice:
        "Coords alinhadas ao print comunitário e ao guia Trivia (teste da expansão). foreign_reference.",
      steps,
    },
  ],
};

fs.writeFileSync(
  path.join(root, "data/fixtures/maps/drops-reino-oriental.json"),
  `${JSON.stringify(map, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(root, "data/fixtures/quests/drops-reino-oriental.json"),
  `${JSON.stringify(quest, null, 2)}\n`,
);

const counts = {};
for (const point of mobPoints) counts[point.icon_key] = (counts[point.icon_key] || 0) + 1;
console.log("points", map.points.length, counts);
console.log("unused trivia", trivia.filter((point) => !point.used).length);
