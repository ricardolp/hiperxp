import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DropTableFixture } from "@hiperxp/contracts";
import {
  atLeastOneProbability,
  exclusiveProbability,
  simulate,
  validateDropTable,
} from "./index.js";

/** Tabela mínima só para testes do motor (não é conteúdo do produto). */
function loadFixture(): DropTableFixture {
  return {
    schema_version: 1,
    synthetic: true,
    publication_allowed: false,
    notice: "Tabela interna de teste do drop-engine.",
    id: "test-chest",
    slug: "test-chest",
    name_pt_br: "Baú de Teste",
    revision: "test-v1",
    model_version: "groups-v1",
    probability_status: "hypothetical",
    game_build_id: null,
    groups: [
      {
        id: "g1",
        order: 1,
        type: "guaranteed",
        entries: [
          {
            id: "a",
            order: 1,
            rewards: [{ item_id: "fixture-token", quantity: 1 }],
          },
        ],
      },
      {
        id: "g2",
        order: 2,
        type: "exclusive_weighted",
        rolls: 1,
        weight_kind: "declared_probability",
        probability_denominator: 10000,
        entries: [
          {
            id: "b",
            order: 1,
            weight: 100,
            rewards: [{ item_id: "fixture-rare", quantity: 1 }],
          },
          {
            id: "c",
            order: 2,
            weight: 9900,
            rewards: [{ item_id: "fixture-common", quantity: 2 }],
          },
        ],
      },
      {
        id: "g3",
        order: 3,
        type: "independent_bernoulli",
        rolls: 1,
        entries: [
          {
            id: "d",
            order: 1,
            numerator: 1,
            denominator: 2,
            rewards: [{ item_id: "fixture-bonus", quantity: 1 }],
          },
        ],
      },
    ],
  };
}

describe("validateDropTable", () => {
  it("accepts the synthetic fixture", () => {
    assert.equal(validateDropTable(loadFixture()).length, 0);
  });

  it("rejects exclusive weights that do not match denominator", () => {
    const table = loadFixture();
    const group = table.groups.find((g) => g.type === "exclusive_weighted");
    assert.ok(group && group.type === "exclusive_weighted");
    group.probability_denominator = 10;
    group.entries[0]!.weight = 1;
    group.entries[1]!.weight = 8;
    const issues = validateDropTable(table);
    assert.ok(issues.some((i) => i.code === "denominator_mismatch"));
  });
});

describe("analytic helpers", () => {
  it("matches exclusive 1/4 reference", () => {
    assert.equal(exclusiveProbability(1, 4), 0.25);
    assert.equal(atLeastOneProbability(0.25, 2), 0.4375);
  });

  it("matches p=0.01 N=100 reference", () => {
    const p = atLeastOneProbability(0.01, 100);
    assert.ok(Math.abs(p - 0.6339676587267709) < 1e-12);
  });
});

describe("simulate", () => {
  it("is reproducible for the same seed", () => {
    const table = loadFixture();
    const a = simulate(table, { count: 50, seed: "42" });
    const b = simulate(table, { count: 50, seed: "42" });
    assert.equal(a.status, "completed");
    assert.deepEqual(a.aggregates, b.aggregates);
    assert.deepEqual(a.openings, b.openings);
  });

  it("always grants guaranteed rewards", () => {
    const table = loadFixture();
    const result = simulate(table, { count: 20, seed: "7" });
    const token = result.aggregates.find((a) => a.item_id === "fixture-token");
    assert.ok(token);
    assert.equal(token.quantity, "20");
    assert.equal(token.openings_with_item, 20);
  });

  it("shorter run matches prefix of longer run with same seed", () => {
    const table = loadFixture();
    const full = simulate(table, { count: 10, seed: "99" });
    const prefix = simulate(table, { count: 5, seed: "99" });
    assert.deepEqual(prefix.openings, full.openings.slice(0, 5));
  });

  it("honors abort signal between openings", () => {
    const table = loadFixture();
    const controller = new AbortController();
    controller.abort();
    const result = simulate(table, {
      count: 10,
      seed: "99",
      signal: controller.signal,
    });
    assert.equal(result.status, "cancelled");
    assert.equal(result.processed, 0);
  });
});
