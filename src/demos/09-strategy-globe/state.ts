export interface Region {
  id: string;
  name: string;
  lon: number;
  lat: number;
  owner: "player" | "rival" | "neutral";
  armies: number;
}

export interface Campaign {
  turn: number;
  food: number;
  regions: Region[];
  log: string[];
}

export function createCampaign(): Campaign {
  return {
    turn: 1,
    food: 12,
    regions: [
      { id: "north", name: "North Reach", lon: -20, lat: 50, owner: "player", armies: 3 },
      { id: "equator", name: "Equator Gate", lon: 10, lat: 8, owner: "neutral", armies: 1 },
      { id: "south", name: "South Rim", lon: 40, lat: -35, owner: "rival", armies: 4 }
    ],
    log: ["Turn 1. Main-thread resolution is the baseline."]
  };
}

export function resolveTurn(campaign: Campaign): Campaign {
  const next: Campaign = {
    turn: campaign.turn + 1,
    food: campaign.food + campaign.regions.filter((r) => r.owner === "player").length * 2 - 1,
    regions: campaign.regions.map((region) => ({ ...region })),
    log: [...campaign.log]
  };
  const player = next.regions.find((region) => region.owner === "player");
  const rival = next.regions.find((region) => region.owner === "rival");
  const neutral = next.regions.find((region) => region.owner === "neutral");
  if (player && neutral && player.armies > 1) {
    player.armies -= 1;
    if (neutral.owner !== "player") {
      neutral.owner = "player";
      neutral.armies += 1;
      next.log.push(`Turn ${next.turn}: seized ${neutral.name}.`);
    }
  } else if (player && rival && rival.armies > 0) {
    rival.armies = Math.max(0, rival.armies - 1);
    next.log.push(`Turn ${next.turn}: skirmish at ${rival.name}.`);
  }
  next.log = next.log.slice(-12);
  return next;
}

export const SAVE_DB = "toolkit-demo09";
export const SAVE_VERSION = 2;

export function worldToMap(lon: number, lat: number, size: number): { x: number; y: number } {
  return { x: ((lon + 180) / 360) * size, y: ((90 - lat) / 180) * size };
}

export function restoreCampaign(raw: unknown): Campaign | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<Campaign>;
  if (!Number.isSafeInteger(value.turn) || (value.turn ?? 0) < 1 ||
      !Number.isFinite(value.food) || !Array.isArray(value.regions) ||
      !Array.isArray(value.log) || value.log.length > 100 ||
      !value.log.every((line) => typeof line === "string" && line.length <= 300) ||
      value.regions.length < 1 || value.regions.length > 100) return null;
  const ids = new Set<string>();
  for (const region of value.regions) {
    if (!region || typeof region.id !== "string" || !region.id || ids.has(region.id) ||
        typeof region.name !== "string" || region.name.length > 100 ||
        !["player", "rival", "neutral"].includes(region.owner) ||
        !Number.isFinite(region.lon) || Math.abs(region.lon) > 180 ||
        !Number.isFinite(region.lat) || Math.abs(region.lat) > 90 ||
        !Number.isSafeInteger(region.armies) || region.armies < 0) return null;
    ids.add(region.id);
  }
  return { turn: value.turn!, food: value.food!, regions: value.regions.map((region) => ({ ...region })), log: [...value.log] };
}
