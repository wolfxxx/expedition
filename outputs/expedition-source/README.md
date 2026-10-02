# Expedition — Wildhaven Valley

Open Expedition-Wildhaven.html in a modern browser with WebGL enabled. Everything is bundled locally: no downloads, CDN, account, or build step is needed to play.

## Controls

- W/A/S/D or arrows: walk / drive. On foot movement follows the camera.
- Shift: run. Space: jump on foot / handbrake when driving.
- Drag the scene: rotate camera. Mouse wheel: zoom.
- E: enter near the driver's door, or exit when stopped.
- C: chase / cockpit camera while driving.
- M: toggle all game audio. L: daylight / golden-hour lighting.
- R: return to base camp. Exploration discoveries remain for this play session.
- Touch devices: joystick, run/brake and contextual enter/exit buttons. Jump is keyboard-only.

Visit Mirror Spring, Ranger Lookout and South Pass; their amber minimap dots turn green when discovered. This is a small stylized exploration sandbox, not a vehicle physics simulator. The spring is walkable and drivable along its sloped lakebed; the lookout has climbable stairs, a walkable deck and clearance underneath. Progress resets when the page reloads.

Mirror Spring uses a recessed basin and an irregular terrain-clipped water surface. Subtle animated lighting supplies ripples while the waterline remains level. Walking and driving follow the lakebed through the water; the water has no exposed cylindrical rim. The east-bank boardwalk is supported, with foot height matching its deck.

## Source

- `base.html`: user's original bundled Highland Trail scene, character and Jeep; retained as the foundation.
- `valley.js`: readable additions for forest, lake, mountains, landmarks, discoveries and environment lighting. It executes inside the existing bundle and uses an alias table for the bundled Three.js classes.
- `motion.js`: phased entry/exit choreography, contact targets, grounded jump anticipation, airborne inertia and landing recovery.
- `world-audio.js`: offline wind, birds, proximity-based lake ambience, footsteps, takeoff and landing sounds; shares the existing mute control.
- `lookout.js`: stair/deck support surfaces, height-aware pedestrian collision, posts and guardrails.
- `stair-motion.js`: smooth rendered character elevation over discrete stair collisions.
- `camera.js`: smooth pedestrian aiming height and continuous stair-height camera tracking.
- `polish.css`: updated interface styling.
- `human-runtime.js`: skinned human loader, blended idle/walk/run, fitted driving pose and two-bone foot/hand IK.
- `human-runtime.bundle.js`: bundled Three.js r180 loader and animation runtime. To rebuild after editing the runtime, run `npm install` then `npm run build:human`.
- `ranger.glb`: textured, 80-bone human with three baked animation clips, prepared in Blender.
- `Ranger.blend`: editable character, packed textures, rig and baked actions.
- `build.py`: dependency-free offline assembly using the bundled runtime and embedded GLB. Run `python build.py` to write `Expedition-Wildhaven.html` here.
- `original-vehicle/`: the user's original modular vehicle source, including its bundled Three.js vendor files and license.
- `checks.js`: browser integration checks; `checks.html` runs these against the final game and displays results.

The Jeep geometry, interior, articulated doors, wheels remain from the supplied project. The original primitive character has been replaced with Microsoft Rocketbox's Wood_Male_01, prepared using the installed Blender 5.2. Textures, geometry, 80-bone rig, and retargeted Idle/Walk/Run motion are embedded in the offline HTML. See ASSET-CREDITS.md and ROCKETBOX-LICENSE.md.

## Verification

Forty browser integration checks passed for the loaded human rig, anatomical orientation, run selection, movement, driver-door reachability, jump/landing, seated attachment and knee pose, driving, moving-exit prevention, cockpit camera, braking, exit, post-exit walking, lighting and reset. The face, clothing, driving pose, airborne pose, and entry/exit stages were visually inspected in the Codex browser. The movement checks also cover planted feet during anticipation, door clearance before climbing, airborne entry prevention, and reset pose restoration. Synthetic tests do not validate audible playback; audio remains dependent on browser user activation. Terrain and obstacle handling use simplified collision shapes.

The human loader uses a second isolated Three.js r180 bundle alongside the supplied game bundle. The browser may log Three.js's duplicate-instance warning; both builds use the same revision and rendering/animation passed the integration checks. No runtime network requests are needed.

