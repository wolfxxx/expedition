# Human character and motion

Character: **Wood_Male_01**, Microsoft Rocketbox Avatar Library.

Source: https://github.com/microsoft/Microsoft-Rocketbox/tree/master/Assets/Avatars/Professions/Wood_Male_01

Animation sources from the same repository:
- `Assets/Animations/all_animations_max_motextr_static/m_idle_neutral_01.max.fbx`
- `Assets/Animations/all_animations_max_motextr_xy/m_walk_neutral_01.max.fbx`
- `Assets/Animations/all_animations_max_motextr_xy/m_run_neutral_01.max.fbx`

License: MIT; full original notice in ROCKETBOX-LICENSE.md. The original asset was authored by the Rocketbox team and released by Microsoft.

Local adaptations: material conversion to glTF PBR, packed color and normal maps, smooth normals, world-space motion retargeting to preserve the character's proportions, in-place locomotion, animation blending and procedural driving pose. Prepared with Blender 5.2 and Three.js r180. The standalone HTML embeds the complete human asset.

Three.js and GLTFLoader: MIT, https://github.com/mrdoob/three.js/tree/r180 . License retained in the runtime bundle and original-vehicle/vendor/THREE-LICENSE.txt.

The discarded Soldier and Michelle test models are not included in the final character or runtime.

- Heavy sniper rifle: `heavy_sniper_rifle.glb`, supplied by the user for this project. Original creator and license were not supplied. Original GLB retained unchanged; the game mounts it on the lookout and fires it.
