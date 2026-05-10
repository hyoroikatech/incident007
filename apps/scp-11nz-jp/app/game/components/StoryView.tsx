"use client";

import { useState } from "react";
import type { StoryEntry } from "@incident007/escape-engine";

interface StoryViewProps {
  storyLog: StoryEntry[];
  onClose: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function StoryView({ storyLog, onClose }: StoryViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    storyLog.length > 0 ? storyLog[storyLog.length - 1].id : null,
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        zIndex: 40,
        display: "flex",
        alignItems: "flex-start",
        paddingTop: "calc(60px + env(safe-area-inset-top, 0px))",
      }}
    >
      <div
        style={{
          width: "100%",
          maxHeight: "75%",
          background: "#0d0d1a",
          borderBottom: "1px solid #2a2a4a",
          borderRadius: "0 0 12px 12px",
          padding: "1rem",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.75rem",
            paddingBottom: "0.5rem",
            borderBottom: "1px solid #222",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "1rem", color: "#c0c0ff" }}>
            ストーリーログ
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              color: "#666",
              border: "1px solid #333",
              borderRadius: "4px",
              padding: "0.3rem 0.75rem",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            閉じる
          </button>
        </div>

        {storyLog.length === 0 ? (
          <p
            style={{
              color: "#555",
              textAlign: "center",
              padding: "2rem",
              fontStyle: "italic",
            }}
          >
            まだストーリーは進行していません
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {storyLog.map((entry) => {
              const expanded = expandedId === entry.id;
              return (
                <div
                  key={entry.id}
                  style={{
                    background: "rgba(20, 20, 40, 0.7)",
                    border: "1px solid #2a2a3a",
                    borderRadius: "6px",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "transparent",
                      border: "none",
                      color: "#aaa",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.85rem",
                    }}
                  >
                    <span>
                      {entry.sceneTitle ?? entry.sceneId ?? "ストーリー"}
                      <span style={{ color: "#555", fontSize: "0.7rem", marginLeft: "0.5rem" }}>
                        {formatTime(entry.timestamp)}
                      </span>
                    </span>
                    <span style={{ color: "#666" }}>{expanded ? "▲" : "▼"}</span>
                  </button>
                  {expanded && (
                    <div
                      style={{
                        padding: "0.75rem",
                        borderTop: "1px solid #2a2a3a",
                        background: "rgba(0, 0, 0, 0.3)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      {entry.dialogues.map((d, i) => (
                        <div key={i} style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                          {d.speaker && (
                            <span
                              style={{
                                color: "#8888ff",
                                fontWeight: 600,
                                marginRight: "0.4rem",
                              }}
                            >
                              {d.speaker}:
                            </span>
                          )}
                          <span style={{ color: "#ccc" }}>{d.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
