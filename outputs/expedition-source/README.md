# Expedition — Wildhaven Valley

Open Expedition-Wildhaven.html in a modern browser with WebGL enabled. Everything is bundled locally: no downloads, CDN, account, or build step is needed to play.

## Controls

- W/A/S/D or arrows: walk / drive. On foot movement follows the camera.
- Shift: run. Space: jump on foot / handbrake when driving.
- Mouse: your first key press (or click) captures it, then move it to rotate the camera with no button held; Esc frees the cursor and a click takes it back (dragging still rotates the camera while it is free). Mouse wheel: zoom.
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

Entry now walks to the door, reaches for the handle, waits for clearance, steps onto the sill, ducks and turns into the seat. Exit reverses the climbing sequence. Jumping (`jumpPose` in `motion.js`): a 0.16 s crouch with the torso leaning in and the arms swung back; a push-off through straight legs while the arms are thrown forward and up; a mid-air tuck with one knee drawn up and the other heel trailing back, feet relaxed so the toes follow the shins; legs reaching for the ground before touchdown; then a 0.32 s landing that dips fast, absorbs with a forward lean and arms out, and recovers. Gravity and momentum are unchanged. These are procedural adaptations of the existing rig; Idle/Walk/Run retain the baked source animations.

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

Left-click the game view while on foot to punch toward the camera heading. With the mouse captured a press punches at once; with a free cursor a quick click (not a drag) does. Clicks alternate between a right cross and a left jab. A swing lasts 0.46 s plus a 50 ms hit-pause on contact, and damage is applied once at impact (0.19 s), within 1.5 metres and in front of the player. Mosswick has 100 health and takes 25 damage per hit, so four hits knock him unconscious. R restores his health. Punching is disabled while jumping, driving or on the rifle.

The motion (`combat.js`, `punchPose`; the strike accelerates into the target, the fist travels in a slight arc, and the striking shoulder drives forward while the other pulls back): the player drops into a staggered boxing stance with knees bent and both fists up in guard. The striking hand coils back, then the hips, spine and shoulder rotate into the blow while the fist travels to Mosswick's chest (or straight ahead and slightly across if nobody is in range). The player steps in just far enough that the fist arrives, never closer than about a metre, so a punch that lands never looks short. After contact there is a brief hit-pause and a small camera jolt, then the fist returns to guard. If the player is moving when the punch starts, only the upper body animates and the legs keep walking.

Mosswick reacts physically: he is shoved about a quarter of a metre away from the blow (never into trees, water or a steep drop), his upper body whips away from it, he flashes red and he pauses before walking on. Swing whooshes and impact thumps run through the shared world-audio mute control.

`human-runtime.js` provides what the motion needs: `hipTwist`, a two-handed `fist` curl, `free` foot placement without the jump clamps, and shoulder-relative hand targets (`relative`, `strike` with a `reach` limit) that follow the lean, drop and twist. `combat-checks.html` (generated by the build) runs 16 combat, animation and sound checks.

## Lookout rifle

The user-supplied `heavy_sniper_rifle.glb` stands on its bipod at the centre of the lookout deck, resting aimed down the valley towards Mirror Spring. Walk up beside it and press **E** (or the on-screen prompt) to lie down behind it.

- **Aim:** move the mouse; it is captured when you lie down, so no button needs holding (press Esc to free the cursor, click to capture it again). If the browser declines, dragging still aims, and W/A/S/D always works. Aim is limited to 31 degrees below and 20 degrees above the horizon.
- **Fire:** left-click or Space. It is a bolt action: 1.6 seconds between shots. A hit takes 50 health from Mosswick (two shots knock him out); trees, rocks and the ground stop the bullet. The shot has a muzzle flash, tracer, recoil, a distance-delayed impact sound and valley echoes.
- **Scope:** Z or right-click toggles a 6x scope with a reticle, and the mouse wheel zooms between 3x and 16x. Aim sensitivity falls as you zoom. The range to whatever is under the crosshair is shown.
- **Get up:** E. R also resets. Touch players get Scope, Fire and Get up buttons.

