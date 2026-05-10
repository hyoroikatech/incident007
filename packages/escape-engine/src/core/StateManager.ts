import { createStore } from "zustand/vanilla";
import type { GameState, Notice, StoryEntry } from "../types/state";
import { createInitialState } from "../types/state";

export interface StateActions {
  setScene(sceneId: string): void;
  goBack(): void;
  setFlag(flag: string, value: boolean): void;
  incrementCounter(counter: string, amount?: number): void;
  decrementCounter(counter: string, amount?: number): void;
  addItem(itemId: string, fromScene?: string, fromLabel?: string): void;
  removeItem(itemId: string): void;
  addNotice(notice: Notice): void;
  markNoticeRead(noticeId: string): void;
  updateDynamicContent(
    sceneId: string,
    sectionId: string,
    content: string,
  ): void;
  markSceneCompleted(sceneId: string): void;
  markItemViewed(itemId: string): void;
  addStoryEntry(entry: StoryEntry): void;
  setFormDraft(modalId: string, fieldId: string, value: string): void;
  clearFormDraft(modalId: string): void;
  setPart(part: number): void;
  advancePart(): void;
  reset(startScene: string): void;
  loadState(state: GameState): void;
}

export type GameStore = GameState & StateActions;

export function createGameStore(startScene: string) {
  return createStore<GameStore>((set) => ({
    ...createInitialState(startScene),

    setScene(sceneId: string) {
      set((s) => ({
        currentScene: sceneId,
        sceneHistory: [...s.sceneHistory, s.currentScene],
        visitedScenes: s.visitedScenes.includes(sceneId)
          ? s.visitedScenes
          : [...s.visitedScenes, sceneId],
      }));
    },

    goBack() {
      set((s) => {
        if (s.sceneHistory.length === 0) return s;
        const history = [...s.sceneHistory];
        const prev = history.pop()!;
        return { currentScene: prev, sceneHistory: history };
      });
    },

    setFlag(flag: string, value: boolean) {
      set((s) => ({ flags: { ...s.flags, [flag]: value } }));
    },

    incrementCounter(counter: string, amount = 1) {
      set((s) => ({
        counters: {
          ...s.counters,
          [counter]: (s.counters[counter] ?? 0) + amount,
        },
      }));
    },

    decrementCounter(counter: string, amount = 1) {
      set((s) => ({
        counters: {
          ...s.counters,
          [counter]: (s.counters[counter] ?? 0) - amount,
        },
      }));
    },

    addItem(itemId: string, fromScene?: string, fromLabel?: string) {
      set((s) => {
        if (s.inventory.includes(itemId)) return s;
        return {
          inventory: [...s.inventory, itemId],
          itemAcquisitions: {
            ...s.itemAcquisitions,
            [itemId]: {
              acquiredAt: Date.now(),
              acquiredFromScene: fromScene ?? s.currentScene,
              acquiredFromLabel: fromLabel,
            },
          },
        };
      });
    },

    removeItem(itemId: string) {
      set((s) => ({
        inventory: s.inventory.filter((id) => id !== itemId),
      }));
    },

    addNotice(notice: Notice) {
      set((s) => ({
        notices: s.notices.some((n) => n.id === notice.id)
          ? s.notices
          : [...s.notices, notice],
      }));
    },

    markNoticeRead(noticeId: string) {
      set((s) => ({
        notices: s.notices.map((n) =>
          n.id === noticeId ? { ...n, read: true } : n,
        ),
      }));
    },

    updateDynamicContent(sceneId: string, sectionId: string, content: string) {
      set((s) => ({
        dynamicContent: {
          ...s.dynamicContent,
          [sceneId]: {
            ...(s.dynamicContent[sceneId] ?? {}),
            [sectionId]: content,
          },
        },
      }));
    },

    markSceneCompleted(sceneId: string) {
      set((s) => ({
        completedScenes: s.completedScenes.includes(sceneId)
          ? s.completedScenes
          : [...s.completedScenes, sceneId],
      }));
    },

    markItemViewed(itemId: string) {
      set((s) => ({
        viewedItems: s.viewedItems.includes(itemId)
          ? s.viewedItems
          : [...s.viewedItems, itemId],
      }));
    },

    addStoryEntry(entry) {
      set((s) => {
        // 同じidの重複は追加しない
        if (s.storyLog.some((e) => e.id === entry.id)) return s;
        return { storyLog: [...s.storyLog, entry] };
      });
    },

    setFormDraft(modalId: string, fieldId: string, value: string) {
      set((s) => ({
        formDrafts: {
          ...s.formDrafts,
          [modalId]: {
            ...(s.formDrafts[modalId] ?? {}),
            [fieldId]: value,
          },
        },
      }));
    },

    clearFormDraft(modalId: string) {
      set((s) => {
        const next = { ...s.formDrafts };
        delete next[modalId];
        return { formDrafts: next };
      });
    },

    setPart(part: number) {
      set({ currentPart: part });
    },

    advancePart() {
      set((s) => ({ currentPart: s.currentPart + 1 }));
    },

    reset(startScene: string) {
      set(createInitialState(startScene));
    },

    loadState(state: GameState) {
      set(state);
    },
  }));
}
