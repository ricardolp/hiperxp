import { get, set } from "idb-keyval";
import { release } from "./data";

const CHARACTERS_KEY = "hiperxp:characters:v1";
const PROGRESS_KEY = "hiperxp:progress:v1";
const ACTIVE_KEY = "hiperxp:active-character:v1";
const EXPORT_FORMAT_VERSION = 1;

export type LocalCharacter = {
  id: string;
  display_name: string;
  created_at: string;
};

export type ProgressState = {
  character_id: string;
  point_id: string;
  period_id: string;
  completed: boolean;
  updated_at: string;
  revision?: number;
};

export type ProgressExport = {
  format_version: number;
  exported_at: string;
  release_id: string;
  characters: LocalCharacter[];
  states: ProgressState[];
};

export type ImportSummary = {
  characters_added: number;
  characters_skipped: number;
  states_merged: number;
  states_unchanged: number;
};

function uuid(): string {
  return crypto.randomUUID();
}

export async function listCharacters(): Promise<LocalCharacter[]> {
  return (await get<LocalCharacter[]>(CHARACTERS_KEY)) ?? [];
}

export async function ensureDefaultCharacter(): Promise<LocalCharacter> {
  const existing = await listCharacters();
  if (existing[0]) {
    const active = await get<string>(ACTIVE_KEY);
    if (!active) await set(ACTIVE_KEY, existing[0].id);
    return existing[0];
  }
  const character: LocalCharacter = {
    id: uuid(),
    display_name: "Personagem 1",
    created_at: new Date().toISOString(),
  };
  await set(CHARACTERS_KEY, [character]);
  await set(ACTIVE_KEY, character.id);
  return character;
}

export async function getActiveCharacterId(): Promise<string | null> {
  return (await get<string>(ACTIVE_KEY)) ?? null;
}

export async function setActiveCharacterId(id: string): Promise<void> {
  await set(ACTIVE_KEY, id);
}

export async function createCharacter(name: string): Promise<LocalCharacter> {
  const characters = await listCharacters();
  const character: LocalCharacter = {
    id: uuid(),
    display_name: name.trim() || `Personagem ${characters.length + 1}`,
    created_at: new Date().toISOString(),
  };
  await set(CHARACTERS_KEY, [...characters, character]);
  await set(ACTIVE_KEY, character.id);
  return character;
}

async function allProgress(): Promise<ProgressState[]> {
  return (await get<ProgressState[]>(PROGRESS_KEY)) ?? [];
}

export async function getProgressForCharacter(
  characterId: string,
): Promise<ProgressState[]> {
  return (await allProgress()).filter((p) => p.character_id === characterId);
}

export async function setPointCompleted(input: {
  characterId: string;
  pointId: string;
  periodId: string;
  completed: boolean;
}): Promise<ProgressState> {
  const states = await allProgress();
  const idx = states.findIndex(
    (p) =>
      p.character_id === input.characterId &&
      p.point_id === input.pointId &&
      p.period_id === input.periodId,
  );
  const prev = idx >= 0 ? states[idx] : undefined;
  const next: ProgressState = {
    character_id: input.characterId,
    point_id: input.pointId,
    period_id: input.periodId,
    completed: input.completed,
    updated_at: new Date().toISOString(),
    revision: (prev?.revision ?? 0) + 1,
  };
  if (idx >= 0) states[idx] = next;
  else states.push(next);
  await set(PROGRESS_KEY, states);
  return next;
}

export function periodIdForPoint(
  resetPolicy: "permanent" | "daily" | "manual",
): string {
  if (resetPolicy === "permanent") return "permanent";
  // Calendar/server reset unknown — use manual period until verified.
  return "manual";
}

export async function exportProgress(): Promise<ProgressExport> {
  return {
    format_version: EXPORT_FORMAT_VERSION,
    exported_at: new Date().toISOString(),
    release_id: release.id,
    characters: await listCharacters(),
    states: await allProgress(),
  };
}

export function parseProgressExport(raw: unknown): ProgressExport {
  if (!raw || typeof raw !== "object") {
    throw new Error("Arquivo de progresso inválido.");
  }
  const data = raw as Partial<ProgressExport>;
  if (data.format_version !== EXPORT_FORMAT_VERSION) {
    throw new Error(
      `Versão de formato não suportada (${String(data.format_version)}).`,
    );
  }
  if (!Array.isArray(data.characters) || !Array.isArray(data.states)) {
    throw new Error("Exportação incompleta: faltam personagens ou estados.");
  }
  return data as ProgressExport;
}

/** Merge import without deleting existing local data. */
export async function importProgress(
  payload: ProgressExport,
): Promise<ImportSummary> {
  const characters = await listCharacters();
  const known = new Set(characters.map((c) => c.id));
  let characters_added = 0;
  let characters_skipped = 0;

  for (const character of payload.characters) {
    if (known.has(character.id)) {
      characters_skipped++;
      continue;
    }
    characters.push(character);
    known.add(character.id);
    characters_added++;
  }
  await set(CHARACTERS_KEY, characters);

  const states = await allProgress();
  let states_merged = 0;
  let states_unchanged = 0;

  for (const incoming of payload.states) {
    const idx = states.findIndex(
      (p) =>
        p.character_id === incoming.character_id &&
        p.point_id === incoming.point_id &&
        p.period_id === incoming.period_id,
    );
    if (idx < 0) {
      states.push({ ...incoming, revision: incoming.revision ?? 1 });
      states_merged++;
      continue;
    }
    const current = states[idx]!;
    const incomingRev = incoming.revision ?? 0;
    const currentRev = current.revision ?? 0;
    if (incomingRev > currentRev) {
      states[idx] = incoming;
      states_merged++;
    } else if (
      incomingRev === currentRev &&
      incoming.updated_at > current.updated_at
    ) {
      states[idx] = incoming;
      states_merged++;
    } else {
      states_unchanged++;
    }
  }

  await set(PROGRESS_KEY, states);
  return {
    characters_added,
    characters_skipped,
    states_merged,
    states_unchanged,
  };
}

/** Requires explicit scope. Never wipes silently. */
export async function resetProgress(scope: {
  all?: boolean;
  characterId?: string;
  mapPointIds?: string[];
}): Promise<number> {
  if (!scope.all && !scope.characterId && !scope.mapPointIds) {
    throw new Error("Informe o escopo do reset (all, characterId ou mapPointIds).");
  }

  const states = await allProgress();

  if (scope.all) {
    await set(PROGRESS_KEY, []);
    return states.length;
  }

  const cleared = states.filter((state) => {
    const characterMatches =
      !scope.characterId || state.character_id === scope.characterId;

    if (scope.mapPointIds) {
      if (characterMatches && scope.mapPointIds.includes(state.point_id)) {
        return false;
      }
      return true;
    }

    return !characterMatches;
  });

  const removed = states.length - cleared.length;
  await set(PROGRESS_KEY, cleared);
  return removed;
}
