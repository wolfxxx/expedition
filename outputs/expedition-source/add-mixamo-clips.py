# Add the Mixamo jump and punch (../../Jump.fbx, ../../Punching.fbx) to the ranger as baked clips, then re-export ranger.glb.
# Run with Blender 5.2:  blender -b --python add-mixamo-clips.py
# Retargeting: for every mapped bone, the source's rotation away from its own rest pose is applied in world space to the
# ranger's bone, after first turning the ranger's rest bone to point the way the source's rest bone points (the two
# skeletons have different rest poses and bone axes). Horizontal root motion is dropped (the game moves the player); the
# hips keep only how far they sink below standing height (crouch, absorb), so in the air the game's physics sets the height.
# Punch (a right cross) is also mirrored into PunchLeft (a left jab) by reflecting every rotation across the body's mid-plane.
import bpy
from pathlib import Path
from mathutils import Quaternion,Vector

here=Path(__file__).resolve().parent
sources=here.parent.parent
CLIPS=[('Jump','Jump.fbx',False),('Punch','Punching.fbx',False),('PunchLeft','Punching.fbx',True)]

M='mixamorig:'
pairs={'Hips':'Pelvis','Spine':'Spine','Spine1':'Spine1','Spine2':'Spine2','Neck':'Neck','Head':'Head'}
for side,s in (('Left','L'),('Right','R')):
 pairs.update({side+'Shoulder':s+' Clavicle',side+'Arm':s+' UpperArm',side+'ForeArm':s+' Forearm',side+'Hand':s+' Hand',
  side+'UpLeg':s+' Thigh',side+'Leg':s+' Calf',side+'Foot':s+' Foot',side+'ToeBase':s+' Toe0'})
 for finger,n in (('Thumb',0),('Index',1),('Middle',2),('Ring',3),('Pinky',4)):
  pairs.update({f'{side}Hand{finger}1':f'{s} Finger{n}',f'{side}Hand{finger}2':f'{s} Finger{n}1',f'{side}Hand{finger}3':f'{s} Finger{n}2'})
MAP={M+k:'Bip01 '+v for k,v in pairs.items()}
# where each bone points: towards this child (ranger name -> child), for the rest-direction alignment
def aim_child(name):
 table={'Pelvis':'Spine','Spine':'Spine1','Spine1':'Spine2','Spine2':'Neck','Neck':'Head'}
 short=name[6:]
 if short in table:return 'Bip01 '+table[short]
 for s in 'LR':
  t={f'{s} Clavicle':f'{s} UpperArm',f'{s} UpperArm':f'{s} Forearm',f'{s} Forearm':f'{s} Hand',f'{s} Hand':f'{s} Finger2',
     f'{s} Thigh':f'{s} Calf',f'{s} Calf':f'{s} Foot',f'{s} Foot':f'{s} Toe0'}
  if short in t:return 'Bip01 '+t[short]
  for n in range(5):
   if short==f'{s} Finger{n}':return f'Bip01 {s} Finger{n}1'
   if short==f'{s} Finger{n}1':return f'Bip01 {s} Finger{n}2'
 return None
INV={v:k for k,v in MAP.items()}
mirror_name=lambda n:n.replace('Left','#').replace('Right','Left').replace('#','Right')
mirror_q=lambda q:Quaternion((q.w,q.x,-q.y,-q.z))    # reflection across the x=0 plane (left is +x on both rigs)

bpy.ops.wm.open_mainfile(filepath=str(here/'Ranger.blend'))
scene=bpy.context.scene;fps=scene.render.fps/scene.render.fps_base
rig=bpy.data.objects['RangerRig'];body=next(o for o in bpy.data.objects if o.type=='MESH')
for t in list(rig.animation_data.nla_tracks):
 if t.name in [c[0] for c in CLIPS]:rig.animation_data.nla_tracks.remove(t)
for name,_,_ in CLIPS:
 if name in bpy.data.actions:bpy.data.actions.remove(bpy.data.actions[name])
