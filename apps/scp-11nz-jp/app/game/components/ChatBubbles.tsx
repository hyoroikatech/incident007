"use client";

import type { ChatMessage } from "@incident007/escape-engine";

interface ChatBubblesProps {
  messages: ChatMessage[];
  onAttachmentClick?: (modalId: string) => void;
}

const SPEAKER_COLORS: Record<string, { bg: string; name: string; align: "left" | "right" }> = {
  "アルファ": { bg: "#3a2a3a", name: "#ffaaaa", align: "right" },
  "ベータ": { bg: "#2a3a4a", name: "#aaccff", align: "left" },
  "チャーリー": { bg: "#2a4a3a", name: "#aaeeaa", align: "left" },
  "司令部": { bg: "#3a3a2a", name: "#dddd88", align: "left" },
};

export function ChatBubbles({ messages, onAttachmentClick }: ChatBubblesProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {messages.map((msg, i) => {
        const style = msg.speaker
          ? (SPEAKER_COLORS[msg.speaker] ?? {
              bg: "#2a2a3a",
              name: "#aaaaaa",
              align: "left" as const,
            })
          : {
              bg: "#2a2a3a",
              name: "#aaaaaa",
              align: "left" as const,
            };
        const align = style.align;

        // システム表示
        if (msg.type === "system") {
          return (
            <div
              key={i}
              style={{
                alignSelf: "center",
                padding: "0.4rem 0.75rem",
                background: "rgba(40, 20, 20, 0.7)",
                color: "#cc8888",
                fontSize: "0.75rem",
                borderRadius: "4px",
                fontStyle: "italic",
                maxWidth: "85%",
                textAlign: "center",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.body}
            </div>
          );
        }

        // 添付ファイル
        if (msg.attachment) {
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: align === "right" ? "flex-end" : "flex-start",
              }}
            >
              {msg.speaker && (
                <p
                  style={{
                    margin: "0 0.3rem 0.15rem",
                    fontSize: "0.7rem",
                    color: style.name,
                    fontWeight: 600,
                  }}
                >
                  {msg.speaker}
                </p>
              )}
              <button
                onClick={() => onAttachmentClick?.(msg.attachment!.modalId)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  background: style.bg,
                  border: `1px solid ${style.name}55`,
                  borderRadius:
                    align === "right"
                      ? "12px 12px 4px 12px"
                      : "12px 12px 12px 4px",
                  padding: "0.7rem 0.9rem",
                  cursor: "pointer",
                  color: "#e0e0e0",
                  textAlign: "left",
                  maxWidth: "85%",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                <span style={{ fontSize: "2rem", lineHeight: 1 }}>📎</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    {msg.attachment.filename}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#888" }}>
                    タップで開く
                  </span>
                </div>
              </button>
            </div>
          );
        }

        // 通常のメッセージ
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: align === "right" ? "flex-end" : "flex-start",
              maxWidth: "100%",
            }}
          >
            {msg.speaker && (
              <p
                style={{
                  margin: "0 0.3rem 0.15rem",
                  fontSize: "0.7rem",
                  color: style.name,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                {msg.speaker}
              </p>
            )}
            <div
              style={{
                background: style.bg,
                color: "#e0e0e0",
                padding: "0.6rem 0.85rem",
                borderRadius:
                  align === "right"
                    ? "12px 12px 4px 12px"
                    : "12px 12px 12px 4px",
                maxWidth: "85%",
                fontSize: "0.85rem",
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              {msg.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
