import bpy, math, json
from pathlib import Path
from mathutils import Matrix,Vector
root=Path(__file__).resolve().parent
assets=root/'rocketbox'
out=root
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.fbx(filepath=str(assets/'Wood_Male_01.fbx'))
rig=next(o for o in bpy.data.objects if o.type=='ARMATURE')
body=next(o for o in bpy.data.objects if o.type=='MESH')
rig.name='RangerRig'
for obj in list(bpy.data.objects):
 if obj not in [rig,body]:bpy.data.objects.remove(obj,do_unlink=True)
rig.animation_data_clear();rig.rotation_mode='QUATERNION'
rigRest=rig.matrix_world.copy()
bpy.context.view_layer.update()
restHip=(rig.matrix_world@rig.pose.bones['Bip01 Pelvis'].matrix).translation.copy()
print('RIG',list(rig.location),list(rig.rotation_quaternion),'hip',list(restHip))
# Replace legacy FBX materials with exportable PBR textures, retaining real folds.
for m in body.data.materials:
 kind='head' if 'head' in m.name else 'body'
 m.use_nodes=True;m.node_tree.nodes.clear()
 nodes=m.node_tree.nodes;links=m.node_tree.links
 shader=nodes.new('ShaderNodeBsdfPrincipled');shader.inputs['Roughness'].default_value=.82
 shader.inputs['Specular IOR Level'].default_value=.27
 output=nodes.new('ShaderNodeOutputMaterial');links.new(shader.outputs['BSDF'],output.inputs['Surface'])
 for suffix in ['color','normal']:
  image=bpy.data.images.load(str(assets/f'm110_{kind}_{suffix}.tga'),check_existing=True)
  image.scale(2048 if suffix=='color' else 1024,2048 if suffix=='color' else 1024)
  image.file_format='PNG';image.pack()
  node=nodes.new('ShaderNodeTexImage');node.image=image
  if suffix=='color':links.new(node.outputs['Color'],shader.inputs['Base Color'])
  else:
   image.colorspace_settings.name='Non-Color';normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.55
   links.new(node.outputs['Color'],normal.inputs['Color']);links.new(normal.outputs['Normal'],shader.inputs['Normal'])
for poly in body.data.polygons:poly.use_smooth=True
clips=[('Idle','m_idle_neutral_01.max.fbx',150),('Walk','m_walk_neutral_01.max.fbx',None),('Run','m_run_neutral_01.max.fbx',None)]
created=[]
for name,file,limit in clips:
 before=set(bpy.data.objects)
 bpy.ops.import_scene.fbx(filepath=str(assets/file))
 imported=set(bpy.data.objects)-before
 src=next(o for o in imported if o.type=='ARMATURE')
 action=src.animation_data.action
 start,end=map(int,action.frame_range)
 if limit:end=min(end,start+limit)
 fps=bpy.context.scene.render.fps
 # Capture actual world rotations, so different FBX rest poses do not distort limbs.
 frames=[]
 for f in range(start,end+1):
  bpy.context.scene.frame_set(f)
  worlds={p.name:(src.matrix_world@p.matrix).to_quaternion().copy() for p in src.pose.bones}
  hip=(src.matrix_world@src.pose.bones['Bip01 Pelvis'].matrix).translation.copy()
  frames.append((worlds,hip))
 for obj in imported:bpy.data.objects.remove(obj,do_unlink=True)
 for p in rig.pose.bones:p.matrix_basis.identity()
 rig.matrix_world=rigRest;rig.animation_data_create();a=bpy.data.actions.new(name);a.use_fake_user=True;rig.animation_data.action=a
 hip0=frames[0][1]
 # Root follows only the vertical component; WASD supplies horizontal motion.
 for i,(worlds,hip) in enumerate(frames):
  frame=i+1
  rig.location=rigRest.translation+Vector((0,0,(hip.z-hip0.z)))
  rig.keyframe_insert('location',frame=frame,group='Root height')
  bpy.context.view_layer.update()
  for pb in rig.pose.bones:
   if pb.name not in worlds:continue
   rot=rig.matrix_world.to_quaternion().inverted()@worlds[pb.name]
   desired=rot.to_matrix().to_4x4();desired.translation=pb.matrix.translation
   pb.matrix=desired
   # Local offsets remain those of this avatar, never those of the source body.
   pb.location=(0,0,0);pb.scale=(1,1,1);pb.rotation_mode='QUATERNION'
   pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
   bpy.context.view_layer.update()
 created.append(a)
 print('BAKED',name,len(frames),fps)
 rig.animation_data.action=None
 # Use one named NLA track per clip for stable GLB animation names.
 track=rig.animation_data.nla_tracks.new();track.name=name
 strip=track.strips.new(name,1,a);strip.name=name;track.mute=True
rig.matrix_world=rigRest
for p in rig.pose.bones:p.matrix_basis.identity()
for track in rig.animation_data.nla_tracks:track.mute=False
bpy.context.scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(out/'Ranger.blend'))
bpy.ops.export_scene.gltf(filepath=str(out/'ranger.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_def_bones=True,export_image_format='AUTO',export_yup=True)
print('EXPORTED',out/'ranger.glb')
