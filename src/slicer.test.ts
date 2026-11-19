import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Manifold } from "manifold-3d";
import { build, KINDS, type Robot, SIZES, type Slot } from "./kit";
import { cleanup, loadManifold, meshData } from "./mesh";
import { to3mf } from "./threemf";

const ORCA = "/Applications/OrcaSlicer.app";
const SLICER = join(import.meta.dir, "../../kobra-slice/slice.py");
const m = await loadManifold();
afterEach(cleanup);

const robot = (slot: Slot, kind: string, size: number): Robot => ({
  name: "test",
  head: { kind: "box", color: "blue" },
  torso: { kind: "box", color: "blue" },
  arms: { kind: "tube", color: "blue" },
  legs: { kind: "boots", color: "blue" },
  [slot]: { kind, color: "blue", size },
});

// Every size the controls can reach: outlines can pinch at any of them.
const STEPS = Array.from(
  { length: Math.round((SIZES.max - SIZES.min) / SIZES.step) + 1 },
  (_, i) => SIZES.min + i * SIZES.step,
);

// Built lazily: each test frees its manifolds when it ends.
const parts: [string, () => Manifold][] = [
  ...(Object.keys(KINDS) as Slot[]).flatMap((slot) =>
    KINDS[slot].flatMap((kind) =>
      STEPS.map((size): [string, () => Manifold] => [
        `${slot} ${kind} at ${size}`,
        () =>
          build(m, robot(slot, kind, size)).find((p) => p.slot === slot)!.print,
      ]),
    ),
  ),
];

// The slicer is the judge of printability: it must find nothing to support.
// Parts go through the same 3MF hand-off the app downloads.
test.skipIf(!existsSync(ORCA) || !existsSync(SLICER)).each(parts)(
  "%s needs no support",
  async (_, part) => {
    const dir = mkdtempSync(join(tmpdir(), "toybox-"));
    const file = join(dir, "part.3mf");
    const mesh = meshData(part());
    await Bun.write(
      file,
      to3mf([{ name: "part", mesh, color: "blue" }], "part"),
    );
    const args = [
      "enable_support=1",
      "support_type=normal(auto)",
      "support_threshold_angle=40",
      "bridge_no_support=1",
    ];
    const proc = Bun.spawnSync(
      [
        "uv",
        "run",
        SLICER,
        file,
        "--slot-for",
        "blue=1",
        ...args.flatMap((a) => ["--set", a]),
      ],
      { stderr: "pipe" },
    );
    expect(proc.exitCode).toBe(0);
    const gcode = readdirSync(dir).find((f) => f.endsWith(".gcode")) as string;
    const text = await Bun.file(join(dir, gcode)).text();
    expect(text.match(/^;TYPE:Support/gm)?.length ?? 0).toBe(0);
  },
  120_000,
);
