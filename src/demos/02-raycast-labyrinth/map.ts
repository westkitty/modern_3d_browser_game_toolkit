export const TILE = 1;

export type Cell = 0 | 1 | 2;

export interface Sprite {
  id: string;
  kind: "orb" | "sentinel";
  x: number;
  y: number;
  collected: boolean;
}

export interface LabyrinthWorld {
  width: number;
  height: number;
  cells: Cell[];
  sprites: Sprite[];
}

export interface Player {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  planeX: number;
  planeY: number;
}

const LAYOUT = [
  "111111111111",
  "100000000001",
  "101110011101",
  "100010000001",
  "111010111101",
  "100000000001",
  "101111011101",
  "100000000001",
  "111111111111"
];

export function createWorld(): LabyrinthWorld {
  const height = LAYOUT.length;
  const width = LAYOUT[0]?.length ?? 0;
  const cells: Cell[] = [];
  for (const row of LAYOUT) {
    for (const ch of row) {
      cells.push(ch === "1" ? 1 : 0);
    }
  }
  return {
    width,
    height,
    cells,
    sprites: [
      { id: "orb-a", kind: "orb", x: 2.5, y: 1.5, collected: false },
      { id: "orb-b", kind: "orb", x: 9.5, y: 3.5, collected: false },
      { id: "orb-c", kind: "orb", x: 6.5, y: 7.5, collected: false },
      { id: "sentinel", kind: "sentinel", x: 4.5, y: 5.5, collected: false }
    ]
  };
}

export function cellAt(world: LabyrinthWorld, x: number, y: number): Cell {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cx < 0 || cy < 0 || cx >= world.width || cy >= world.height) return 1;
  return world.cells[cy * world.width + cx] ?? 1;
}

export function isWall(world: LabyrinthWorld, x: number, y: number): boolean {
  return cellAt(world, x, y) > 0;
}

export function spawnPlayer(): Player {
  return {
    x: 1.5,
    y: 7.5,
    dirX: 1,
    dirY: 0,
    planeX: 0,
    planeY: 0.66
  };
}

export function rotatePlayer(player: Player, radians: number): Player {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    ...player,
    dirX: player.dirX * cos - player.dirY * sin,
    dirY: player.dirX * sin + player.dirY * cos,
    planeX: player.planeX * cos - player.planeY * sin,
    planeY: player.planeX * sin + player.planeY * cos
  };
}

export function tryMove(world: LabyrinthWorld, player: Player, dx: number, dy: number): Player {
  const radius = 0.18;
  let x = player.x;
  let y = player.y;
  if (!isWall(world, x + dx + Math.sign(dx) * radius, y)) x += dx;
  if (!isWall(world, x, y + dy + Math.sign(dy) * radius)) y += dy;
  return { ...player, x, y };
}
