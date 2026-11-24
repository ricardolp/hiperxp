/**
 * Converte dumps de https://pw-map.ru em fixtures locais (PT-BR).
 * Origem: third_party / foreign_reference.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sources = join(root, "data/fixtures/sources");
const mapsOut = join(root, "data/fixtures/maps");
const i18n = JSON.parse(
  readFileSync(join(root, "data/fixtures/i18n/ru-pt.json"), "utf8"),
);

mkdirSync(mapsOut, { recursive: true });

const REGIONS = {
  pokoi: {
    slug: "cidade-da-paz",
    name_pt_br: "Cidade da Paz Eterna",
    aliases: ["Город Покоя", "Pokoi", "City of Peace", "Cidade da Paz"],
    asset: "/maps/cidade-da-paz.webp",
    notice:
      "Mapa/pontos de pw-map.ru traduzidos para PT-BR. Arte do mapa sem rótulos em russo. foreign_reference / permission_pending.",
    regionFile: "pw-map-pokoi-region.json",
    pointsFile: "pw-map-pokoi-points.json",
    typesFile: "pw-map-pokoi-types.json",
  },
  tianyuy: {
    slug: "tianyu",
    name_pt_br: "Tianyu",
    aliases: ["Город Тяньюй", "Tianyuy", "Тяньюй"],
    asset: "/maps/tianyu.webp",
    notice:
      "Mapa/pontos de pw-map.ru traduzidos para PT-BR. Arte do mapa sem rótulos em russo. foreign_reference / permission_pending.",
    regionFile: "pw-map-tianyuy-region.json",
    pointsFile: "pw-map-tianyuy-points.json",
    typesFile: "pw-map-tianyuy-types.json",
  },
  czinsyuan: {
    slug: "jingxuan",
    name_pt_br: "Jingxuan",
    aliases: ["Город Цзинсюань", "Czinsyuan", "Цзинсюань", "Jing Xuan"],
    asset: "/maps/jingxuan.webp",
    regionFile: "pw-map-czinsyuan-region.json",
    pointsFile: "pw-map-czinsyuan-points.json",
    typesFile: "pw-map-czinsyuan-types.json",
  },
};

const EXTRA_NAMES = {
  "Вызов: Родство душ": "Desafio: Laço das almas",
  "Вызов: Прыжок к звездам": "Desafio: Salto às estrelas",
  "Вызов: Череда загадок": "Desafio: Sequência de enigmas",
  "Вызов: Сокровища и ловушки": "Desafio: Tesouros e armadilhas",
  "Вызов: Прыжок в бездну": "Desafio: Salto Abissal",
  "Вызов: Парящий небожитель": "Desafio: Celestial flutuante",
  "Вызов: Дорога цветов": "Desafio: Estrada das Flores",
  "Вызов: Драгоценная яшма": "Desafio: Jasper Precioso",
  "Вызов: Ловкий шаг": "Desafio: Passo ágil",
  "Вызов: Цуцзюй": "Desafio: Cuju",
  "Вызов: Всеобъемлющая забота": "Desafio: Cuidado abrangente",
  "Вызов: Восполнение недостатка": "Desafio: Preenchendo a lacuna",
  "Вызов: Прогноз будущего": "Desafio: Prever o Futuro",
  "Вызов: Ложные звуки": "Desafio: Sons Falsos",
  "Вызов: Широкий обзор": "Desafio: Visão Ampla",
  "Вызов: Подходящий момент": "Desafio: O Momento Certo",
  Пшеница: "Trigo",
  Янтарь: "Âmbar",
  Клубника: "Morango",
  Талисман: "Talismã",
  Порошок: "Pó",
  "Командир клана Резчиков": "Comandante do clã dos Entalhadores",
  "Мастер рудника клана Резчиков": "Mestre da mina do clã dos Entalhadores",
  "Якшас-заклинатель приливов": "Yaksha conjurador das marés",
  "Якшас-охотница на души": "Yaksha caçadora de almas",
  "Якшас охотница за головами": "Yaksha caçadora de cabeças",
  Якшас: "Yaksha",
  "мастер рудника клана резчиков": "Mestre da mina do clã dos Entalhadores",
  "Крушитель клана Резчиков": "Esmagador do clã dos Entalhadores",
  "Захватчик клана Резчиков": "Invasor do clã dos Entalhadores",
  "Пропавший сын": "Filho desaparecido",
  "Тайна происхождения": "Segredo da origem",
  "Желание книжного духа": "Desejo do espírito do livro",
  "Память о прошлом": "Memórias do Passado",
  "Скрытые течения": "Correntes Ocultas",
  "Порочные медики": "Médicos Sombrios",
  "Алтарь Пылающего Дракона": "Altar do Dragão Flamejante",
  "Четыре камня стихий": "Quatro pedras elementais",
  "Опавшие листья": "Folhas ao Vento",
  Ураган: "Tempestade",
  "Горы Драконова источника": "Montanhas da Fonte do Dragão",
  "Убийца поневоле": "Assassino involuntário",
  "Колодец Хуайбэй": "Poço Huaibei",
  "Призраки лавки тканей": "Loja de Tecidos",
  "Убийство в скромном доме": "Assassinato na casa modesta",
  "Бабочка из прошлого": "Borboleta do passado",
  "Прятки с судьбой": "Esconde-esconde com o destino",
  "Ледяная колдунья Бездны": "Feiticeira gelada do Abismo",
};

/** Отблеск = Relíquia Raiz (Paz) / Relíquia Cauda (Tianyu). */
const RELIC_LABEL_BY_REGION = {
  pokoi: "Relíquia Raiz",
  tianyuy: "Relíquia Cauda",
  czinsyuan: "Relíquia",
};

