import { initMancha, Renderer } from "mancha/browser";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { toCreasedNormals } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  build,
  type Color,
  COLORS,
  KINDS,
  type Robot,
  SIZES,
  type Slot,
  sizeOf,
} from "../src/kit";
import { fromQuery, toQuery } from "../src/link";
import { cleanup, loadManifold, type MeshData, meshData } from "../src/mesh";
import { PRESETS, randomRobot } from "../src/presets";
import { robotParts, to3mf } from "../src/threemf";

interface State {
  robot: Robot;
  slots: Slot[];
  labels: Record<Slot, string>;
  colors: { name: Color; hex: string }[];
  problems: string[];
  stats: string;
  presets: string[];
  shared: string;
  editing: boolean;
  choose: (select: HTMLSelectElement) => void;
  surprise: () => void;
  share: () => Promise<void>;
  rename: (name: string) => void;
  cycle: (slot: Slot, dir: number) => void;
  resize: (slot: Slot, dir: number) => void;
  paint: (slot: Slot, color: Color) => void;
  download: () => void;
}

function mountViewer(el: HTMLElement) {
  const gl = new THREE.WebGLRenderer({ antialias: true });
  gl.setPixelRatio(devicePixelRatio);
  gl.toneMapping = THREE.ACESFilmicToneMapping;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  el.append(gl.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#dbe4ee");
  scene.environment = new THREE.PMREMGenerator(gl).fromScene(
    new RoomEnvironment(),
    0.04,
  ).texture;
  scene.environmentIntensity = 0.55;
  const sun = new THREE.DirectionalLight("#ffffff", 1.8);
  // Low front-left key light so face and chest relief casts shadows.
  sun.position.set(-110, 130, 170);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 6;
  Object.assign(sun.shadow.camera, {
    left: -120,
    right: 120,
    top: 120,
    bottom: -120,
  });
  scene.add(sun);
  const bed = new THREE.Mesh(
    new THREE.CircleGeometry(400, 96),
    new THREE.MeshStandardMaterial({ color: "#f1f5f9", roughness: 0.9 }),
  );
  bed.rotation.x = -Math.PI / 2;
  bed.receiveShadow = true;
  scene.add(bed);
  // Scenes are z-up with -y at the front; three is y-up facing +z.
  const toy = new THREE.Group();
  toy.rotation.x = -Math.PI / 2;
  scene.add(toy);

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 3000);
  const controls = new OrbitControls(camera, gl.domElement);
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.enableDamping = true;
  new ResizeObserver(() => {
    gl.setSize(el.clientWidth, el.clientHeight);
    camera.aspect = el.clientWidth / el.clientHeight;
    camera.updateProjectionMatrix();
  }).observe(el);
  gl.setAnimationLoop(() => {
    controls.update();
    gl.render(scene, camera);
  });

  let framed = 0;
  return (parts: { mesh: MeshData; color: string }[], height: number) => {
    for (const child of [...toy.children] as THREE.Mesh[]) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
      toy.remove(child);
    }
    for (const { mesh: part, color } of parts) {
      const indexed = new THREE.BufferGeometry();
      indexed.setAttribute(
        "position",
        new THREE.BufferAttribute(part.positions, 3),
      );
      indexed.setIndex(new THREE.BufferAttribute(part.indices, 1));
      // Smooth curves, crisp edges.
      const geometry = toCreasedNormals(indexed, Math.PI / 6);
      indexed.dispose();
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.35,
          clearcoat: 0.4,
          clearcoatRoughness: 0.3,
        }),
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      toy.add(mesh);
    }
    // Reframe only when the toy's size changes noticeably, not on every edit.
    const reach = Math.max(height, 40);
    if (Math.abs(reach - framed) / reach > 0.25) {
      framed = reach;
      controls.target.set(0, height / 2, 0);
      camera.position.set(0, height * 0.75, reach * 2.4);
    }
  };
}

const manifold = await loadManifold(() => "manifold.wasm");

