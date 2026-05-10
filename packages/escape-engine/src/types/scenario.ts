import type { Action } from "./action";
import type { Condition } from "./condition";

// ホットスポット（RoomScene用）
export interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  action: Action;
  condition?: Condition;
  /** アイテム使用時のアクション: キー=アイテムID */
  useItem?: Record<string, Action>;
}

// モーダル定義
export interface FormField {
  id: string;
  label?: string;
  placeholder?: string;
  /** フィールドの入力タイプ */
  inputType?: "text" | "slot" | "password" | "select" | "sentence" | "charpick";
  /** slot用: 使用する文字セット */
  charset?: "katakana" | "hiragana" | "alphabet" | "number" | string[];
  /** slot用: スロットの文字数 */
  slotLength?: number;
  /** select用: 選択肢 */
  options?: string[];
  /** sentence用: 文章テンプレート 例: "SCP-11NZ-JPは{q1}する{q2}である。" */
  template?: string;
  /** sentence用: blanks内の各フィールド定義 */
  blanks?: Record<
    string,
    { id: string; placeholder?: string; width?: string }
  >;
  /** charpick用: 選択肢に表示する文字配列 */
  pickChars?: string[];
  /** charpick用: グリッドの列数 */
  pickCols?: number;
  /** charpick用: シャッフルするか（デフォルト: true） */
  pickShuffle?: boolean;
}

export interface ModalDef {
  type: "text" | "input" | "image" | "confirm" | "form";
  title?: string;
  content?: string;
  description?: string;
  placeholder?: string;
  fields?: FormField[];
  onSubmit?: Action;
  onClose?: Action;
}

// 条件付きコンテンツセクション
export interface ContentVariant {
  condition: Condition;
  content: string;
}

export interface ChatMessage {
  speaker?: string;
  body?: string;
  attachment?: { filename: string; modalId: string };
  /** "system": 中央表示の通知メッセージ */
  type?: "user" | "system";
}

export interface ChatMessageAppend {
  condition: Condition;
  messages: ChatMessage[];
}

export interface ContentSection {
  id: string;
  default?: string;
  variants?: ContentVariant[];
  /** チャット用: 構造化メッセージ */
  messages?: ChatMessage[];
  /** チャット用: 条件付きで追加されるメッセージ */
  appendMessages?: ChatMessageAppend[];
}

// WebPageScene用リンク
export interface PageLink {
  label: string;
  target?: string;
  action?: Action;
  availableWhen?: Condition;
}

// マップ接続（RoomScene用）
export interface MapConnection {
  areaId: string;
  label: string;
  thumbnail?: string;
  connections: {
    up: string | null;
    down: string | null;
    left: string | null;
    right: string | null;
  };
  availableWhen?: Condition;
}

// シーン定義（discriminated union）
export type SceneDef =
  | RoomSceneDef
  | NovelSceneDef
  | MapSceneDef
  | WebPageSceneDef;

export interface RoomSceneDef {
  id: string;
  type: "room";
  background: string;
  map?: MapConnection;
  hotspots: Hotspot[];
  modals?: Record<string, ModalDef>;
  onEnter?: Action;
  onExit?: Action;
}

export interface NovelSceneDef {
  id: string;
  type: "novel";
  background?: string;
  dialogues: { text: string; speaker?: string; speed?: number }[];
  onComplete: Action;
}

export interface MapSceneDef {
  id: string;
  type: "map";
  areaId: string;
  title: string;
}

export interface WebPageSceneDef {
  id: string;
  type: "webpage";
  template: string;
  title?: string;
  sections?: ContentSection[];
  links?: PageLink[];
  fields?: Record<string, { value: string; editable: boolean }>;
  actions?: Record<string, Action>;
  modals?: Record<string, ModalDef>;
  onEnter?: Action;
}

// アイテム定義
export interface ItemDef {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  description?: string;
}

// ゲーム全体定義
export interface GameDef {
  title: string;
  startScene: string;
  baseResolution: { width: number; height: number };
  scenes: Record<string, SceneDef>;
  eventRegistry: Record<string, Action>;
  itemRegistry?: Record<string, ItemDef>;
}
