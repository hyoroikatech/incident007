"use client";

import { useState } from "react";
import type { GameEngine, ItemDef } from "@incident007/escape-engine";
import { ItemDetailModal } from "./ItemDetailModal";

interface BottomMenuProps {
  engine: GameEngine;
  inventory: string[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
  selectionMode?: boolean;
  onOpenMap?: () => void;
  showMapButton?: boolean;
  onBack?: () => void;
  canGoBack?: boolean;
  onOpenStory?: () => void;
}

const FALLBACK_LABELS: Record<string, { name: string; icon: string }> = {
  id_card: { name: "IDカード", icon: "🪪" },
  id_card_hiraragi: { name: "平良木の社員証", icon: "🪪" },
  crumpled_memo: { name: "くしゃくしゃのメモ", icon: "📝" },
  meme_kill_image: { name: "ミーム殺害エージェント", icon: "☠️" },
  meme_key: { name: "対抗ミーム鍵", icon: "🔑" },
};

export function BottomMenu({
  engine,
  inventory,
  selectedItemId,
  onSelectItem,
  selectionMode = false,
  onOpenMap,
  showMapButton = false,
  onBack,
  canGoBack = false,
  onOpenStory,
}: BottomMenuProps) {
  const [activeTab, setActiveTab] = useState<"none" | "items">("none");
  const [detailItemId, setDetailItemId] = useState<string | null>(null);

  const itemRegistry = engine.getGameDef().itemRegistry ?? {};

  const getItemInfo = (itemId: string): ItemDef => {
    if (itemRegistry[itemId]) return itemRegistry[itemId];
    const fallback = FALLBACK_LABELS[itemId] ?? {
      name: itemId,
      icon: "📦",
    };
    return { id: itemId, name: fallback.name, icon: fallback.icon };
  };

  return (
    <>
      {/* アイテム一覧シート（上から下りてくる） */}
      {activeTab === "items" && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveTab("none");
          }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            zIndex: 40,
            display: "flex",
            alignItems: "flex-start",
            paddingTop: "calc(60px + env(safe-area-inset-top, 0px))",
          }}
        >
          <div
            style={{
              width: "100%",
              background: "#0d0d1a",
              borderBottom: "1px solid #2a2a4a",
              borderRadius: "0 0 12px 12px",
              padding: "1rem",
              maxHeight: "70%",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
                paddingBottom: "0.5rem",
                borderBottom: "1px solid #222",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1rem", color: "#c0c0ff" }}>
                所持アイテム
              </h3>
              <button
                onClick={() => setActiveTab("none")}
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

            {inventory.length === 0 ? (
              <p
                style={{
                  color: "#555",
                  textAlign: "center",
                  padding: "2rem",
                  fontStyle: "italic",
                }}
              >
                アイテムを所持していません
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {inventory.map((itemId) => {
                  const info = getItemInfo(itemId);
                  const isSelected = selectedItemId === itemId;
                  const isNew = !engine.store.viewedItems.includes(itemId);
                  return (
                    <div
                      key={itemId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        padding: "0.75rem",
                        background: isSelected
                          ? "rgba(80, 80, 160, 0.3)"
                          : isNew
                            ? "rgba(80, 50, 30, 0.6)"
                            : "rgba(25, 25, 45, 0.8)",
                        border: isSelected
                          ? "1px solid #6666cc"
                          : isNew
                            ? "2px solid #ee9944"
                            : "1px solid #2a2a3a",
                        borderRadius: "8px",
                        animation: isNew && !isSelected
                          ? "item-blink 1.4s ease-in-out infinite"
                          : "none",
                      }}
                    >
                      {/* アイコン */}
                      <span style={{ fontSize: "2rem", lineHeight: 1, position: "relative" }}>
                        {info.icon ?? "📦"}
                        {isNew && (
                          <span
                            style={{
                              position: "absolute",
                              top: "-6px",
                              right: "-12px",
                              background: "#ee5544",
                              color: "#fff",
                              fontSize: "0.55rem",
                              padding: "1px 5px",
                              borderRadius: "8px",
                              fontWeight: 700,
                              letterSpacing: "0.05em",
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </span>

                      {/* 名前 */}
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.95rem",
                            color: isNew ? "#ffd09a" : "#e0e0ff",
                            fontWeight: 600,
                          }}
                        >
                          {info.name}
                        </p>
                        {isSelected ? (
                          <p style={{ margin: "0.2rem 0 0", fontSize: "0.7rem", color: "#8888ff" }}>
                            選択中
                          </p>
                        ) : isNew ? (
                          <p style={{ margin: "0.2rem 0 0", fontSize: "0.7rem", color: "#ee9944", fontWeight: 600 }}>
                            未確認
                          </p>
                        ) : null}
                      </div>

                      {/* アクションボタン */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                        <button
                          onClick={() => setDetailItemId(itemId)}
                          style={{
                            padding: "0.4rem 0.75rem",
                            background: "rgba(60, 60, 120, 0.5)",
                            color: "#aaaaff",
                            border: "1px solid #444477",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                          }}
                        >
                          詳細
                        </button>
                        {selectionMode && (
                          <button
                            onClick={() => {
                              onSelectItem(isSelected ? null : itemId);
                              setActiveTab("none");
                            }}
                            style={{
                              padding: "0.4rem 0.75rem",
                              background: isSelected
                                ? "#3a3a5a"
                                : "rgba(40, 40, 70, 0.6)",
                              color: isSelected ? "#aaa" : "#bbb",
                              border: "1px solid #444",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                            }}
                          >
                            {isSelected ? "解除" : "使用"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 詳細モーダル */}
      {detailItemId && (
        <ItemDetailModal
          itemId={detailItemId}
          itemDef={getItemInfo(detailItemId)}
          engine={engine}
          onClose={() => setDetailItemId(null)}
        />
      )}

      <style>{`
        @keyframes item-blink {
          0%, 100% { box-shadow: 0 0 0 0 rgba(238, 153, 68, 0.4); }
          50% { box-shadow: 0 0 0 5px rgba(238, 153, 68, 0.1); }
        }
      `}</style>

      {/* 上部ヘッダーメニュー */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 35,
          background: "rgba(8, 8, 20, 0.85)",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid #2a2a4a",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            height: "60px",
          }}
        >
          {/* 戻るボタン */}
          {canGoBack && onBack && (
            <button
              onClick={onBack}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid transparent",
                color: "#888",
                cursor: "pointer",
                fontSize: "0.7rem",
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>←</span>
              <span>戻る</span>
            </button>
          )}

          {/* アイテムボタン */}
          <button
            onClick={() => setActiveTab(activeTab === "items" ? "none" : "items")}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "2px",
              background:
                activeTab === "items" ? "rgba(60, 60, 120, 0.4)" : "transparent",
              border: "none",
              borderBottom:
                activeTab === "items" ? "2px solid #6666cc" : "2px solid transparent",
              color:
                activeTab === "items" || selectedItemId ? "#aaaaff" : "#888",
              cursor: "pointer",
              fontSize: "0.7rem",
              position: "relative",
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>🎒</span>
            <span>アイテム</span>
            {inventory.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "20%",
                  background: "#6666cc",
                  color: "#fff",
                  fontSize: "0.6rem",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                {inventory.length}
              </span>
            )}
            {selectedItemId && (
              <span
                style={{
                  position: "absolute",
                  bottom: "2px",
                  fontSize: "0.55rem",
                  color: "#8888ff",
                }}
              >
                選択中
              </span>
            )}
          </button>

          {/* ストーリーボタン */}
          {onOpenStory && (
            <button
              onClick={onOpenStory}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid transparent",
                color: "#888",
                cursor: "pointer",
                fontSize: "0.7rem",
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>📖</span>
              <span>ストーリー</span>
            </button>
          )}

          {/* マップボタン */}
          {showMapButton && onOpenMap && (
            <button
              onClick={onOpenMap}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "2px",
                background: "transparent",
                border: "none",
                borderBottom: "2px solid transparent",
                color: "#888",
                cursor: "pointer",
                fontSize: "0.7rem",
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>🗺</span>
              <span>マップ</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