Entry now walks to the door, reaches for the handle, waits for clearance, steps onto the sill, ducks and turns into the seat. Exit reverses the climbing sequence. Jumping has a brief preparation crouch, knee tuck, gravity and momentum, then a landing crouch. These are procedural adaptations of the existing rig; Idle/Walk/Run retain the baked source animations.

The limb solver aligns the complete knee/elbow hinge plane to avoid axial twisting. Knee flexion is limited to 125 degrees; foot targets remain within a reachable forward corridor. Elbow poles point down beside the torso. The same solver is used for legs when seated, entering, exiting and jumping. Jump arms use a relaxed joint-driven swing instead of hand targets, retaining the original wrist rotations and blending through takeoff and landing. Checks sample knee direction and flexion throughout both vehicle transitions and verify jump elbow position.

World audio begins on the first click or keypress. All ambience and movement sounds are synthesized locally using Web Audio. Wind varies gently, birds call occasionally, and water becomes louder near the lake. Footstep timing follows the low point of each animated foot after its downward swing, with separate left/right contact detection; footsteps stop during jumping and vehicle use. The sound button and M key mute both the Jeep and world audio.

After building, open `audio-checks.html` and activate **Test world audio** to check browser audio unlock, audible signal, footstep/jump/landing events, and shared mute/unmute. This test requires an actual click or keyboard activation.

Lookout traversal: walk or run up the stairs normally. The deck has guardrails and a stair opening. Return down the stairs or pass beneath the raised deck at ground level. Sixteen dedicated placement, traversal, character-motion and camera checks cover ascent, descent, under-deck passage, rails, ceiling clearance, running, and landing after jumping on the deck. `lookout-checks.html` runs these checks after building.

Spring traversal: `spring-checks.html` verifies walking in and out, lakebed support, driving across the spring, and exiting/re-entering a stopped Jeep in the water. All seven checks passed.

## Jeep driving update

The Jeep now has stronger acceleration (0–60 km/h in approximately 2.3 seconds on unobstructed terrain), a 97 km/h forward limit, five automatic gears, quicker steering, stronger braking and a gradual speed-sensitive camera field of view. Short collision sweeps prevent fast movement from skipping thin obstacles.

`driving.js` supplies handling, automatic shifting, RPM display and camera response. `engine-audio.js` replaces the original engine synth with deeper six-cylinder combustion pulses: RPM controls pitch independently of throttle, while load changes exhaust brightness, intake noise and volume. Gear changes briefly unload the engine and drop RPM. Everything remains offline.

`driving-checks.html` is generated by the build. It checks acceleration, gearing, braking, reverse, swept collision and reset, then offers a button to test the engine audio signal and node cleanup. All 11 checks and the 40 gameplay checks passed. Audio signal tests verify output and modulation, not subjective sound quality.

The lookout sits in a clearing inside the north-east road loop at (18, 35). Its entire deck, stairs and approach remain more than 6.6 metres from the road centreline. Trees and rocks are excluded from the clearing; the discovery marker follows the new position.

## Mosswick, the poison dwarf

An original stylized alchemist roams the valley independently. Look near base camp on startup, or follow the bright green minimap dot. His hood, beard, leather equipment, luminous potion bottles, staff and drifting motes are built from local geometry in `poison-dwarf.js`; no asset downloads are required. He pauses between destinations, animates his short-legged gait, and avoids obstacles, steep ledges, deep water, the lookout and nearby player/Jeep positions. He roams peacefully until hit; there is no dialogue system.

`dwarf-checks.html` simulates three minutes of roaming and verifies distance travelled, terrain support, obstacle clearance, dry routes and continuous movement. Five roaming checks and all forty gameplay checks passed.

## Punching

Left-click the game view while on foot to punch toward the camera heading. Dragging still rotates the camera. Each swing has a 0.52-second cooldown and applies damage once at impact, within 1.5 metres and in front of the player. Mosswick has 100 health, takes 25 damage per hit, flinches and flashes on contact, and falls unconscious after four hits. A nearby health bar shows his condition. R restores his health. Punching is disabled while jumping or using the Jeep. Eighteen combat, animation and sound checks and forty gameplay checks pass. `combat.js` implements input, animation blending, hit detection and health display; `combat-checks.html` is generated by the build.

Punch animation uses a drawn-back fist, a 70 ms forward strike, torso rotation, shoulder drive and a blended recovery. Swing whooshes and impact thumps run through the shared world-audio mute control. Combat checks include forward fist travel, shoulder movement, audio output after user activation and mute behavior.
