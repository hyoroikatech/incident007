"use client";

import { useEffect } from "react";
import type { ItemDef, GameEngine } from "@incident007/escape-engine";
import { assetPath } from "../../lib/asset";

interface ItemDetailModalProps {
  itemId: string;
  itemDef?: ItemDef;
  engine: GameEngine;
  onClose: () => void;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

export function ItemDetailModal({
  itemId,
  itemDef,
  engine,
  onClose,
}: ItemDetailModalProps) {
  // 詳細を開いたら確認済みとして記録
  useEffect(() => {
    engine.store.markItemViewed(itemId);
  }, [itemId, engine]);

  const acquisition = engine.store.itemAcquisitions[itemId];
  const sceneTitle = acquisition
    ? (() => {
        const scene = engine.sceneManager.getScene(acquisition.acquiredFromScene);
        if (!scene) return acquisition.acquiredFromScene;
        if ("title" in scene && scene.title) return scene.title;
        if ("map" in scene && scene.map?.label) return scene.map.label;
        return scene.id;
      })()
    : "不明";

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 55,
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#0d0d1a",
          border: "1px solid #333",
          borderRadius: "8px",
          padding: "1.5rem",
          maxWidth: "360px",
          width: "100%",
          maxHeight: "85%",
          overflowY: "auto",
        }}
      >
        {/* ヘッダー */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "1.8rem" }}>{itemDef?.icon ?? "📦"}</span>
          <h3
            style={{
              margin: 0,
              fontSize: "1.1rem",
              color: "#c0c0ff",
              flex: 1,
            }}
          >
            {itemDef?.name ?? itemId}
          </h3>
        </div>

        {/* 画像 */}
        {itemDef?.image && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1rem",
              padding: "0.5rem",
              background: "#0a0a14",
              borderRadius: "6px",
              border: "1px solid #2a2a3a",
            }}
          >
            <img
              src={assetPath(itemDef.image)}
              alt={itemDef.name}
              style={{
                maxWidth: "100%",
                maxHeight: "300px",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                borderRadius: "4px",
              }}
            />
          </div>
        )}

        {/* 説明 */}
        {itemDef?.description && (
          <p
            style={{
              margin: "0 0 1rem",
              color: "#ccc",
              lineHeight: 1.6,
              fontSize: "0.9rem",
              whiteSpace: "pre-wrap",
            }}
          >
            {itemDef.description}
          </p>
        )}

        {/* 取得情報 */}
        <div
          style={{
            background: "#111122",
            border: "1px solid #2a2a3a",
            borderRadius: "4px",
            padding: "0.75rem",
            marginBottom: "1rem",
            fontSize: "0.8rem",
            color: "#888",
          }}
        >
          <div style={{ marginBottom: "0.4rem" }}>
            <span style={{ color: "#666" }}>取得場所: </span>
            <span style={{ color: "#aaa" }}>{sceneTitle}</span>
          </div>
          {acquisition && (
            <div>
              <span style={{ color: "#666" }}>取得日時: </span>
              <span style={{ color: "#aaa" }}>
                {formatTimestamp(acquisition.acquiredAt)}
              </span>
            </div>
          )}
        </div>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          style={{
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
          閉じる
        </button>
      </div>
    </div>
  );
}