const SLOTS: Slot[] = ["head", "torso", "arms", "legs"];
const params = new URLSearchParams(location.search);
const renderer = new Renderer<State>({
  robot: {
    name: "",
    ...Object.fromEntries(
      SLOTS.map((s) => [s, { kind: KINDS[s][0], color: "blue" }]),
    ),
  } as Robot,
  slots: SLOTS,
  labels: { head: "Head", torso: "Body", arms: "Arms", legs: "Legs" },
  colors: Object.entries(COLORS).map(([name, hex]) => ({
    name: name as Color,
    hex,
  })),
  problems: [],
  stats: "",
  presets: PRESETS.map((p) => p.name),
  shared: "",
  editing: !params.has("tv"),
  choose: () => {},
  surprise: () => {},
  share: async () => {},
  rename: () => {},
  cycle: () => {},
  resize: () => {},
  paint: () => {},
  download: () => {},
});
const $ = renderer.$;

await initMancha({
  renderer,
  css: ["utils"],
  cloak: true,
  callback: async (r) => {
    await r.mount(document.body);
    const show = mountViewer(
      document.getElementById("viewport") as HTMLElement,
    );

    const render = (robot: Robot) => {
      const started = performance.now();
      let parts: { mesh: MeshData; color: string }[];
      try {
        parts = build(manifold, robot).map((p) => ({
          mesh: meshData(p.print.transform(p.toRobot)),
          color: COLORS[p.color],
        }));
      } catch (err) {
        $.problems = [(err as Error).message];
        return;
      } finally {
        // Meshes are copied out, so free the WASM side of every edit.
        cleanup();
      }
      let height = 0;
      for (const { mesh } of parts) {
        for (let i = 2; i < mesh.positions.length; i += 3) {
          height = Math.max(height, mesh.positions[i]);
        }
      }
      $.problems = [];
      $.stats = `${parts.length} parts · ${height.toFixed(0)} mm tall · ${(performance.now() - started).toFixed(0)} ms`;
      show(parts, height);
      document.body.dataset.ready = "1";
    };
    /** Shows a robot and puts it in the address bar, ready to share. */
    const update = (robot: Robot) => {
      $.robot = robot;
      const tv = params.has("tv") ? "&tv=1" : "";
      history.replaceState(null, "", `?${toQuery(robot)}${tv}`);
      render(robot);
    };
    const change = (slot: Slot, patch: Partial<Robot[Slot]>) =>
      update({ ...$.robot, [slot]: { ...$.robot[slot], ...patch } });

    $.choose = (select: HTMLSelectElement) => {
      const preset = PRESETS.find((p) => p.name === select.value);
      // Back to the placeholder, so picking the same example again reloads it.
      select.value = "";
      if (preset) update(preset);
    };
    $.surprise = () => update(randomRobot());
    $.share = async () => {
      try {
        if (navigator.share) {
          await navigator.share({ title: $.robot.name, url: location.href });
          return;
        }
        await navigator.clipboard.writeText(location.href);
        $.shared = "Copied!";
        setTimeout(() => ($.shared = ""), 2000);
      } catch (err) {
        // Closing the share sheet is not a problem.
        if ((err as Error).name !== "AbortError") {
          $.problems = [`couldn't share: ${(err as Error).message}`];
        }
      }
    };
    $.rename = (name: string) => update({ ...$.robot, name });
    $.cycle = (slot: Slot, dir: number) => {
      const kinds = KINDS[slot];
      const i = kinds.indexOf($.robot[slot].kind);
      change(slot, { kind: kinds[(i + dir + kinds.length) % kinds.length] });
    };
    $.resize = (slot: Slot, dir: number) =>
      change(slot, {
        size: sizeOf({
          ...$.robot[slot],
          size: sizeOf($.robot[slot]) + dir * SIZES.step,
        }),
      });
    $.paint = (slot: Slot, color: Color) => change(slot, { color });
    /** Saves the robot's parts in print pose as one 3MF. */
    $.download = () => {
      let bytes: Uint8Array;
      try {
        bytes = to3mf(robotParts(build(manifold, $.robot)), $.robot.name);
      } catch (err) {
        $.problems = [(err as Error).message];
        return;
      } finally {
        cleanup();
      }
      const slug = $.robot.name
        .toLowerCase()
        .replace(/\W+/g, "-")
        .replace(/^-|-$/g, "");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(
        new Blob([bytes as BlobPart], { type: "model/3mf" }),
      );
      a.download = `${slug || "robot"}.3mf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href));
    };
    window.addEventListener("keydown", (e) => {
      const typing = e.target instanceof HTMLInputElement;
      if (e.key === "e" && !typing) $.editing = !$.editing;
    });

    update(fromQuery(params) ?? randomRobot());
  },
});
