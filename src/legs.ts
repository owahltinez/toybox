import type { Manifold } from "manifold-3d";
import { DEPTH } from "./depth";
import type { Shapes } from "./shapes";

/** Front outlines from the sole up to the hip, at most 19 mm wide to clear
 * each other. Feet are taller slabs so they stick forward for balance; a
 * raised detail would overhang the rounded edge below it. */
export const LEGS: Record<string, (k: Shapes) => Manifold> = {
  boots: (k) => {
    const top = DEPTH.legs;
    const boot = k.rr(19, 12, 5, 0, 6);
    return k
      .slab(k.rr(16, 27, 3, 0, 18.5), top)
      .add(k.slab(boot, top + 8, 2.5));
  },
  pistons: (k) => {
    const top = DEPTH.legs;
    const base = k.rr(19, 12, 4, 0, 6);
    const grooves = [14, 18].map((y) => k.rr(18, 1.4, 0.7, 0, y));
    const outline = k.union([
      base,
      k.rr(18, 13, 3, 0, 16.5),
      k.rr(16, 12, 2, 0, 26),
    ]);
    return k
      .slab(outline, top)
      .subtract(k.recess(k.union(grooves), top, 1.2))
      .add(k.slab(base, top + 7, 2.5));
  },
  treads: (k) => {
    const top = DEPTH.legs;
    const block = k.rr(19, 20, 6, 0, 10);
    const ridges = [4, 8, 12, 16].map((y) => k.rr(15, 1.6, 0.8, 0, y));
    return k
      .slab(k.rr(16, 15, 2, 0, 24.5), top)
      .add(k.slab(block, top + 8, 2.5))
      .subtract(k.recess(k.union(ridges), top + 8, 1.2));
  },
  thrusters: (k) => {
    const top = DEPTH.legs;
    const bell = k
      .poly([
        [-8, 15],
        [8, 15],
        [9.5, 0],
        [-9.5, 0],
      ])
      .offset(-1.5, "Round", 2, 48)
      .offset(1.5, "Round", 2, 48);
    const rings = [4.5, 9].map((y) => k.rr(16, 1.4, 0.7, 0, y));
    return k
      .slab(k.rr(16, 19, 3, 0, 22.5), top)
      .add(k.slab(bell, top + 7, 2.5))
      .subtract(k.recess(k.union(rings), top + 7, 1.2));
  },
  springs: (k) => {
    const top = DEPTH.legs;
    const coils = [11.5, 16, 20.5, 25].map((y, i) =>
      k.rr(16, 5.5, 2.75, i % 2 ? 1 : -1, y),
    );
    const foot = k.rr(19, 9, 4, 0, 4.5);
    return k
      .slab(
        k.union([k.rr(10, 24, 2, 0, 18), ...coils, k.rr(16, 6, 2, 0, 29)]),
        top,
      )
      .add(k.slab(foot, top + 7, 2.5));
  },
  wheels: (k) => {
    const top = DEPTH.legs;
    const { CrossSection: CS } = k.m;
    // Round, so it ignores the leg's stretch; cut flat to stand on.
    const wheel = CS.circle(9.5 * k.s, 48)
      .translate([0, 8.5 * k.s])
      .intersect(CS.square([20, 20]).translate([-10, 0]));
    const hub = CS.circle(6 * k.s, 48)
      .subtract(CS.circle(4 * k.s, 48))
      .translate([0, 8.5 * k.s]);
    return k
      .slab(k.rr(14, 22, 3, 0, 21), top)
      .add(k.slab(wheel, top + 6, 2.5))
      .subtract(k.recess(hub, top + 6, 1.2));
  },
  stompers: (k) => {
    const top = DEPTH.legs;
    const nails = [-5.5, 0, 5.5].map((x) => k.rr(4.2, 3.4, 1.7, x, 5));
    return k
      .slab(k.rr(18, 26, 6, 0, 19), top)
      .subtract(k.recess(k.rr(20, 1.4, 0, 0, 22), top, 1.2))
      .add(k.slab(k.rr(19, 10, 4.5, 0, 5), top + 7, 2.5))
      .add(k.raise(k.union(nails), top + 7, 1.2));
  },
  paws: (k) => {
    const top = DEPTH.legs;
    const paw = k.rr(19, 11, 5.5, 0, 5.5);
    const beans = k.union([
      k.rr(7, 3.6, 1.8, 0, 3.6),
      k.circle(1.6, -4.5, 7.5),
      k.circle(1.6, 0, 8.4),
      k.circle(1.6, 4.5, 7.5),
    ]);
    return k
      .slab(k.rr(15, 24, 5, 0, 20), top)
      .subtract(k.recess(k.rr(18, 1.4, 0.7, 0, 15), top, 1.2))
      .add(k.slab(paw, top + 7, 2.5))
      .subtract(k.recess(beans, top + 7, 1.2));
  },
  talons: (k) => {
    const top = DEPTH.legs;
    const foot = k.rr(19, 7, 3, 0, 3.5);
    const toes = [-3.2, 3.2].map((x) => k.rr(1.4, 8, 0.7, x, 3.5));
    return k
      .slab(
        k.union([
          k.rr(16, 6, 2, 0, 29),
          k.rr(7, 26, 3.5, 0, 17),
          k.circle(5, 0, 18),
        ]),
        top,
      )
      .add(k.slab(foot, top + 9, 2.5))
      .subtract(k.recess(k.union(toes), top + 9, 1.2));
  },
  sneakers: (k) => {
    const top = DEPTH.legs;
    const shoe = k.rr(19, 11, 4, 0, 5.5);
    const laces = [14.5, 19, 23.5].map((y) => k.rr(9, 1.6, 0.8, 0, y));
    return k
      .slab(k.rr(16, 22, 3, 0, 21), top)
      .add(k.raise(k.union(laces), top, 1.2))
      .add(k.slab(shoe, top + 8, 2.5))
      .subtract(k.recess(k.rr(22, 1.4, 0, 0, 3), top + 8, 1.2));
  },
};
