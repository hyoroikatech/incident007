"use client";

import type { GameEngine, RoomSceneDef } from "@incident007/escape-engine";
import { evaluate } from "@incident007/escape-engine";
import { assetPath } from "../../lib/asset";

interface MapViewProps {
  engine: GameEngine;
  areaId?: string;
  onSelectRoom: (sceneId: string) => void;
  onClose: () => void;
}

export function MapView({ engine, areaId, onSelectRoom, onClose }: MapViewProps) {
  const roomScenes = engine.sceneManager
    .getScenesByType("room")
    .filter((s) => !areaId || s.map?.areaId === areaId) as RoomSceneDef[];

  const currentSceneId = engine.store.currentScene;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#0a0a1a",
        zIndex: 40,
        overflow: "auto",
        padding: "1rem",
        paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
        paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          paddingBottom: "0.75rem",
          borderBottom: "1px solid #222",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#c0c0ff" }}>
          マップ
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            color: "#888",
            border: "1px solid #333",
            borderRadius: "4px",
            padding: "0.4rem 1rem",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          閉じる
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {roomScenes.map((room) => {
          const isCurrent = room.id === currentSceneId;
          const available =
            !room.map?.availableWhen ||
            evaluate(room.map.availableWhen, engine.store);
          const visited = engine.store.visitedScenes.includes(room.id);

          return (
            <button
              key={room.id}
              disabled={!available}
              onClick={() => {
                if (available) {
                  onSelectRoom(room.id);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.75rem",
                background: isCurrent
                  ? "rgba(60, 60, 120, 0.4)"
                  : available
                    ? "rgba(20, 20, 40, 0.6)"
                    : "rgba(10, 10, 20, 0.4)",
                border: isCurrent
                  ? "1px solid #6666cc"
                  : "1px solid #222",
                borderRadius: "6px",
                cursor: available ? "pointer" : "not-allowed",
                textAlign: "left",
                opacity: available ? 1 : 0.4,
              }}
            >
              {/* サムネイル */}
              <div
                style={{
                  width: "80px",
                  height: "50px",
                  borderRadius: "4px",
                  background: "#1a1a2e",
                  backgroundImage: room.map?.thumbnail
                    ? `url(${assetPath(room.map.thumbnail)})`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  flexShrink: 0,
                  border: "1px solid #333",
                }}
              />

              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    color: available ? "#e0e0ff" : "#555",
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  {room.map?.label ?? room.id}
                  {!available && " 🔒"}
                </p>
                {visited && (
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#555" }}>
                    訪問済み
                  </p>
                )}
                {isCurrent && (
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#6a6aff" }}>
                    現在地
                  </p>
                )}
              </div>
            </button>
          );
        })}

        {roomScenes.length === 0 && (
          <p style={{ color: "#555", textAlign: "center", padding: "2rem" }}>
            移動可能な部屋がありません
          </p>
        )}
      </div>
    </div>
  );
}
