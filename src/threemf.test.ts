import { afterEach, expect, test } from "bun:test";
import { strFromU8, unzipSync } from "fflate";
import { build, COLORS, type Robot } from "./kit";
import { cleanup, loadManifold, meshData } from "./mesh";
import { PRESETS } from "./presets";
import { robotParts, to3mf } from "./threemf";

const m = await loadManifold();
afterEach(cleanup);

const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)));

/** Attributes of every `<tag .../>` or `<tag ...>` in `xml`. */
function elements(xml: string, tag: string): Record<string, string>[] {
  return [...xml.matchAll(new RegExp(`<${tag}\\b([^>]*?)/?>`, "g"))].map((e) =>
    Object.fromEntries(
      [...e[1].matchAll(/([\w:]+)="([^"]*)"/g)].map((a) => [
        a[1],
        decode(a[2]),
      ]),
    ),
  );
}

function read(bytes: Uint8Array) {
  const files = unzipSync(bytes);
  const xml = strFromU8(files["3D/3dmodel.model"]);
  const objects = [...xml.matchAll(/<object\b[^>]*>[\s\S]*?<\/object>/g)].map(
    ([body]) => {
      const v = elements(body, "vertex").map((a) => [+a.x, +a.y, +a.z]);
      const t = elements(body, "triangle").map((a) => [+a.v1, +a.v2, +a.v3]);
      // Positive only if triangles wind counter-clockwise seen from outside.
      const volume = t.reduce((sum, [a, b, c]) => {
        const [p, q, r] = [v[a], v[b], v[c]];
        const det =
          p[0] * (q[1] * r[2] - q[2] * r[1]) -
          p[1] * (q[0] * r[2] - q[2] * r[0]) +
          p[2] * (q[0] * r[1] - q[1] * r[0]);
        return sum + det / 6;
      }, 0);
      const xs = v.map((p) => p[0]);
      return {
        attrs: elements(body, "object")[0],
        vertices: v.length,
        triangles: t.length,
        zMin: Math.min(...v.map((p) => p[2])),
        x: [Math.min(...xs), Math.max(...xs)],
        volume,
      };
    },
  );
  const metadata = Object.fromEntries(
    [...xml.matchAll(/<metadata name="([^"]+)">([^<]*)<\/metadata>/g)].map(
      (e) => [e[1], decode(e[2])],
    ),
  );
  return { files, xml, objects, metadata };
}

test("a robot's 3MF holds each part in print pose, named and colored", () => {
  const robot: Robot = {
    ...PRESETS[0],
    name: `Sparky & "Co" <3`,
  };
  const pieces = build(m, robot);
  const { files, xml, objects, metadata } = read(
    to3mf(robotParts(pieces), robot.name),
  );

  expect(Object.keys(files).sort()).toEqual([
    "3D/3dmodel.model",
    "Metadata/model_settings.config",
    "[Content_Types].xml",
    "_rels/.rels",
  ]);
  expect(strFromU8(files["[Content_Types].xml"])).toContain(
    'Extension="config"',
  );
  expect(strFromU8(files["_rels/.rels"])).toContain(
    'Target="/3D/3dmodel.model"',
  );
  const [model] = elements(xml, "model");
  expect(model.unit).toBe("millimeter");
  expect(model.xmlns).toBe(
    "http://schemas.microsoft.com/3dmanufacturing/core/2015/02",
  );
  expect(Object.keys(model).sort()).toEqual(["unit", "xml:lang", "xmlns"]);
  expect(metadata).toEqual({ Title: robot.name });

  const bases = elements(xml, "base");
  expect(elements(xml, "basematerials")).toEqual([{ id: "1" }]);
  expect(bases.map((b) => b.name).sort()).toEqual(
    ["black", "gray", "purple", "yellow"].sort(),
  );
  for (const b of bases) {
    expect(b.displaycolor).toBe(
      COLORS[b.name as keyof typeof COLORS].toUpperCase(),
    );
  }

  // build() places the +x arm and leg first: the robot's left.
  const names = [
    "torso",
    "head",
    "arm-left",
    "arm-right",
    "leg-left",
    "leg-right",
  ];
  expect(objects.map((o) => o.attrs.name)).toEqual(names);
  for (const [i, o] of objects.entries()) {
    const mesh = meshData(pieces[i].print);
    expect(o.attrs.type).toBe("model");
    expect(o.attrs.pid).toBe("1");
    expect(bases[+o.attrs.pindex].name).toBe(pieces[i].color);
    expect(o.vertices).toBe(mesh.positions.length / 3);
    expect(o.triangles).toBe(mesh.indices.length / 3);
    expect(o.zMin).toBe(0);
    expect(o.volume).toBeCloseTo(pieces[i].print.volume(), 0);
  }

  // Orca's per-object settings: every part gets what the joints need.
  const config = strFromU8(files["Metadata/model_settings.config"]);
  const settings = [
    ...config.matchAll(/<object id="(\d+)">([\s\S]*?)<\/object>/g),
  ];
  expect(settings.map((o) => o[1])).toEqual(objects.map((o) => o.attrs.id));
  for (const [i, [, , body]] of settings.entries()) {
    expect(
      Object.fromEntries(
        [...body.matchAll(/key="([^"]+)" value="([^"]*)"/g)].map((e) => [
          e[1],
          e[2],
        ]),
      ),
    ).toEqual({
      name: names[i],
      wall_loops: "4",
      sparse_infill_pattern: "gyroid",
      sparse_infill_density: "20%",
    });
  }

  const items = elements(xml, "item");
  expect(items.map((i) => i.objectid)).toEqual(objects.map((o) => o.attrs.id));
  // Laid out in a row along x, so no two items overlap.
  const spans = items
    .map((item, i) => {
      const [, , , , , , , , , tx, ty, tz] = item.transform
        .split(" ")
        .map(Number);
      expect([ty, tz]).toEqual([0, 0]);
      return objects[i].x.map((x) => x + tx);
    })
    .sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < spans.length; i++) {
    expect(spans[i][0] - spans[i - 1][1]).toBeCloseTo(10, 3);
  }
});
