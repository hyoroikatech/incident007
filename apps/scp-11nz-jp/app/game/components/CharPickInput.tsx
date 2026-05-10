"use client";

import { useState, useEffect, useMemo } from "react";

interface CharPickInputProps {
  length: number;
  chars: string[];
  cols?: number;
  value: string;
  onChange: (value: string) => void;
  /** charsをそのまま使うかシャッフルするか（デフォルト: シャッフル） */
  shuffle?: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function CharPickInput({
  length,
  chars,
  cols = 5,
  value,
  onChange,
  shuffle = true,
}: CharPickInputProps) {
  // グリッド配置（一度だけシャッフル）
  const gridChars = useMemo(
    () => (shuffle ? shuffleArray(chars) : chars),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chars.join(",")],
  );

  // 選択中のスロットインデックス（次にどこを埋めるか）
  const [activeSlot, setActiveSlot] = useState(0);

  // 入力済み文字配列
  const slots: string[] = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < length; i++) {
      arr.push(value[i] ?? "");
    }
    return arr;
  }, [value, length]);

  useEffect(() => {
    // 入力位置を最初の空スロットに
    const firstEmpty = slots.findIndex((s) => s === "");
    setActiveSlot(firstEmpty === -1 ? length - 1 : firstEmpty);
  }, [slots, length]);

  const handlePickChar = (ch: string) => {
    const newSlots = [...slots];
    if (activeSlot >= length) return;
    newSlots[activeSlot] = ch;
    onChange(newSlots.join(""));

    // 次のスロットへ
    if (activeSlot < length - 1) {
      setActiveSlot(activeSlot + 1);
    }
  };

  const handleClear = (idx: number) => {
    const newSlots = [...slots];
    newSlots[idx] = "";
    onChange(newSlots.join(""));
    setActiveSlot(idx);
  };

  const handleClearAll = () => {
    onChange("");
    setActiveSlot(0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* 入力スロット表示 */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
          padding: "0.5rem",
        }}
      >
        {slots.map((ch, i) => (
          <button
            key={i}
            type="button"
            onClick={() => (ch ? handleClear(i) : setActiveSlot(i))}
            style={{
              width: "52px",
              height: "60px",
              background: ch ? "#1a1a3a" : "#0a0a14",
              border:
                activeSlot === i
                  ? "2px solid #6666ee"
                  : ch
                    ? "2px solid #4444aa"
                    : "2px dashed #333",
              borderRadius: "6px",
              fontSize: "1.6rem",
              fontWeight: 700,
              color: ch ? "#fff" : "#444",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "monospace",
              boxShadow: activeSlot === i ? "0 0 8px rgba(100, 100, 230, 0.5)" : "none",
            }}
          >
            {ch || (activeSlot === i ? "_" : "")}
          </button>
        ))}
      </div>

      {/* 進捗ヒント */}
      <p
        style={{
          margin: 0,
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#888",
        }}
      >
        {activeSlot < length
          ? `${activeSlot + 1}文字目を選択してください`
          : "入力完了"}
      </p>

      {/* 文字選択グリッド */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: "0.4rem",
        }}
      >
        {gridChars.map((ch, i) => {
          const isUsed = slots.includes(ch);
          return (
            <button
              key={i}
              type="button"
              onClick={() => handlePickChar(ch)}
              style={{
                aspectRatio: "1 / 1",
                background: isUsed
                  ? "rgba(60, 60, 100, 0.3)"
                  : "rgba(30, 30, 60, 0.85)",
                border: isUsed ? "1px solid #333" : "1px solid #5555aa",
                borderRadius: "6px",
                fontSize: "1.3rem",
                fontWeight: 600,
                color: isUsed ? "#666" : "#e0e0ff",
                cursor: "pointer",
                fontFamily: "monospace",
                touchAction: "manipulation",
              }}
            >
              {ch}
            </button>
          );
        })}
      </div>

      {/* クリアボタン */}
      <button
        type="button"
        onClick={handleClearAll}
        style={{
          marginTop: "0.25rem",
          padding: "0.4rem",
          background: "transparent",
          color: "#777",
          border: "1px solid #333",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "0.8rem",
        }}
      >
        全てクリア
      </button>
    </div>
  );
}
