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
    const battle = parsed.battle as TacticsState;
    const validUnit = (unit: TacticsState["units"][number]): boolean =>
      !!unit && typeof unit.id === "string" && typeof unit.name === "string" &&
      (unit.side === "player" || unit.side === "enemy") &&
      [unit.hp, unit.maxHp, unit.move, unit.range, unit.damage, unit.x, unit.y].every(Number.isFinite) &&
      unit.hp >= 0 && unit.hp <= unit.maxHp && unit.maxHp > 0 &&
      Number.isInteger(unit.x) && Number.isInteger(unit.y) &&
      unit.x >= 0 && unit.y >= 0 && unit.x < battle.width && unit.y < battle.height &&
      typeof unit.acted === "boolean";
    if (!Number.isInteger(battle.width) || !Number.isInteger(battle.height) ||
        battle.width < 1 || battle.height < 1 || battle.width > 100 || battle.height > 100 ||
        !Number.isSafeInteger(battle.turn) || battle.turn < 1 ||
        !["select-unit", "select-action", "select-tile", "select-target", "enemy", "victory", "defeat"].includes(battle.phase) ||
        !Array.isArray(battle.units) || !battle.units.every(validUnit) ||
        new Set(battle.units.map((unit) => unit.id)).size !== battle.units.length ||
        !Array.isArray(battle.log) || !battle.log.every((entry) => typeof entry === "string")) {
      return { save: defaultSave(), notice: "Invalid saved battle; new battle started." };
    }
    return {
      save: {
        schemaVersion: SCHEMA_VERSION,
        camera: {
          yaw: Number.isFinite(parsed.camera.yaw) ? parsed.camera.yaw : 0.7,
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

export function writeSave(save: Demo01Save, storage?: Storage): boolean {
  try { (storage ?? window.localStorage).setItem(STORAGE_KEY, JSON.stringify(save)); return true; }
  catch { return false; }
}
