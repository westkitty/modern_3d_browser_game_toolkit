const DB = "toolkit-demo04";
const STORE = "saves";

export interface AdventureSaveV2 {
  schemaVersion: 2;
  x: number;
  z: number;
  collected: boolean;
  spoken: boolean;
}

export type AdventureSave = AdventureSaveV2;

function migrate(raw: unknown): AdventureSave {
  if (!raw || typeof raw !== "object") throw new Error("Empty save.");
  const data = raw as { schemaVersion?: number; x?: number; z?: number; collected?: boolean; spoken?: boolean; pos?: { x: number; z: number } };
  if (data.schemaVersion === 1) {
    return {
      schemaVersion: 2,
      x: data.pos?.x ?? 0,
      z: data.pos?.z ?? 0,
      collected: Boolean(data.collected),
      spoken: false
    };
  }
  if (data.schemaVersion === 2) {
    return {
      schemaVersion: 2,
      x: Number(data.x) || 0,
      z: Number(data.z) || 0,
      collected: Boolean(data.collected),
      spoken: Boolean(data.spoken)
    };
  }
  throw new Error(`Unsupported save schema ${String(data.schemaVersion)}`);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadAdventure(): Promise<{ save: AdventureSave; notice: string }> {
  try {
    const db = await openDb();
    const save = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get("current");
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!save) return { save: { schemaVersion: 2, x: 0, z: 2, collected: false, spoken: false }, notice: "No save. New expedition." };
    return { save: migrate(save), notice: "Restored IndexedDB save." };
  } catch (error) {
    return {
      save: { schemaVersion: 2, x: 0, z: 2, collected: false, spoken: false },
      notice: error instanceof Error ? error.message : "Save unreadable. Reset."
    };
  }
}

export async function writeAdventure(save: AdventureSave): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(save, "current");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export { migrate as migrateAdventureSave };
