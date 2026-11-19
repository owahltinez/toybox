import { strToU8, zipSync } from "fflate";
import { type Color, COLORS, type Piece } from "./kit";
import { type MeshData, meshData } from "./mesh";

/** One object in a 3MF: a name unique in the file, its print-pose mesh and its color. */
export interface Part {
  name: string;
  mesh: MeshData;
  color: Color;
}

// Sturdy PLA: strength comes from walls, so tongues end up solid. Written as
// Orca per-object settings: 3MF has no standard place for slicer settings.
const SETTINGS = {
  wall_loops: "4",
  sparse_infill_pattern: "gyroid",
  sparse_infill_density: "20%",
};
/** Space between parts in the build's row. */
const GAP = 10;

const TYPES = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
<Default Extension="config" ContentType="application/xml"/>
</Types>`;
const RELS = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

const xml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
// Nine significant digits round-trip a float32 exactly.
const num = (v: number) => String(Number(v.toPrecision(9)));

/** A robot's parts, named by slot and side; x > 0 on the robot is its left. */
export function robotParts(pieces: Piece[]): Part[] {
  return pieces.map((p) => {
    const x = p.toRobot[12];
    const side = x > 0 ? "-left" : x < 0 ? "-right" : "";
    return {
      name: p.slot.replace(/s$/, "") + side,
      mesh: meshData(p.print),
      color: p.color,
    };
  });
}

/** Packs parts into a core-spec 3MF, plus the Orca settings the joints need. */
export function to3mf(parts: Part[], title: string): Uint8Array {
  const colors = [...new Set(parts.map((p) => p.color))];
  const out = [
    `<?xml version="1.0" encoding="UTF-8"?>
<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">`,
    `<metadata name="Title">${xml(title)}</metadata>`,
    "<resources>",
    '<basematerials id="1">',
    ...colors.map(
      (c) => `<base name="${c}" displaycolor="${COLORS[c].toUpperCase()}"/>`,
    ),
    "</basematerials>",
  ];
  const items: string[] = [];
  const config = ['<?xml version="1.0" encoding="UTF-8"?>', "<config>"];
  let cursor = 0;
  for (const [i, { name, mesh, color }] of parts.entries()) {
    const { positions: p, indices: t } = mesh;
    const id = i + 2;
    out.push(
      `<object id="${id}" type="model" name="${xml(name)}" pid="1" pindex="${colors.indexOf(color)}"><mesh><vertices>`,
    );
    let [minX, maxX] = [Infinity, -Infinity];
    for (let j = 0; j < p.length; j += 3) {
      minX = Math.min(minX, p[j]);
      maxX = Math.max(maxX, p[j]);
      out.push(
        `<vertex x="${num(p[j])}" y="${num(p[j + 1])}" z="${num(p[j + 2])}"/>`,
      );
    }
    out.push("</vertices><triangles>");
    for (let j = 0; j < t.length; j += 3) {
      out.push(`<triangle v1="${t[j]}" v2="${t[j + 1]}" v3="${t[j + 2]}"/>`);
    }
    out.push("</triangles></mesh></object>");
    items.push(
      `<item objectid="${id}" transform="1 0 0 0 1 0 0 0 1 ${num(cursor - minX)} 0 0"/>`,
    );
    cursor += maxX - minX + GAP;
    config.push(
      `<object id="${id}">`,
      ...Object.entries({ name, ...SETTINGS }).map(
        ([k, v]) => `<metadata key="${k}" value="${xml(v)}"/>`,
      ),
      "</object>",
    );
  }
  config.push("</config>");
  out.push("</resources>", "<build>", ...items, "</build>", "</model>");
  return zipSync({
    "[Content_Types].xml": strToU8(TYPES),
    "_rels/.rels": strToU8(RELS),
    "3D/3dmodel.model": strToU8(out.join("\n")),
    "Metadata/model_settings.config": strToU8(config.join("\n")),
  });
}
