import type { PointCategory } from "@hiperxp/contracts";

export const CATEGORY_LABELS: Record<PointCategory, string> = {
  chest: "Baú",
  challenge: "Desafio / Mob",
  collectible: "Reflexo",
  daily_resource: "Recurso diário",
  npc: "NPC",
  teleport: "Teleporte",
  quest_objective: "História",
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
