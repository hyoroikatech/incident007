"use client";

import type {
  WebPageSceneDef,
  Action,
  GameEngine,
  ContentSection,
} from "@incident007/escape-engine";
import { evaluate } from "@incident007/escape-engine";
import { RichText, splitByHr } from "./RichText";
import { ChatBubbles } from "./ChatBubbles";
import { LetterView } from "./LetterView";

interface WebPageViewProps {
  scene: WebPageSceneDef;
  engine: GameEngine;
  onAction: (actionKey: string) => void;
  onNavigate: (target: string) => void;
  onExecAction: (action: Action) => Promise<void>;
}

export function WebPageView({
  scene,
  engine,
  onAction,
  onNavigate,
  onExecAction,
}: WebPageViewProps) {
  const state = engine.store;

  // 条件付きセクションの解決
  const resolveSection = (section: ContentSection) => {
    // 動的コンテンツがあればそちらを優先
    const dynamic = state.dynamicContent[scene.id]?.[section.id];
    if (dynamic) return dynamic;

    // variantsを評価
    if (section.variants) {
      for (const variant of section.variants) {
        if (evaluate(variant.condition, state)) {
          return variant.content;
        }
      }
    }
    return section.default ?? "";
  };

  // チャットメッセージを評価（messages + appendMessages）
  const resolveChatMessages = (section: ContentSection) => {
    const messages = [...(section.messages ?? [])];
    if (section.appendMessages) {
      for (const append of section.appendMessages) {
        if (evaluate(append.condition, state)) {
          messages.push(...append.messages);
        }
      }
    }
    return messages;
  };

  // letter テンプレート: 任命書を全面表示
  if (scene.template === "letter" && scene.fields) {
    const f = scene.fields;
    return (
      <>
        <LetterView
          date={f.date?.value ?? ""}
          recipient={f.recipient?.value ?? ""}
          fromOrg={f.fromOrg?.value ?? ""}
          fromPerson={f.fromPerson?.value ?? ""}
          body={f.body?.value ?? ""}
          title={f.title?.value ?? "任 命 書"}
        />
        {/* リンク（次へ進むボタン等） */}
        {scene.links && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              padding: "0 1.5rem",
              zIndex: 50,
              opacity: 0,
              animation: "letter-buttons-fade 1s ease-out 2.4s forwards",
            }}
          >
            {scene.links
              .filter((l) => !l.availableWhen || evaluate(l.availableWhen, state))
              .map((link, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    if (link.action) onExecAction(link.action);
                    else if (link.target) onNavigate(link.target);
                  }}
                  style={{
                    padding: "0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.85)",
                    color: "#1a1408",
                    border: "1px solid rgba(80, 60, 30, 0.4)",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontFamily: "'Yu Mincho', serif",
                    fontSize: "0.9rem",
                  }}
                >
                  {link.label}
                </button>
              ))}
            <style>{`
              @keyframes letter-buttons-fade {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "auto",
        padding: "1.5rem",
        paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
        paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
        background: "#0d0d1a",
        fontFamily: "monospace",
        boxSizing: "border-box",
      }}
    >
      {/* ヘッダー */}
      <header
        style={{
          borderBottom: "1px solid #333",
          paddingBottom: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            color: "#666",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "0.5rem",
          }}
        >
          SCP Foundation - Secure Access
        </div>
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 700,
            margin: 0,
            color: "#c0c0ff",
          }}
        >
          {scene.title ?? scene.id}
        </h1>
      </header>

      {/* フィールド（ログインページ等） */}
      {scene.fields && (
        <div style={{ marginBottom: "1.5rem" }}>
          {Object.entries(scene.fields).map(([key, field]) => (
            <div key={key} style={{ marginBottom: "0.75rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.8rem",
                  color: "#888",
                  marginBottom: "0.25rem",
                  textTransform: "uppercase",
                }}
              >
                {key}
              </label>
              <input
                type={key === "password" ? "password" : "text"}
                value={field.value}
                readOnly={!field.editable}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  background: "#1a1a2e",
                  border: "1px solid #333",
                  color: "#e0e0e0",
                  borderRadius: "4px",
                  fontFamily: "monospace",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}
          {scene.actions?.["login"] && (
            <button
              type="button"
              onClick={() => onAction("login")}
              style={{
                marginTop: "0.5rem",
                padding: "0.75rem 2rem",
                background: "#2a2a4a",
                color: "#e0e0e0",
                border: "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "0.9rem",
              }}
            >
              ログイン
            </button>
          )}
        </div>
      )}

      {/* お知らせテンプレート（動的お知らせのみ表示） */}
      {scene.template === "scp-notices" && state.notices.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          {state.notices.map((notice) => (
              <div
                key={notice.id}
                style={{
                  background: notice.read ? "#111122" : "#1a1a30",
                  border: `1px solid ${notice.read ? "#2a2a3a" : "#3a3a5a"}`,
                  borderRadius: "4px",
                  padding: "1rem",
                  marginBottom: "0.5rem",
                  fontSize: "0.9rem",
                  color: notice.read ? "#888" : "#e0e0ff",
                  lineHeight: 1.6,
                }}
                onClick={() => engine.store.markNoticeRead(notice.id)}
              >
                {!notice.read && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#6a6aff",
                      marginRight: "0.5rem",
                    }}
                  />
                )}
                <RichText
                  text={notice.content}
                  onLinkClick={(target) => {
                    engine.store.markNoticeRead(notice.id);
                    onNavigate(target);
                  }}
                />
                {notice.actionTarget && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      engine.store.markNoticeRead(notice.id);
                      onNavigate(notice.actionTarget!);
                    }}
                    style={{
                      display: "block",
                      marginTop: "0.75rem",
                      padding: "0.5rem 1rem",
                      background: "#2a2a5a",
                      color: "#aaaaff",
                      border: "1px solid #4444aa",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                    }}
                  >
                    アクセスする →
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      {/* セクション（報告書等）: --- で分割して個別カードに */}
      {scene.sections?.flatMap((section) => {
        // チャット: messages 配列があれば構造化バブル表示
        if (section.messages || section.appendMessages) {
          const msgs = resolveChatMessages(section);
          return [
            <div
              key={section.id}
              style={{
                background: "#0a0a18",
                border: "1px solid #2a2a3a",
                borderRadius: "8px",
                padding: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <ChatBubbles
                messages={msgs}
                onAttachmentClick={(modalId) =>
                  onExecAction({ type: "modal", modalId })
                }
              />
            </div>,
          ];
        }

        const sectionContent = resolveSection(section);
        if (!sectionContent) return [];
        return splitByHr(sectionContent).map((chunk, i) => (
          <div
            key={`${section.id}-${i}`}
            style={{
              background: "#111122",
              border: "1px solid #2a2a3a",
              borderRadius: "4px",
              padding: "1rem",
              marginBottom: "1rem",
              whiteSpace: "pre-wrap",
              lineHeight: 1.6,
              fontSize: "0.9rem",
              color: "#ccc",
            }}
          >
            <RichText text={chunk} onLinkClick={onNavigate} />
          </div>
        ));
      })}

      {/* リンク一覧（条件未達のリンクは非表示） */}
      {scene.links && (
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {scene.links
            .filter((link) => !link.availableWhen || evaluate(link.availableWhen, state))
            .map((link, i) => {
            const available = true;

            return (
              <button
                type="button"
                key={i}
                disabled={!available}
                onClick={() => {
                  if (link.action) {
                    onExecAction(link.action);
                  } else if (link.target) {
                    onNavigate(link.target);
                  }
                }}
                style={{
                  textAlign: "left",
                  padding: "0.75rem 1rem",
                  background: available ? "#1a1a2e" : "#0d0d15",
                  color: available ? "#8888ff" : "#444",
                  border: "1px solid #2a2a3a",
                  borderRadius: "4px",
                  cursor: available ? "pointer" : "not-allowed",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  opacity: available ? 1 : 0.5,
                }}
              >
                {link.label}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
