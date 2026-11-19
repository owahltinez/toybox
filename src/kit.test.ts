import { afterEach, describe, expect, test } from "bun:test";
import type { ManifoldToplevel } from "manifold-3d";
import { FIT, type Joint, KEYS, keyProfile } from "./joints";
import { build, KINDS, type Robot, SIZES, type Slot } from "./kit";
import { cleanup, loadManifold } from "./mesh";

const m = await loadManifold();
afterEach(cleanup);
const SLOTS = Object.keys(KINDS) as Slot[];
const robot = (over: Partial<Robot> = {}): Robot => ({
  name: "test",
  head: { kind: "box", color: "blue" },
  torso: { kind: "box", color: "blue" },
  arms: { kind: "tube", color: "blue" },
  legs: { kind: "boots", color: "blue" },
  ...over,
});

/** Overlaps between placed parts; tongues may only touch their sockets' crush ribs. */
function collisions(r: Robot): string[] {
  const placed = build(m, r).map((p) => ({
    name: `${p.slot} ${r[p.slot].kind}`,
    slot: p.slot,
    solid: p.print.transform(p.toRobot),
  }));
  const hits: string[] = [];
  for (const [i, a] of placed.entries()) {
    for (const b of placed.slice(i + 1)) {
      const v = a.solid.intersect(b.solid).volume();
      const ribs = a.slot === "torso" || b.slot === "torso" ? 6 : 0.5;
      if (v > ribs) hits.push(`${a.name} × ${b.name}: ${v.toFixed(1)} mm³`);
    }
  }
  return hits;
}

describe.each(SLOTS)("%s", (slot) => {
  test.each(
    KINDS[slot].flatMap((kind) =>
      [SIZES.min, 1, SIZES.max].map((size) => [kind, size] as const),
    ),
  )("%s at %d prints as one solid and fits", (kind, size) => {
    const r = robot({ [slot]: { kind, color: "red", size } });
    for (const p of build(m, r).filter((p) => p.slot === slot)) {
      expect(p.print.decompose().length).toBe(1);
      expect(p.print.boundingBox().min[2]).toBeCloseTo(0);
      expect(p.color).toBe("red");
    }
    expect(collisions(r)).toEqual([]);
  });
});

test.each(
  SLOTS.flatMap((slot) => KINDS[slot].map((_, i) => i)).filter(
    (i, j, a) => a.indexOf(i) === j,
  ),
)("variant %i stands on its feet", (i) => {
  const r = robot(
    Object.fromEntries(
      SLOTS.map((s) => [s, { kind: KINDS[s][i], color: "blue" }]),
    ),
  );
  expect(collisions(r)).toEqual([]);
  const placed = build(m, r).map((p) => ({
    slot: p.slot,
    box: p.print.transform(p.toRobot).boundingBox(),
  }));
  for (const { slot, box } of placed) {
    if (slot === "legs") expect(box.min[2]).toBeCloseTo(0);
    else expect(box.min[2]).toBeGreaterThan(1);
  }
});

test.each(KINDS.arms)(
  "tiny legs with long %s arms keep the hands off the ground",
  (kind) => {
    const r = robot({
      legs: { kind: "boots", color: "blue", size: SIZES.min },
      torso: { kind: "box", color: "blue", size: SIZES.min },
      arms: { kind, color: "blue", size: SIZES.max },
    });
    for (const p of build(m, r).filter((p) => p.slot === "arms")) {
      expect(p.print.transform(p.toRobot).boundingBox().min[2]).toBeGreaterThan(
        0,
      );
    }
  },
);

function fits(top: ManifoldToplevel, key: Joint, into: Joint): boolean {
  const socket = keyProfile(top, into, 0).offset(FIT, "Miter", 4);
  return keyProfile(top, key).subtract(socket).area() < 1e-6;
}

test.each(Object.keys(KEYS) as Joint[])(
  "a %s key fits only its own socket",
  (key) => {
    for (const into of Object.keys(KEYS) as Joint[]) {
      expect(fits(m, key, into)).toBe(key === into);
    }
  },
);

test("unknown colors are rejected", () => {
  const pink = { kind: "tube", color: "pink" } as unknown as Robot["arms"];
  expect(() => build(m, robot({ arms: pink }))).toThrow("unknown color: pink");
});

test("unknown kinds are rejected", () => {
  expect(() =>
    build(m, robot({ arms: { kind: "noodle", color: "blue" } })),
  ).toThrow("unknown arms: noodle");
});
