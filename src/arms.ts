import type { Manifold } from "manifold-3d";
import { DEPTH } from "./depth";
import type { Shapes } from "./shapes";

/** A flat inner side for the arm's tongue to leave from. */
const shoulder = (k: Shapes) => k.rr(14, 16, 3, 7, 0);

/** Front outlines with the shoulder at the origin, hanging down and outward;
 * nothing crosses x = 0, where the torso's side is. */
export const ARMS: Record<string, (k: Shapes) => Manifold> = {
  tube: (k) =>
    k.slab(
      k.union([shoulder(k), k.rr(13, 40, 6.5, 6.5, -14), k.circle(8, 8, -36)]),
      DEPTH.arms,
    ),
  claw: (k) => {
    const pincer = k.circle(10, 10, -34).subtract(
      k.poly([
        [10, -33],
        [2.5, -47],
        [17.5, -47],
      ]),
    );
    return k.slab(
      k.union([shoulder(k), k.rr(13, 34, 6.5, 6.5, -11), pincer]),
      DEPTH.arms,
    );
  },
  hammer: (k) => {
    const head = k.rr(26, 13, 3, 13, -33);
    return k
      .slab(shoulder(k).add(k.rr(13, 40, 6.5, 6.5, -14)), DEPTH.arms)
      .add(k.slab(head, DEPTH.arms + 2, 2.5))
      .add(k.raise(k.rr(5, 8, 2, 19.5, -33), DEPTH.arms + 2, 1.6));
  },
  drill: (k) => {
    const bit = k
      .poly([
        [0, -27],
        [15, -27],
        [10, -48],
        [5, -48],
      ])
      .offset(-1.5 * k.s, "Round", 2, 48)
      .offset(1.5 * k.s, "Round", 2, 48);
    const grooves = [-33, -39].map((y) =>
      k
        .rr(10, 1.6, 0.8)
        .rotate(20)
        .translate([7.5 * k.s, y * k.s]),
    );
    return k
      .slab(
        k.union([shoulder(k), k.rr(13, 34, 6.5, 6.5, -11), bit]),
        DEPTH.arms,
      )
      .add(k.slab(k.rr(15, 6, 2, 7.5, -27), DEPTH.arms + 1.5, 1.5))
      .subtract(k.recess(k.union(grooves), DEPTH.arms, 1.2));
  },
  rocket: (k) => {
    const nozzle = k
      .poly([
        [3, -39],
        [15, -39],
        [17, -47],
        [1, -47],
      ])
      .offset(-1.2 * k.s, "Round", 2, 48)
      .offset(1.2 * k.s, "Round", 2, 48);
    const rings = [-28, -34].map((y) => k.rr(18, 1.4, 0.7, 9, y));
    return k
      .slab(
        k.union([shoulder(k), k.rr(13, 36, 6.5, 6.5, -12), nozzle]),
        DEPTH.arms,
      )
      .add(k.slab(k.rr(18, 17, 5, 9, -31.5), DEPTH.arms + 2, 2.5))
      .subtract(k.recess(k.union(rings), DEPTH.arms + 2, 1.2));
  },
  shield: (k) => {
    const shield = k
      .poly([
        [1, -16],
        [21, -16],
        [21, -30],
        [11, -42],
        [1, -30],
      ])
      .offset(-2.5 * k.s, "Round", 2, 48)
      .offset(2.5 * k.s, "Round", 2, 48);
    return k
      .slab(shoulder(k).add(k.rr(13, 34, 6.5, 6.5, -11)), DEPTH.arms)
      .add(k.slab(shield, DEPTH.arms + 3, 2.5))
      .add(
        k.raise(
          k.circle(5, 11, -26).subtract(k.circle(3.4, 11, -26)),
          DEPTH.arms + 3,
          1.2,
        ),
      )
      .add(k.raise(k.circle(2, 11, -26), DEPTH.arms + 3, 1.8));
  },
  sword: (k) => {
    const blade = k
      .poly([
        [14, -31.5],
        [36, -31.5],
        [42, -28],
        [36, -24.5],
        [14, -24.5],
      ])
      .offset(-1.2 * k.s, "Round", 2, 48)
      .offset(1.2 * k.s, "Round", 2, 48);
    return k
      .slab(
        k.union([
          shoulder(k),
          k.rr(13, 26, 6.5, 6.5, -8),
          k.circle(8, 8, -26),
          blade,
        ]),
        DEPTH.arms,
      )
      .add(k.slab(k.rr(5, 19, 2, 18.5, -28), DEPTH.arms + 2, 2))
      .subtract(k.recess(k.rr(13, 1.4, 0.7, 29, -28), DEPTH.arms, 1));
  },
  magnet: (k) => {
    const horseshoe = k
      .circle(11, 11, -28)
      .subtract(k.circle(4.5, 11, -28))
      .intersect(k.rr(24, 12, 0, 11, -22))
      .add(k.rr(6.5, 11, 1, 3.25, -33.5))
      .add(k.rr(6.5, 11, 1, 18.75, -33.5));
    const tips = k
      .rr(8, 1.4, 0, 3.25, -34.5)
      .add(k.rr(8, 1.4, 0, 18.75, -34.5));
    // Fills the hairline crevice where the arch meets the arm.
    const outline = k
      .union([shoulder(k), k.rr(13, 24, 6.5, 6.5, -7), horseshoe])
      .offset(2 * k.s, "Round", 2, 48)
      .offset(-2 * k.s, "Round", 2, 48);
    return k
      .slab(outline, DEPTH.arms)
      .subtract(k.recess(tips, DEPTH.arms, 1.2));
  },
  wing: (k) => {
    const wing = k
      .poly([
        [0, 7],
        [16, 8],
        [30, 4],
        [42, -4],
        [44, -10],
        [37, -12],
        [39, -19],
        [30, -19],
        [31, -27],
        [21, -26],
        [20, -34],
        [9, -31],
        [0, -22],
      ])
      .offset(-2 * k.s, "Round", 2, 48)
      .offset(2 * k.s, "Round", 2, 48);
    const feathers = [
      [33, -8],
      [26, -15],
      [19, -21],
    ].map(([x, y]) =>
      k
        .rr(11, 1.4, 0.7)
        .rotate(-40)
        .translate([x * k.s, y * k.s]),
    );
    return k
      .slab(shoulder(k).add(wing), DEPTH.arms)
      .subtract(k.recess(k.union(feathers), DEPTH.arms, 1.2));
  },
  tentacle: (k) => {
    const joints: [number, number, number][] = [
      [6.5, 0, 6.5],
      [7, -14, 6],
      [10, -26, 5.5],
      [17, -34, 5],
      [25.5, -34, 4.5],
      [29, -26.5, 4],
      [24.5, -21.5, 3.5],
    ];
    const blobs = joints.map(([x, y, r]) => k.circle(r, x, y));
    const body = k.union(
      blobs.slice(1).map((b, i) => k.m.CrossSection.hull([blobs[i], b])),
    );
    const suckers = joints.slice(1, 5).map(([x, y]) => k.circle(1.6, x, y));
    return k
      .slab(shoulder(k).add(body), DEPTH.arms)
      .subtract(k.recess(k.union(suckers), DEPTH.arms, 1.2));
  },
};
