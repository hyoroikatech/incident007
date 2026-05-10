"use client";

import { useState } from "react";
import type { GameEngine, ItemDef } from "@incident007/escape-engine";
import { ItemDetailModal } from "./ItemDetailModal";

interface InventoryBarProps {
  engine: GameEngine;
  inventory: string[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
  /** 選択モード（部屋探索中はtrue、それ以外はfalseで詳細表示のみ） */
  selectionMode?: boolean;
}

// フォールバック用のラベルマッピング
const FALLBACK_LABELS: Record<string, { name: string; icon: string }> = {
  id_card: { name: "IDカード", icon: "🪪" },
  id_card_hiraragi: { name: "平良木の社員証", icon: "🪪" },
  crumpled_memo: { name: "くしゃくしゃのメモ", icon: "📝" },
  meme_kill_image: { name: "ミーム殺害エージェント", icon: "☠️" },
  meme_key: { name: "対抗ミーム鍵", icon: "🔑" },
};

export function InventoryBar({
  engine,
  inventory,
  selectedItemId,
  onSelectItem,
  selectionMode = false,
}: InventoryBarProps) {
  const [detailItemId, setDetailItemId] = useState<string | null>(null);

  if (inventory.length === 0) return null;

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
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: "rgba(8, 8, 20, 0.92)",
          borderBottom: "1px solid #2a2a4a",
          padding: "0.6rem 0.75rem",
          paddingTop: "calc(0.6rem + env(safe-area-inset-top, 0px))",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.7rem",
              color: "#555",
              whiteSpace: "nowrap",
              marginRight: "0.25rem",
            }}
          >
            ITEMS
          </span>

          {inventory.map((itemId) => {
            const info = getItemInfo(itemId);
            const isSelected = selectedItemId === itemId;

            return (
              <div
                key={itemId}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.2rem",
                  flexShrink: 0,
                }}
              >
                {/* メインボタン: タップで詳細表示（選択モード時は選択） */}
                <button
                  onClick={() => {
                    if (selectionMode) {
                      onSelectItem(isSelected ? null : itemId);
                    } else {
                      setDetailItemId(itemId);
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setDetailItemId(itemId);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.2rem",
                    padding: "0.4rem 0.6rem",
                    minWidth: "60px",
                    background: isSelected
                      ? "rgba(80, 80, 160, 0.5)"
                      : "rgba(30, 30, 55, 0.8)",
                    border: isSelected
                      ? "2px solid #7777ee"
                      : "2px solid #2a2a4a",
                    borderRadius: "8px",
                    color: isSelected ? "#d0d0ff" : "#bbb",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>
                    {info.icon ?? "📦"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.6rem",
                      whiteSpace: "nowrap",
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {info.name}
                  </span>
                </button>

                {/* 選択モード時の補助ボタン: 詳細表示 */}
                {selectionMode && (
                  <button
                    onClick={() => setDetailItemId(itemId)}
                    style={{
                      fontSize: "0.55rem",
                      padding: "0.1rem 0.4rem",
                      background: "transparent",
                      color: "#666",
                      border: "1px solid #2a2a3a",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    詳細
                  </button>
                )}
                {!selectionMode && (
                  <span style={{ fontSize: "0.55rem", color: "#444" }}>
                    タップで詳細
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 詳細モーダル */}
      {detailItemId && (
        <ItemDetailModal
          itemId={detailItemId}
          itemDef={getItemInfo(detailItemId)}
          engine={engine}
          onClose={() => setDetailItemId(null)}
        />
      )}
    </>
  );
}
