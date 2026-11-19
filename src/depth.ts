export type Slot = "head" | "torso" | "arms" | "legs";

/**
 * Every part prints face up: print x, y are the robot's x and up, and print z
 * runs from the part's back (on the bed) to its front. Parts are centered
 * front to back on the robot, so sockets sit as far above the torso's back as
 * each part's back is in front of it.
 */
export const DEPTH: Record<Slot, number> = {
  head: 22,
  torso: 26,
  arms: 16,
  legs: 18,
};
