# Expedition — Wildhaven Valley

A playable Three.js exploration world with a drivable Jeep, a rigged human character, forest trails, mountains, and a lake.

## Play

Download this repository and open `outputs/Expedition-Wildhaven.html` in a browser with WebGL enabled. The game is self-contained and works offline.

- **WASD / arrows:** walk or drive
- **Shift:** run
- **Space:** jump on foot, handbrake while driving
- **E:** enter or exit the Jeep
- **Drag / scroll:** look around / zoom
- **C:** driving camera; **L:** lighting; **M:** sound; **R:** reset

## Edit and build

Editable code, the character GLB, Blender scene, credits, and validation results are in [`outputs/expedition-source`](outputs/expedition-source/README.md).

From that directory:

```sh
npm install
npm run build:human
python build.py
```

The build writes `Expedition-Wildhaven.html` and `checks.html` in the source directory. Copy the generated game to `outputs/Expedition-Wildhaven.html` when preparing a release. Open `checks.html` to run the browser integration checks.

`Ranger.blend` contains the editable character. Asset origins and third-party licenses are preserved in the source directory. The original supplied vehicle source is under `original-vehicle`.
