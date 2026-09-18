const DB = "toolkit-demo04";
const STORE = "saves";
export const ADVENTURE_SAVE_VERSION = 3;

export interface AdventureSaveV3 {
  schemaVersion: 3;
  player: { x: number; z: number; yaw: number; pitch: number };
  seed: number;
  collected: boolean;
  spoken: boolean;
  activatedZones: string[];
}

export type AdventureSave = AdventureSaveV3;

export function defaultAdventureSave(): AdventureSave {
  return {
    schemaVersion: 3,
    player: { x: 0, z: 2, yaw: 0, pitch: 0 },
    seed: 1337,
    collected: false,
    spoken: false,
    activatedZones: []
  };
}

function finite(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function boundedPosition(value: unknown, fallback = 0): number {
  const number = finite(value, fallback);
  if (number < -1000 || number > 1000) throw new Error("Save position is outside supported bounds.");
  return number;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.length <= 80))];
}

export function migrateAdventureSave(raw: unknown): AdventureSave {
  if (!raw || typeof raw !== "object") throw new Error("Empty save.");
  const data = raw as Record<string, unknown>;

  if (data.schemaVersion === 1) {
    const pos = data.pos && typeof data.pos === "object" ? data.pos as Record<string, unknown> : {};
    return {
      ...defaultAdventureSave(),
      player: { x: boundedPosition(pos.x), z: boundedPosition(pos.z), yaw: 0, pitch: 0 },
      collected: Boolean(data.collected)
    };
  }

  if (data.schemaVersion === 2) {
    return {
      ...defaultAdventureSave(),
      player: { x: boundedPosition(data.x), z: boundedPosition(data.z, 2), yaw: 0, pitch: 0 },
      collected: Boolean(data.collected),
      spoken: Boolean(data.spoken)
    };
  }

  if (data.schemaVersion === 3) {
    const player = data.player && typeof data.player === "object" ? data.player as Record<string, unknown> : null;
    if (!player) throw new Error("Save player state is missing.");
    const seed = finite(data.seed, NaN);
    if (!Number.isSafeInteger(seed)) throw new Error("Save seed is invalid.");
    return {
      schemaVersion: 3,
      player: {
        x: boundedPosition(player.x),
        z: boundedPosition(player.z, 2),
        yaw: finite(player.yaw),
        pitch: Math.max(-1.55, Math.min(1.55, finite(player.pitch)))
      },
      seed,
      collected: Boolean(data.collected),
      spoken: Boolean(data.spoken),
      activatedZones: stringArray(data.activatedZones)
    };
  }

  throw new Error(`Unsupported save schema ${String(data.schemaVersion)}`);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, ADVENTURE_SAVE_VERSION);
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
    const raw = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get("current");
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (!raw) return { save: defaultAdventureSave(), notice: "No save. New expedition." };
    return { save: migrateAdventureSave(raw), notice: "Restored versioned IndexedDB save." };
  } catch (error) {
    return {
      save: defaultAdventureSave(),
      notice: error instanceof Error ? `Save refused: ${error.message}` : "Save unreadable. Defaults retained."
    };
  }
}

export async function writeAdventure(save: AdventureSave): Promise<void> {
  const validated = migrateAdventureSave(save);
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(validated, "current");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function clearAdventureSave(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete("current");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
