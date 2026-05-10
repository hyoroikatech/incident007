import type { GameDef } from "../types/scenario";
import type { GameState } from "../types/state";
import { createGameStore, type GameStore } from "./StateManager";
import { SceneManager } from "./SceneManager";
import { ActionExecutor, type UIHandler } from "./ActionExecutor";
import { SaveManager } from "./SaveManager";
import { eventBus } from "./EventBus";
import type { StoreApi } from "zustand/vanilla";

export interface GameEngineConfig {
  gameDef: GameDef;
  uiHandler: UIHandler;
  gameId?: string;
}

export class GameEngine {
  private vanillaStore: StoreApi<GameStore>;
  readonly sceneManager: SceneManager;
  readonly actionExecutor: ActionExecutor;
  readonly saveManager: SaveManager;

  private gameDef: GameDef;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private autoSaveUnsubscribe: (() => void) | null = null;

  constructor(config: GameEngineConfig) {
    this.gameDef = config.gameDef;
    this.sceneManager = new SceneManager(config.gameDef);

    this.vanillaStore = createGameStore(config.gameDef.startScene);

    this.actionExecutor = new ActionExecutor(
      this,
      config.gameDef,
      config.uiHandler,
    );

    this.saveManager = new SaveManager(config.gameId);
  }

  /** store変更を監視して自動保存を有効化 */
  enableAutoSave(): void {
    if (this.autoSaveUnsubscribe) return;
    this.autoSaveUnsubscribe = this.vanillaStore.subscribe(() => {
      // デバウンス: 連続変更を1回にまとめる
      if (this.saveDebounceTimer) clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = setTimeout(() => {
        this.save().catch((e) => console.error("自動保存失敗:", e));
      }, 300);
    });
  }

  disableAutoSave(): void {
    if (this.autoSaveUnsubscribe) {
      this.autoSaveUnsubscribe();
      this.autoSaveUnsubscribe = null;
    }
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }
  }

  /** 現在の状態を取得（常に最新） */
  get store(): GameStore {
    return this.vanillaStore.getState();
  }

  /** storeの変更を購読 */
  subscribe(listener: (state: GameStore) => void): () => void {
    return this.vanillaStore.subscribe(listener);
  }

  async start(): Promise<void> {
    const savedState = await this.saveManager.load();
    if (savedState) {
      this.store.loadState(savedState);
    }

    const currentScene = this.sceneManager.getScene(this.store.currentScene);
    if (currentScene && "onEnter" in currentScene && currentScene.onEnter) {
      await this.actionExecutor.execute(currentScene.onEnter);
    }

    eventBus.emit("game:start");
  }

  async save(): Promise<void> {
    const { currentScene, sceneHistory, flags, counters, inventory,
      itemAcquisitions, visitedScenes, completedScenes, viewedItems, currentPart,
      notices, dynamicContent, formDrafts, storyLog } = this.store;
    await this.saveManager.save({
      currentScene, sceneHistory, flags, counters, inventory,
      itemAcquisitions, visitedScenes, completedScenes, viewedItems, currentPart,
      notices, dynamicContent, formDrafts, storyLog,
    });
  }

  async reset(): Promise<void> {
    await this.saveManager.delete();
    this.store.reset(this.gameDef.startScene);
    eventBus.emit("game:reset");
  }

  getCurrentScene() {
    return this.sceneManager.getScene(this.store.currentScene);
  }

  getGameDef(): GameDef {
    return this.gameDef;
  }
}
