import * as THREE from "three";
import { createResourceScope, resourceSnapshot } from "../../shared/resources";
import { cappedDevicePixelRatio, observeElementSize } from "../../shared/resize";
import { PLAYER_HEIGHT, PLAYER_RADIUS, interpolate, type CourseState } from "./sim";

export function createCourseView(viewport: HTMLElement) {
  const scope = createResourceScope();
  scope.own("runtime");
  scope.own("scene");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101820);
  const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 80);
  const renderer = new THREE.WebGLRenderer({ antialias: true, failIfMajorPerformanceCaveat: false });
  renderer.setPixelRatio(cappedDevicePixelRatio(2));
  viewport.append(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xd7ecff, 0x22180f, 1));
  const sun = new THREE.DirectionalLight(0xfff3d0, 1.2);
  sun.position.set(6, 10, 4);
  scene.add(sun);

  const ownGeometry = <T extends THREE.BufferGeometry>(geometry: T): T => {
    scope.own("geometry", () => geometry.dispose());
    return geometry;
  };
  const ownMaterial = <T extends THREE.Material>(material: T): T => {
    scope.own("material", () => material.dispose());
    return material;
  };

  const boxGeo = ownGeometry(new THREE.BoxGeometry(1, 1, 1));
  const capGeo = ownGeometry(new THREE.CapsuleGeometry(PLAYER_RADIUS, PLAYER_HEIGHT - PLAYER_RADIUS * 2, 6, 12));
  const playerMesh = new THREE.Mesh(capGeo, ownMaterial(new THREE.MeshStandardMaterial({ color: 0x7dd3fc, roughness: 0.35 })));
  playerMesh.visible = false;
  scene.add(playerMesh);

  const make = (color: number): THREE.Mesh =>
    new THREE.Mesh(boxGeo, ownMaterial(new THREE.MeshStandardMaterial({ color, roughness: 0.5 })));

  const platformMeshes = new Map<string, THREE.Mesh>();
  const hazardMeshes = new Map<string, THREE.Mesh>();
  const floor = make(0x243246);
  floor.scale.set(28, 0.2, 18);
  floor.position.set(0, -0.4, 0);
  scene.add(floor);

  let yaw = 0;
  let pitch = 0;
  const resize = observeElementSize(viewport, (w, h) => {
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  });

  const setLook = (nextYaw: number, nextPitch: number): void => {
    yaw = nextYaw;
    pitch = Math.max(-Math.PI * 0.47, Math.min(Math.PI * 0.47, nextPitch));
  };

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
      mesh.scale.set(
        hazard.kind === "goal" ? 0.5 : 0.7,
        hazard.kind === "goal" ? 1.6 : 2.2,
        hazard.kind === "goal" ? 0.5 : 2.8
      );
    }

    camera.position.set(p.x, p.y + PLAYER_HEIGHT * 0.32, p.z);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    renderer.render(scene, camera);
  };

  return {
    canvas: renderer.domElement,
    setLook,
    sync,
    getRendererMetrics() {
      const info = renderer.info;
      return {
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
        owned: resourceSnapshot()
      };
    },
    dispose() {
      resize.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
      scene.clear();
      scope.dispose();
    }
  };
}
