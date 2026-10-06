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

Entry now walks to the door, reaches for the handle, waits for clearance, steps onto the sill, ducks and turns into the seat. Exit reverses the climbing sequence. Jumping (`jumpPose` in `motion.js`) plays a motion-captured Mixamo jump (`Jump.fbx`), driven by the jump's physics: the crouch and push-off blend in over the 0.16 s wind-up, the flight runs the clip from push-off to touch-down in step with the rise and fall (a long drop holds the legs reaching for the ground), and the 0.4 s landing plays the clip's absorb and blends back to standing. On the move it never stops you: a jump taken while walking or running carries its speed through the wind-up (no planted feet then), and landing with a direction held keeps the full speed and runs straight on, the landing dip blending out over the first 0.22 s. Landing with no direction held stops, as before. Gravity and momentum are unchanged. The punch and jump are Mixamo clips retargeted onto this rig; Idle/Walk/Run retain the baked Rocketbox animations.

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

The motion (`combat.js`, `punchPose`) is a motion-captured Mixamo right cross (`Punching.fbx`, the `Punch` clip), mirrored into a left jab (`PunchLeft`). Each is retimed so its full extension lands on the 0.19 s impact and its return to guard ends the 0.46 s swing, blending in and out at the ends. The player steps in just far enough that the fist arrives, never closer than about a metre. After contact there is a brief hit-pause and a small camera jolt. If the player is moving when the punch starts, only the upper body plays the clip and the legs keep walking.

Mosswick reacts physically: he is shoved about a quarter of a metre away from the blow (never into trees, water or a steep drop), his upper body whips away from it, he flashes red and he pauses before walking on. Swing whooshes and impact thumps run through the shared world-audio mute control.

`human-runtime.js` provides what the motion needs: `hipTwist`, a two-handed `fist` curl, `free` foot placement without the jump clamps, and shoulder-relative hand targets (`relative`, `strike` with a `reach` limit) that follow the lean, drop and twist. `combat-checks.html` (generated by the build) runs 16 combat, animation and sound checks.

## Lookout rifle

The user-supplied `heavy_sniper_rifle.glb` stands on its bipod at the centre of the lookout deck, resting aimed down the valley towards Mirror Spring. Walk up beside it and press **E** (or the on-screen prompt) to lie down behind it.

- **Aim:** move the mouse; it is captured when you lie down, so no button needs holding (press Esc to free the cursor, click to capture it again). If the browser declines, dragging still aims, and W/A/S/D always works. Aim is limited to 31 degrees below and 20 degrees above the horizon.
- **Fire:** left-click or Space. It is a bolt action: 1.6 seconds between shots. A body hit takes 50 health from Mosswick (two shots knock him out); trees, rocks and the ground stop the bullet. The shot has a muzzle flash, tracer, recoil, a distance-delayed impact sound and valley echoes.
- **Ducks:** the ducks on Mirror Spring (about 45 to 55 m from the deck) can be shot too. A hit duck bursts into feathers with a last squawk and drops, the others take fright and fly off, and it floats belly up, drifting, before sinking. 30 s later a new duck turns up elsewhere on the spring (R brings them all back at once). A note counts your ducks. The shot duck is in `spring-life.js` (`spShootDuck`, `SP_DUCK_RESPAWN`).
- **Headshot:** a hit on his head (a 0.3 m sphere round his hood and face) kills him in one shot. His head bursts in a flash and a plume of poison mist. Scraps of hood, face and beard fly out along the shot, the hood's tip sails high, and about 90 green droplets rain down and splash flat on the ground. His neck spurts for a second as he falls, a green stain spreads where he stood, and it all clears within about seven seconds. The moment plays in slow motion, a green **HEADSHOT** banner shows, and he says nothing (no head, no last words). The sound arrives with the bullet's travel time: a sharp wet crack, a meaty pop with a sub-bass punch, a spatter of droplets and a bright two-note bell ding (`valleyAudio.headshot` in `world-audio.js`). He lies headless until he gets back up, head restored, 25 s later (or at once with R). `RIFLE.headRadius` sets the head's size.
- **Smooth aim:** mouse, drag and keys set where you want to aim, and the rifle, the lying shooter and the camera ease toward it over about 30 ms each step, with the camera locked to the rifle. However unevenly the mouse events arrive, the view turns smoothly, scoped or not.
- **Scope:** Z or right-click toggles a 6x scope with a reticle, and the mouse wheel zooms between 3x and 16x. Aim sensitivity falls as you zoom. The range to whatever is under the crosshair is shown.
- **Get up:** E. R also resets. Touch players get Scope, Fire and Get up buttons.

