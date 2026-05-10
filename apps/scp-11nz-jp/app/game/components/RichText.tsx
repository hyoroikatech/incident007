"use client";

import { Fragment } from "react";
import { assetPath } from "../../lib/asset";

/**
 * シンプルなマークアップをパースして JSX に変換する
 *
 * 対応マークアップ:
 *   [画像: /path/to/image.jpg]
 *   [赤文字: テキスト]
 *   [太字: テキスト]
 *   [リンク: target_scene_id | 表示テキスト]
 */

type Token =
  | { type: "text"; value: string }
  | { type: "image"; src: string }
  | { type: "red"; value: string }
  | { type: "bold"; value: string }
  | { type: "link"; target: string; label: string };

const TOKEN_RE = /\[(画像|赤文字|太字|リンク):\s*([^\]]+?)\]/g;

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  for (const match of input.matchAll(TOKEN_RE)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      tokens.push({ type: "text", value: input.slice(lastIndex, idx) });
    }
    const tag = match[1];
    const content = match[2];
    if (tag === "画像") tokens.push({ type: "image", src: content });
    else if (tag === "赤文字") tokens.push({ type: "red", value: content });
    else if (tag === "太字") tokens.push({ type: "bold", value: content });
    else if (tag === "リンク") {
      const [target, label] = content.split("|").map((s) => s.trim());
      tokens.push({ type: "link", target, label: label ?? target });
    }
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < input.length) {
    tokens.push({ type: "text", value: input.slice(lastIndex) });
  }
  return tokens;
}

/** `---` 行で分割してセクションごとに分けたい時に使うヘルパー */
export function splitByHr(text: string): string[] {
  return text
    .split(/\n[ \t]*-{3,}[ \t]*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

interface RichTextProps {
  text: string;
  imageMaxHeight?: string;
  onLinkClick?: (target: string) => void;
}

export function RichText({ text, imageMaxHeight = "400px", onLinkClick }: RichTextProps) {
  const tokens = tokenize(text);

  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.type === "text") {
          return <Fragment key={i}>{tok.value}</Fragment>;
        }
        if (tok.type === "image") {
          return (
            <span
              key={i}
              style={{
                display: "block",
                margin: "0.75rem 0",
                textAlign: "center",
              }}
            >
              <img
                src={assetPath(tok.src)}
                alt=""
                style={{
                  maxWidth: "100%",
                  maxHeight: imageMaxHeight,
                  objectFit: "contain",
                  borderRadius: "4px",
                  border: "1px solid #2a2a3a",
                }}
              />
            </span>
          );
        }
        if (tok.type === "red") {
          return (
            <span
              key={i}
              style={{
                color: "#ff5555",
                fontWeight: 700,
                textShadow: "0 0 6px rgba(255, 80, 80, 0.4)",
              }}
            >
              {tok.value}
            </span>
          );
        }
        if (tok.type === "bold") {
          return (
            <span key={i} style={{ fontWeight: 700, color: "#fff" }}>
              {tok.value}
            </span>
          );
        }
        if (tok.type === "link") {
          return (
            <span
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onLinkClick?.(tok.target);
              }}
              style={{
                color: "#7777ff",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {tok.label}
            </span>
          );
        }
        return null;
      })}
    </>
  );
}
