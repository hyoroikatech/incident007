"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type {
  RoomSceneDef,
  Hotspot,
  Action,
  GameEngine,
} from "@incident007/escape-engine";
import { evaluate } from "@incident007/escape-engine";
import { assetPath } from "../../lib/asset";

interface RoomViewProps {
  scene: RoomSceneDef;
  engine: GameEngine;
  onExecAction: (action: Action) => Promise<void>;
  onNavigate: (target: string) => void;
  onOpenMap: () => void;
  selectedItemId: string | null;
  onClearItem: () => void;
}

const BASE_W = 390;
const BASE_H = 844;

export function RoomView({
  scene,
  engine,
  onExecAction,
  onNavigate,
  onOpenMap,
  selectedItemId,
  onClearItem,
}: RoomViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<Hotspot | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  // 利用可能なホットスポットをフィルタ
  const visibleHotspots = scene.hotspots.filter(
    (h) => !h.condition || evaluate(h.condition, engine.store),
  );

  // Canvas描画
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 背景画像
    if (bgImageRef.current) {
      ctx.drawImage(bgImageRef.current, offsetX, offsetY, BASE_W * scale, BASE_H * scale);
    } else {
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, w, h);
    }

    // ホットスポット描画
    for (const hotspot of visibleHotspots) {
      const x = hotspot.x * scale + offsetX;
      const y = hotspot.y * scale + offsetY;
      const hw = hotspot.width * scale;
      const hh = hotspot.height * scale;

      const isHovered = hoveredId === hotspot.id;

      ctx.save();

      if (isHovered) {
        // ホバー時: 枠線 + ラベル
        ctx.strokeStyle = "rgba(140, 140, 255, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, hw, hh);

        if (hotspot.label) {
          ctx.font = "12px sans-serif";
          const tw = ctx.measureText(hotspot.label).width + 12;
          ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
          ctx.fillRect(x, y - 24, tw, 22);
          ctx.fillStyle = "#d0d0ff";
          ctx.fillText(hotspot.label, x + 6, y - 8);
        }
      } else {
        // 通常時: 小さなパルスドットのみ
        ctx.beginPath();
        ctx.arc(x + hw / 2, y + hh / 2, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(130, 130, 255, 0.35)";
        ctx.fill();
      }

      ctx.restore();
    }
  }, [scale, offsetX, offsetY, visibleHotspots, hoveredId]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 親要素の実サイズに合わせる
    const parent = canvas.parentElement;
    const rect = parent?.getBoundingClientRect();
    const vw = rect?.width ?? window.innerWidth;
    const vh = rect?.height ?? window.innerHeight;

    // Retina対応
    const dpr = window.devicePixelRatio || 1;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    canvas.style.width = vw + "px";
    canvas.style.height = vh + "px";

    const ctx = canvas.getContext("2d");
    ctx?.scale(dpr, dpr);

    const scaleX = vw / BASE_W;
    const scaleY = vh / BASE_H;
    const s = Math.min(scaleX, scaleY);
    setScale(s);
    setOffsetX((vw - BASE_W * s) / 2);
    setOffsetY((vh - BASE_H * s) / 2);
  }, []);

  // リサイズ対応（初回は1フレーム遅延でレイアウト確定後に計算）
  useEffect(() => {
    requestAnimationFrame(() => resize());
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  // 背景画像読み込み（完了後にリサイズ再計算+描画）
  useEffect(() => {
    if (!scene.background) return;

    const img = new Image();
    img.onload = () => {
      bgImageRef.current = img;
      resize();
      draw();
    };
    img.src = assetPath(scene.background);
  }, [scene.background, resize, draw]);

  // 再描画
  useEffect(() => {
    draw();
  }, [draw]);

  // タップ/クリック位置からホットスポットを検出
  const hitTest = useCallback(
    (clientX: number, clientY: number): Hotspot | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;

      // Canvas座標 → 基準座標
      const baseX = (px - offsetX) / scale;
      const baseY = (py - offsetY) / scale;

      for (const hotspot of visibleHotspots) {
        if (
          baseX >= hotspot.x &&
          baseX <= hotspot.x + hotspot.width &&
          baseY >= hotspot.y &&
          baseY <= hotspot.y + hotspot.height
        ) {
          return hotspot;
        }
      }
      return null;
    },
    [offsetX, offsetY, scale, visibleHotspots],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const hit = hitTest(e.clientX, e.clientY);
      if (hit) {
        setActiveHotspot(hit);
      }
    },
    [hitTest],
  );

  const handleCanvasMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const hit = hitTest(e.clientX, e.clientY);
      setHoveredId(hit?.id ?? null);
    },
    [hitTest],
  );

  const handleHotspotAction = useCallback(async () => {
    if (!activeHotspot) return;

    // アイテム選択中で、このホットスポットにuseItem定義がある場合
    if (selectedItemId && activeHotspot.useItem?.[selectedItemId]) {
      await onExecAction(activeHotspot.useItem[selectedItemId]);
      onClearItem();
    } else {
      await onExecAction(activeHotspot.action);
    }
    setActiveHotspot(null);
  }, [activeHotspot, onExecAction, selectedItemId, onClearItem]);

  // DPad遷移
  const handleDPad = useCallback(
    (direction: "up" | "down" | "left" | "right") => {
      const target = scene.map?.connections[direction];
      if (target) {
        onNavigate(target);
      }
    },
    [scene.map, onNavigate],
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        style={{
          position: "absolute",
          inset: 0,
          cursor: hoveredId ? "pointer" : "default",
          touchAction: "none",
        }}
      />

      {/* DPad (どこかに接続がある場合のみ表示) */}
      {scene.map && Object.values(scene.map.connections).some((c) => c) && (
        <div
          style={{
            position: "absolute",
            bottom: "env(safe-area-inset-bottom, 20px)",
            left: "20px",
            display: "grid",
            gridTemplateColumns: "48px 48px 48px",
            gridTemplateRows: "48px 48px 48px",
            gap: "2px",
            zIndex: 30,
            opacity: 0.7,
          }}
        >
          <div />
          <DPadButton
            label="▲"
            disabled={!scene.map.connections.up}
            onClick={() => handleDPad("up")}
          />
          <div />
          <DPadButton
            label="◀"
            disabled={!scene.map.connections.left}
            onClick={() => handleDPad("left")}
          />
          <DPadButton
            label="◆"
            disabled={false}
            onClick={onOpenMap}
          />
          <DPadButton
            label="▶"
            disabled={!scene.map.connections.right}
            onClick={() => handleDPad("right")}
          />
          <div />
          <DPadButton
            label="▼"
            disabled={!scene.map.connections.down}
            onClick={() => handleDPad("down")}
          />
          <div />
        </div>
      )}

      {/* ホットスポットタップ時の情報パネル */}
      {activeHotspot && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(10, 10, 30, 0.95)",
            borderTop: "1px solid #333",
            padding: "1.25rem",
            zIndex: 35,
          }}
        >
          <p
            style={{
              margin: "0 0 0.75rem",
              fontSize: "1rem",
              color: "#e0e0ff",
              fontWeight: 600,
            }}
          >
            {activeHotspot.label ?? activeHotspot.id}
          </p>
          {selectedItemId && activeHotspot.useItem?.[selectedItemId] && (
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "#8888ff" }}>
              アイテムを使用できます
            </p>
          )}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={handleHotspotAction}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: selectedItemId && activeHotspot.useItem?.[selectedItemId]
                  ? "#3a2a6a" : "#2a2a5a",
                color: "#e0e0ff",
                border: "1px solid #444",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              {selectedItemId && activeHotspot.useItem?.[selectedItemId] ? "使う" : "調べる"}
            </button>
            <button
              onClick={() => setActiveHotspot(null)}
              style={{
                padding: "0.75rem 1.5rem",
                background: "#1a1a2e",
                color: "#888",
                border: "1px solid #333",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              戻る
            </button>
          </div>
        </div>
      )}

      {/* マップボタン（DPadがない場合） */}
      {!scene.map && (
        <button
          onClick={onOpenMap}
          style={{
            position: "absolute",
            top: "env(safe-area-inset-top, 16px)",
            right: "16px",
            background: "rgba(20, 20, 40, 0.8)",
            color: "#aaa",
            border: "1px solid #333",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            fontSize: "0.8rem",
            cursor: "pointer",
            zIndex: 30,
          }}
        >
          マップ
        </button>
      )}
    </div>
  );
}

// DPadボタンコンポーネント
function DPadButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "48px",
        height: "48px",
        background: disabled ? "rgba(20, 20, 40, 0.3)" : "rgba(30, 30, 60, 0.8)",
        color: disabled ? "#333" : "#aaa",
        border: `1px solid ${disabled ? "#222" : "#444"}`,
        borderRadius: "6px",
        fontSize: "1.2rem",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "manipulation",
      }}
    >
      {label}
    </button>
  );
}
