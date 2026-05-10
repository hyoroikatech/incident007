export type ComparisonOp = "eq" | "gt" | "gte" | "lt" | "lte";

export type Condition =
  | { type: "flag"; flag: string; value: boolean }
  | { type: "counter"; counter: string; op: ComparisonOp; value: number }
  | { type: "has_item"; itemId: string }
  | { type: "not_has_item"; itemId: string }
  | { type: "visited"; sceneId: string }
  | { type: "not_visited"; sceneId: string }
  | { type: "current_part"; op: ComparisonOp; value: number }
  | { type: "and"; conditions: Condition[] }
  | { type: "or"; conditions: Condition[] }
  | { type: "not"; condition: Condition };
