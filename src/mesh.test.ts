import { expect, test } from "bun:test";
import { cleanup, loadManifold } from "./mesh";

const m = await loadManifold();

test("cleanup frees what methods return, not just constructors", () => {
  const square = m.CrossSection.square(2);
  const moved = square.translate([1, 1]);
  const solid = moved.extrude(1);
  const parts = solid.add(solid.translate([5, 0, 0])).decompose();
  cleanup();
  // Every embind handle has isDeleted; the typings omit it.
  const handles = [square, moved, solid, ...parts] as unknown as {
    isDeleted: () => boolean;
  }[];
  for (const h of handles) {
    expect(h.isDeleted()).toBe(true);
  }
});
