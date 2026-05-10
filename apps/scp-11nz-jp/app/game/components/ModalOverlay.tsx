"use client";

import { useState, useEffect } from "react";
import type { SceneDef, Action, GameEngine } from "@incident007/escape-engine";
import { SlotInput } from "./SlotInput";
import { SentenceInput } from "./SentenceInput";
import { CharPickInput } from "./CharPickInput";
import { RichText } from "./RichText";

interface ModalOverlayProps {
  modalId: string;
  scene: SceneDef;
  engine: GameEngine;
  onClose: () => void;
  onExecAction: (action: Action) => Promise<void>;
}

export function ModalOverlay({
  modalId,
  scene,
  engine,
  onClose,
  onExecAction,
}: ModalOverlayProps) {
  // ドラフト復元
  const draftKey = `${scene.id}:${modalId}`;
  const initialDraft = engine.store.formDrafts[draftKey] ?? {};

  const [inputValue, setInputValue] = useState(initialDraft._single ?? "");
  const [formValues, setFormValues] = useState<Record<string, string>>(initialDraft);
  const [error, setError] = useState("");

  // フォーム値が変わったらドラフト保存
  useEffect(() => {
    const merged = { ...formValues };
    if (inputValue) merged._single = inputValue;
    if (Object.keys(merged).length > 0) {
      Object.entries(merged).forEach(([fieldId, value]) => {
        engine.store.setFormDraft(draftKey, fieldId, value);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, formValues]);

  // シーンが変わったらモーダルも閉じる（onIncorrectのnavigate等のため）
  useEffect(() => {
    if (engine.store.currentScene !== scene.id) {
      onClose();
    }
  }, [engine.store.currentScene, scene.id, onClose]);

  const modals =
    scene.type === "room" || scene.type === "webpage"
      ? scene.modals
      : undefined;
  const modalDef = modals?.[modalId];

  if (!modalDef) {
    return null;
  }

  const handleInputSubmit = async () => {
    if (!modalDef.onSubmit) return;

    if (modalDef.onSubmit.type === "check_answer") {
      const submit = modalDef.onSubmit as {
        correct: string;
        onCorrect: Action;
        onIncorrect?: Action;
        closeOnIncorrect?: boolean;
      };
      const isCorrect = inputValue.trim() === submit.correct;
      if (isCorrect) {
        onClose();
        engine.store.clearFormDraft(draftKey);
        await onExecAction(submit.onCorrect);
      } else {
        if (submit.closeOnIncorrect) {
          onClose();
        } else {
          setError("不正解です。もう一度試してください。");
        }
        if (submit.onIncorrect) {
          await onExecAction(submit.onIncorrect);
        }
      }
    } else {
      onClose();
      await onExecAction(modalDef.onSubmit);
    }
  };

  const handleFormSubmit = async () => {
    if (!modalDef.onSubmit) return;

    if (modalDef.onSubmit.type === "check_answer") {
      const submit = modalDef.onSubmit as {
        correct: string;
        targetField?: string;
        corrects?: Record<string, string>;
        onCorrect: Action;
        onIncorrect?: Action;
        closeOnIncorrect?: boolean;
      };

      let isCorrect = false;

      if (submit.corrects) {
        isCorrect = Object.entries(submit.corrects).every(
          ([fieldId, expected]) => formValues[fieldId]?.trim() === expected,
        );
      } else if (submit.targetField) {
        isCorrect = formValues[submit.targetField]?.trim() === submit.correct;
      } else {
        isCorrect = inputValue.trim() === submit.correct;
      }

      if (isCorrect) {
        onClose();
        engine.store.clearFormDraft(draftKey);
        await onExecAction(submit.onCorrect);
      } else {
        if (submit.closeOnIncorrect) {
          onClose();
        } else {
          setError("不正解です。もう一度試してください。");
        }
        if (submit.onIncorrect) {
          await onExecAction(submit.onIncorrect);
        }
      }
    } else {
      onClose();
      await onExecAction(modalDef.onSubmit);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#1a1a2e",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "1.5rem",
          maxWidth: modalDef.type === "form" ? "380px" : "340px",
          maxHeight: "85%",
          overflowY: "auto",
          width: "100%",
        }}
      >
        {modalDef.title && (
          <h3
            style={{
              margin: "0 0 1rem",
              fontSize: "1.1rem",
              color: "#c0c0ff",
            }}
          >
            {modalDef.title}
          </h3>
        )}

        {modalDef.content && (
          <p
            style={{
              margin: "0 0 1rem",
              color: "#ccc",
              lineHeight: 1.6,
              fontSize: "0.9rem",
              whiteSpace: "pre-wrap",
            }}
          >
            <RichText text={modalDef.content} />
          </p>
        )}

        {modalDef.type === "input" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleInputSubmit();
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError("");
              }}
              placeholder={modalDef.placeholder ?? "入力..."}
              autoFocus
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#0d0d1a",
                border: `1px solid ${error ? "#a33" : "#333"}`,
                color: "#fff",
                fontSize: "1rem",
                borderRadius: "4px",
                fontFamily: "monospace",
                boxSizing: "border-box",
              }}
            />
            {error && (
              <p style={{ color: "#f66", fontSize: "0.8rem", margin: "0.5rem 0 0" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              style={{
                marginTop: "0.75rem",
                width: "100%",
                padding: "0.75rem",
                background: "#2a2a4a",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              送信
            </button>
          </form>
        )}

        {modalDef.type === "confirm" && (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={async () => {
                if (modalDef.onSubmit) await onExecAction(modalDef.onSubmit);
                onClose();
              }}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "#2a2a4a",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              はい
            </button>
            <button
              onClick={() => {
                if (modalDef.onClose) onExecAction(modalDef.onClose);
                onClose();
              }}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "#111",
                color: "#888",
                border: "1px solid #333",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              いいえ
            </button>
          </div>
        )}

        {modalDef.type === "form" && modalDef.fields && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFormSubmit();
            }}
          >
            {modalDef.description && (
              <p style={{ margin: "0 0 1rem", color: "#aaa", fontSize: "0.85rem", lineHeight: 1.5 }}>
                {modalDef.description}
              </p>
            )}
            {modalDef.fields.map((field) => (
              <div key={field.id} style={{ marginBottom: "0.75rem" }}>
                {field.label && (
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      color: "#ccc",
                      marginBottom: "0.4rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {field.label}
                  </label>
                )}

                {(!field.inputType || field.inputType === "text") && (
                  <input
                    type="text"
                    value={formValues[field.id] ?? ""}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }));
                      setError("");
                    }}
                    placeholder={field.placeholder ?? ""}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      background: "#0d0d1a",
                      border: `1px solid ${error ? "#a33" : "#333"}`,
                      color: "#fff",
                      fontSize: "0.95rem",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                    }}
                  />
                )}

                {field.inputType === "password" && (
                  <input
                    type="password"
                    value={formValues[field.id] ?? ""}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }));
                      setError("");
                    }}
                    placeholder={field.placeholder ?? ""}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      background: "#0d0d1a",
                      border: `1px solid ${error ? "#a33" : "#333"}`,
                      color: "#fff",
                      fontSize: "0.95rem",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                    }}
                  />
                )}

                {field.inputType === "charpick" && field.pickChars && (
                  <CharPickInput
                    length={field.slotLength ?? 3}
                    chars={field.pickChars}
                    cols={field.pickCols ?? 5}
                    shuffle={field.pickShuffle ?? true}
                    value={formValues[field.id] ?? ""}
                    onChange={(v) => {
                      setFormValues((prev) => ({ ...prev, [field.id]: v }));
                      setError("");
                    }}
                  />
                )}

                {field.inputType === "slot" && (
                  <SlotInput
                    length={field.slotLength ?? 3}
                    charset={field.charset ?? "katakana"}
                    value={formValues[field.id] ?? ""}
                    onChange={(v) => {
                      setFormValues((prev) => ({ ...prev, [field.id]: v }));
                      setError("");
                    }}
                  />
                )}

                {field.inputType === "sentence" && field.template && field.blanks && (
                  <SentenceInput
                    template={field.template}
                    blanks={field.blanks}
                    formValues={formValues}
                    onChangeField={(id, v) => {
                      setFormValues((prev) => ({ ...prev, [id]: v }));
                      setError("");
                    }}
                    error={!!error}
                  />
                )}

                {field.inputType === "select" && field.options && (
                  <select
                    value={formValues[field.id] ?? ""}
                    onChange={(e) => {
                      setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }));
                      setError("");
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      background: "#0d0d1a",
                      border: `1px solid ${error ? "#a33" : "#333"}`,
                      color: "#fff",
                      fontSize: "0.95rem",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                    }}
                  >
                    <option value="">選択してください</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            {error && (
              <p style={{ color: "#f66", fontSize: "0.8rem", margin: "0 0 0.5rem" }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              style={{
                marginTop: "0.5rem",
                width: "100%",
                padding: "0.75rem",
                background: "#2a2a4a",
                color: "#fff",
                border: "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              送信
            </button>
          </form>
        )}

        {(modalDef.type === "text" || modalDef.type === "image") && (
          <button
            onClick={onClose}
            style={{
              marginTop: "1rem",
              width: "100%",
              padding: "0.75rem",
              background: "#2a2a4a",
              color: "#fff",
              border: "1px solid #444",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            閉じる
          </button>
        )}
      </div>
    </div>
  );
}
