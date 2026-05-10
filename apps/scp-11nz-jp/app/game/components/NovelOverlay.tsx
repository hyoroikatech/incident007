"use client";

import { useState, useEffect, useCallback, useRef, useMemo, Fragment } from "react";
import { assetPath } from "../../lib/asset";

type StyledToken = { text: string; style: "normal" | "red" | "bold" };

const STYLE_TOKEN_RE = /\[(赤文字|太字):\s*([^\]]+?)\]/g;

function parseStyledText(text: string): StyledToken[] {
  const tokens: StyledToken[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(STYLE_TOKEN_RE)) {
    const idx = match.index ?? 0;
    if (idx > lastIndex) {
      tokens.push({ text: text.slice(lastIndex, idx), style: "normal" });
    }
    const tag = match[1];
    const content = match[2];
    tokens.push({ text: content, style: tag === "赤文字" ? "red" : "bold" });
    lastIndex = idx + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ text: text.slice(lastIndex), style: "normal" });
  }
  return tokens;
}

function totalLength(tokens: StyledToken[]): number {
  return tokens.reduce((sum, t) => sum + t.text.length, 0);
}

/** トークン列をN文字目まで表示するように切り詰める */
function sliceTokens(tokens: StyledToken[], count: number): StyledToken[] {
  const result: StyledToken[] = [];
  let remaining = count;
  for (const t of tokens) {
    if (remaining <= 0) break;
    if (t.text.length <= remaining) {
      result.push(t);
      remaining -= t.text.length;
    } else {
      result.push({ ...t, text: t.text.slice(0, remaining) });
      remaining = 0;
    }
  }
  return result;
}

function renderTokens(tokens: StyledToken[]) {
  return tokens.map((t, i) => {
    if (t.style === "red") {
      return (
        <span
          key={i}
          style={{
            color: "#ff5555",
            fontWeight: 700,
            textShadow: "0 0 6px rgba(255, 80, 80, 0.4)",
          }}
        >
          {t.text}
        </span>
      );
    }
    if (t.style === "bold") {
      return (
        <span key={i} style={{ fontWeight: 700, color: "#fff" }}>
          {t.text}
        </span>
      );
    }
    return <Fragment key={i}>{t.text}</Fragment>;
  });
}

interface NovelOverlayProps {
  dialogues: {
    text: string;
    speaker?: string;
    speed?: number;
    /** 0-1。1で真っ暗に。表示時に画面全体に黒オーバーレイをかける */
    fade?: number;
  }[];
  onComplete: () => void;
  transparent?: boolean;
  /** 既読シーン: スキップボタンを表示 */
  canSkip?: boolean;
}

