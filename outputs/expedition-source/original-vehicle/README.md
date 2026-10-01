# Expedition 4×4

A standalone, procedural Three.js expedition vehicle based on the supplied vintage 4×4 reference. The body, cabin, engine bay, wheels, cargo and tools are actual 3D geometry. The reference image is not embedded in the model or used as a billboard or texture.

## Open it

Download **Expedition-4x4.html** and double-click it in Chrome or Edge. It contains the complete viewer, Three.js and all procedural assets. No installation, internet connection or local server is required. WebGL 2 must be available.

- Drag to orbit; use the wheel or pinch gesture to zoom.
- Click a panel or its button to open or close it.
- Use the Cabin and Engine bay buttons for close inspection.
- Start engine enables sound after your click. Throttle changes the engine rate; Stop fades and disconnects the sound.

The modular `index.html` is also included. Open it with VS Code Live Server, or run `npm start` / `node serve.mjs` from this folder and visit `http://127.0.0.1:8080`. No npm installation is needed.

## Reuse the object

`vehicle.js` is the entry point. The object includes **no camera, lights, scene, floor, sky, background or interface**. Its host supplies lighting, scene placement and rendering. The floor and environment visible in the viewer belong exclusively to `demo.js`.

The code is tested with **Three.js r180 (0.180.0)**. That version and the needed official helpers are bundled in `vendor/` with their MIT license. Use the same Three.js module throughout your host; avoid loading two different copies.

For a browser using the bundled version, add an import map:

```html
<script type="importmap">
{"imports":{"three":"./vendor/three.module.js"}}
</script>
```

Then:

```js
import { createExpeditionVehicle } from './vehicle.js';

const vehicle = createExpeditionVehicle({ seed: 731 });
scene.add(vehicle.root);
vehicle.root.position.set(0, 0, 0);

// Call this in the host's animation loop, using elapsed seconds.
vehicle.update(deltaSeconds);

vehicle.setOpen('hood', true);
vehicle.setOpen('driver', true);
vehicle.setOpen('passenger', false);
vehicle.toggle('rear');

// Bind start to a user gesture. No audio is created at construction time.
startButton.onclick = () => vehicle.startEngine();
vehicle.setThrottle(0.5); // 0–1
vehicle.stopEngine();

// Await this if you need to wait for the AudioContext to finish closing.
await vehicle.dispose();
```

| API | Behavior |
| --- | --- |
| `root` | Vehicle `THREE.Group`; add to any host scene or parent. |
| `parts` | Named pivot groups: `hood`, `driver`, `passenger`, `rear`. |
| `dimensions` | Computed closed-pose bounding size in metres, including equipment; `bodyWidth` is the nominal body width. |
| `update(seconds)` | Smooth panel animation and hood-support alignment. |
| `setOpen(name, open, { immediate: false })` | Explicit open/close. Use `immediate: true` for pose setup, then `update(0)` to align the support. |
| `toggle(name)` | Toggle the target state of an individual panel. |
| `interactionTargets` | Four moving assemblies suitable for recursive host raycasting. |
| `handleInteraction(hit.object)` | Finds the panel ancestor and toggles it; returns whether a panel was handled. |
| `startEngine()` | Promise resolving to whether audio could start; requires a user gesture for first initialization. |
| `stopEngine()` | Fade, stop and disconnect engine sources. |
| `setThrottle(0…1)` | Smooth rate, filter and noise changes. |
| `getState()` | Panel target/value/angle, engine state, disposal state. |
| `audioDiagnostics()` | Audio lifecycle, active node count and throttle for integration checks. |
| `dispose()` | Remove the root, dispose owned GPU resources, stop audio and close its context. Safe to call again. |

Raycasting example:

```js
const hit = raycaster.intersectObject(vehicle.root, true)[0];
if (hit) vehicle.handleInteraction(hit.object);
```

## Coordinate system and construction

Y is up, +Z is the front, X is left/right. The driver is on +X. The origin is at the ground-level center. The body is about 1.66 m wide; protruding tires, equipment and mirrors increase the overall bounding width. The wheelbase is 2.54 m. The vehicle is approximately 4.6 m long, 2.18 m wide including mirrors, and 2.29 m tall with equipment.

Doors open outward approximately 71°, the hood rises approximately 65°, and the rear access door swings outward approximately 83°. Glass, trim and mirrors move with their doors. The rear spare, pouch and carrier move with the rear door. The hood carries its own skin and braces, with a separately articulated telescoping support.

Paint and hardware use standard PBR materials with stable r180 shader hooks for layered weathering. Closed-pose geometry attributes keep the paint chips anchored as panels move. Small transparent surfaces remain separate; opaque geometry is batched by material within each moving assembly. Repeated tread blocks and fasteners use instancing.

All label, gauge, vinyl and splatter textures are generated locally with Canvas. The engine is synthesized with starter-crank noise, uneven combustion pulses, resonant exhaust, sub-bass and filtered mechanical noise. No reference photographs, third-party vehicle meshes, HDRI downloads or audio recordings are required.

## Files created

| File | Purpose |
| --- | --- |
| `Expedition-4x4.html` | Self-contained offline viewer. |
| `vehicle.js` | Body, pivots, resource ownership and public API. |
| `exterior.js` | Wheels, tread, spare, chassis, hardware, tools, rack, cargo and lamps. |
| `interior.js` | Dashboard, gauge textures, seats, door cards, floor, rear cabin and engine bay. |
| `weathering.js` | Paint, edge chips, rust, grime, rubber wear, canvas weave and mud splashes. |
| `batching.js` | Geometry batching that preserves articulated ownership. |
| `engine-audio.js` | User-initiated synthesized engine and audio lifecycle. |
| `demo.js`, `index.html`, `style.css` | Separate viewer environment, camera and controls. |
| `serve.mjs`, `package.json` | Optional dependency-free local preview workflow and syntax check command. |
| `vendor/` | Bundled Three.js r180 and official helpers/license. |
| `checks/` | Final rendered views and machine-readable verification results. |

## Verification

The vehicle was run and rendered with local Chrome 131 / WebGL 2 through software rendering, using Three.js r180. Front three-quarter, side and rear three-quarter views were inspected during body, equipment, material and final phases. The cabin was inspected through closed glass and through the open driver door. The open engine bay, all doors, rear cargo access and spare carrier were inspected.

Three repeated open/close cycles per panel preserved hinge positions, opening direction and eased motion. Final controls and raycasting hooks were exercised after opaque geometry was batched. The standalone HTML was loaded directly from disk and made **zero network requests**. The 390 × 844 mobile view was inspected and has no horizontal page overflow; its camera fits the complete vehicle.

The final front view rendered about **133,420 triangles and 105 draw calls**, including the demo floor. View-dependent culling changes these counts. There were no JavaScript console errors or WebGL shader errors in the final checks. The vehicle root contains zero lights and zero cameras.

Audio checks used actual button gestures and a live Web Audio analyser. Before starting, the AudioContext did not exist. Idle and rev produced nonzero output; rev changed the playback rate and intensity. Stopping produced zero measured output and left zero active sources. Disposal closed the AudioContext. See `checks/audio-results.json` for measured output and lifecycle states.

**Not performed:** subjective listening to judge engine timbre, testing on physical Windows/Android hardware, GPU frame-rate benchmarking, or verification with Three.js versions other than r180. The model is a procedural interpretation of the reference, not a scanned or mechanically exact vehicle.
