import { cloneState, createBattle, type TacticsState } from "./game";

export const STORAGE_KEY = "toolkit.demo01.tactics.v1";
export const SCHEMA_VERSION = 1;

export interface CameraPose {
  yaw: number;
  pitch: number;
  distance: number;
}

export interface Demo01Save {
  schemaVersion: number;
  camera: CameraPose;
  campaign: {
    battlesStarted: number;
    battlesWon: number;
  };
  battle: TacticsState;
}

export const defaultCamera = (): CameraPose => ({
  yaw: 0.7,
  pitch: 0.95,
  distance: 13
});

export function defaultSave(): Demo01Save {
  return {
    schemaVersion: SCHEMA_VERSION,
    camera: defaultCamera(),
    campaign: { battlesStarted: 1, battlesWon: 0 },
    battle: createBattle()
  };
}

export function loadSave(raw: string | null): { save: Demo01Save; notice: string } {
  if (!raw) return { save: defaultSave(), notice: "No saved table. Starting a new battle." };
  try {
    const parsed = JSON.parse(raw) as Partial<Demo01Save>;
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      return { save: defaultSave(), notice: "Save schema unsupported. Reset to a new battle." };
    }
    if (!parsed.battle || !parsed.camera || !parsed.campaign) {
      return { save: defaultSave(), notice: "Save was incomplete. Reset to a new battle." };
    }
    return {
      save: {
        schemaVersion: SCHEMA_VERSION,
        camera: {
          yaw: Number(parsed.camera.yaw) || 0.7,
          pitch: Number(parsed.camera.pitch) || 0.95,
          distance: Number(parsed.camera.distance) || 13
        },
        campaign: {
          battlesStarted: Number(parsed.campaign.battlesStarted) || 1,
          battlesWon: Number(parsed.campaign.battlesWon) || 0
        },
        battle: cloneState(parsed.battle as TacticsState)
      },
      notice: "Restored table from localStorage."
    };
  } catch {
    return { save: defaultSave(), notice: "Save was unreadable. Reset to a new battle." };
  }
}

export function writeSave(save: Demo01Save, storage: Storage = window.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(save));
}
