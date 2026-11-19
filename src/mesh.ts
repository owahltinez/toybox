import Module, { type Manifold, type ManifoldToplevel } from "manifold-3d";

export interface MeshData {
  positions: Float32Array;
  indices: Uint32Array;
}

interface Handle {
  delete: () => void;
  isDeleted: () => boolean;
}
const made = new Set<Handle>();

/** Frees every manifold and cross-section made since the last call; copy meshes out first. */
export function cleanup() {
  for (const h of made) if (!h.isDeleted()) h.delete();
  made.clear();
}

/** Records every manifold or cross-section that `target`'s functions return. */
function track(target: Record<string, unknown>, kinds: object[]) {
  for (const name of Object.getOwnPropertyNames(target)) {
    const fn = target[name];
    if (
      typeof fn !== "function" ||
      name === "delete" ||
      name === "constructor"
    ) {
      continue;
    }
    target[name] = function (this: unknown, ...args: unknown[]) {
      const out = fn.apply(this, args);
      for (const o of Array.isArray(out) ? out : [out]) {
        if (o && kinds.includes(Object.getPrototypeOf(o))) made.add(o);
      }
      return out;
    };
  }
}

let toplevel: Promise<ManifoldToplevel> | undefined;

/** Loads the manifold WASM once; pass `locateFile` in the browser. */
export function loadManifold(locateFile?: () => string) {
  toplevel ??= Module(locateFile && { locateFile }).then((m) => {
    m.setup();
    // Instances don't share the exported classes' prototypes, which is why
    // manifold's own garbage collector misses every method call.
    const cs = Object.getPrototypeOf(m.CrossSection.square(1));
    const solid = Object.getPrototypeOf(m.Manifold.cube(1));
    // The stock extrude never frees its polygons; slabs call it constantly.
    const native = m as unknown as {
      _Extrude: (p: Handle, h: number, n: 0, t: 0, s: object) => Manifold;
    };
    cs.extrude = function (this: { _ToPolygons: () => Handle }, h: number) {
      const polygons = this._ToPolygons();
      const out = native._Extrude(polygons, h, 0, 0, { x: 1, y: 1 });
      polygons.delete();
      return out;
    };
    for (const target of [m.CrossSection, m.Manifold, cs, solid]) {
      track(target as unknown as Record<string, unknown>, [cs, solid]);
    }
    return m;
  });
  return toplevel;
}

/** Copies a manifold's triangles out of WASM memory. */
export function meshData(s: Manifold): MeshData {
  const { numProp, vertProperties: vp, triVerts } = s.getMesh();
  const positions = new Float32Array((vp.length / numProp) * 3);
  for (let i = 0, j = 0; i < vp.length; i += numProp, j += 3) {
    positions.set(vp.subarray(i, i + 3), j);
  }
  return { positions, indices: triVerts.slice() };
}