export function NovelOverlay({ dialogues, onComplete, transparent = false, canSkip = false }: NovelOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charsRevealed, setCharsRevealed] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [autoMode, setAutoMode] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const isTypingRef = useRef(true);
  const completedRef = useRef(false);

  // dialogues配列の参照が変わったらindexをリセット（シーン遷移時等）
  useEffect(() => {
    setCurrentIndex(0);
    completedRef.current = false;
  }, [dialogues]);

  const currentDialogue = dialogues[currentIndex];
  const speed = currentDialogue?.speed ?? 40;
  const targetFade = currentDialogue?.fade ?? 0;

  // テキストをトークン化（markup解析）
  const tokens = useMemo(
    () => (currentDialogue ? parseStyledText(currentDialogue.text) : []),
    [currentDialogue],
  );
  const totalChars = useMemo(() => totalLength(tokens), [tokens]);
  const visibleTokens = useMemo(
    () => sliceTokens(tokens, charsRevealed),
    [tokens, charsRevealed],
  );

  // 画像かチェック
  const imageMatch = currentDialogue?.text.match(/^\[画像:\s*(.+?)\]$/);
  const imagePath = imageMatch?.[1];

  // フェード遷移（前回値→targetFadeへ滑らかに）
  useEffect(() => {
    let raf = 0;
    const startTime = Date.now();
    const startFade = fadeOpacity;
    const duration = 700;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 2);
      setFadeOpacity(startFade + (targetFade - startFade) * eased);
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetFade, currentIndex]);

  // タイプライター（charsRevealedをインクリメント）
  useEffect(() => {
    if (!currentDialogue) return;

    if (imagePath) {
      setCharsRevealed(0);
      setIsTyping(false);
      isTypingRef.current = false;
      return;
    }

    setCharsRevealed(0);
    setIsTyping(true);
    isTypingRef.current = true;

    if (totalChars === 0) {
      setIsTyping(false);
      isTypingRef.current = false;
      return;
    }

    let count = 0;
    const timer = setInterval(() => {
      count++;
      setCharsRevealed(count);
      if (count >= totalChars) {
        clearInterval(timer);
        setIsTyping(false);
        isTypingRef.current = false;
      }
    }, speed);

    return () => clearInterval(timer);
  }, [currentIndex, currentDialogue, speed, imagePath, totalChars]);

  // 自動送り: タイプ完了後、一定時間で次へ
  useEffect(() => {
    if (!autoMode) return;
    if (isTyping) return;
    if (completedRef.current) return;
    const t = setTimeout(() => {
      setCurrentIndex((prev) => {
        if (prev < dialogues.length - 1) {
          return prev + 1;
        }
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
        return prev;
      });
    }, 1200);
    return () => clearTimeout(t);
  }, [autoMode, isTyping, dialogues.length, onComplete]);

  const handleSkip = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  const handleTap = useCallback(() => {
    // ref経由で最新stateを取得（連打時のstale closure対策）
    if (isTypingRef.current) {
      // タイプ中ならテキスト全表示
      setCharsRevealed(totalChars);
      setIsTyping(false);
      isTypingRef.current = false;
      return;
    }

    // 完了済みなら何もしない
    if (completedRef.current) return;

    // 次のダイアログへ（functional updateでstale state回避）
    setCurrentIndex((prev) => {
      if (prev < dialogues.length - 1) {
        return prev + 1;
      }
      // 最後のダイアログ → onComplete
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
      return prev;
    });
  }, [currentDialogue, dialogues.length, onComplete]);

  if (!currentDialogue) return null;

  return (
    <div
      onClick={handleTap}
      style={{
        position: "absolute",
        inset: 0,
        background: imagePath
          ? "rgba(0, 0, 0, 0.92)"
          : transparent
            ? "transparent"
            : "rgba(0, 0, 0, 0.85)",
        display: "flex",
        flexDirection: "column",
        justifyContent: imagePath ? "center" : "flex-end",
        padding: transparent && !imagePath ? "0 1rem 1rem" : "2rem",
        zIndex: 40,
        cursor: "pointer",
        userSelect: "none",
        pointerEvents: "auto",
      }}
    >
      {/* フェード黒オーバーレイ（意識喪失等） */}
      {fadeOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `rgba(0, 0, 0, ${fadeOpacity})`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      <div
        style={{
          background: imagePath ? "transparent" : "rgba(10, 10, 30, 0.9)",
          border: imagePath ? "none" : "1px solid #333",
          borderRadius: "8px",
          padding: imagePath ? "0" : "1.5rem",
          minHeight: imagePath ? "auto" : "120px",
          maxWidth: "100%",
          position: "relative",
          zIndex: 2,
        }}
      >
        {currentDialogue.speaker && (
          <p
            style={{
              margin: "0 0 0.5rem",
              fontSize: "0.85rem",
              color: "#6a6aff",
              fontWeight: 600,
            }}
          >
            {currentDialogue.speaker}
          </p>
        )}
        {imagePath ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "0.5rem",
            }}
          >
            <img
              src={assetPath(imagePath)}
              alt=""
              style={{
                maxWidth: "92%",
                maxHeight: "75%",
                objectFit: "contain",
                borderRadius: "4px",
                boxShadow: "0 4px 24px rgba(0, 0, 0, 0.7)",
              }}
              onError={(e) => {
                console.error("画像読み込み失敗:", imagePath);
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "1rem",
                left: 0,
                right: 0,
                textAlign: "center",
                color: "#888",
                fontSize: "0.8rem",
                pointerEvents: "none",
              }}
            >
              タップして次へ ▼
            </div>
          </div>
        ) : (
          <p
            style={{
              margin: 0,
              fontSize: "1rem",
              lineHeight: 1.8,
              color: "#e0e0e0",
            }}
          >
            {renderTokens(visibleTokens)}
          </p>
        )}
        {!isTyping && (
          <span
            style={{
              display: "block",
              textAlign: "right",
              fontSize: "0.8rem",
              color: "#666",
              marginTop: "0.5rem",
              animation: "blink 1s infinite",
            }}
          >
            ▼
          </span>
        )}
      </div>

      {/* 進行インジケーター */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "4px",
          marginTop: "0.75rem",
        }}
      >
        {dialogues.map((_, i) => (
          <div
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: i <= currentIndex ? "#6a6aff" : "#333",
            }}
          />
        ))}
      </div>

      {/* コントロール: AUTO/SKIP */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "0.5rem",
          marginTop: "0.5rem",
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAutoMode((v) => !v);
          }}
          style={{
            padding: "0.3rem 0.75rem",
            background: autoMode ? "rgba(80, 80, 200, 0.6)" : "rgba(20, 20, 40, 0.7)",
            color: autoMode ? "#fff" : "#aaa",
            border: `1px solid ${autoMode ? "#6666cc" : "#333"}`,
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "0.7rem",
          }}
        >
          AUTO {autoMode ? "ON" : "OFF"}
        </button>
        {canSkip && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSkip();
            }}
            style={{
              padding: "0.3rem 0.75rem",
              background: "rgba(60, 30, 30, 0.7)",
              color: "#ccaaaa",
              border: "1px solid #553333",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "0.7rem",
            }}
          >
            SKIP →
          </button>
        )}
      </div>
    </div>
  );
}
