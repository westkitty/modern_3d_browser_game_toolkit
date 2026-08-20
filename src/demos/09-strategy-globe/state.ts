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
