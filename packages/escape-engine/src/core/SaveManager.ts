import type { GameState } from "../types/state";
import type { SaveData } from "../types/state";
import { SAVE_VERSION } from "../types/state";

const DB_NAME = "escape-engine";
const STORE_NAME = "saves";
const DB_VERSION = 1;

function openDB(dbName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet<T>(db: IDBDatabase, key: string): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db: IDBDatabase, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export class SaveManager {
  private key: string;
  private dbName: string;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(gameId?: string) {
    this.key = gameId ?? "default";
    this.dbName = `${DB_NAME}-${this.key}`;
  }

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(this.dbName);
    }
    return this.dbPromise;
  }

  async save(state: GameState): Promise<void> {
    const data: SaveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state,
    };
    try {
      const db = await this.getDB();
      await idbPut(db, this.key, data);
    } catch (e) {
      console.error("セーブデータの保存に失敗しました", e);
    }
  }

  async load(): Promise<GameState | null> {
    try {
      const db = await this.getDB();
      const data = await idbGet<SaveData>(db, this.key);
      if (!data) return null;
      return this.migrate(data);
    } catch (e) {
      console.error("セーブデータの読み込みに失敗しました", e);
      return null;
    }
  }

  async delete(): Promise<void> {
    try {
      const db = await this.getDB();
      await idbDelete(db, this.key);
    } catch (e) {
      console.error("セーブデータの削除に失敗しました", e);
    }
  }

  async hasSave(): Promise<boolean> {
    try {
      const db = await this.getDB();
      const data = await idbGet(db, this.key);
      return data !== undefined;
    } catch {
      return false;
    }
  }

  private migrate(data: SaveData): GameState {
    if (data.version !== SAVE_VERSION) {
      console.warn(
        `セーブデータのバージョンが異なります (got: ${data.version}, expected: ${SAVE_VERSION})`,
      );
    }
    return data.state;
  }
}