const allNames = { ...i18n.types, ...EXTRA_NAMES, ...i18n.place_labels };

function translateText(text, regionKey) {
  if (!text) return text;
  if (text === "Отблеск" && RELIC_LABEL_BY_REGION[regionKey]) {
    return RELIC_LABEL_BY_REGION[regionKey];
  }
  if (allNames[text]) return allNames[text];
  let out = text;
  const parts = Object.entries(i18n.phrases).sort(
    (a, b) => b[0].length - a[0].length,
  );
  for (const [ru, pt] of parts) {
    out = out.split(ru).join(pt);
  }
  for (const [ru, pt] of Object.entries(allNames).sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    out = out.split(ru).join(pt);
  }
  if (regionKey && RELIC_LABEL_BY_REGION[regionKey]) {
    out = out.split("Relíquia Raiz").join(RELIC_LABEL_BY_REGION[regionKey]);
  }
  return out;
}

function iconKeyForType(type) {
  const name = (type?.name ?? "").toLowerCase();
  const category = type?.category ?? "";
  if (name.includes("сундук с монстрами")) return "monster-chest";
  if (name.includes("сундук")) return "chest";
  if (name.includes("отблеск")) return "glint";
  if (name.includes("вызов")) return "challenge";
  if (name.includes("истори")) return "quest";
  if (category === "daily-mob" || name.includes("моб")) return "mob";
  if (category === "daily-resource") return "resource";
  if (category === "collectable") return "glint";
  return "resource";
}

