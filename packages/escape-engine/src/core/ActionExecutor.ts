import type { Action } from "../types/action";
import type { GameDef } from "../types/scenario";
import { evaluate } from "./ConditionEvaluator";
import { eventBus } from "./EventBus";

export type UIHandler = {
  playNovel: (
    dialogues: { text: string; speaker?: string; speed?: number }[],
  ) => Promise<void>;
  showModal: (modalId: string) => Promise<void>;
  promptAnswer: (
    correct: string,
  ) => Promise<{ isCorrect: boolean; value: string }>;
  showLoading: (duration: number, message?: string) => Promise<void>;
};

// GameEngineへの循環参照を避けるためインターフェースで抽象化
export interface GameEngineRef {
  get store(): {
    setScene(sceneId: string): void;
    setFlag(flag: string, value: boolean): void;
    incrementCounter(counter: string, amount?: number): void;
    decrementCounter(counter: string, amount?: number): void;
    addItem(itemId: string, fromScene?: string, fromLabel?: string): void;
    itemAcquisitions: Record<string, { acquiredAt: number; acquiredFromScene: string; acquiredFromLabel?: string }>;
    removeItem(itemId: string): void;
    addNotice(notice: { id: string; content: string; read: boolean; actionTarget?: string }): void;
    updateDynamicContent(sceneId: string, sectionId: string, content: string): void;
    setPart(part: number): void;
    advancePart(): void;
    markSceneCompleted(sceneId: string): void;
    markItemViewed(itemId: string): void;
    viewedItems: string[];
    addStoryEntry(entry: { id: string; sceneId?: string; sceneTitle?: string; dialogues: { text: string; speaker?: string }[]; timestamp: number }): void;
    storyLog: { id: string; sceneId?: string; sceneTitle?: string; dialogues: { text: string; speaker?: string }[]; timestamp: number }[];
    setFormDraft(modalId: string, fieldId: string, value: string): void;
    clearFormDraft(modalId: string): void;
    formDrafts: Record<string, Record<string, string>>;
    completedScenes: string[];
    currentScene: string;
    sceneHistory: string[];
    flags: Record<string, boolean>;
    counters: Record<string, number>;
    inventory: string[];
    visitedScenes: string[];
    currentPart: number;
    notices: { id: string; content: string; read: boolean }[];
    dynamicContent: Record<string, Record<string, string>>;
  };
}

export class ActionExecutor {
  constructor(
    private engineRef: GameEngineRef,
    private gameDef: GameDef,
    private uiHandler: UIHandler,
  ) {}

  async execute(action: Action): Promise<void> {
    const store = this.engineRef.store;

    switch (action.type) {
      case "navigate":
        store.setScene(action.target);
        eventBus.emit("scene:change", action.target);
        break;

      case "modal":
        await this.uiHandler.showModal(action.modalId);
        break;

      case "set_flag":
        store.setFlag(action.flag, action.value);
        break;

      case "increment":
        store.incrementCounter(action.counter, action.amount);
        break;

      case "decrement":
        store.decrementCounter(action.counter, action.amount);
        break;

      case "add_item":
        store.addItem(action.itemId, store.currentScene);
        break;

      case "remove_item":
        store.removeItem(action.itemId);
        break;

      case "add_notice":
        store.addNotice({
          id: action.noticeId,
          content: action.content,
          read: false,
          actionTarget: action.actionTarget,
        });
        break;

      case "update_content":
        store.updateDynamicContent(
          action.targetScene,
          action.sectionId,
          action.newContent,
        );
        break;

      case "trigger": {
        const registeredAction = this.gameDef.eventRegistry[action.event];
        if (registeredAction) {
          await this.execute(registeredAction);
        } else {
          console.warn(`未登録のイベント: ${action.event}`);
        }
        break;
      }

      case "set_part":
        store.setPart(action.part);
        break;

      case "advance_part":
        store.advancePart();
        break;

      case "sequence":
        for (const step of action.steps) {
          await this.execute(step);
        }
        break;

      case "conditional": {
        const currentState = this.engineRef.store;
        if (evaluate(action.condition, currentState)) {
          await this.execute(action.then);
        } else if (action.else) {
          await this.execute(action.else);
        }
        break;
      }

      case "check_answer": {
        const result = await this.uiHandler.promptAnswer(action.correct);
        if (result.isCorrect) {
          await this.execute(action.onCorrect);
        } else if (action.onIncorrect) {
          await this.execute(action.onIncorrect);
        }
        break;
      }

      case "play_novel":
        await this.uiHandler.playNovel(action.dialogues);
        break;

      case "wait":
        await this.uiHandler.showLoading(action.duration, action.message);
        break;

      case "noop":
        break;
    }
  }
}
