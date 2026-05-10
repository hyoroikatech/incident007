"use client";

import { Fragment } from "react";

interface SentenceInputProps {
  template: string;
  blanks: Record<string, { id: string; placeholder?: string; width?: string }>;
  formValues: Record<string, string>;
  onChangeField: (id: string, value: string) => void;
  error?: boolean;
}

/**
 * テンプレート文字列の {key} を入力フィールドに置換する
 *
 * 例: template="SCP-11NZ-JPは{a}する{b}である。"
 *     blanks={a:{id:"q1",...}, b:{id:"q2",...}}
 */
export function SentenceInput({
  template,
  blanks,
  formValues,
  onChangeField,
  error = false,
}: SentenceInputProps) {
  // {key} で分割しながらトークン化
  const parts: { type: "text" | "blank"; value: string }[] = [];
  let lastIndex = 0;
  for (const match of template.matchAll(/\{([^}]+)\}/g)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      parts.push({ type: "text", value: template.slice(lastIndex, idx) });
    }
    parts.push({ type: "blank", value: match[1] });
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < template.length) {
    parts.push({ type: "text", value: template.slice(lastIndex) });
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.25rem",
        lineHeight: 2.2,
        fontSize: "0.95rem",
        color: "#ddd",
        padding: "0.4rem",
        background: "#0d0d1a",
        border: "1px solid #2a2a3a",
        borderRadius: "4px",
      }}
    >
      {parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <span key={i} style={{ whiteSpace: "pre-wrap" }}>
              {part.value}
            </span>
          );
        }
        const blank = blanks[part.value];
        if (!blank) return <Fragment key={i} />;
        return (
          <input
            key={i}
            type="text"
            value={formValues[blank.id] ?? ""}
            onChange={(e) => onChangeField(blank.id, e.target.value)}
            placeholder={blank.placeholder ?? ""}
            style={{
              width: blank.width ?? "100px",
              padding: "0.35rem 0.5rem",
              background: "#000",
              border: `1px solid ${error ? "#a33" : "#5566aa"}`,
              borderRadius: "3px",
              color: "#fff",
              fontSize: "0.95rem",
              fontFamily: "inherit",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          />
        );
      })}
    </div>
  );
}
