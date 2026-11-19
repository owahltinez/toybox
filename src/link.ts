import { type Choice, type Color, KINDS, type Robot, type Slot } from "./kit";

const SLOTS = Object.keys(KINDS) as Slot[];

/** A robot as URL parameters: `head=cat-purple`, plus the size in % unless 100. */
export function toQuery(robot: Robot): string {
  const params = new URLSearchParams({ name: robot.name });
  for (const slot of SLOTS) {
    const { kind, color, size = 1 } = robot[slot];
    const pct = Math.round(size * 100);
    params.set(slot, [kind, color, ...(pct === 100 ? [] : [pct])].join("-"));
  }
  return params.toString();
}

/** The robot in a link, if it names any part; `build` validates the rest. */
export function fromQuery(params: URLSearchParams): Robot | undefined {
  if (!SLOTS.some((s) => params.has(s))) return undefined;
  const choice = (slot: Slot): Choice => {
    const [kind = KINDS[slot][0], color = "blue", pct] = (
      params.get(slot) ?? ""
    )
      .split("-")
      .map((s) => s || undefined);
    const size = Number(pct) / 100;
    return {
      kind,
      color: color as Color,
      ...(size > 0 && size !== 1 ? { size } : {}),
    };
  };
  return {
    name: params.get("name") ?? "",
    ...(Object.fromEntries(SLOTS.map((s) => [s, choice(s)])) as Record<
      Slot,
      Choice
    >),
  };
}
