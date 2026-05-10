"use client";

import { useRouter } from "next/navigation";
import { SaveManager, type GameState } from "@incident007/escape-engine";
import { useState, useEffect } from "react";

const saveManager = new SaveManager("scp-11nz-jp");

const SCENE_LABELS: Record<string, string> = {
  start: "オープニング",
  "login-ogari": "尾狩研究員ログインページ",
  "meme-inoculation": "ミーム接種",
  "personal-ogari": "尾狩研究員 個人ページ",
  "report-ogari": "報告書",
  "experiment-log": "実験記録",
  "notices-ogari": "お知らせ",
  "meme-dev-page": "対抗ミーム開発ページ",
  "room-explore": "部屋探索",
  "login-hiraragi": "平良木研究員ログインページ",
  "personal-hiraragi": "平良木研究員 個人ページ",
  "incident-11nz": "インシデント11NZ-JP",
  "notices-hiraragi": "お知らせ（平良木）",
  "part2-intro": "パート2 開始",
  "terrorist-login": "暗号化通信ネットワーク",
  "part2-complete": "パート2 クリア",
  "part3-intro": "パート3 開始",
  "terrorist-chat": "テロ組織チャット",
  "part3-complete": "パート3 クリア",
  "part4-intro": "パート4 開始",
  "memory-flashback-1": "記憶の中…",
  "memory-flashback-2": "記憶の中…",
  "memory-flashback-3": "記憶の中…",
  "memory-modify-prompt": "記憶改変",
  ending: "エンディング",
  "ending-credit": "辞令",
};

export default function TitlePage() {
  const router = useRouter();
  const [savedState, setSavedState] = useState<GameState | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    saveManager.load().then(setSavedState);
  }, []);

  const hasSave = savedState !== null;
  const sceneLabel = savedState
    ? (SCENE_LABELS[savedState.currentScene] ?? savedState.currentScene)
    : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "1.8rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          marginBottom: "1.5rem",
        }}
      >
        SCP-11NZ-JP
      </h1>

      <button
        onClick={() => router.push("/game")}
        style={{
          background: "#1a1a2e",
          color: "#e0e0e0",
          border: "1px solid #333",
          padding: "1rem 2.5rem",
          fontSize: "1.05rem",
          cursor: "pointer",
          borderRadius: "4px",
          minWidth: "240px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.3rem",
        }}
      >
        <span style={{ fontWeight: 700 }}>
          {hasSave ? "つづきから" : "はじめから"}
        </span>
        {hasSave && (
          <span
            style={{
              fontSize: "0.7rem",
              color: "#888",
              fontWeight: 400,
            }}
          >
            パート{savedState!.currentPart} / {sceneLabel}
          </span>
        )}
      </button>

      {hasSave && !confirmReset && (
        <button
          onClick={() => setConfirmReset(true)}
          style={{
            background: "transparent",
            color: "#666",
            border: "1px solid #333",
            padding: "0.6rem 1.5rem",
            fontSize: "0.85rem",
            cursor: "pointer",
            borderRadius: "4px",
            minWidth: "240px",
          }}
        >
          最初からやり直す
        </button>
      )}

      {hasSave && confirmReset && (
        <div
          style={{
            background: "#1a1010",
            border: "1px solid #553333",
            borderRadius: "6px",
            padding: "0.75rem 1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            minWidth: "240px",
          }}
        >
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#cc8888" }}>
            セーブデータを削除して最初から始めますか？
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={async () => {
                await saveManager.delete();
                setSavedState(null);
                setConfirmReset(false);
                router.push("/game");
              }}
              style={{
                flex: 1,
                background: "#3a1010",
                color: "#ff8888",
                border: "1px solid #553333",
                padding: "0.5rem",
                cursor: "pointer",
                borderRadius: "4px",
                fontSize: "0.85rem",
              }}
            >
              削除して開始
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              style={{
                flex: 1,
                background: "transparent",
                color: "#888",
                border: "1px solid #333",
                padding: "0.5rem",
                cursor: "pointer",
                borderRadius: "4px",
                fontSize: "0.85rem",
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
