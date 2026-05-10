import type { GameDef, SceneDef } from "../types/scenario";

export class SceneManager {
  private scenes: Record<string, SceneDef>;

  constructor(gameDef: GameDef) {
    this.scenes = gameDef.scenes;
  }

  getScene(sceneId: string): SceneDef | undefined {
    return this.scenes[sceneId];
  }

  getScenesByType<T extends SceneDef["type"]>(
    type: T,
  ): Extract<SceneDef, { type: T }>[] {
    return Object.values(this.scenes).filter(
      (s): s is Extract<SceneDef, { type: T }> => s.type === type,
    );
  }

  getScenesByAreaId(areaId: string): SceneDef[] {
    return Object.values(this.scenes).filter(
      (s) => s.type === "room" && s.map?.areaId === areaId,
    );
  }

  getAllSceneIds(): string[] {
    return Object.keys(this.scenes);
  }

  hasScene(sceneId: string): boolean {
    return sceneId in this.scenes;
  }
}
