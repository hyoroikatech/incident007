import type { Condition, ComparisonOp } from "../types/condition";
import type { GameState } from "../types/state";

function compare(actual: number, op: ComparisonOp, expected: number): boolean {
  switch (op) {
    case "eq":
      return actual === expected;
    case "gt":
      return actual > expected;
    case "gte":
      return actual >= expected;
    case "lt":
      return actual < expected;
    case "lte":
      return actual <= expected;
  }
}

export function evaluate(condition: Condition, state: GameState): boolean {
  switch (condition.type) {
    case "flag":
      return (state.flags[condition.flag] ?? false) === condition.value;

    case "counter":
      return compare(
        state.counters[condition.counter] ?? 0,
        condition.op,
        condition.value,
      );

    case "has_item":
      return state.inventory.includes(condition.itemId);

    case "not_has_item":
      return !state.inventory.includes(condition.itemId);

    case "visited":
      return state.visitedScenes.includes(condition.sceneId);

    case "not_visited":
      return !state.visitedScenes.includes(condition.sceneId);

    case "current_part":
      return compare(state.currentPart, condition.op, condition.value);

    case "and":
      return condition.conditions.every((c) => evaluate(c, state));

    case "or":
      return condition.conditions.some((c) => evaluate(c, state));

    case "not":
      return !evaluate(condition.condition, state);
  }
}