/** Converte /static/... do pw-map.ru para path local em /icons/pw-map/ */
function localIconPath(remoteIcon) {
  if (!remoteIcon) return null;
  const name = remoteIcon.replace(/^\/static\//, "").replaceAll("/", "_");
  return `/icons/pw-map/${name}`;
}

function fallbackIcon(iconKey) {
  const map = {
    chest: "/icons/pw-map/icons_1784113895501464640.webp",
    "monster-chest": "/icons/pw-map/monster-chest-icon.webp",
    glint: "/icons/pw-map/otblesk-icon.webp",
    challenge: "/icons/pw-map/vizov-icon.webp",
    quest: "/icons/pw-map/quest-icon.webp",
    resource: "/icons/pw-map/grib-icon.webp",
    mob: "/icons/pw-map/monster-icon.webp",
  };
  return map[iconKey] ?? map.glint;
}

function mapCategory(type) {
  const name = (type?.name ?? "").toLowerCase();
  if (name.includes("сундук с монстрами")) return "chest";
  if (name.includes("сундук")) return "chest";
  if (name.includes("вызов")) return "challenge";
  if (name.includes("истори")) return "quest_objective";
  if (name.includes("отблеск")) return "collectible";
  if (type?.category === "daily-resource") return "daily_resource";
  if (type?.category === "daily-mob") return "challenge";
  if (type?.category === "collectable") return "collectible";
  return "collectible";
}

function resetPolicy(category, iconKey) {
  if (iconKey === "resource" || iconKey === "mob") return "daily";
  if (category === "daily_resource") return "daily";
  return "permanent";
}

function buildTransform(region) {
  const scaleX = region.browser_width / (region.max_x - region.origin_x);
  const scaleY = region.browser_height / (region.max_y - region.origin_y);
  return {
    a: scaleX,
    b: 0,
    c: -region.origin_x * scaleX,
    d: 0,
    e: scaleY,
    f: -region.origin_y * scaleY,
  };
}

function convert(key) {
  const cfg = REGIONS[key];
  const region = JSON.parse(
    readFileSync(join(sources, cfg.regionFile), "utf8"),
  );
  const { points } = JSON.parse(
    readFileSync(join(sources, cfg.pointsFile), "utf8"),
  );
  const { types } = JSON.parse(
    readFileSync(join(sources, cfg.typesFile), "utf8"),
  );
  const typeById = new Map(types.map((t) => [t.id, t]));

  const fixture = {
    id: `map-${cfg.slug}`,
    slug: cfg.slug,
    name_pt_br: cfg.name_pt_br,
    aliases: cfg.aliases,
    coverage_status: "partial",
    width: region.browser_width,
    height: region.browser_height,
    asset: cfg.asset,
    transform: buildTransform(region),
    native_refs: {
      "pw-map.ru": {
        region_id: region.id,
        slug: region.slug,
        origin_x: region.origin_x,
        origin_y: region.origin_y,
        max_x: region.max_x,
        max_y: region.max_y,
      },
    },
    notice:
      cfg.notice ??
      "Mapa/pontos de pw-map.ru traduzidos para PT-BR. Textos na arte do mapa podem permanecer em russo até haver asset próprio. foreign_reference / permission_pending.",
    synthetic: false,
    origin: "third_party",
    source_url: `https://pw-map.ru/${region.slug}`,
    points: points.map((p) => {
      const type = typeById.get(p.type?.id) ?? p.type;
      const category = mapCategory(type);
      const icon_key = iconKeyForType(type);
      const icon = localIconPath(type?.icon) ?? fallbackIcon(icon_key);
      const nameRu = p.name;
      const namePt = translateText(nameRu, key);
      const typeRu = type?.name ?? null;
      const typePt = typeRu ? translateText(typeRu, key) : null;
      const tipPt = p.description ? translateText(p.description, key) : null;
      return {
        id: `pwm-${region.slug}-${p.id}`,
        name: namePt,
        aliases: [nameRu, String(p.id), typeRu, typePt].filter(Boolean),
        category,
        icon_key,
        icon,
        x: p.x,
        y: p.y,
        altitude: typeof p.height === "number" ? p.height : null,
        zone: null,
        reset_policy: resetPolicy(category, icon_key),
        tip: tipPt,
        access_conditions: null,
        review_status: "foreign_reference",
        origin: "third_party",
        type_label: typePt,
        source_point_id: p.id,
      };
    }),
  };

  const out = join(mapsOut, `${cfg.slug}.json`);
  writeFileSync(out, JSON.stringify(fixture, null, 2), "utf8");
  const untranslated = fixture.points.filter((p) =>
    /[А-Яа-яЁё]/.test(p.name),
  ).length;
  return {
    slug: cfg.slug,
    points: fixture.points.length,
    untranslated_names: untranslated,
  };
}

const summary = Object.keys(REGIONS).map(convert);
console.log(JSON.stringify(summary, null, 2));