The rifle pivots about its butt, and the lying shooter swings around it. With the feet 1.37 m behind the butt the body stays within 1.3 m of the deck centre at every heading, inside the 1.6 m clear half-width of the rails (`rifle-checks.js` verifies this at 24 headings). Looking south along the stairs the handrails can block the scope; the other directions are open.

`lookout-rifle.js` holds the mounting sequence, aiming, camera, ballistics and effects, and the tuning constants (`RIFLE`) at its top: heading, damage, bolt time, body offsets and hand targets. The hands are posed deliberately: the right hand wraps the pistol grip in a handshake grip (fingers along the rifle, thumb up, fingers curled), and the left hand cups the underside of the stock near the butt with its palm up (`RIFLE.right` / `RIFLE.left` are the wrist targets, in rifle coordinates). `human-runtime.js` gained a `prone` pose (body tipped flat, head and neck propped up, feet relaxed), a per-hand elbow pole and `orient` (turn a hand so its fingers and palm face given directions, using the skeleton's own finger axes); rebuild the bundle with `npm run build:human`. `world-audio.js` synthesizes the shot, bolt and impact. Jumping, punching and footsteps are disabled while on the rifle.

`rifle-checks.html` (generated by the build) runs 36 checks: reach and prompt, getting down, fit at every heading, flat on the deck, aim limits, click/drag/scope input, bolt cycle, hits, occlusion, ground and sky shots, getting up, and reset. All pass. Run any check page headlessly with `node run-checks.mjs rifle-checks.html rifle-results` (needs Chrome or Edge, no install).

## Running Mosswick over

Drive the Jeep into Mosswick at more than 2 m/s (forwards or in reverse) and he is launched, tumbling, in a burst of shattered potions. A creep, a parked Jeep or a near miss does nothing.

- **Flight:** the harder the hit, the further he goes. He is thrown along the Jeep's travel at 1.25 times its speed plus 2 m/s, and up at 5 m/s plus 0.45 times its speed, sideways if you clip him, and spins about the middle of his body under gravity; the landing is kept inside the map. Measured on the ground from where he was hit: about 7 m for a bump at 14 km/h, 19 m at 30 km/h, 37 m at 47 km/h, 59 m at 68 km/h and 65 to 70 m at 92 to 97 km/h. He bounces up to three times, slumps and lies where he lands.
- **Debris:** his staff, four glowing bottles and scraps of coat fly off and bounce; 34 green glass shards spray out; green smoke puffs and a ring of poison spreads over the ground at the impact and at each bounce. Everything clears itself within four seconds.
- **Flight report:** when he comes to rest, a panel shows the speed of the hit, how many metres he flew (measured from where he was hit to where he lies), his peak height, air time and bounces, and your best this session, with a "new record" note when you beat it. The kill-cam follows him down the flight path, backing off the further he goes (2.6 s for a bump, up to 6.5 s for a full-speed hit). The panel goes away after about nine seconds.
- **Drama:** a white impact flash, a screen shake, a brief slow-motion beat (about 0.85 s at 28% speed, easing back to normal), a kill-cam that swings beside the road and tracks him through the air for about 2.6 s before returning to the chase view, and a synthesized crash (heavy thump, wet burst, a rising whoosh, glass tinkling down). The Jeep loses 30% of its speed. The toast reads "Mosswick has been flattened" and his health label reads "flattened".
- **Afterwards:** like a knockout he stays down and cannot be punched or shot. 25 seconds after he stops moving he gets back up at a random clear spot at least 25 m from you and 10 m from the Jeep, with a puff of green smoke (`RESPAWN_SECONDS` in `poison-dwarf.js`). A knockout from punches or the rifle respawns the same way. R still brings him back at once.

`roadkill.js` holds the hit test, effects, slow motion and kill-cam, with the tuning constants (`ROADKILL`) at its top. `poison-dwarf.js` gained `fling()`, the tumbling flight simulation. `roadkill-checks.html` (generated by the build) runs 39 checks: what must not kill him, the hit, flight height and distance, settling, debris cleanup, slow motion and its recovery, reversing, glancing hits, distance scaling with speed, the flight report, staying inside the map, respawn, and reset.

## Mouse-look

`mouselook.js` captures the mouse (Pointer Lock) on the first key press or click, so looking around needs neither a button nor a click first (browsers refuse capture before some user action, and a key press counts): walking turns the character's heading and pitch, driving orbits the chase camera, and the rifle aims (it shares the capture). The click that captures the mouse is not also a punch. Esc frees the cursor, and after that only a click recaptures it (keys will not grab it back). If the browser declines the capture, dragging works as before. Sensitivity is `.0032` rad per pixel horizontally and `.0024` vertically. The capture stays on after getting up from the rifle. `mouselook-checks.html` runs 23 checks.

## Mosswick's voice

Mosswick now talks, in a gravelly, mischievous voice recorded with ElevenLabs (the premade "Callum" voice) and embedded in the game, so it still works offline. There are 37 spoken lines and one scream, in `voice/`, with their text in `voice/lines.json`.

- **Taunts:** within 11 m of you (on foot or in the Jeep) he greets you within about two seconds, then keeps going every 7 to 12 s, or every 4.5 to 8 s when you are within 5 m. 18 humorous insults (for example "I've met turnips with better posture!" and "Your shadow called. It wants a better owner."), never the same one twice in a row. He stops walking, turns to face you, jabs a finger and nods while he talks.
- **Reactions:** six yelps when punched, three when shot, a dying line when knocked out, taunts when the rifle shot misses him by a metre or so ("Ha! Missed me! Learn to aim!"), complaints when the Jeep roars past ("Slow down, you maniac!"), a scream when the Jeep launches him, and a gloat when he respawns. A pain line cuts off whatever he was saying.
- **Captions:** every line also appears in a speech bubble over his head (or as a subtitle at the bottom of the screen when he is off screen), so the jokes work with the sound off.
- **Mix:** louder and more central the closer he is; it follows the sound toggle (M). The voices decode once the browser has allowed audio, after your first key press or click.

To change or add lines, edit `voice/lines.json` and run `node make-voice.mjs` with the `ELEVENLABS_API_KEY` environment variable set (it generates only clips that do not exist; `--force` redoes all, or name clip ids to redo those), then `python build.py`. The key is never stored. The finished mp3 files are committed, so a key is only needed to change lines. **He is solid.** On foot you can no longer walk through Mosswick: he blocks the player (walking, running, and landing from a jump) with a circle 0.40 m across his middle, so you stop 0.68 m from his centre and slide round him. He is taller than a jump (1.4 m), so you cannot hop over him either. Someone standing on the lookout deck above him is not blocked, and a knocked-out or flying Mosswick is not solid, so you can step over a body. `mosswick-checks.html` (generated by the build) runs 34 checks: distance, pacing, no repeats, captions, facing, each reaction, the scream, respawn, being solid and reset.

## Driving over stones

Low stones no longer stop the Jeep dead. A stone no taller than a wheel (0.95 m; 36 of the valley's stones) can be driven over if the Jeep has the speed, and the speed needed rises with the stone: 2.5 m/s plus 3.5 m/s per metre of height, so about 5 m/s (18 km/h) for a 0.7 m stone. Too slow and the Jeep stops against it, as before, with a hint. Taller rocks, trees and everything else stay solid.

- **Riding over:** the wheels follow the stone, and the underside has 0.32 m of clearance, so even a stone narrower than the wheel track lifts the chassis. The nose pitches up as the front wheels climb.
- **Contact:** a thump and a small jolt when the front touches a stone, and the Jeep loses a little speed.
- **Launch:** above about 36 km/h the Jeep leaves the ground at the crest. The launch speed depends on how fast the ground rose under it plus the Jeep's speed (up to 4.5 m/s); a 0.7 m stone at 50 km/h throws it about 0.7 m up for around 0.6 s. It lands with a heavy thud, a jolt of the camera and dust at the wheels, and loses a little more speed.
- **Never trapped:** a Jeep already over a stone is free to reverse or drive off it.

`rocks.js` holds this, with the tuning constants (`ROCK`) at its top. `rocks-checks.html` (generated by the build) runs 19 checks: speed gating, lift, the thump, a single launch, landing, solid tall rocks and trees, reversing off a stone, and unchanged driving on open ground.
