import { expect, test } from "bun:test";
import type { Robot } from "./kit";
import { fromQuery, toQuery } from "./link";

const kitty: Robot = {
  name: "Kitty & Co",
  head: { kind: "cat", color: "purple" },
  torso: { kind: "star", color: "yellow", size: 1.15 },
  arms: { kind: "rocket", color: "white", size: 0.85 },
  legs: { kind: "springs", color: "purple", size: 1 },
};

test("a robot survives the trip through a link", () => {
  const back = fromQuery(new URLSearchParams(toQuery(kitty)));
  expect(back).toEqual({
    ...kitty,
    legs: { kind: "springs", color: "purple" },
  });
});

test("links stay short and readable", () => {
  expect(toQuery(kitty)).toBe(
    "name=Kitty+%26+Co&head=cat-purple&torso=star-yellow-115&arms=rocket-white-85&legs=springs-purple",
  );
});

test("a link without parts has no robot", () => {
  expect(fromQuery(new URLSearchParams("tv=1"))).toBeUndefined();
});

test("missing parts fall back to the first style in blue", () => {
  const r = fromQuery(new URLSearchParams("head=cat-red"));
  expect(r?.name).toBe("");
  expect(r?.head).toEqual({ kind: "cat", color: "red" });
  expect(r?.legs).toEqual({ kind: "boots", color: "blue" });
});

test("garbled parts pass through for the builder to reject", () => {
  const r = fromQuery(new URLSearchParams("arms=noodle-pink-abc"));
  expect(r?.arms as object).toEqual({ kind: "noodle", color: "pink" });
});
