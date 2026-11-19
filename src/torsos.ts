import type { Manifold } from "manifold-3d";
import { DEPTH } from "./depth";
import type { Shapes } from "./shapes";

export interface Torso {
  solid: Manifold;
  height: number;
  /** Half width and height of the flat sides the arms plug into. */
  shoulder: [number, number];
}

export const TORSOS: Record<string, (k: Shapes) => Torso> = {
  box: (k) => {
    const top = DEPTH.torso;
    const outline = box(k);
    const buttons = [-8, 0, 8].map((x) => k.circle(2.2, x, 26));
    const solid = k
      .slab(outline, top, 2.5)
      .add(k.raise(k.rr(26, 15, 3, 0, 26), top, 2))
      .add(k.raise(k.union(buttons), top + 2, 1.4))
      .subtract(k.recess(k.rr(52, 3, 0, 0, 8), top, 1.6));
    return { solid, height: 42 * k.s, shoulder: [24 * k.s, 32 * k.s] };
  },
  barrel: (k) => {
    const top = DEPTH.torso;
    const outline = k.rr(48, 46, 16, 0, 23).add(k.rr(48, 20, 3, 0, 10));
    const heart = k.union([
      k.circle(4.6, -4, 27),
      k.circle(4.6, 4, 27),
      k.poly([
        [-8.4, 25.4],
        [8.4, 25.4],
        [0, 15.5],
      ]),
    ]);
    const rivets = [-16, 16].flatMap((x) =>
      [7, 38].map((y) => k.circle(1.8, x, y)),
    );
    const solid = k
      .slab(outline, top, 3)
      .add(k.raise(heart, top, 2))
      .add(k.raise(k.union(rivets), top, 1.2));
    // Below where the top corners start to curve.
    return { solid, height: 46 * k.s, shoulder: [24 * k.s, 25 * k.s] };
  },
  chunky: (k) => {
    const top = DEPTH.torso;
    const outline = k
      .poly([
        [-23, 0],
        [23, 0],
        [28, 24],
        [28, 42],
        [-28, 42],
        [-28, 24],
      ])
      .offset(-3 * k.s, "Round", 2, 48)
      .offset(3 * k.s, "Round", 2, 48);
    const core = k.circle(7.5, 0, 25).subtract(k.circle(5, 0, 25));
    const vents = [-7, 0, 7].map((x) => k.rr(3.4, 10, 1.7, x, 10));
    const solid = k
      .slab(outline, top, 2.5)
      .add(k.raise(core, top, 2))
      .add(k.raise(k.circle(2.8, 0, 25), top, 2.6))
      .subtract(k.recess(k.union(vents), top, 1.6));
    return { solid, height: 42 * k.s, shoulder: [28 * k.s, 32 * k.s] };
  },
  star: (k) => {
    const top = DEPTH.torso;
    const star = k
      .poly(starPoints(13.5, 5.6, 0, 23))
      .offset(-1.2 * k.s, "Round", 2, 48)
      .offset(1.2 * k.s, "Round", 2, 48);
    const solid = k.slab(box(k), top, 2.5).add(k.raise(star, top, 2.2));
    return { solid, height: 42 * k.s, shoulder: [24 * k.s, 32 * k.s] };
  },
  screen: (k) => {
    const top = DEPTH.torso;
    const bolt = k.poly([
      [-2, 33],
      [5, 33],
      [1.5, 26],
      [6, 26],
      [-3, 15.5],
      [-0.5, 23],
      [-5, 23],
    ]);
    const knobs = k.circle(2.4, -15, 8).add(k.circle(2.4, -8, 8));
    const solid = k
      .slab(box(k), top, 2.5)
      .subtract(k.recess(k.rr(30, 21, 4, 0, 24.5), top, 1.6))
      .add(k.raise(bolt, top - 1.6, 2))
      .add(k.raise(knobs, top, 1.6))
      .subtract(k.recess(k.rr(12, 2.2, 1.1, 11, 8), top, 1.2));
    return { solid, height: 42 * k.s, shoulder: [24 * k.s, 32 * k.s] };
  },
  shield: (k) => {
    const top = DEPTH.torso;
    const shield = k
      .poly([
        [-11, 36],
        [11, 36],
        [11, 25],
        [6, 17.5],
        [0, 13],
        [-6, 17.5],
        [-11, 25],
      ])
      .offset(-1.5 * k.s, "Round", 2, 48)
      .offset(1.5 * k.s, "Round", 2, 48);
    const star = k
      .poly(starPoints(7, 3, 0, 25.5))
      .offset(-0.6 * k.s, "Round", 2, 48)
      .offset(0.6 * k.s, "Round", 2, 48);
    const buckle = k.rr(9, 6, 1.5, 0, 8);
    const solid = k
      .slab(box(k), top, 2.5)
      .add(k.raise(shield, top, 2))
      .subtract(k.recess(star, top + 2, 1.2))
      .subtract(k.recess(k.rr(52, 2, 0, 0, 8).subtract(buckle), top, 1.4))
      .add(k.raise(buckle, top, 1.4));
    return { solid, height: 42 * k.s, shoulder: [24 * k.s, 32 * k.s] };
  },
  radio: (k) => {
    const top = DEPTH.torso;
    const grille = [-16, -10.5, -5].flatMap((x) =>
      [31, 25.5, 20].map((y) => k.circle(1.8, x, y)),
    );
    const buttons = [-13, -4.5, 4, 12.5].map((x) => k.rr(6, 3.4, 1.5, x, 9));
    const solid = k
      .slab(box(k), top, 2.5)
      .subtract(k.recess(k.union(grille), top, 1.6))
      .add(k.raise(k.circle(6, 11, 25.5), top, 2))
      .subtract(k.recess(k.rr(1.6, 5, 0.8, 11, 28), top + 2, 1.2))
      .add(k.raise(k.union(buttons), top, 1.4));
    return { solid, height: 42 * k.s, shoulder: [24 * k.s, 32 * k.s] };
  },
  gears: (k) => {
    const top = DEPTH.torso;
    const gear = (r: number, teeth: number, x: number, y: number) =>
      k
        .union([
          k.circle(r - 1.5),
          ...Array.from({ length: teeth }, (_, i) =>
            k.rr(3.4, 4, 1, 0, r - 1).rotate((360 * i) / teeth),
          ),
        ])
        .subtract(k.circle(r * 0.35))
        .translate([x * k.s, y * k.s]);
    const bolts = [-18, 18].map((x) => k.circle(1.6, x, 6));
    const solid = k
      .slab(box(k), top, 2.5)
      .add(k.raise(gear(10, 10, -5.5, 25.5), top, 2))
      .add(k.raise(gear(6.5, 7, 9, 13.5), top, 2))
      .add(k.raise(k.union(bolts), top, 1.2));
    return { solid, height: 42 * k.s, shoulder: [24 * k.s, 32 * k.s] };
  },
  muscles: (k) => {
    const top = DEPTH.torso;
    const pecs = [-9.5, 9.5].map((x) => k.rr(17, 11, 5, x, 30));
    const abs = [-4.5, 4.5].flatMap((x) =>
      [21, 15, 9].map((y) => k.rr(7.5, 5, 2, x, y)),
    );
    const solid = k
      .slab(box(k), top, 2.5)
      .add(k.raise(k.union(pecs), top, 2, 1.2))
      .add(k.raise(k.union(abs), top, 1.6));
    return { solid, height: 42 * k.s, shoulder: [24 * k.s, 32 * k.s] };
  },
  overalls: (k) => {
    const top = DEPTH.torso;
    const bib = k.union([
      k.rr(26, 22, 3, 0, 17),
      k.rr(5, 12, 1.5, -8.5, 33),
      k.rr(5, 12, 1.5, 8.5, 33),
    ]);
    const buttons = k.circle(1.8, -8.5, 29.5).add(k.circle(1.8, 8.5, 29.5));
    const solid = k
      .slab(box(k), top, 2.5)
      .add(k.raise(bib, top, 1.6))
      .subtract(k.recess(k.rr(11, 7, 1.5, 0, 15), top + 1.6, 1))
      .add(k.raise(buttons, top + 1.6, 1.2));
    return { solid, height: 42 * k.s, shoulder: [24 * k.s, 32 * k.s] };
  },
};

/** A five-pointed star's corners, point up. */
function starPoints(outer: number, inner: number, x: number, y: number) {
  return Array.from({ length: 10 }, (_, i): [number, number] => {
    const r = i % 2 ? inner : outer;
    const a = Math.PI / 2 + (i * Math.PI) / 5;
    return [x + r * Math.cos(a), y + r * Math.sin(a)];
  });
}

/** The plain box outline: big rounded top corners, nearly square bottom ones. */
function box(k: Shapes) {
  return k.rr(48, 42, 8, 0, 21).add(k.rr(48, 20, 3, 0, 10));
}
