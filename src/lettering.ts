import type { CrossSection, ManifoldToplevel } from "manifold-3d";
import font from "./font.json";

/** Hershey simplex, "!" to "~": capitals span y 1-22, y down, in font units. */
const CAP = 21;
const MID = 11.5;
/** Advance for spaces and characters the font lacks. */
const GAP = 16;

/** Strokes of `text` as `[x, y][]` polylines in font units, left to right. */
function strokes(text: string): { lines: [number, number][][]; width: number } {
  const lines: [number, number][][] = [];
  let x = 0;
  for (const ch of text) {
    const glyph = (font as [string, number][])[(ch.codePointAt(0) ?? 0) - 33];
    if (!glyph) {
      x += GAP;
      continue;
    }
    const [d, half] = glyph;
    for (const [, op, args] of d.matchAll(/([ML])([^ML]*)/g)) {
      const points = (args.match(/-?[\d.]+/g) ?? []).map(Number);
      const pairs: [number, number][] = [];
      for (let i = 0; i + 1 < points.length; i += 2) {
        pairs.push([x + points[i], points[i + 1]]);
      }
      if (op === "M") lines.push(pairs);
      else lines.at(-1)?.push(...pairs);
    }
    x += 2 * half;
  }
  return { lines, width: x };
}

/**
 * Text as rounded strokes, centered on the origin and y up, at most `maxWidth`
 * wide and `cap` tall; strokes stay `stroke` thick however small the text.
 */
export function lettering(
  m: ManifoldToplevel,
  text: string,
  maxWidth: number,
  cap: number,
  stroke: number,
): CrossSection {
  const { lines, width } = strokes(text);
  const { CrossSection: CS } = m;
  if (!lines.length) return CS.square(0);
  const s = Math.min(cap / CAP, maxWidth / width);
  const dot = CS.circle(stroke / 2, 16);
  const at = ([x, y]: [number, number]) =>
    dot.translate([x * s, (MID - y) * s]);
  const segments = lines.flatMap((line) =>
    line.length === 1
      ? [at(line[0])]
      : line.slice(1).map((p, i) => CS.hull([at(line[i]), at(p)])),
  );
  // Glyphs carry side bearings, so center on the ink.
  const ink = CS.union(segments);
  const { min, max } = ink.bounds();
  return ink.translate([-(min[0] + max[0]) / 2, 0]);
}
