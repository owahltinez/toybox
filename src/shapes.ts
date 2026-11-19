import type { CrossSection, Manifold, ManifoldToplevel } from "manifold-3d";

/** Layer height; slabs are built from slices this thick. */
export const STEP = 0.2;
const SEGMENTS = 48;

/**
 * 2D and slab helpers; 2D sizes and positions scale by `s` (or `[sx, sy]`),
 * heights do not. Corners and circles keep the smaller scale.
 */
export function shapes(
  m: ManifoldToplevel,
  scale: number | [number, number] = 1,
) {
  const { CrossSection: CS, Manifold: M } = m;
  const [sx, sy] = typeof scale === "number" ? [scale, scale] : scale;
  const s = Math.min(sx, sy);
  const rr = (w: number, h: number, r: number, x = 0, y = 0) =>
    CS.square([w * sx - 2 * r * s, h * sy - 2 * r * s], true)
      .offset(r * s, "Round", 2, SEGMENTS)
      .translate([x * sx, y * sy]);
  const circle = (r: number, x = 0, y = 0) =>
    CS.circle(r * s, SEGMENTS).translate([x * sx, y * sy]);
  const poly = (points: [number, number][]) =>
    CS.ofPolygons(
      [points.map(([x, y]) => [x * sx, y * sy] as [number, number])],
      "NonZero",
    );
  const union = (parts: CrossSection[]) => CS.union(parts);

  /**
   * Extrudes a profile with a 45° chamfer at the bed and rounded top edges,
   * built from layer-height slices so every layer rests on the one below.
   */
  const slab = (p: CrossSection, h: number, round = 2, chamfer = 0.8) => {
    const pieces: Manifold[] = [];
    const add = (z0: number, z1: number, inset: number) => {
      const shape = inset > 0 ? p.offset(-inset, "Round", 2, SEGMENTS) : p;
      if (z1 > z0 && !shape.isEmpty()) {
        pieces.push(shape.extrude(z1 - z0).translate([0, 0, z0]));
      }
    };
    const r = Math.min(round, h - chamfer);
    for (let z = 0; z < chamfer - 1e-9; z += STEP) {
      add(z, Math.min(z + STEP, chamfer), chamfer - z);
    }
    add(chamfer, h - r, 0);
    for (let z = h - r; z < h - 1e-9; z += STEP) {
      const top = Math.min(z + STEP, h);
      const d = top - (h - r);
      add(z, top, r - Math.sqrt(Math.max(0, r * r - d * d)));
    }
    return M.union(pieces);
  };

  /** Raises a profile from height z, sunk one layer in so it fuses. */
  const raise = (p: CrossSection, z: number, h: number, round = 0.6) =>
    slab(p, h + STEP, round, 0).translate([0, 0, z - STEP]);
  /** Cuts a profile down from height z. */
  const recess = (p: CrossSection, z: number, depth: number) =>
    p.extrude(depth + 1).translate([0, 0, z - depth]);

  return { m, s, rr, circle, poly, union, slab, raise, recess };
}

export type Shapes = ReturnType<typeof shapes>;