The rifle pivots about its butt, and the lying shooter swings around it. With the feet 1.37 m behind the butt the body stays within 1.3 m of the deck centre at every heading, inside the 1.6 m clear half-width of the rails (`rifle-checks.js` verifies this at 24 headings). Looking south along the stairs the handrails can block the scope; the other directions are open.

`lookout-rifle.js` holds the mounting sequence, aiming, camera, ballistics and effects, and the tuning constants (`RIFLE`) at its top: heading, damage, bolt time, body offsets and hand targets. The hands are posed deliberately: the right hand wraps the pistol grip in a handshake grip (fingers along the rifle, thumb up, fingers curled), and the left hand cups the underside of the stock near the butt with its palm up (`RIFLE.right` / `RIFLE.left` are the wrist targets, in rifle coordinates). `human-runtime.js` gained a `prone` pose (body tipped flat, head and neck propped up, feet relaxed), a per-hand elbow pole and `orient` (turn a hand so its fingers and palm face given directions, using the skeleton's own finger axes); rebuild the bundle with `npm run build:human`. `world-audio.js` synthesizes the shot, bolt and impact. Jumping, punching and footsteps are disabled while on the rifle.

`rifle-checks.html` (generated by the build) runs 53 checks: reach and prompt, getting down, fit at every heading, flat on the deck, aim limits, click/drag/scope input, bolt cycle, hits, one-shot headshots (head gone, slow motion, no last words, head back on reset), shooting ducks (down, floating, back after 30 s and on reset), smooth aim easing, occlusion, ground and sky shots, getting up, and reset. All pass. Run any check page headlessly with `node run-checks.mjs rifle-checks.html rifle-results` (needs Chrome or Edge, no install).

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

## Mirror Spring

The spring is now real water, built in `spring.js` (the water) and `spring-life.js` (what lives in and around it). It replaces the flat teal plane that `valley.js` used to draw.

**The water**
- **Reflections:** the scene is rendered a second time, upside-down about the surface, into a render target at half the screen size, and mirrored in the water: the pines, mountains, tent, boat, ducks and sky, bent by the ripples and stronger at grazing angles (Fresnel). The mirror camera's near plane is tilted onto the surface (oblique projection) so only what is above the water is drawn.
- **True depth:** the lakebed is sampled once from the same height function the terrain uses (a 240 by 208 grid, 12.5 cm cells) and uploaded as a texture. The water is tinted turquoise in the shallows and deep teal at 1.4 m, becomes transparent where it is shallow so you see the bed, and shows sunlight caustics there.
- **Surface:** four crossing swells plus fine wind-streaked detail bend the reflection and the light; sun glitter sparkles on the ripples; the detail fades with distance so it does not shimmer.
- **Shoreline:** a lapping foam line and speckled foam wash where the water meets the bank.
- **Ripples:** a list of 12 rings spreads across the surface (`addRipple`), fed by everything below.
- **Weak machines:** if frames stay slow while the lake is in view (over 32 ms for 2.5 s) the mirror steps down to 35%, then 25% of the screen size, then is replaced by a plain sky tint. `SPRING.adaptive` and `SPRING.reflectScale` control this.

**Around and in it**
- 234 reeds with 86 cattail heads swaying in the wind, 60 lily pads (7 with white and pink flowers) bobbing on the surface, 210 weeds waving on the lakebed and 170 stones on the bed, 110 stones and a driftwood log on the bank.
- A painted rowboat moored to a post by the boardwalk, bobbing and solid: four collision circles run along the hull (bow to stern), so you cannot walk through it from any side, the Jeep stops against it rather than riding over it, and bullets hit it.
- Three mallards that swim between points in deep water, dabble, leave a V of ripples, and swim off briskly if you walk, run or drive up to them (they ignore someone standing still at a distance). They are solid for a player on foot. If the Jeep drives into one it bursts into flight with a honk and a cloud of feathers, flies a short hop (about 1.25 s) to another part of the lake and splashes down, and the Jeep carries on, slowed slightly.
- Three dragonflies that hover and dart over the water and the bank.
- A fish that leaps now and then when you are within 45 m, with a splash both ways.

**Interaction**
- Wading, running or landing from a jump in the water makes rings, spray droplets and a splash; the Jeep leaves a wake and throws spray from each wheel; a rifle bullet that reaches the water splashes where it enters (and stops there; the sound arrives after the delay of the speed of sound); a body thrown in (Mosswick after a Jeep hit) lands on the surface with a big splash and floats rather than sinking to the bed. Standing still makes nothing.

`spring-water-checks.html` (generated by the build) runs 55 checks: the shader and mirror, the depth grid, ripples, the props, ducks fleeing and being driven into, a solid boat, dragonflies, fish, wading, the Jeep, bullets, a thrown body, and the slow-machine safety valve.

## Landscape

- `landscape-trees.js`: tiered, flat-shaded pines, rounded broadleaf trees (most green, a few gold and orange), white birches, bushes, ferns and mushrooms, plus a far forest out to the hills. The original 243 trees stay where they are; new trees keep clear of roads, the lake, camp, lookout and boat, and have collision circles. All sway in the shared wind.
- `landscape.js`: a richer ground shader (lush and dry meadow, mottling), a dense window of fine grass tufts that follows the player and sways, and about 2,400 wildflowers in colour patches. The grass is left out of the water mirror.
- A frame-time valve thins the grass on slow machines (four steps) and restores it when the machine copes. `expedition.landscape` exposes the settings (`LAND`), and `landscape-checks.html` runs 33 checks.

## Ramp circuit

East of the ring road there is now a cleared stretch of meadow with a dirt circuit to fly the Jeep around. Take the dirt link from the east side of the ring road (signposted **RAMP CIRCUIT**), or drive across the grass. The circuit is a 9 m wide oval with two 64 m straights, driven anticlockwise from the chequered start line under the banner:

- **Inner straight (north):** three rollers (0.5 m bumps) that make the Jeep hop at speed, then the **Kicker**, a 1.5 m timber-faced ramp that curves up into its lip. At 50 km/h it throws the Jeep about 13 m and 1.3 m high; at 72 km/h, about 23 m. A long flat run-out follows.
- **Outer straight (south):** a **Tabletop** (1.2 m high, 6 m flat top) and then the **Big kicker**, 2.2 m high and steepening to 30 degrees at the lip. At 50 km/h it gives about 17 m, at 72 km/h about 32 m and 5 m high, and at full speed about 45 m with 6 m of height.
- **Turns:** both ends are lined with round hay bales. They are solid, so overshoot a turn and you stop.

How it flies: the ramps are part of the ground, so the wheels, the body's pitch and roll, and walking all follow them. Off the lip the ground falls away faster than gravity can follow, so the Jeep keeps the upward speed it had on the ramp (plus 8%) and flies. In the air the wheels have no grip: throttle and brakes do nothing (the engine just revs), steering barely turns it, and the nose follows the flight path. Landing on a down slope is soft. A flat landing gives a heavy thud, a jolt and dust, and costs some speed. Slow (below about 22 km/h), the Jeep just rolls over every ramp, in either direction. After each jump a note shows the air time, distance and height, and your best this session.

- `circuit-layout.js`: the layout and ramp shapes (`circuitLayout()`, position, sizes, and each ramp's lip, run-up, top, back slope, height and curve). `build.py` puts it ahead of the terrain code, so the clearing, grass and physics all share it. Change a number there and rebuild to reshape the circuit.
- `circuit.js`: clears trees, stones, bushes and their collision circles from the circuit ground, and from an open meadow 16 m round the ranger lookout so the tower stands in the open (`LOOKOUT_MEADOW`; the grass and wildflowers stay) (everything else in the valley stays exactly where it was), adds the ramps to `world.height`, builds the track, ramps, flags, bales, start gantry and road sign, draws the circuit on the minimap, and reports jumps. `expedition.circuit` exposes the layout and jump stats.
- `rocks.js` holds the take-off and landing (the ramp rule sits beside the stone rule, and `ROCK.rampLaunchSpeed` / `ROCK.rampGain` tune it). `driving.js` holds the airborne handling.
- `circuit-checks.html` (generated by the build) runs 21 checks: the clearing, no grass on the track, ramp heights, standing on a ramp, rolling over slowly, the launches and their size, the airborne controls, landing, the report, rollers, driving a ramp backwards, solid bales, an autopilot lap and reset.

## Mixamo jump and punch

`add-mixamo-clips.py` (run with Blender 5.2: `blender -b --python add-mixamo-clips.py`) takes `Jump.fbx` and `Punching.fbx` from the repository root (Mixamo downloads; they are not committed, so download them from mixamo.com and put them there to re-run it), retargets them onto the ranger in `Ranger.blend`, and re-exports `ranger.glb` with three more clips: `Jump`, `Punch` and `PunchLeft` (the punch mirrored). Each ranger bone first turns its rest direction to match the Mixamo bone's (the two skeletons have different rest poses and bone axes), then takes on the Mixamo bone's rotation away from its own rest, in world space. Fingers are included. Horizontal root motion is dropped because the game moves the player. The hips keep only how far they sink below standing height, so crouches and landings show while the game's physics sets the height in the air. `human-runtime.js` keeps these as one-shot clips that the game samples at a time of its choosing (`applyClip(name, time, weight, mask)`, with mask `'upper'` for a punch on the move) instead of letting the mixer loop them. Rebuild the bundle with `npm run build:human`.

## Phones and tablets

On a touch screen without a mouse the game switches to a phone layout (`mobile.js`). Add `?mobile` to the address to force it on a computer, or `?desktop` to turn it off on a phone.

- **Landscape only:** held upright, a "turn your phone sideways" card covers the game and drawing pauses to save battery. The first tap asks for fullscreen and a landscape lock (Android Chrome allows this; on iPhone, turn the phone yourself).
- **Left thumb:** the joystick. Push it part way to walk, all the way to run (no Run button). Driving, it steers and accelerates.
- **Right thumb:** a big **Jump** and a **Punch** on foot, and one context button above them that changes with what is near: **Get in** at the driver's door, **Get out** in the Jeep, **Use rifle** on the lookout deck. Driving, the big button is **Brake**. On the rifle, **Scope**, **Fire** and **Get up** sit on the right, and you drag anywhere to aim.
- **Camera:** walking, it swings round behind the way you are going, so the stick steers you. Drag anywhere on the screen to look around; it waits 1.2 s after you let go before following again. Driving, it eases back behind the car.
- **Less clutter:** the title, field notes and keyboard help are hidden. The map is a small dial top right, the toolbar a row of small buttons top left, and Mosswick's health sits under the toolbar.
- **Lighter rendering:** no antialiasing, 1024 px shadows, lighter grass to start with (it still adapts), a smaller water mirror, and a render resolution that steps down (to 60%) when frames are slow and back up when they recover.

`MOBILE_TUNE` at the top of `mobile.js` holds the tuning: when the stick starts running, how fast the camera follows, and the resolution steps. `mobile-checks.html` (generated by the build) runs 19 checks in phone mode.
