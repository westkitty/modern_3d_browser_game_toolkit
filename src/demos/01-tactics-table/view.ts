import * as THREE from "three";
import { createDemandRenderer } from "../../shared/loop";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import {
  attackTargets,
  reachableTiles,
  type TacticsState,
  type Unit
} from "./game";
import type { CameraPose } from "./persist";

export interface BoardView {
  render(state: TacticsState): void;
  setCamera(pose: CameraPose): void;
  getCamera(): CameraPose;
  pick(clientX: number, clientY: number): { kind: "tile"; x: number; y: number } | { kind: "unit"; id: string } | null;
  dispose(): void;
  readonly renderCount: number;
  readonly looping: boolean;
}

const TILE = 1.15;

function tileWorld(x: number, y: number, width: number, height: number): THREE.Vector3 {
  return new THREE.Vector3((x - (width - 1) / 2) * TILE, 0, (y - (height - 1) / 2) * TILE);
}

export function createBoardView(
  viewport: HTMLElement,
  onNeedRender?: () => void
): BoardView {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c1118);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      failIfMajorPerformanceCaveat: false
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`WebGL2/Three.js table unavailable: ${detail}`);
  }
  renderer.setPixelRatio(cappedDevicePixelRatio(2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  viewport.append(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xcde4ff, 0x1a1410, 1.1));
  const key = new THREE.DirectionalLight(0xfff1d6, 1.4);
  key.position.set(6, 10, 4);
  scene.add(key);

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(10.4, 0.35, 9.2),
    new THREE.MeshStandardMaterial({ color: 0x3b2a1d, roughness: 0.7 })
  );
  table.position.y = -0.38;
  table.userData.gameId = "table";
  scene.add(table);

  const tileGeo = new THREE.BoxGeometry(1.02, 0.12, 1.02);
  const unitGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.72, 14);
  const markerGeo = new THREE.RingGeometry(0.18, 0.28, 20);
  markerGeo.rotateX(-Math.PI / 2);

  const tiles: THREE.Mesh[] = [];
  const unitMeshes = new Map<string, THREE.Mesh>();
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [tileGeo, unitGeo, markerGeo, table.geometry];
  materials.push(table.material as THREE.Material);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pose: CameraPose = { yaw: 0.7, pitch: 0.95, distance: 13 };
  let latest: TacticsState | null = null;
  let renderCount = 0;

  const demand = createDemandRenderer(() => {
    if (!latest) return;
    applyCamera();
    renderer.render(scene, camera);
    renderCount += 1;
    onNeedRender?.();
  });

  const syncTiles = (state: TacticsState): void => {
    while (tiles.length < state.width * state.height) {
      const mat = new THREE.MeshStandardMaterial({ color: 0x1c2a3a, roughness: 0.55 });
      materials.push(mat);
      const mesh = new THREE.Mesh(tileGeo, mat);
      scene.add(mesh);
      tiles.push(mesh);
    }
    const actor = state.selectedUnitId
      ? state.units.find((item) => item.id === state.selectedUnitId)
      : undefined;
    const reach = actor && state.pendingAction === "move" ? reachableTiles(state, actor) : [];
    const reachSet = new Set(reach.map((tile) => `${tile.x},${tile.y}`));
    const attackSet = new Set(
      actor && state.pendingAction === "attack"
        ? attackTargets(state, actor).map((item) => `${item.x},${item.y}`)
        : []
    );
    for (let y = 0; y < state.height; y += 1) {
      for (let x = 0; x < state.width; x += 1) {
        const index = y * state.width + x;
        const mesh = tiles[index];
        if (!mesh) continue;
        mesh.position.copy(tileWorld(x, y, state.width, state.height));
        mesh.userData.gameId = `tile:${x}:${y}`;
        mesh.userData.tileX = x;
        mesh.userData.tileY = y;
        const checker = (x + y) % 2 === 0;
        const material = mesh.material as THREE.MeshStandardMaterial;
        const keyPos = `${x},${y}`;
        if (reachSet.has(keyPos)) material.color.set(0x3f7f6a);
        else if (attackSet.has(keyPos)) material.color.set(0x8a3b3b);
        else material.color.set(checker ? 0x243246 : 0x1a2433);
      }
    }
  };

  const colorFor = (unit: Unit): number => {
    if (unit.hp <= 0) return 0x3a3f48;
    if (unit.side === "player") return unit.acted ? 0x4d6d86 : 0x7dd3fc;
    return unit.acted ? 0x7a4a4a : 0xf0a3a3;
  };

  const syncUnits = (state: TacticsState): void => {
    const seen = new Set<string>();
    for (const unit of state.units) {
      seen.add(unit.id);
      let mesh = unitMeshes.get(unit.id);
      if (!mesh) {
        const mat = new THREE.MeshStandardMaterial({ color: colorFor(unit), roughness: 0.4 });
        materials.push(mat);
        mesh = new THREE.Mesh(unitGeo, mat);
        mesh.userData.gameId = unit.id;
        scene.add(mesh);
        unitMeshes.set(unit.id, mesh);
      }
      const pos = tileWorld(unit.x, unit.y, state.width, state.height);
      mesh.position.set(pos.x, unit.hp > 0 ? 0.48 : 0.16, pos.z);
      mesh.scale.setScalar(unit.hp > 0 ? 1 : 0.55);
      (mesh.material as THREE.MeshStandardMaterial).color.set(colorFor(unit));
      mesh.userData.gameId = unit.id;
    }
    for (const [id, mesh] of unitMeshes) {
      if (seen.has(id)) continue;
      scene.remove(mesh);
      unitMeshes.delete(id);
    }
  };

  const applyCamera = (): void => {
    const pitch = THREE.MathUtils.clamp(pose.pitch, 0.35, 1.35);
    const x = Math.cos(pose.yaw) * Math.sin(pitch) * pose.distance;
    const y = Math.cos(pitch) * pose.distance;
    const z = Math.sin(pose.yaw) * Math.sin(pitch) * pose.distance;
    camera.position.set(x, y, z);
    camera.lookAt(0, 0.2, 0);
  };

  const resize = observeElementSize(viewport, (width, height) => {
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    demand.request();
  });

  return {
    get renderCount() {
      return renderCount;
    },
    get looping() {
      return demand.pending;
    },
    render(state) {
      latest = state;
      syncTiles(state);
      syncUnits(state);
      demand.request();
    },
    setCamera(next) {
      pose = { ...next };
      demand.request();
    },
    getCamera() {
      return { ...pose };
    },
    pick(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const objects = [...unitMeshes.values(), ...tiles];
      const hits = raycaster.intersectObjects(objects, false);
      const hit = hits[0];
      if (!hit) return null;
      const id = hit.object.userData.gameId as string | undefined;
      if (!id) return null;
      if (id.startsWith("tile:")) {
        return { kind: "tile", x: hit.object.userData.tileX as number, y: hit.object.userData.tileY as number };
      }
      if (id === "table") return null;
      return { kind: "unit", id };
    },
    dispose() {
      demand.dispose();
      resize.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
      for (const geo of geometries) geo.dispose();
      for (const mat of materials) mat.dispose();
      scene.clear();
      unitMeshes.clear();
      tiles.length = 0;
    }
  };
}
