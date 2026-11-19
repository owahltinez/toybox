import { afterEach, expect, test } from "bun:test";
import { lettering } from "./lettering";
import { cleanup, loadManifold } from "./mesh";

const m = await loadManifold();
afterEach(cleanup);

test("short names are as tall as allowed", () => {
  const { min, max } = lettering(m, "BOB", 40, 9, 1.4).bounds();
  expect(max[1] - min[1]).toBeCloseTo(9 + 1.4, 0);
  expect(max[0] - min[0]).toBeLessThan(40);
});

test("long names shrink to fit the width", () => {
  const { min, max } = lettering(m, "SUPER MEGA ROBOT", 30, 9, 1.4).bounds();
  expect(max[0] - min[0]).toBeLessThanOrEqual(30 + 1.4);
  expect(max[1] - min[1]).toBeLessThan(9);
});

test("text is centered on the origin", () => {
  const { min, max } = lettering(m, "Sparky", 40, 9, 1.4).bounds();
  expect(min[0] + max[0]).toBeCloseTo(0, 0);
});

test("blank and unknown characters draw nothing", () => {
  expect(lettering(m, "", 40, 9, 1.4).isEmpty()).toBe(true);
  expect(lettering(m, "  ", 40, 9, 1.4).isEmpty()).toBe(true);
  expect(lettering(m, "🤖", 40, 9, 1.4).isEmpty()).toBe(true);
});
