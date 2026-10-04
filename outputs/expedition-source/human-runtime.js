import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// A continuous skinned human replaces the original collection of rigid primitives.
// All textures and animation clips are embedded in the GLB and in the offline build.
export function create(encoded) {
  const root=new THREE.Group();root.name='Rigged explorer';
  const elevation=new THREE.Group();root.add(elevation);
  const visual=new THREE.Group();elevation.add(visual);
  let mixer,model,bones={},actions={},elapsed=0,seated=0,current='Idle',loaded=false;
  let hipsOrigin,normalOffset=0,hidden=false,motionLabel=null;
  const api={root,head:new THREE.Group(),arms:[],legs:[],ready:null,
    setElevationOffset(value){elevation.position.y=value;},
    getElevationOffset(){return elevation.position.y;},
    footHeights(){if(!loaded)return null;root.updateMatrixWorld(true);return {Left:localPosition(bones.LeftFoot).y-elevation.position.y,Right:localPosition(bones.RightFoot).y-elevation.position.y,contactHeight:.115+.060*(actions.Run?.getEffectiveWeight()||0)};},
    animate, poseMotion, setFirstPerson(value){hidden=value;visual.visible=!value;},
    getPose(){
      const joints={};if(loaded){root.updateMatrixWorld(true);for(const n of ['Hips','Head','LeftHand','RightHand','LeftArm','RightArm','LeftForeArm','RightForeArm','LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftFoot','RightFoot'])joints[n]=root.worldToLocal(bones[n].getWorldPosition(new THREE.Vector3())).toArray();}
      return {stride:elapsed,seated,model:'Rocketbox outdoor ranger',loaded,animation:motionLabel||(seated>.5?'Driving':current),bones:Object.keys(bones).length,joints};
    },
    dispose(){mixer?.stopAllAction();root.removeFromParent();model?.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of [].concat(o.material)){m.map?.dispose();m.normalMap?.dispose();m.dispose();}}});}
  };
  const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
  api.ready=new GLTFLoader().parseAsync(bytes.buffer,'').then(gltf=>{
    model=gltf.scene;model.name='Expedition ranger';visual.add(model);
    model.traverse(o=>{
      if(o.isBone){
        let name=o.name.replace(/^Bip01[ _]/,'').replaceAll('_',' ');
        const aliases={Pelvis:'Hips','L Thigh':'LeftUpLeg','R Thigh':'RightUpLeg','L Calf':'LeftLeg','R Calf':'RightLeg','L Foot':'LeftFoot','R Foot':'RightFoot','L Toe0':'LeftToeBase','R Toe0':'RightToeBase','L UpperArm':'LeftArm','R UpperArm':'RightArm','L Forearm':'LeftForeArm','R Forearm':'RightForeArm','L Hand':'LeftHand','R Hand':'RightHand'};
        bones[aliases[name]||name]=o;
      }
      if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
        o.material.roughness=.86;o.material.metalness=0;o.material.color.set('#ffffff');
        if(o.material.map)o.material.map.anisotropy=4;
      }
    });
    mixer=new THREE.AnimationMixer(model);
    for(const clip of gltf.animations){
      if(clip.name==='TPose')continue;
      // Retain vertical hip bounce but remove horizontal locomotion/root drift.
      actions[clip.name]=mixer.clipAction(clip).setEffectiveWeight(clip.name==='Idle'?1:0).play();
    }
    mixer.update(0);model.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(model),height=bounds.max.y-bounds.min.y;
    model.scale.multiplyScalar(1.77/height);
    model.updateMatrixWorld(true);
    const fitted=new THREE.Box3().setFromObject(model);normalOffset=-fitted.min.y;
    model.position.y=normalOffset;
    hipsOrigin=bones.Hips.position.clone();loaded=true;
    animate(0,0,0);return api;
  });

  // Aim a bone at a target in controller-local coordinates. This works with the
  // imported bone axes rather than assuming Euler axes match procedural limbs.
  const worldTarget=new THREE.Vector3(),origin=new THREE.Vector3(),tip=new THREE.Vector3();
  const delta=new THREE.Quaternion(),worldRotation=new THREE.Quaternion(),parentRotation=new THREE.Quaternion();
  function aim(name,childName,target,weight){
    const bone=bones[name],child=bones[childName];if(!bone||!child)return;
    root.updateMatrixWorld(true);
    worldTarget.copy(target);root.localToWorld(worldTarget);
    bone.getWorldPosition(origin);child.getWorldPosition(tip);
    const from=tip.sub(origin).normalize(),to=worldTarget.sub(origin).normalize();
    delta.setFromUnitVectors(from,to);bone.getWorldQuaternion(worldRotation);
    bone.parent.getWorldQuaternion(parentRotation).invert();
    worldRotation.premultiply(delta).premultiply(parentRotation);
    bone.quaternion.slerp(worldRotation,weight);bone.updateMatrixWorld(true);
  }
  const v=(x,y,z)=>new THREE.Vector3(x,y,z);
  function localPosition(bone){return root.worldToLocal(bone.getWorldPosition(new THREE.Vector3()));}
  // Solve the whole chain, including its bend plane. Independent shortest-arc
  // swings leave the thigh/upper arm twisted even when joint positions look right.
  function limb(upperName,middleName,endName,target,pole,weight=1,keepEnd=false){
    if(weight<=0)return;
    root.updateMatrixWorld(true);
    const upper=bones[upperName],middle=bones[middleName],end=bones[endName];
    const originals=[upper,middle,end].map(b=>b.quaternion.clone());
    const a=localPosition(upper),b=localPosition(middle),c=localPosition(end);
    const endRotation=end.getWorldQuaternion(new THREE.Quaternion());
    const l1=a.distanceTo(b),l2=b.distanceTo(c),direction=target.clone().sub(a);
    const leg=upperName.endsWith('UpLeg');
    // Limit deep folding and full extension; both produce unstable hinge planes.
    const maxFlex=THREE.MathUtils.degToRad(leg?125:140);
    const minimum=Math.sqrt(l1*l1+l2*l2+2*l1*l2*Math.cos(maxFlex));
    const distance=THREE.MathUtils.clamp(direction.length(),minimum,l1+l2-.008);
    direction.normalize();
    const bend=pole.clone().sub(a);bend.addScaledVector(direction,-bend.dot(direction));
    if(bend.lengthSq()<.00001)bend.set(0,0,1);bend.normalize();
    const along=(l1*l1-l2*l2+distance*distance)/(2*distance);
    const joint=a.clone().addScaledVector(direction,along).addScaledVector(bend,Math.sqrt(Math.max(0,l1*l1-along*along)));
    const endpoint=a.clone().addScaledVector(direction,distance);
    aim(upperName,middleName,joint,1);
    // Rotate around the upper segment until the original hinge plane agrees
    // with the solved chain. The lower joint then flexes in its anatomical plane.
    root.updateMatrixWorld(true);
    const axis=joint.clone().sub(a).normalize();
    const from=localPosition(end).sub(joint);from.addScaledVector(axis,-from.dot(axis)).normalize();
    const to=endpoint.clone().sub(joint);to.addScaledVector(axis,-to.dot(axis)).normalize();
    const angle=Math.atan2(axis.dot(from.clone().cross(to)),THREE.MathUtils.clamp(from.dot(to),-1,1));
    const worldAxis=axis.applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
    const rotation=upper.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromAxisAngle(worldAxis,angle));
    upper.quaternion.copy(upper.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(rotation));
    upper.updateMatrixWorld(true);
    aim(middleName,endName,endpoint,1);
    if(keepEnd)end.quaternion.copy(end.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(endRotation));
    [upper,middle,end].forEach((bone,i)=>bone.quaternion.copy(originals[i].clone().slerp(bone.quaternion,weight)));
    root.updateMatrixWorld(true);
  }
  function tilt(name,radians){
    const b=bones[name];if(!b||!radians)return;
    const axis=new THREE.Vector3(1,0,0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
    const q=b.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromAxisAngle(axis,radians));
    b.quaternion.copy(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));b.updateMatrixWorld(true);
  }
  // Turn a hand so its extended fingers point along `fingers` and its palm faces `palm` (both world directions).
  // The finger and palm axes come from the skeleton itself: the middle finger gives the finger axis, and the palm
  // faces the side the fingers curl towards (local +y, see the fist curl in poseMotion).
  const handBasis=new THREE.Matrix4(),handWorld=new THREE.Quaternion(),handLocal=new THREE.Matrix4();
  function orientHand(side,fingers,palm,weight){
    const hand=bones[side+'Hand'],middle=bones[side[0]+' Finger2'];if(!hand||!middle)return;
    const fx=middle.position.clone().normalize(),fz=new THREE.Vector3(0,1,0).cross(fx).normalize(),fy=fx.clone().cross(fz).normalize();
    handLocal.makeBasis(fx,fy,fz);
    const wx=fingers.clone().normalize(),wz=palm.clone().cross(wx).normalize(),wy=wx.clone().cross(wz).normalize();
    handBasis.makeBasis(wx,wy,wz).multiply(handLocal.clone().transpose());
    handWorld.setFromRotationMatrix(handBasis);
    hand.parent.getWorldQuaternion(parentRotation).invert();
    handWorld.premultiply(parentRotation);
    hand.quaternion.slerp(handWorld,weight);hand.updateMatrixWorld(true);
  }
  function poseMotion(spec={}){
    if(!loaded)return;motionLabel=spec.label||null;
    const prone=spec.prone?.amount||0;
    // Prone: tip the whole body forward about the feet, lift it clear of the floor and prop the head up.
    visual.rotation.x=prone*Math.PI/2;visual.position.set(0,(spec.prone?.lift||0)*prone-(spec.drop||0),0);root.updateMatrixWorld(true);
    if(prone){tilt('Spine1',-.16*prone);tilt('Spine2',-.20*prone);tilt('Neck',-.42*prone);tilt('Head',-.52*prone);tilt('LeftFoot',1.35*prone);tilt('RightFoot',1.35*prone);}
    const twist=(name,angle)=>{const bone=bones[name];const axis=new THREE.Vector3(0,1,0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));const q=bone.getWorldQuaternion(new THREE.Quaternion()).premultiply(new THREE.Quaternion().setFromAxisAngle(axis,angle));bone.quaternion.copy(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q));bone.updateMatrixWorld(true);};
    // Hips turn first so the legs, then the spine, carry the rotation up into the shoulders.
    if(spec.hipTwist)twist('Hips',spec.hipTwist);
    if(spec.twist)twist('Spine',spec.twist);
    // Shoulder protraction: a positive angle swings the right shoulder forward, a negative one the left.
    if(spec.shoulders)for(const [side,angle] of Object.entries(spec.shoulders))if(angle&&bones[side[0]+' Clavicle'])twist(side[0]+' Clavicle',side==='Right'?angle:-angle);
    tilt('Spine',spec.lean||0);tilt('Neck',-(spec.lean||0)*.45);
    // Jump arms use modest joint rotations over the relaxed animation pose.
    // No hand targets or elbow poles: wrists retain their natural local rotation.
    if(spec.jumpArms){
      const {swing,flex,weight}=spec.jumpArms;
      for(const side of ['Left','Right']){
        const variation=side==='Left'?1:.88;
        tilt(side+'Arm',-swing*weight*variation);
        tilt(side+'ForeArm',-flex*weight*variation);
      }
    }
    if(spec.fist){
      const curl=typeof spec.fist==='number'?{Right:spec.fist}:spec.fist;
      for(const [name,bone] of Object.entries(bones)){
        const m=/^([LR]) Finger([0-4])[12]?$/.exec(name),amount=m&&curl[m[1]==='R'?'Right':'Left'];
        if(amount)bone.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),(m[2]==='0'?.35:.85)*amount));
      }
    }
    for(const [side,sign] of [['Left',1],['Right',-1]]){
      const foot=spec.feet?.[side],hand=spec.hands?.[side];
      if(foot){const target=new THREE.Vector3(...foot.position);if(foot.world)root.worldToLocal(target);
        const hip=localPosition(bones[side+'UpLeg']);
        if(!foot.free){
          target.x=THREE.MathUtils.clamp(target.x,hip.x-.16,hip.x+.16);
          target.y=Math.min(target.y,hip.y-.22);
          target.z=Math.max(target.z,hip.z-.20);
        }
        limb(side+'UpLeg',side+'Leg',side+'Foot',target,hip.clone().add(v(0,0,1)),foot.weight??1,!foot.relax);}
      if(hand){const target=new THREE.Vector3(...hand.position);if(hand.world)root.worldToLocal(target);
        const shoulder=localPosition(bones[side+'Arm']);
        // relative: the target is an offset from the shoulder's final position, so it follows lean, drop and twist.
        if(hand.relative)target.add(shoulder);
        // strike: blend towards a point in space, but never further than `reach` from the shoulder (keeps the elbow soft).
        if(hand.strike){const point=new THREE.Vector3(...hand.strike.point),offset=point.clone().sub(shoulder),length=offset.length()||1;
          point.copy(shoulder).addScaledVector(offset,Math.min(length,hand.strike.reach)/length);target.lerp(point,hand.strike.amount);}
        limb(side+'Arm',side+'ForeArm',side+'Hand',target,shoulder.clone().add(hand.pole?v(...hand.pole):v(sign*.06,-1,-.25)),hand.weight??1);
        if(hand.orient)orientHand(side,v(...hand.orient.fingers),v(...hand.orient.palm),hand.weight??1);}
    }
  }
  const animationPose=new Map();
  function animate(dt,speed=0,sit=0){
    elapsed+=dt;seated=sit;if(dt===0)elevation.position.y=0;if(!loaded)return;motionLabel=null;visual.position.set(0,0,0);visual.rotation.x=0;
    const moving=Math.min(1,Math.abs(speed)/.55)*(1-sit);
    const running=THREE.MathUtils.smoothstep(Math.abs(speed),2.8,4.1);
    const weights={Idle:1-moving,Walk:moving*(1-running),Run:moving*running};
    current=running>.5&&moving>.2?'Run':moving>.2?'Walk':'Idle';
    for(const [name,action] of Object.entries(actions)){
      const target=weights[name]||0;
      action.setEffectiveWeight(dt===0?target:THREE.MathUtils.lerp(action.getEffectiveWeight(),target,1-Math.exp(-dt*11)));
      action.setEffectiveTimeScale(name==='Walk'?Math.max(.55,speed/1.65):name==='Run'?Math.max(.65,speed/4.5):1);
    }
    // Restore the last unmodified animation pose before the mixer evaluates.
    // Three skips unchanged tracks, so procedural IK must never become its baseline.
    for(const [bone,pose] of animationPose){bone.position.copy(pose.position);bone.quaternion.copy(pose.quaternion);}
    mixer.update(dt);
    for(const bone of Object.values(bones)){
      let pose=animationPose.get(bone);
      if(!pose){pose={position:bone.position.clone(),quaternion:bone.quaternion.clone()};animationPose.set(bone,pose);}
      else{pose.position.copy(bone.position);pose.quaternion.copy(bone.quaternion);}
    }
    model.position.y=normalOffset-.13*sit;
    visual.visible=!hidden;
    if(sit>0){
      // Stabilize hips while seated; recorded idle breathing remains in the spine.
      bones.Hips.position.lerp(hipsOrigin,sit);
      for(const [side,sign] of [['Left',1],['Right',-1]]){
        const hip=localPosition(bones[side+'UpLeg']);
        limb(side+'UpLeg',side+'Leg',side+'Foot',v(sign*.13,.43,.62),hip.clone().add(v(0,0,1)),sit,true);
        aim(side+'Foot',side+'ToeBase',v(sign*.13,.39,.85),sit);
        const shoulder=localPosition(bones[side+'Arm']);
        limb(side+'Arm',side+'ForeArm',side+'Hand',v(sign*.17,1.10,.56),shoulder.clone().add(v(sign*.06,-1,-.25)),sit);

      }
    }
  }
  return api;
}
// Load embedded scene props with the same offline glTF runtime as the character.
export async function loadProp(encoded,length=1.5){
 const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer,'');
 const model=gltf.scene,root=new THREE.Group();root.add(model);
 model.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
 const originalSize=size.toArray();
 if(size.z>size.x&&size.z>size.y)model.rotation.y+=Math.PI/2;
 else if(size.y>size.x&&size.y>size.z)model.rotation.z+=Math.PI/2;
 model.updateMatrixWorld(true);bounds.setFromObject(model);size=bounds.getSize(new THREE.Vector3());
 model.scale.multiplyScalar(length/size.x);model.updateMatrixWorld(true);bounds.setFromObject(model);
 const center=bounds.getCenter(new THREE.Vector3());model.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;if(o.material.map)o.material.map.anisotropy=4;}});
 root.updateMatrixWorld(true);bounds.setFromObject(root);
 root.userData={originalSize,size:bounds.getSize(new THREE.Vector3()).toArray()};return root;
}
