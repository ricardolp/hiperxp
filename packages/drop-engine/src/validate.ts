import type { DropGroup, DropTableFixture } from "@hiperxp/contracts";

export type ValidationIssue = { code: string; message: string };

const MAX_GROUPS = 100;
const MAX_ENTRIES = 10_000;

export function validateDropTable(table: DropTableFixture): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (table.model_version !== "groups-v1") {
    issues.push({
      code: "unsupported_model",
      message: `model_version ${table.model_version} is not supported`,
    });
  }
  if (table.groups.length > MAX_GROUPS) {
    issues.push({
      code: "too_many_groups",
      message: `at most ${MAX_GROUPS} groups allowed`,
    });
  }

  const groupIds = new Set<string>();
  let entryCount = 0;

  const sorted = [...table.groups].sort(
    (a, b) => a.order - b.order || a.id.localeCompare(b.id),
  );

  for (const group of sorted) {
    if (groupIds.has(group.id)) {
      issues.push({
        code: "duplicate_group_id",
        message: `duplicate group id ${group.id}`,
      });
    }
    groupIds.add(group.id);
    entryCount += group.entries.length;
    issues.push(...validateGroup(group));
  }

  if (entryCount > MAX_ENTRIES) {
    issues.push({
      code: "too_many_entries",
      message: `at most ${MAX_ENTRIES} entries allowed`,
    });
  }

  return issues;
}

function validateGroup(group: DropGroup): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const entryIds = new Set<string>();

  for (const entry of group.entries) {
    if (entryIds.has(entry.id)) {
      issues.push({
        code: "duplicate_entry_id",
        message: `duplicate entry id ${entry.id} in group ${group.id}`,
      });
    }
    entryIds.add(entry.id);
    for (const reward of entry.rewards) {
      if (!Number.isInteger(reward.quantity) || reward.quantity <= 0) {
        issues.push({
          code: "invalid_quantity",
          message: `quantity must be positive integer in ${group.id}/${entry.id}`,
        });
      }
    }
  }

  if (group.type === "exclusive_weighted") {
    if (!Number.isInteger(group.rolls) || group.rolls <= 0) {
      issues.push({
        code: "invalid_rolls",
        message: `rolls must be positive in group ${group.id}`,
      });
    }
    let sum = 0;
    for (const entry of group.entries) {
      if (!Number.isInteger(entry.weight) || entry.weight <= 0) {
        issues.push({
          code: "invalid_weight",
          message: `weight must be positive integer in ${group.id}/${entry.id}`,
        });
      } else {
        sum += entry.weight;
      }
    }
    if (group.weight_kind === "declared_probability") {
      if (
        group.probability_denominator == null ||
        !Number.isInteger(group.probability_denominator) ||
        group.probability_denominator <= 0
      ) {
        issues.push({
          code: "missing_denominator",
          message: `probability_denominator required for declared_probability in ${group.id}`,
        });
      } else if (sum !== group.probability_denominator) {
        issues.push({
          code: "denominator_mismatch",
          message: `weights sum ${sum} != denominator ${group.probability_denominator} in ${group.id}`,
        });
      }
    }
  }

  if (group.type === "independent_bernoulli") {
    if (!Number.isInteger(group.rolls) || group.rolls <= 0) {
      issues.push({
        code: "invalid_rolls",
        message: `rolls must be positive in group ${group.id}`,
      });
    }
    for (const entry of group.entries) {
      if (
        !Number.isInteger(entry.numerator) ||
        !Number.isInteger(entry.denominator) ||
        entry.numerator < 0 ||
        entry.denominator <= 0 ||
        entry.numerator > entry.denominator
      ) {
        issues.push({
          code: "invalid_bernoulli",
          message: `invalid Bernoulli fraction in ${group.id}/${entry.id}`,
        });
      }
    }
  }

  return issues;
}
