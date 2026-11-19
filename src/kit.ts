import type { Manifold, ManifoldToplevel, Mat4, Vec3 } from "manifold-3d";
import { ARMS } from "./arms";
import { DEPTH, type Slot } from "./depth";
import { HEADS } from "./heads";
import { type Joint, socket, tongue } from "./joints";
import { LEGS } from "./legs";
import { lettering } from "./lettering";
import { shapes } from "./shapes";
import { TORSOS } from "./torsos";

export type { Slot };
/** The PLA colors a part can be; hex values are for the preview. */
export const COLORS = {
  blue: "#3d54aa",
  red: "#e10600",
  yellow: "#f5c400",
  gray: "#8a8f98",
  black: "#26262a",
  white: "#f2f2f2",
  purple: "#7b3fa0",
};
export type Color = keyof typeof COLORS;
export interface Choice {
  kind: string;
  color: Color;
  /** Outline scale; joints keep their size. */
  size?: number;
}
export type Robot = { name: string } & Record<Slot, Choice>;
export const SIZES = { min: 0.85, max: 1.3, step: 0.15 };

/** One printed part: its print-ready solid and where it goes on the robot. */
export interface Piece {
  slot: Slot;
  color: Color;
  print: Manifold;
  toRobot: Mat4;
}

const floor = (slot: Slot) => (DEPTH.torso - DEPTH[slot]) / 2;
const HIP_X = 10;
/** The name is cut this deep into the torso's back, the face on the bed. */
const ENGRAVE = 0.6;
const LEG_HEIGHT = 32;
/** Hands stay this far off the ground. */
const CLEAR = 2;

function faceUp(slot: Slot, x: number, z: number): Mat4 {
  return [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, x, DEPTH[slot] / 2, z, 1];
}

export const KINDS: Record<Slot, string[]> = {
  head: Object.keys(HEADS),
  torso: Object.keys(TORSOS),
  arms: Object.keys(ARMS),
  legs: Object.keys(LEGS),
};

/** A slot's outline scale, clamped to what the joints allow. */
export function sizeOf(choice: Choice): number {
  const s = choice.size ?? 1;
  return Math.round(Math.min(SIZES.max, Math.max(SIZES.min, s)) * 100) / 100;
}

/** Builds every printed part of a robot, placed for display by `toRobot`. */
export function build(m: ManifoldToplevel, robot: Robot): Piece[] {
  for (const slot of Object.keys(KINDS) as Slot[]) {
    if (!KINDS[slot].includes(robot[slot]?.kind)) {
      throw new Error(`unknown ${slot}: ${robot[slot]?.kind}`);
    }
    if (!(robot[slot].color in COLORS)) {
      throw new Error(`unknown color: ${robot[slot].color}`);
    }
  }
  // Bigger legs are longer, not wider, so they always fit between the hips.
  const kit = (slot: Slot) =>
    shapes(m, slot === "legs" ? [1, sizeOf(robot.legs)] : sizeOf(robot[slot]));
  const piece = (slot: Slot, print: Manifold, toRobot: Mat4): Piece => ({
    slot,
    color: robot[slot].color,
    print,
    toRobot,
  });
  const out = (joint: Joint, at: Vec3, dir: Vec3) => tongue(m, joint, at, dir);
  const hole = (slot: Slot, joint: Joint, x: number, y: number, dir: Vec3) =>
    socket(m, joint, [x, y, floor(slot)], dir);

  const legHeight = LEG_HEIGHT * sizeOf(robot.legs);
  const leg = LEGS[robot.legs.kind](kit("legs")).add(
    out("leg", [0, legHeight, 0], [0, 1, 0]),
  );

  const t = TORSOS[robot.torso.kind](kit("torso"));
  const [sx, sy] = t.shoulder;
  const torso = [
    hole("head", "neck", 0, t.height, [0, -1, 0]),
    hole("arms", "arm", sx, sy, [-1, 0, 0]),
    hole("arms", "arm", -sx, sy, [1, 0, 0]),
    hole("legs", "leg", HIP_X, 0, [0, 1, 0]),
    hole("legs", "leg", -HIP_X, 0, [0, 1, 0]),
  ].reduce((s, h) => s.subtract(h), t.solid);
  // Mirrored: the back is printed face down and read from behind.
  const name = lettering(m, robot.name, 1.4 * sx, 9 * sizeOf(robot.torso), 1.4)
    .mirror([1, 0])
    .translate([0, t.height / 2]);
  const engraved = torso.subtract(
    name.extrude(ENGRAVE + 1).translate([0, 0, -1]),
  );

  const head = HEADS[robot.head.kind](kit("head")).add(
    out("neck", [0, 0, 0], [0, -1, 0]),
  );
  const shoulderZ = legHeight + sy;
  // Long arms on a short robot shrink until the hands clear the ground.
  const hanging = ARMS[robot.arms.kind];
  let bare = hanging(kit("arms"));
  const reach = -bare.boundingBox().min[1];
  if (reach > shoulderZ - CLEAR) {
    bare = hanging(
      shapes(m, (sizeOf(robot.arms) * (shoulderZ - CLEAR)) / reach),
    );
  }
  const arm = bare.add(out("arm", [0, 0, 0], [-1, 0, 0]));
  return [
    piece("torso", engraved, faceUp("torso", 0, legHeight)),
    piece("head", head, faceUp("head", 0, legHeight + t.height)),
    piece("arms", arm, faceUp("arms", sx, shoulderZ)),
    piece("arms", arm.mirror([1, 0, 0]), faceUp("arms", -sx, shoulderZ)),
    piece("legs", leg, faceUp("legs", HIP_X, 0)),
    piece("legs", leg, faceUp("legs", -HIP_X, 0)),
  ];
}
