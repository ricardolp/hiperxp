import type { PointCategory } from "@hiperxp/contracts";

/** Nomes alinhados ao cliente/comunidade BR. */
export const CATEGORY_LABELS: Record<PointCategory, string> = {
  chest: "Baú",
  challenge: "Desafio / Esquadrão",
  collectible: "Relíquia",
  daily_resource: "Recurso diário",
  npc: "NPC",
  teleport: "Teleporte",
  quest_objective: "Missão Global",
};

export const CATEGORY_DESCRIPTIONS: Record<PointCategory, string> = {
  chest: "Baús escondidos e baús guardados por monstros.",
  challenge: "Mini desafios no mapa e esquadrões de mobs diários.",
  collectible: "Relíquias Raiz/Cauda (brilhos) para as Fontes de Energia.",
  daily_resource: "Coleta diária de materiais do continente oriental.",
  npc: "Personagens não jogáveis no mapa.",
  teleport: "Pontos de teleporte e deslocamento.",
  quest_objective: "Histórias da cidade / missões globais (anedotas).",
};

export const CATEGORY_COLORS: Record<PointCategory, string> = {
  chest: "#c4a35a",
  challenge: "#e0a04a",
  collectible: "#5ec8ff",
  daily_resource: "#6fbf8f",
  npc: "#b18fd4",
  teleport: "#e0d4a8",
  quest_objective: "#7eb8a0",
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as PointCategory[];
