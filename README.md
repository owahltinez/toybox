# toybox

A robot construction kit for designing a toy with a kid and 3D printing it in
PLA: https://owahltinez.github.io/toybox. A robot is a choice of head, torso,
arms and legs, each a hand-designed part in one color, that print without
supports and snap together.

## Layout

- `src/kit.ts`: assembles a robot: sizes, joints and where each part goes
- `src/heads.ts`, `src/torsos.ts`, `src/arms.ts`, `src/legs.ts`: ten styles of
  each part
- `src/joints.ts`: tongues and sockets
- `src/shapes.ts`: 2D outlines and layer-built slabs
- `src/mesh.ts`: manifold-3d loading and mesh copies
- `src/threemf.ts`: the 3MF download: parts, colors and per-object Orca settings
- `src/server.ts`: serves the build locally
- `src/link.ts`: robots as shareable URL parameters
- `src/presets.ts`: example robots and the random one
- `web/`: mancha + three.js viewer with part, size and color controls; works on phones; `?tv=1` hides the controls (or press E)
- `web/public/`: icon, PWA manifest and service worker (network first, cached
  for offline); the PNG icons are renders of `icon.svg`

## Links

The address bar always holds the robot, so any link shares it:
`?name=Kitty&head=cat-purple&torso=star-yellow-115&arms=rocket-white&legs=springs-purple`
(style, color, then size in % unless 100). A link without parts starts with a
random robot.

## How parts print

- Every part prints face up as a 2.5D slab: its front outline extruded from
  its back (on the bed), with a 45° chamfer at the bed, rounded top edges, and
  raised or recessed details on top. Built from layer-height slices, so no
  layer overhangs the one below. `toRobot` places each part on the robot.
- Joints (`src/joints.ts`) are tongues molded onto the head, arms and legs,
  sliding into sockets in the torso. The key is a house shape: flat on the bed,
  45° roof up, so tongues print with layers along their length. Each joint has
  its own key shape, so a part fits only its own socket and only one way up;
  mirrored arms can't swap sides. Crush ribs give a snug fit in PLA without
  wedging, and the tongue root flares to spread the load.
- Sizes (85-130%) scale outlines, never joints; legs only get longer, so they
  always fit between the hips. Long arms on a short robot shrink until the
  hands clear the ground.
- `src/slicer.test.ts` slices every part at every size with OrcaSlicer's auto
  supports on and fails if it would add any. It runs where OrcaSlicer and the
  `kobra-slice` script sit next to this repo, and is skipped elsewhere.

## Printing

Press Download in the app for `<robot>.3mf`, a plain core-spec 3MF:

- one object per part, already in print pose, named `torso`, `head`,
  `arm-left`...
- each object's color as a `basematerials` entry: palette name and hex
- the settings the joints need (4 walls, 20% gyroid) per object in
  `Metadata/model_settings.config`. 3MF has no standard place for slicer
  settings; OrcaSlicer and Anycubic Slicer Next read this file (Bambu Studio
  shares the format), other slicers use their defaults.

Map each color to a loaded filament and print the parts one at a time, so
filament only changes between parts.

## Commands

```sh
bun install
bun run test    # the slicer check runs only where OrcaSlicer is set up
bun start       # http://localhost:4180
```

Pushes to `main` test, build and publish to GitHub Pages.
