export interface Notice {
  id: string;
  content: string;
  read: boolean;
  actionTarget?: string;
}

export interface ItemAcquisition {
  acquiredAt: number;
  acquiredFromScene: string;
  acquiredFromLabel?: string;
}

export interface StoryEntry {
  id: string;
  sceneId?: string;
  sceneTitle?: string;
  dialogues: { text: string; speaker?: string }[];
  timestamp: number;
}

export interface GameState {
  currentScene: string;
  sceneHistory: string[];
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  inventory: string[];
  /** アイテムごとの取得情報 */
  itemAcquisitions: Record<string, ItemAcquisition>;
  visitedScenes: string[];
  /** 1度完了（onComplete発火）したシーンID */
  completedScenes: string[];
  /** 詳細を1度確認したアイテムID */
  viewedItems: string[];
  currentPart: number;
  notices: Notice[];
  dynamicContent: Record<string, Record<string, string>>;
  /** モーダルごとのフォーム入力下書き */
  formDrafts: Record<string, Record<string, string>>;
  /** 既読のモノローグ・ノベル履歴 */
  storyLog: StoryEntry[];
}

export interface SaveData {
  version: number;
  timestamp: number;
  state: GameState;
}

export const SAVE_VERSION = 1;

export function createInitialState(startScene: string): GameState {
  return {
    currentScene: startScene,
    sceneHistory: [],
    flags: {},
    counters: {},
    inventory: [],
    itemAcquisitions: {},
    visitedScenes: [],
    completedScenes: [],
    viewedItems: [],
    currentPart: 1,
    notices: [],
    dynamicContent: {},
    formDrafts: {},
    storyLog: [],
  };
}
