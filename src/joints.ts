import type {
  CrossSection,
  Manifold,
  ManifoldToplevel,
  Mat4,
  Vec3,
} from "manifold-3d";

/**
 * Parts join with a keyed tongue sliding into a socket. The key is a house
 * shape, flat side on the bed and 45° roof up, so both print without support
 * and the tongue's layers run along its length. Each joint's key fits no
 * other joint's socket, and only one way up.
 */
export type Joint = "neck" | "arm" | "leg";
export const KEYS: Record<Joint, { w: number; h: number }> = {
  neck: { w: 10, h: 10 },
  arm: { w: 8, h: 11 },
  leg: { w: 12, h: 9 },
};
/** Clearance per side, in mm; tuned from a test print of real parts. */
export const FIT = 0.15;
export const LENGTH = 10;
/** Crush ribs stand this far proud of the key, gripping without wedging. */
const RIB = 0.3;
/** The tongue's root flares by this much to spread the load. */
export const COLLAR = 1.15;
const TIP = 0.8;
const THIN = 0.01;

/** The key profile: lateral u, up v, bottom corners chamfered for elephant's foot. */
export function keyProfile(
  m: ManifoldToplevel,
  joint: Joint,
  chamfer = 0.4,
): CrossSection {
  const { w, h } = KEYS[joint];
  return m.CrossSection.ofPolygons([
    [
      [-w / 2 + chamfer, 0],
      [w / 2 - chamfer, 0],
      [w / 2, chamfer],
      [w / 2, h - w / 2],
      [0, h],
      [-w / 2, h - w / 2],
      [-w / 2, chamfer],
    ],
  ]);
}

/** Maps local (lateral, up, along) onto print axes, starting at `at`. */
function place(at: Vec3, dir: Vec3): Mat4 {
  const v: Vec3 = [0, 0, 1];
  const u: Vec3 = [
    v[1] * dir[2] - v[2] * dir[1],
    v[2] * dir[0] - v[0] * dir[2],
    v[0] * dir[1] - v[1] * dir[0],
  ];
  return [...u, 0, ...v, 0, ...dir, 0, ...at, 1] as Mat4;
}

function prism(p: CrossSection, z0: number, z1: number): Manifold {
  return p.extrude(z1 - z0).translate([0, 0, z0]);
}

/** A tongue leaving a part's surface at `at` (on the bed) along `dir`. */
export function tongue(
  m: ManifoldToplevel,
  joint: Joint,
  at: Vec3,
  dir: Vec3,
): Manifold {
  const { w, h } = KEYS[joint];
  const plain = keyProfile(m, joint);
  const mid = Math.max(1.2, (h - w / 2) / 2);
  const rib = (side: number) =>
    m.CrossSection.ofPolygons(
      [
        [
          [(side * w) / 2, mid - 0.6],
          [side * (w / 2 + RIB), mid],
          [(side * w) / 2, mid + 0.6],
        ],
      ],
      "NonZero",
    );
  const ribbed = plain.add(rib(1)).add(rib(-1));
  const { Manifold: M } = m;
  return M.union([
    M.hull([prism(plain.scale(COLLAR), 0, THIN), prism(plain, 2, 2 + THIN)]),
    prism(ribbed, -1, LENGTH - 1.5),
    M.hull([
      prism(plain, LENGTH - 1.5, LENGTH - 1.5 + THIN),
      prism(plain.scale(TIP), LENGTH - THIN, LENGTH),
    ]),
  ]).transform(place(at, dir));
}

/** The void a tongue slides into, entering a part's surface at `at` along `dir`. */
export function socket(
  m: ManifoldToplevel,
  joint: Joint,
  at: Vec3,
  dir: Vec3,
): Manifold {
  const square = keyProfile(m, joint, 0);
  const hole = square.offset(FIT, "Miter", 4);
  const mouth = square.scale(COLLAR).offset(FIT, "Miter", 4);
  const { Manifold: M } = m;
  return M.union([
    M.hull([prism(mouth, -1, 0), prism(hole, 2, 2 + THIN)]),
    prism(hole, 0, LENGTH + 1),
  ]).transform(place(at, dir));
}
