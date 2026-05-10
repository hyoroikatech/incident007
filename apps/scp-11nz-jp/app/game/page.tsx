"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  GameEngine,
  type GameDef,
  type UIHandler,
  type SceneDef,
  type Action,
  type StoryEntry,
} from "@incident007/escape-engine";
import gameDef from "../../scenarios/game.json";
import { NovelOverlay } from "./components/NovelOverlay";
import { WebPageView } from "./components/WebPageView";
import { RoomView } from "./components/RoomView";
import { MapView } from "./components/MapView";
import { ModalOverlay } from "./components/ModalOverlay";
import { BottomMenu } from "./components/BottomMenu";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { StoryView } from "./components/StoryView";

type NovelRequest = {
  dialogues: { text: string; speaker?: string; speed?: number }[];
  resolve: () => void;
};

type ModalRequest = {
  modalId: string;
  resolve: () => void;
};

type AnswerRequest = {
  correct: string;
  resolve: (result: { isCorrect: boolean; value: string }) => void;
};

export default function GamePage() {
  const engineRef = useRef<GameEngine | null>(null);
  const [currentScene, setCurrentScene] = useState<SceneDef | null>(null);
  const [novelReq, setNovelReq] = useState<NovelRequest | null>(null);
  const [modalReq, setModalReq] = useState<ModalRequest | null>(null);
  const [answerReq, setAnswerReq] = useState<AnswerRequest | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [inventory, setInventory] = useState<string[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [showStory, setShowStory] = useState(false);
  const [storyLog, setStoryLog] = useState<StoryEntry[]>([]);

  const syncState = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setCurrentScene(engine.getCurrentScene() ?? null);
    setInventory([...engine.store.inventory]);
    // 自動保存はenableAutoSave()でstore subscribeにより実行
  }, []);

  useEffect(() => {
    // テンプレート変数を実状態値で置換: {counter:NAME}, {flag:NAME}, {part}
    const interpolate = (text: string): string => {
      const engine = engineRef.current;
      if (!engine) return text;
      const s = engine.store;
      return text
        .replace(/\{counter:([^}]+)\}/g, (_, name) => String(s.counters[name] ?? 0))
        .replace(/\{flag:([^}]+)\}/g, (_, name) => String(s.flags[name] ?? false))
        .replace(/\{part\}/g, String(s.currentPart));
    };

    const uiHandler: UIHandler = {
      playNovel: (dialogues) =>
        new Promise<void>((resolve) => {
          const interpolated = dialogues.map((d) => ({
            ...d,
            text: interpolate(d.text),
          }));
          setNovelReq({ dialogues: interpolated, resolve });
          // ストーリーログに記録
          const engine = engineRef.current;
          if (engine) {
            const sceneId = engine.store.currentScene;
            const scene = engine.sceneManager.getScene(sceneId);
            const sceneTitle = scene && "title" in scene ? scene.title : undefined;
            engine.store.addStoryEntry({
              id: `${sceneId}-${Date.now()}`,
              sceneId,
              sceneTitle,
              dialogues: interpolated.filter((d) => !d.text.startsWith("[画像:")).map((d) => ({
                text: d.text,
                speaker: d.speaker,
              })),
              timestamp: Date.now(),
            });
          }
        }),
      showModal: (modalId) =>
        new Promise<void>((resolve) => {
          setModalReq({ modalId, resolve });
        }),
      promptAnswer: (correct) =>
        new Promise((resolve) => {
          setAnswerReq({ correct, resolve });
        }),
      showLoading: (duration, message) =>
        new Promise((resolve) => {
          setLoadingMessage(message ?? "接続中...");
          setTimeout(() => {
            setLoadingMessage(null);
            resolve();
          }, duration);
        }),
    };

    const engine = new GameEngine({
      gameDef: gameDef as unknown as GameDef,
      uiHandler,
      gameId: "scp-11nz-jp",
    });

    engineRef.current = engine;
    engine.start().then(() => {
      syncState();
      engine.enableAutoSave();
    });

    // store変更時に毎回syncStateを呼んでcurrentScene/inventoryをReactに反映
    const unsubscribeSync = engine.subscribe(() => {
      setCurrentScene(engine.getCurrentScene() ?? null);
      setInventory([...engine.store.inventory]);
      setStoryLog([...engine.store.storyLog]);
    });

    // タブ閉じる/離れる時にも保存
    const onBeforeUnload = () => {
      engine.save().catch(() => {});
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        engine.save().catch(() => {});
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unsubscribeSync();
      engine.disableAutoSave();
      engine.save();
    };
  }, []);

  const handleSceneAction = useCallback(async (actionKey: string) => {
    const engine = engineRef.current;
    if (!engine) return;

    const scene = engine.getCurrentScene();
    if (!scene || scene.type !== "webpage") return;

    const action = scene.actions?.[actionKey];
    if (action) {
      await engine.actionExecutor.execute(action);
      syncState();
    }
  }, [syncState]);

  const handleNavigate = useCallback(async (target: string) => {
    const engine = engineRef.current;
    if (!engine) return;

    engine.store.setScene(target);

    const newScene = engine.getCurrentScene();
    if (newScene && "onEnter" in newScene && newScene.onEnter) {
      await engine.actionExecutor.execute(newScene.onEnter);
    }
    syncState();
  }, [syncState]);

  const handleNovelComplete = useCallback(() => {
    if (novelReq) {
      novelReq.resolve();
      setNovelReq(null);
      syncState();
    }
  }, [novelReq, syncState]);

  const handleModalClose = useCallback(() => {
    if (modalReq) {
      modalReq.resolve();
      setModalReq(null);
    }
  }, [modalReq]);

  const handleAnswerSubmit = useCallback(
    (value: string) => {
      if (answerReq) {
        answerReq.resolve({
          isCorrect: value.trim() === answerReq.correct,
          value,
        });
        setAnswerReq(null);
        setTimeout(() => syncState(), 100);
      }
    },
    [answerReq],
  );

  const handleActionExec = useCallback(
    async (action: Action) => {
      const engine = engineRef.current;
      if (!engine) return;
      await engine.actionExecutor.execute(action);
      syncState();
    },
    [],
  );

  if (!currentScene) {
    const sceneId = engineRef.current?.store.currentScene;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem" }}>
        <p style={{ color: "#888" }}>
          {sceneId ? `シーン「${sceneId}」は未実装です` : "読み込み中..."}
        </p>
        {sceneId && (
          <button
            onClick={() => {
              engineRef.current?.store.goBack();
              syncState();
            }}
            style={{
              background: "#1a1a2e",
              color: "#e0e0e0",
              border: "1px solid #333",
              padding: "0.75rem 2rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            戻る
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }}>
      {/* メインシーン */}
      {currentScene.type === "novel" && !novelReq && (
        <NovelOverlay
          dialogues={currentScene.dialogues}
          canSkip={engineRef.current?.store.completedScenes.includes(currentScene.id) ?? false}
          onComplete={async () => {
            const sceneId = currentScene.id;
            const engine = engineRef.current;
            // 初回完了時にストーリーログにも追加
            if (engine && !engine.store.completedScenes.includes(sceneId)) {
              if (currentScene.type === "novel") {
                engine.store.addStoryEntry({
                  id: `${sceneId}-init`,
                  sceneId,
                  dialogues: currentScene.dialogues
                    .filter((d) => !d.text.startsWith("[画像:"))
                    .map((d) => ({ text: d.text, speaker: d.speaker })),
                  timestamp: Date.now(),
                });
              }
            }
            engineRef.current?.store.markSceneCompleted(sceneId);
            if (currentScene.onComplete) {
              await handleActionExec(currentScene.onComplete);
            }
          }}
        />
      )}

      {currentScene.type === "webpage" && (
        <WebPageView
          scene={currentScene}
          engine={engineRef.current!}
          onAction={handleSceneAction}
          onNavigate={handleNavigate}
          onExecAction={handleActionExec}
        />
      )}

      {currentScene.type === "room" && (
        <RoomView
          scene={currentScene}
          engine={engineRef.current!}
          onExecAction={handleActionExec}
          onNavigate={handleNavigate}
          onOpenMap={() => setShowMap(true)}
          selectedItemId={selectedItemId}
          onClearItem={() => setSelectedItemId(null)}
        />
      )}

      {/* 下部メニュー: novel以外で常に表示 */}
      {currentScene.type !== "novel" && engineRef.current && (
        <BottomMenu
          engine={engineRef.current}
          inventory={inventory}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          selectionMode={currentScene.type === "room"}
          onOpenMap={() => setShowMap(true)}
          showMapButton={currentScene.type === "room"}
          canGoBack={(engineRef.current.store.sceneHistory.length ?? 0) > 0}
          onBack={() => {
            engineRef.current?.store.goBack();
            syncState();
          }}
          onOpenStory={() => setShowStory(true)}
        />
      )}

      {/* マップオーバーレイ */}
      {showMap && engineRef.current && (
        <MapView
          engine={engineRef.current}
          onSelectRoom={(sceneId) => {
            setShowMap(false);
            handleNavigate(sceneId);
          }}
          onClose={() => setShowMap(false)}
        />
      )}

      {/* ノベルオーバーレイ（アクションから呼ばれた場合） */}
      {novelReq && (
        <NovelOverlay
          dialogues={novelReq.dialogues}
          onComplete={handleNovelComplete}
          transparent={currentScene.type !== "novel"}
        />
      )}

      {/* ローディングオーバーレイ */}
      {loadingMessage && <LoadingOverlay message={loadingMessage} />}

      {/* ストーリーログ */}
      {showStory && (
        <StoryView storyLog={storyLog} onClose={() => setShowStory(false)} />
      )}

      {/* モーダルオーバーレイ */}
      {modalReq && engineRef.current && (
        <ModalOverlay
          modalId={modalReq.modalId}
          scene={currentScene}
          engine={engineRef.current}
          onClose={handleModalClose}
          onExecAction={handleActionExec}
        />
      )}

      {/* 解答入力オーバーレイ */}
      {answerReq && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div style={{ background: "#1a1a2e", padding: "2rem", borderRadius: "8px", maxWidth: "320px", width: "100%" }}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem" }}>解答を入力</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.currentTarget.querySelector("input");
                if (input) handleAnswerSubmit(input.value);
              }}
            >
              <input
                type="text"
                autoFocus
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "#0d0d1a",
                  border: "1px solid #333",
                  color: "#fff",
                  fontSize: "1rem",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
                placeholder="回答を入力..."
              />
              <button
                type="submit"
                style={{
                  marginTop: "1rem",
                  width: "100%",
                  padding: "0.75rem",
                  background: "#2a2a4a",
                  color: "#fff",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                送信
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
