"use client";

import { useState, useCallback, useRef } from "react";

const CHARSETS: Record<string, string[]> = {
  katakana: "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン".split(""),
  hiragana: "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split(""),
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  number: "0123456789".split(""),
};

interface SlotInputProps {
  length: number;
  charset: string | string[];
  value: string;
  onChange: (value: string) => void;
}

function DialSlot({
  chars,
  index,
  onChangeIndex,
}: {
  chars: string[];
  index: number;
  onChangeIndex: (index: number) => void;
}) {
  const dragStartY = useRef<number | null>(null);
  const dragStartIndex = useRef(index);

  const prev2 = chars[(index - 2 + chars.length) % chars.length];
  const prev1 = chars[(index - 1 + chars.length) % chars.length];
  const current = chars[index];
  const next1 = chars[(index + 1) % chars.length];
  const next2 = chars[(index + 2) % chars.length];

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragStartY.current = e.clientY;
      dragStartIndex.current = index;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [index],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartY.current === null) return;
      const dy = e.clientY - dragStartY.current;
      const steps = Math.round(dy / 30);
      if (steps !== 0) {
        const newIndex =
          (dragStartIndex.current + steps + chars.length * 100) % chars.length;
        onChangeIndex(newIndex);
      }
    },
    [chars.length, onChangeIndex],
  );

  const handlePointerUp = useCallback(() => {
    dragStartY.current = null;
  }, []);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "ns-resize",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      {/* 上の文字（薄い） */}
      <div style={fadedStyle(0.15)}>{prev2}</div>
      <div style={fadedStyle(0.35)}>{prev1}</div>

      {/* 現在の文字 */}
      <div
        style={{
          width: "48px",
          height: "56px",
          background: "#0a0a1e",
          border: "2px solid #5555cc",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#e0e0ff",
          fontFamily: "monospace",
          boxShadow: "0 0 12px rgba(80, 80, 200, 0.3)",
        }}
      >
        {current}
      </div>

      {/* 下の文字（薄い） */}
      <div style={fadedStyle(0.35)}>{next1}</div>
      <div style={fadedStyle(0.15)}>{next2}</div>
    </div>
  );
}

function fadedStyle(opacity: number): React.CSSProperties {
  return {
    width: "48px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.9rem",
    color: `rgba(180, 180, 220, ${opacity})`,
    fontFamily: "monospace",
    pointerEvents: "none",
  };
}

export function SlotInput({ length, charset, value, onChange }: SlotInputProps) {
  const chars = Array.isArray(charset)
    ? charset
    : CHARSETS[charset] ?? CHARSETS.katakana;

  const [indices, setIndices] = useState<number[]>(() =>
    Array.from({ length }, (_, i) => {
      const ch = value[i];
      const idx = ch ? chars.indexOf(ch) : 0;
      return idx >= 0 ? idx : 0;
    }),
  );

  const handleChangeIndex = useCallback(
    (slotIndex: number, newCharIndex: number) => {
      setIndices((prev) => {
        const next = [...prev];
        next[slotIndex] = newCharIndex;
        const newValue = next.map((i) => chars[i]).join("");
        onChange(newValue);
        return next;
      });
    },
    [chars, onChange],
  );

  return (
    <div
      style={{
        display: "flex",
        gap: "0.3rem",
        justifyContent: "center",
        alignItems: "center",
        padding: "0.5rem 0",
      }}
    >
      {Array.from({ length }, (_, slotIndex) => (
        <DialSlot
          key={slotIndex}
          chars={chars}
          index={indices[slotIndex]}
          onChangeIndex={(newIndex) => handleChangeIndex(slotIndex, newIndex)}
        />
      ))}
    </div>
  );
}
