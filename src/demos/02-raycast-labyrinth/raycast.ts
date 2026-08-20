import { cellAt, type LabyrinthWorld, type Player, type Sprite } from "./map";

export interface WallColumn {
  x: number;
  distance: number;
  height: number;
  side: 0 | 1;
  wall: number;
}

export interface BillboardDraw {
  sprite: Sprite;
  distance: number;
  screenX: number;
  size: number;
  occluded: boolean;
}

export interface FrameCast {
  walls: WallColumn[];
  depth: Float64Array;
  billboards: BillboardDraw[];
}

const MAX_DIST = 24;

export function castFrame(
  world: LabyrinthWorld,
  player: Player,
  width: number,
  height: number
): FrameCast {
  const walls: WallColumn[] = [];
  const depth = new Float64Array(width);
  for (let x = 0; x < width; x += 1) {
    const cameraX = (2 * x) / width - 1;
    const rayDirX = player.dirX + player.planeX * cameraX;
    const rayDirY = player.dirY + player.planeY * cameraX;
    const column = castColumn(world, player.x, player.y, rayDirX, rayDirY);
    const lineHeight = Math.min(height, Math.floor(height / column.distance));
    walls.push({
      x,
      distance: column.distance,
      height: lineHeight,
      side: column.side,
      wall: column.wall
    });
    depth[x] = column.distance;
  }

  const billboards: BillboardDraw[] = world.sprites
    .filter((sprite) => !sprite.collected)
    .map((sprite) => projectSprite(player, sprite, width, height))
    .filter((item): item is BillboardDraw => item !== null)
    .sort((a, b) => b.distance - a.distance);

  for (const billboard of billboards) {
    const column = Math.floor(billboard.screenX);
    const wallDepth = depth[column] ?? MAX_DIST;
    billboard.occluded = billboard.distance >= wallDepth;
  }

  return { walls, depth, billboards };
}

function castColumn(
  world: LabyrinthWorld,
  posX: number,
  posY: number,
  rayDirX: number,
  rayDirY: number
): { distance: number; side: 0 | 1; wall: number } {
  let mapX = Math.floor(posX);
  let mapY = Math.floor(posY);
  const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
  const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);
  const stepX = rayDirX < 0 ? -1 : 1;
  const stepY = rayDirY < 0 ? -1 : 1;
  let sideDistX =
    rayDirX < 0 ? (posX - mapX) * deltaDistX : (mapX + 1 - posX) * deltaDistX;
  let sideDistY =
    rayDirY < 0 ? (posY - mapY) * deltaDistY : (mapY + 1 - posY) * deltaDistY;
  let side: 0 | 1 = 0;
  let wall = 1;
  for (let i = 0; i < 48; i += 1) {
    if (sideDistX < sideDistY) {
      sideDistX += deltaDistX;
      mapX += stepX;
      side = 0;
    } else {
      sideDistY += deltaDistY;
      mapY += stepY;
      side = 1;
    }
    wall = cellAt(world, mapX + 0.001, mapY + 0.001);
    if (wall > 0) break;
  }
  const distance =
    side === 0 ? (sideDistX - deltaDistX) : (sideDistY - deltaDistY);
  return { distance: Math.max(0.08, Math.min(distance, MAX_DIST)), side, wall };
}

function projectSprite(
  player: Player,
  sprite: Sprite,
  width: number,
  height: number
): BillboardDraw | null {
  const relX = sprite.x - player.x;
  const relY = sprite.y - player.y;
  const inv = player.planeX * player.dirY - player.dirX * player.planeY;
  if (Math.abs(inv) < 1e-8) return null;
  const transformX = (player.dirY * relX - player.dirX * relY) / inv;
  const transformY = (-player.planeY * relX + player.planeX * relY) / inv;
  if (transformY <= 0.08) return null;
  const screenX = (width / 2) * (1 + transformX / transformY);
  const size = Math.abs(Math.floor(height / transformY));
  return {
    sprite,
    distance: transformY,
    screenX,
    size,
    occluded: false
  };
}

export function visibleBillboards(frame: FrameCast): BillboardDraw[] {
  return frame.billboards.filter((item) => !item.occluded);
}
