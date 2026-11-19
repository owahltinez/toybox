import type { Manifold } from "manifold-3d";
import { DEPTH } from "./depth";
import type { Shapes } from "./shapes";

export const HEADS: Record<string, (k: Shapes) => Manifold> = {
  box: (k) => {
    const top = DEPTH.head;
    const face = k.union([
      k.rr(34, 30, 6, 0, 15),
      k.rr(6, 12, 2.5, 18, 15),
      k.rr(6, 12, 2.5, -18, 15),
    ]);
    const eyes = k.circle(5, -7.5, 18).add(k.circle(5, 7.5, 18));
    const pupils = k.circle(2.2, -7.5, 18).add(k.circle(2.2, 7.5, 18));
    const mouth = k.rr(16, 2.2, 1.1, 0, 8.5).add(k.rr(16, 2.2, 1.1, 0, 5));
    return k
      .slab(face, top)
      .add(k.raise(eyes, top, 2))
      .subtract(k.recess(pupils, top + 2, 1.4))
      .subtract(k.recess(mouth, top, 1.6));
  },
  dome: (k) => {
    const top = DEPTH.head;
    const face = k.rr(34, 18, 3, 0, 9).add(k.circle(17, 0, 17));
    const visor = k.rr(26, 10, 5, 0, 18);
    const lights = k.circle(2.6, -6.5, 18).add(k.circle(2.6, 6.5, 18));
    // Antennas sit at the back: a face-up print can't center them.
    const antenna = k.rr(6, 8, 2, 0, 35).add(k.circle(5, 0, 41));
    return k
      .slab(face, top)
      .add(k.slab(antenna, 12, 2))
      .subtract(k.recess(visor, top, 1.6))
      .add(k.raise(lights, top - 1.6, 2));
  },
  tv: (k) => {
    const top = DEPTH.head;
    const screen = k.rr(28, 19, 3, 0, 16);
    const eyes = k.circle(2.8, -6.5, 18).add(k.circle(2.8, 6.5, 18));
    const smile = k
      .circle(7, 0, 14)
      .subtract(k.circle(5.2, 0, 14))
      .intersect(k.rr(16, 7, 0, 0, 10));
    const ear = (deg: number) =>
      k
        .rr(6, 13, 3, 0, 5)
        .rotate(deg)
        .translate([0, 27 * k.s]);
    return k
      .slab(k.rr(40, 30, 6, 0, 15), top)
      .add(k.slab(ear(25).add(ear(-25)), 10, 2))
      .subtract(k.recess(screen, top, 1.6))
      .add(k.raise(eyes.add(smile), top - 1.6, 2));
  },
  cyclops: (k) => {
    const top = DEPTH.head;
    const face = k.union([
      k.circle(17, 0, 18),
      k.rr(28, 12, 3, 0, 6),
      k.rr(5, 10, 2, 18.5, 18),
      k.rr(5, 10, 2, -18.5, 18),
    ]);
    const ring = k.circle(9, 0, 20).subtract(k.circle(6.2, 0, 20));
    return k
      .slab(face, top)
      .add(k.raise(ring, top, 2))
      .add(k.raise(k.circle(3.4, 0, 20), top, 2.6))
      .subtract(k.recess(k.rr(12, 2.2, 1.1, 0, 6.5), top, 1.6));
  },
  cat: (k) => {
    const top = DEPTH.head;
    const ear = (side: number) =>
      k
        .poly([
          [side * 17, 20],
          [side * 3, 27],
          [side * 14, 39],
        ])
        .offset(-1.6 * k.s, "Round", 2, 48)
        .offset(1.6 * k.s, "Round", 2, 48);
    const inner = (side: number) =>
      k.poly([
        [side * 13.5, 25],
        [side * 7.5, 28],
        [side * 12.5, 33.5],
      ]);
    const whiskers = [-1, 1].flatMap((side) =>
      [9.5, 6.5].map((y) => k.rr(8, 1.4, 0.7, side * 12.5, y)),
    );
    const nose = k
      .poly([
        [-2.6, 11.5],
        [2.6, 11.5],
        [0, 8.5],
      ])
      .offset(0.6 * k.s, "Round", 2, 24);
    return k
      .slab(k.union([k.rr(34, 28, 7, 0, 14), ear(1), ear(-1)]), top)
      .subtract(k.recess(inner(1).add(inner(-1)), top, 1.4))
      .add(k.raise(k.circle(3.4, -7, 17).add(k.circle(3.4, 7, 17)), top, 2))
      .add(k.raise(nose, top, 1.6))
      .subtract(k.recess(k.union(whiskers), top, 1.2));
  },
  owl: (k) => {
    const top = DEPTH.head;
    const tuft = (side: number) =>
      k
        .poly([
          [side * 6, 27],
          [side * 18, 21],
          [side * 21, 36],
        ])
        .offset(-1.5 * k.s, "Round", 2, 48)
        .offset(1.5 * k.s, "Round", 2, 48);
    const rings = [-8.5, 8.5].map((x) =>
      k.circle(7, x, 17).subtract(k.circle(4.6, x, 17)),
    );
    const beak = k
      .poly([
        [-3, 10.5],
        [3, 10.5],
        [0, 5],
      ])
      .offset(0.8 * k.s, "Round", 2, 24);
    return k
      .slab(k.union([k.rr(36, 30, 12, 0, 15), tuft(1), tuft(-1)]), top)
      .add(k.raise(k.union(rings), top, 1.6))
      .add(
        k.raise(k.circle(2.6, -8.5, 17).add(k.circle(2.6, 8.5, 17)), top, 2.4),
      )
      .add(k.raise(beak, top, 1.8));
  },
  alien: (k) => {
    const top = DEPTH.head;
    const { CrossSection: CS } = k.m;
    const face = CS.hull([k.circle(16, 0, 21), k.rr(18, 8, 3, 0, 4)]);
    const eye = (side: number) =>
      CS.circle(1, 48)
        .scale([6.5 * k.s, 3.8 * k.s])
        .rotate(side * 30)
        .translate([side * 7.5 * k.s, 19 * k.s]);
    const antenna = (deg: number) =>
      k
        .rr(5, 14, 2.5, 0, 7)
        .add(k.circle(4.2, 0, 15))
        .rotate(deg)
        .translate([0, 30 * k.s]);
    return k
      .slab(face, top)
      .add(k.slab(antenna(28).add(antenna(-28)), 12, 2))
      .subtract(k.recess(eye(1).add(eye(-1)), top, 1.6))
      .add(
        k.raise(
          k.circle(1.5, -9, 21).add(k.circle(1.5, 9, 21)),
          top - 1.6,
          1.4,
        ),
      )
      .subtract(k.recess(k.rr(7, 1.8, 0.9, 0, 8), top, 1.2));
  },
  knight: (k) => {
    const top = DEPTH.head;
    const helmet = k.rr(32, 36, 10, 0, 18).add(k.rr(32, 14, 3, 0, 7));
    const plume = k.rr(12, 16, 6, 0, 39);
    const slits = k.rr(24, 3, 1.5, 0, 20).add(k.rr(3, 12, 1.5, 0, 13));
    const holes = [-1, 1].flatMap((side) =>
      [6, 10].map((y) => k.circle(1.1, side * 9, y)),
    );
    const rivets = [-11, 11].map((x) => k.circle(1.6, x, 28));
    return k
      .slab(helmet, top)
      .add(k.slab(plume, 13, 3))
      .add(k.raise(k.rr(26, 3, 1.5, 0, 25), top, 1.4))
      .subtract(k.recess(slits.add(k.union(holes)), top, 1.8))
      .add(k.raise(k.union(rivets), top, 1.2));
  },
  pumpkin: (k) => {
    const top = DEPTH.head;
    const body = k.union([
      k.circle(12, -8.5, 17),
      k.circle(12, 8.5, 17),
      k.circle(13.5, 0, 17),
      k.rr(22, 8, 2, 0, 4),
    ]);
    const stem = k
      .rr(6, 10, 2.5, 0, 0)
      .rotate(-15)
      .translate([1 * k.s, 33 * k.s]);
    const eye = (side: number) =>
      k.poly([
        [side * 3.5, 19],
        [side * 11, 19],
        [side * 7.25, 25],
      ]);
    const nose = k.poly([
      [-2, 15],
      [2, 15],
      [0, 18],
    ]);
    const mouth = k
      .rr(20, 6, 3, 0, 9.5)
      .subtract(k.rr(3, 3, 0, -4, 12))
      .subtract(k.rr(3, 3, 0, 4, 7));
    return k
      .slab(body, top)
      .add(k.slab(stem, 13, 2))
      .subtract(k.recess(k.union([eye(1), eye(-1), nose, mouth]), top, 1.8));
  },
  bear: (k) => {
    const top = DEPTH.head;
    const ears = k.circle(6.5, -13, 27).add(k.circle(6.5, 13, 27));
    const inner = k.circle(3, -13.5, 28).add(k.circle(3, 13.5, 28));
    const nose = k
      .poly([
        [-3, 11.5],
        [3, 11.5],
        [0, 8.5],
      ])
      .offset(0.8 * k.s, "Round", 2, 24);
    return k
      .slab(k.rr(34, 28, 10, 0, 14).add(ears), top)
      .subtract(k.recess(inner, top, 1.2))
      .add(k.raise(k.rr(15, 10, 5, 0, 9), top, 1.4))
      .add(k.raise(nose, top + 1.4, 1.2))
      .add(k.raise(k.circle(2.4, -7, 18).add(k.circle(2.4, 7, 18)), top, 1.6));
  },
};