for t in rig.animation_data.nla_tracks:t.mute=True
rig.animation_data.action=None
for p in rig.pose.bones:p.matrix_basis.identity()
bpy.context.view_layer.update()
rigRest=rig.matrix_world.copy();rigRot=rigRest.to_quaternion()
tRest={b.name:(rigRest@b.matrix_local).to_quaternion() for b in rig.data.bones}
tHead={b.name:rigRest@b.head_local for b in rig.data.bones}
tHip=tHead['Bip01 Pelvis'].z

for clip,file,mirrored in CLIPS:
 before=set(bpy.data.objects)
 bpy.ops.import_scene.fbx(filepath=str(sources/file))
 imported=set(bpy.data.objects)-before
 src=next(o for o in imported if o.type=='ARMATURE');action=src.animation_data.action
 sRest={b.name:(src.matrix_world@b.matrix_local).to_quaternion() for b in src.data.bones}
 sHead={b.name:src.matrix_world@b.head_local for b in src.data.bones}
 sHip=sHead[M+'Hips'].z
 # per ranger bone: the turn that makes its rest direction match the source's rest direction
 align={}
 for t,s in INV.items():
  c=aim_child(t);sc=INV.get(c) if c else None
  if c and sc and c in tHead and sc in sHead:
   a=(tHead[c]-tHead[t]).normalized();b=(sHead[sc]-sHead[s]).normalized();align[t]=a.rotation_difference(b)
  else:align[t]=Quaternion()
 start,end=map(int,action.frame_range);frames=[]
 for f in range(start,end+1):
  scene.frame_set(f)
  delta={pb.name:(src.matrix_world@pb.matrix).to_quaternion()@sRest[pb.name].inverted() for pb in src.pose.bones}
  frames.append((delta,(src.matrix_world@src.pose.bones[M+'Hips'].matrix).translation.z))
 srcfps=bpy.context.scene.render.fps   # the FBX import set the scene to the file's rate
 for o in imported:bpy.data.objects.remove(o,do_unlink=True)
 scene.render.fps=int(fps)
 for p in rig.pose.bones:p.matrix_basis.identity()
 rig.matrix_world=rigRest;a=bpy.data.actions.new(clip);a.use_fake_user=True;rig.animation_data.action=a
 for i,(delta,hipz) in enumerate(frames):
  frame=1+i*fps/srcfps
  sink=min(0.0,hipz-sHip)*tHip/sHip                       # crouch only: never lift the hips above standing
  rig.location=rigRest.translation+Vector((0,0,sink));rig.keyframe_insert('location',frame=frame,group='Root height')
  bpy.context.view_layer.update()
  for pb in rig.pose.bones:
   s=INV.get(pb.name)
   if not s:continue
   d=mirror_q(delta[mirror_name(s)]) if mirrored else delta[s]
   world=d@align[pb.name]@tRest[pb.name]
   m=(rigRot.inverted()@world).to_matrix().to_4x4();m.translation=pb.matrix.translation;pb.matrix=m
   pb.location=(0,0,0);pb.scale=(1,1,1);pb.rotation_mode='QUATERNION'
   pb.keyframe_insert('rotation_quaternion',frame=frame,group=pb.name)
   bpy.context.view_layer.update()
 rig.animation_data.action=None
 track=rig.animation_data.nla_tracks.new();track.name=clip
 strip=track.strips.new(clip,1,a);strip.name=clip;track.mute=True
 print('BAKED',clip,len(frames),'frames at',srcfps,'fps ->',fps)
rig.matrix_world=rigRest
for p in rig.pose.bones:p.matrix_basis.identity()
for t in rig.animation_data.nla_tracks:t.mute=False
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT');rig.select_set(True);body.select_set(True);bpy.context.view_layer.objects.active=rig
bpy.ops.wm.save_as_mainfile(filepath=str(here/'Ranger.blend'))
bpy.ops.export_scene.gltf(filepath=str(here/'ranger.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_def_bones=True,export_image_format='AUTO',export_yup=True)
print('EXPORTED',here/'ranger.glb')
