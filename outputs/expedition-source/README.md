# Expedition — Wildhaven Valley

Open Expedition-Wildhaven.html in a modern browser with WebGL enabled. Everything is bundled locally: no downloads, CDN, account, or build step is needed to play.

## Controls

- W/A/S/D or arrows: walk / drive. On foot movement follows the camera.
- Shift: run. Space: jump on foot / handbrake when driving.
- Drag the scene: rotate camera. Mouse wheel: zoom.
- E: enter near the driver's door, or exit when stopped.
- C: chase / cockpit camera while driving.
- M: toggle engine audio. L: daylight / golden-hour lighting.
- R: return to base camp. Exploration discoveries remain for this play session.
- Touch devices: joystick, run/brake and contextual enter/exit buttons. Jump is keyboard-only.

Visit Mirror Spring, Ranger Lookout and South Pass; their amber minimap dots turn green when discovered. This is a small stylized exploration sandbox, not a vehicle physics simulator. The lake is a blocked shoreline; the lookout is a scenic landmark rather than a climbable structure. Progress resets when the page reloads.

Mirror Spring uses a recessed basin and an irregular terrain-clipped water surface. Subtle animated lighting supplies ripples while the waterline remains level. Walking and vehicle boundaries follow the dry bank; the water has no exposed cylindrical rim. The east-bank boardwalk is supported, with foot height matching its deck.

## Source

- `base.html`: user's original bundled Highland Trail scene, character and Jeep; retained as the foundation.
- `valley.js`: readable additions for forest, lake, mountains, landmarks, discoveries and environment lighting. It executes inside the existing bundle and uses an alias table for the bundled Three.js classes.
- `motion.js`: phased entry/exit choreography, contact targets, grounded jump anticipation, airborne inertia and landing recovery.
- `polish.css`: updated interface styling.
- `human-runtime.js`: skinned human loader, blended idle/walk/run, fitted driving pose and two-bone foot/hand IK.
- `human-runtime.bundle.js`: bundled Three.js r180 loader and animation runtime. To rebuild after editing the runtime, run `npm install` then `npm run build:human`.
- `ranger.glb`: textured, 80-bone human with three baked animation clips, prepared in Blender.
- `Ranger.blend`: editable character, packed textures, rig and baked actions.
- `build.py`: dependency-free offline assembly using the bundled runtime and embedded GLB. Run `python build.py` to write `Expedition-Wildhaven.html` here.
- `original-vehicle/`: the user's original modular vehicle source, including its bundled Three.js vendor files and license.
- `checks.js`: browser integration checks; `checks.html` runs these against the final game and displays results.

The Jeep geometry, interior, articulated doors, wheels and engine audio remain from the supplied project. The original primitive character has been replaced with Microsoft Rocketbox's Wood_Male_01, prepared using the installed Blender 5.2. Textures, geometry, 80-bone rig, and retargeted Idle/Walk/Run motion are embedded in the offline HTML. See ASSET-CREDITS.md and ROCKETBOX-LICENSE.md.

## Verification

Thirty-two browser integration checks passed for the loaded human rig, anatomical orientation, run selection, movement, driver-door reachability, jump/landing, seated attachment and knee pose, driving, moving-exit prevention, cockpit camera, braking, exit, post-exit walking, lighting and reset. The face, clothing, driving pose, airborne pose, and entry/exit stages were visually inspected in the Codex browser. The movement checks also cover planted feet during anticipation, door clearance before climbing, airborne entry prevention, and reset pose restoration. Synthetic tests do not validate audible playback; audio remains dependent on browser user activation. Terrain and obstacle handling use simplified collision shapes.

The human loader uses a second isolated Three.js r180 bundle alongside the supplied game bundle. The browser may log Three.js's duplicate-instance warning; both builds use the same revision and rendering/animation passed the integration checks. No runtime network requests are needed.

Entry now walks to the door, reaches for the handle, waits for clearance, steps onto the sill, ducks and turns into the seat. Exit reverses the climbing sequence. Jumping has a brief preparation crouch, knee tuck, gravity and momentum, then a landing crouch. These are procedural adaptations of the existing rig; Idle/Walk/Run retain the baked source animations.

The limb solver aligns the complete knee/elbow hinge plane to avoid axial twisting. Knee flexion is limited to 125 degrees; foot targets remain within a reachable forward corridor. Elbow poles point down beside the torso. The same solver is used for legs when seated, entering, exiting and jumping. Jump arms use a relaxed joint-driven swing instead of hand targets, retaining the original wrist rotations and blending through takeoff and landing. Checks sample knee direction and flexion throughout both vehicle transitions and verify jump elbow position.
