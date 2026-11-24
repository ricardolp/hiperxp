/** Fallbacks locais (ícones oficiais do pw-map.ru espelhados). */
export const ICON_URLS: Record<string, string> = {
  chest: "/icons/pw-map/icons_1784113895501464640.webp",
  "monster-chest": "/icons/pw-map/monster-chest-icon.webp",
  glint: "/icons/pw-map/otblesk-icon.webp",
  challenge: "/icons/pw-map/vizov-icon.webp",
  quest: "/icons/pw-map/quest-icon.webp",
  resource: "/icons/pw-map/grib-icon.webp",
  mob: "/icons/pw-map/monster-icon.webp",
};

export const ICON_LABELS: Record<string, string> = {
  chest: "Baú",
  "monster-chest": "Baú com monstros",
  glint: "Reflexo",
  challenge: "Desafio",
  quest: "História",
  resource: "Recurso diário",
  mob: "Mob diário",
};

export function iconUrl(
  key: string | undefined,
  explicit?: string | null,
): string {
  if (explicit) return explicit;
  return ICON_URLS[key ?? ""] ?? ICON_URLS.glint!;
}
