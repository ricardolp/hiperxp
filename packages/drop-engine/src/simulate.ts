import type { DropGroup, DropReward, DropTableFixture } from "@hiperxp/contracts";
import { createSeed, parseSeed, Pcg32, RNG_VERSION } from "./rng.js";
import { validateDropTable } from "./validate.js";

export const ENGINE_VERSION = "drop-engine-v1";
export const MAX_OPENS = 100_000;
export const MAX_RNG_TESTS = 5_000_000;
export const MAX_OPEN_DETAILS = 100;

export type SimulateProgress = {
  processed: number;
  requested: number;
};

export type SimulateOptions = {
  count: number;
  seed?: string;
  signal?: AbortSignal;
  /** Called roughly every `progressEvery` openings (default 1000). */
  onProgress?: (progress: SimulateProgress) => void;
  progressEvery?: number;
};

export type OpeningDetail = {
  index: number;
  rewards: DropReward[];
};

export type ItemAggregate = {
  item_id: string;
  quantity: string;
  openings_with_item: number;
  observed_open_rate: number;
};

export type SimulateResult = {
  status: "completed" | "cancelled" | "failed";
  error?: string;
  seed: string;
  engine_version: string;
  rng_version: string;
  table_id: string;
  table_revision: string;
  model_version: string;
  requested: number;
  processed: number;
  aggregates: ItemAggregate[];
  openings: OpeningDetail[];
};

function estimateBudget(table: DropTableFixture, count: number): number {
  let perOpen = 0;
  for (const g of table.groups) {
    if (g.type === "guaranteed") continue;
    if (g.type === "exclusive_weighted") perOpen += g.rolls;
    if (g.type === "independent_bernoulli") perOpen += g.rolls * g.entries.length;
  }
  return count * perOpen;
}

function sortGroups(groups: DropGroup[]): DropGroup[] {
  return [...groups].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function sortEntries<T extends { order: number; id: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

function openOnce(groups: DropGroup[], rng: Pcg32): DropReward[] {
  const rewards: DropReward[] = [];

  for (const group of groups) {
    if (group.type === "guaranteed") {
      for (const entry of sortEntries(group.entries)) {
        rewards.push(...entry.rewards);
      }
      continue;
    }

    if (group.type === "exclusive_weighted") {
      const entries = sortEntries(group.entries);
      const total =
        group.weight_kind === "declared_probability"
          ? group.probability_denominator!
          : entries.reduce((s, e) => s + e.weight, 0);
      const cumulative: { entry: (typeof entries)[number]; acc: number }[] = [];
      let acc = 0;
      for (const entry of entries) {
        acc += entry.weight;
        cumulative.push({ entry, acc });
      }
      for (let i = 0; i < group.rolls; i++) {
        const r = rng.nextBelow(total);
        const hit = cumulative.find((c) => c.acc > r);
        if (hit) rewards.push(...hit.entry.rewards);
      }
      continue;
    }

    if (group.type === "independent_bernoulli") {
      for (const entry of sortEntries(group.entries)) {
        for (let i = 0; i < group.rolls; i++) {
          const r = rng.nextBelow(entry.denominator);
          if (r < entry.numerator) rewards.push(...entry.rewards);
        }
      }
    }
  }

  return rewards;
}

function mergeRewards(rewards: DropReward[]): DropReward[] {
  const map = new Map<string, number>();
  for (const r of rewards) {
    map.set(r.item_id, (map.get(r.item_id) ?? 0) + r.quantity);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([item_id, quantity]) => ({ item_id, quantity }));
}

export function simulate(
  table: DropTableFixture,
  options: SimulateOptions,
): SimulateResult {
  const seed = options.seed ?? createSeed();
  const base = {
    seed,
    engine_version: ENGINE_VERSION,
    rng_version: RNG_VERSION,
    table_id: table.id,
    table_revision: table.revision,
    model_version: table.model_version,
    requested: options.count,
  };

  const issues = validateDropTable(table);
  if (issues.length > 0) {
    return {
      ...base,
      status: "failed",
      error: issues.map((i) => i.message).join("; "),
      processed: 0,
      aggregates: [],
      openings: [],
    };
  }

  if (!Number.isInteger(options.count) || options.count < 0) {
    return {
      ...base,
      status: "failed",
      error: "count must be a non-negative integer",
      processed: 0,
      aggregates: [],
      openings: [],
    };
  }

  if (options.count > MAX_OPENS) {
    return {
      ...base,
      status: "failed",
      error: `count exceeds MAX_OPENS (${MAX_OPENS})`,
      processed: 0,
      aggregates: [],
      openings: [],
    };
  }

  if (estimateBudget(table, options.count) > MAX_RNG_TESTS) {
    return {
      ...base,
      status: "failed",
      error: `estimated RNG tests exceed ${MAX_RNG_TESTS}`,
      processed: 0,
      aggregates: [],
      openings: [],
    };
  }

  const rng = new Pcg32(parseSeed(seed));
  const groups = sortGroups(table.groups);
  const qty = new Map<string, bigint>();
  const openingsWith = new Map<string, number>();
  const openings: OpeningDetail[] = [];
  let processed = 0;

  const progressEvery = options.progressEvery ?? 1000;

  for (let i = 0; i < options.count; i++) {
    if (options.signal?.aborted) {
      return finalize("cancelled", base, processed, qty, openingsWith, openings);
    }
    const merged = mergeRewards(openOnce(groups, rng));
    const seen = new Set<string>();
    for (const r of merged) {
      qty.set(r.item_id, (qty.get(r.item_id) ?? 0n) + BigInt(r.quantity));
      seen.add(r.item_id);
    }
    for (const id of seen) {
      openingsWith.set(id, (openingsWith.get(id) ?? 0) + 1);
    }
    if (openings.length < MAX_OPEN_DETAILS) {
      openings.push({ index: i, rewards: merged });
    }
    processed++;
    if (options.onProgress && processed % progressEvery === 0) {
      options.onProgress({ processed, requested: options.count });
    }
  }

  if (options.onProgress && processed > 0) {
    options.onProgress({ processed, requested: options.count });
  }

  return finalize("completed", base, processed, qty, openingsWith, openings);
}

function finalize(
  status: "completed" | "cancelled",
  base: Omit<SimulateResult, "status" | "processed" | "aggregates" | "openings">,
  processed: number,
  qty: Map<string, bigint>,
  openingsWith: Map<string, number>,
  openings: OpeningDetail[],
): SimulateResult {
  const aggregates: ItemAggregate[] = [...qty.keys()]
    .sort((a, b) => a.localeCompare(b))
    .map((item_id) => {
      const openings_with_item = openingsWith.get(item_id) ?? 0;
      return {
        item_id,
        quantity: (qty.get(item_id) ?? 0n).toString(),
        openings_with_item,
        observed_open_rate: processed === 0 ? 0 : openings_with_item / processed,
      };
    });

  return {
    ...base,
    status,
    processed,
    aggregates,
    openings,
  };
}

/** Analytic helpers for supported simple cases (docs/drop-engine.md). */
export function exclusiveProbability(weight: number, total: number): number {
  return weight / total;
}

export function atLeastOneProbability(p: number, trials: number): number {
  if (trials <= 0) return 0;
  return 1 - (1 - p) ** trials;
}
