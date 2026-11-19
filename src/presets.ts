import { type Color, COLORS, KINDS, type Robot, type Slot } from "./kit";

/** Robots to start from. */
export const PRESETS: Robot[] = [
  {
    name: "Sparky",
    head: { kind: "box", color: "yellow" },
    torso: { kind: "box", color: "purple" },
    arms: { kind: "tube", color: "gray" },
    legs: { kind: "boots", color: "black" },
  },
  {
    name: "Bolt",
    head: { kind: "dome", color: "blue" },
    torso: { kind: "barrel", color: "red" },
    arms: { kind: "claw", color: "blue" },
    legs: { kind: "pistons", color: "red" },
  },
  {
    name: "Tank",
    head: { kind: "tv", color: "red" },
    torso: { kind: "chunky", color: "blue" },
    arms: { kind: "hammer", color: "red" },
    legs: { kind: "treads", color: "blue" },
  },
  {
    name: "Kitty",
    head: { kind: "cat", color: "purple" },
    torso: { kind: "star", color: "yellow" },
    arms: { kind: "rocket", color: "white" },
    legs: { kind: "springs", color: "purple" },
  },
  {
    name: "Digger",
    head: { kind: "cyclops", color: "yellow" },
    torso: { kind: "screen", color: "gray" },
    arms: { kind: "drill", color: "black", size: 1.15 },
    legs: { kind: "thrusters", color: "red" },
  },
  {
    name: "Hoot",
    head: { kind: "owl", color: "purple" },
    torso: { kind: "gears", color: "gray" },
    arms: { kind: "wing", color: "purple" },
    legs: { kind: "talons", color: "yellow" },
  },
  {
    name: "Lancelot",
    head: { kind: "knight", color: "gray" },
    torso: { kind: "shield", color: "blue" },
    arms: { kind: "sword", color: "gray" },
    legs: { kind: "stompers", color: "blue" },
  },
];

const NAMES = [
  "Beep",
  "Bolt",
  "Boomer",
  "Bubbles",
  "Chip",
  "Clank",
  "Cosmo",
  "Dash",
  "Dot",
  "Fizz",
  "Gizmo",
  "Jet",
  "Nova",
  "Pip",
  "Rex",
  "Rusty",
  "Sprocket",
  "Tinker",
  "Turbo",
  "Widget",
  "Zap",
  "Zippy",
];

/** A robot with every part, color and name picked at random. */
export function randomRobot(): Robot {
  const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
  const colors = Object.keys(COLORS) as Color[];
  return {
    name: pick(NAMES),
    ...(Object.fromEntries(
      (Object.keys(KINDS) as Slot[]).map((s) => [
        s,
        { kind: pick(KINDS[s]), color: pick(colors) },
      ]),
    ) as Pick<Robot, Slot>),
  };
}
