import type { Condition } from "./condition";

export interface Dialogue {
  text: string;
  speaker?: string;
  speed?: number;
}

export type Action =
  | { type: "navigate"; target: string }
  | { type: "modal"; modalId: string }
  | { type: "set_flag"; flag: string; value: boolean }
  | { type: "increment"; counter: string; amount?: number }
  | { type: "decrement"; counter: string; amount?: number }
  | { type: "add_item"; itemId: string }
  | { type: "remove_item"; itemId: string }
  | { type: "add_notice"; noticeId: string; content: string; actionTarget?: string }
  | {
      type: "update_content";
      targetScene: string;
      sectionId: string;
      newContent: string;
    }
  | { type: "trigger"; event: string }
  | { type: "set_part"; part: number }
  | { type: "advance_part" }
  | { type: "sequence"; steps: Action[] }
  | {
      type: "conditional";
      condition: Condition;
      then: Action;
      else?: Action;
    }
  | {
      type: "check_answer";
      correct: string;
      targetField?: string;
      /** 複数フィールド検証用: { fieldId: 正解 } */
      corrects?: Record<string, string>;
      onCorrect: Action;
      onIncorrect?: Action;
      /** 不正解時もモーダルを閉じる（デフォルト: false=開いたまま） */
      closeOnIncorrect?: boolean;
    }
  | { type: "play_novel"; dialogues: Dialogue[] }
  | { type: "wait"; duration: number; message?: string }
  | { type: "noop" };
