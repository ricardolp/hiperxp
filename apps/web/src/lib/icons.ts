/** Fallbacks locais (ícones oficiais do pw-map.ru espelhados). */
export const ICON_URLS: Record<string, string> = {
  chest: "/icons/pw-map/icons_1784113895501464640.webp",
  "monster-chest": "/icons/pw-map/monster-chest-icon.webp",
  glint: "/icons/pw-map/otblesk-icon.webp",
  challenge: "/icons/pw-map/vizov-icon.webp",
  quest: "/icons/pw-map/quest-icon.webp",
  resource: "/icons/pw-map/grib-icon.webp",
  mob: "/icons/pw-map/monster-icon.webp",
  teleport: "/icons/pw-map/icons_1784109905068661400.png",
  npc: "/icons/npc.svg",
};

export const ICON_LABELS: Record<string, string> = {
  chest: "Baú",
  "monster-chest": "Baú com monstros",
  glint: "Relíquia",
  challenge: "Desafio",
  quest: "Missão Global",
  resource: "Recurso diário",
  mob: "Esquadrão",
  teleport: "Teleporte",
  npc: "NPC",
  "drop-guerreiro": "Elmo de Lobo Cinzento",
  "drop-cavaleiro": "Peitoral de Padrão Místico",
  "drop-mutante": "Crina Vermelha",
  "drop-armada": "Chifre Afiado",
  "drop-fera": "Cordão de Presas",
  "drop-sombrio": "Cauda de Sangue",
  "drop-arqueiros": "Asas Cortadas de Mosca",
  "drop-predador": "Inscrição de Bênção na Pedra",
  "drop-cacador": "Máscara Ritualística",
  "drop-ceifador": "Xale Clã dos Viajantes",
  "drop-entrega": "Entrega",
  "drop-ty-profundeza": "Abissal Profundezas",
  "drop-ty-cristalizado": "Abissal Cristalizado",
  "drop-ty-mago": "Abissal Mago",
  "drop-ty-cacador": "Abissal Caçador",
  "drop-ty-atirador": "Abissal Atirador",
  "drop-ty-sombrio": "Abismo Sombrio",
  "drop-ty-alado-furioso": "Guerreiro Alado Furioso",
  "drop-ty-alado-sanguinario": "Guerreiro Alado Sanguinário",
  "drop-ty-alado-guarda": "Guarda do Guerreiro",
  "drop-ty-tita-espirito": "Titã Espírito",
  "drop-ty-tita-pacificador": "Titã Pacificador",
  "drop-ty-tita-furioso": "Titã Furioso",
  "quest-imagem": "Memória / foto",
};

export function iconUrl(
  key: string | undefined,
  explicit?: string | null,
): string {
  if (explicit) return explicit;
  return ICON_URLS[key ?? ""] ?? ICON_URLS.glint!;
}
