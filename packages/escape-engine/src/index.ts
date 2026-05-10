// Core
export { GameEngine, type GameEngineConfig } from "./core/GameEngine";
export {
  createGameStore,
  type GameStore,
  type StateActions,
} from "./core/StateManager";
export {
  ActionExecutor,
  type UIHandler,
  type GameEngineRef,
} from "./core/ActionExecutor";
export { evaluate } from "./core/ConditionEvaluator";
export { SceneManager } from "./core/SceneManager";
export { SaveManager } from "./core/SaveManager";
export { EventBus, eventBus } from "./core/EventBus";

// Types
export type { Action, Dialogue } from "./types/action";
export type { Condition, ComparisonOp } from "./types/condition";
export type { GameState, SaveData, Notice, ItemAcquisition, StoryEntry } from "./types/state";
export { SAVE_VERSION, createInitialState } from "./types/state";
export type {
  GameDef,
  SceneDef,
  RoomSceneDef,
  NovelSceneDef,
  MapSceneDef,
  WebPageSceneDef,
  Hotspot,
  ModalDef,
  FormField,
  ItemDef,
  ContentSection,
  ContentVariant,
  ChatMessage,
  ChatMessageAppend,
  PageLink,
  MapConnection,
} from "./types/scenario";
