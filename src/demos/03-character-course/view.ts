import * as THREE from "three";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import {
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  cameraObstruction,
  interpolate,
  type CourseState
} from "./sim";

export function createCourseView(viewport: HTMLElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101820);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 80);
  const renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
  renderer.setPixelRatio(cappedDevicePixelRatio(2));
  viewport.append(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xd7ecff, 0x22180f, 1));
  const sun = new THREE.DirectionalLight(0xfff3d0, 1.2);
  sun.position.set(6, 10, 4);
  scene.add(sun);

  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const capGeo = new THREE.CapsuleGeometry(PLAYER_RADIUS, PLAYER_HEIGHT - PLAYER_RADIUS * 2, 6, 12);
  geos.push(boxGeo, capGeo);

  const make = (color: number): THREE.Mesh => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    mats.push(mat);
    return new THREE.Mesh(boxGeo, mat);
  };

  const playerMesh = new THREE.Mesh(
    capGeo,
    new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.35 })
  );
  mats.push(playerMesh.material as THREE.Material);
  scene.add(playerMesh);

  const platformMeshes = new Map<string, THREE.Mesh>();
  const hazardMeshes = new Map<string, THREE.Mesh>();
  const floor = make(0x243246);
  floor.scale.set(28, 0.2, 18);
  floor.position.set(0, -0.4, 0);
  scene.add(floor);

  const resize = observeElementSize(viewport, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  });

  const sync = (state: CourseState, alpha: number): void => {
    const p = interpolate(state.player.previous, state.player.current, alpha);
    playerMesh.position.set(p.x, p.y, p.z);
    for (const platform of state.platforms) {
      let mesh = platformMeshes.get(platform.id);
      if (!mesh) {
        mesh = make(platform.id === "pad-move" ? 0x86efac : 0x4b5d73);
        platformMeshes.set(platform.id, mesh);
        scene.add(mesh);
      }
      const pos = interpolate(platform.previous, platform.current, alpha);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.scale.set(3.2, 0.36, 3.2);
    }
    for (const hazard of state.hazards) {
      let mesh = hazardMeshes.get(hazard.id);
      if (!mesh) {
        mesh = make(hazard.kind === "goal" ? 0xfbbf24 : 0xf0a3a3);
        hazardMeshes.set(hazard.id, mesh);
        scene.add(mesh);
      }
      mesh.position.set(hazard.current.x, hazard.current.y, hazard.current.z);
      mesh.scale.set(hazard.kind === "goal" ? 0.5 : 0.7, hazard.kind === "goal" ? 1.6 : 2.2, hazard.kind === "goal" ? 0.5 : 2.8);
    }
    const desired = { x: p.x - 5.5, y: p.y + 3.2, z: p.z + 5.5 };
    const blocked = cameraObstruction(p, desired, [
      { x: -2, z: 0, hx: 0.5, hz: 1.5 }
    ]);
    camera.position.set(blocked.x, blocked.y, blocked.z);
    camera.lookAt(p.x, p.y + 0.6, p.z);
    renderer.render(scene, camera);
  };

  return {
    sync,
    dispose() {
      resize.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
      for (const geo of geos) geo.dispose();
      for (const mat of mats) mat.dispose();
      scene.clear();
    }
  };
}
