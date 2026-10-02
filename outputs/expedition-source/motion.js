// Movement choreography. Coordinates for contacts are in metres, in Jeep space.
// The human runtime solves two-bone IK against the fixed world contact targets.
const ease=(a,b,t)=>{const u=Mn((t-a)/(b-a),0,1);return u*u*(3-2*u);};
const lerpPoint=(a,b,t)=>a.clone().lerp(b,t);
const contact=(point,weight=1)=>({position:point.toArray(),world:true,weight});
const localContact=(x,y,z)=>({position:[x,y,z]});
let jumpPhase='grounded',jumpTime=0,jumpY=0,jumpMomentum=new L(),jumpAnchors=null,jumpArmSwing=0,jumpArmFlex=0,jumpArmWeight=0;
function groundFeet(){
  const pose=Xt.getPose().joints;Xt.root.updateMatrixWorld(true);
  return Object.fromEntries(['Left','Right'].map(side=>{
    const p=Xt.root.localToWorld(new L(...pose[side+'Foot']));p.y=Je.height(p.x,p.z)+.10;return [side,p];
  }));
}
function jumpPose(dt,drop,air=0){
  Xt.animate(dt,0,0);
  const preparation=jumpPhase==='anticipation',landing=jumpPhase==='landing';
  const targetSwing=preparation?-.20:landing?.02:(-.20+.60*ease(0,.18,jumpTime))*(1-ease(.25,.65,jumpTime));
  const targetFlex=preparation?.08:landing?.08:.08+.30*ease(0,.18,jumpTime);
  const response=1-Math.exp(-dt*18);
  jumpArmSwing+=(targetSwing-jumpArmSwing)*response;
  jumpArmFlex+=(targetFlex-jumpArmFlex)*response;
  jumpArmWeight=preparation?ease(0,.13,jumpTime):landing?1-ease(0,.24,jumpTime):1;
  Xt.poseMotion({label:jumpPhase==='anticipation'?'Jump preparation':jumpPhase==='landing'?'Landing':'Airborne',drop,lean:.10+.12*drop,
    feet:air?{Left:localContact(.12,.10+.19*air,.12*air),Right:localContact(-.12,.10+.13*air,-.07*air)}:
      {Left:contact(jumpAnchors.Left),Right:contact(jumpAnchors.Right)},
    jumpArms:{swing:jumpArmSwing,flex:jumpArmFlex,weight:jumpArmWeight}});
}
addEventListener('keydown',e=>{
  if(e.code==='Space'&&!e.repeat&&Te==='walking'&&!Le&&jumpPhase==='grounded'){
    jumpPhase='anticipation';jumpTime=0;jumpArmSwing=jumpArmFlex=jumpArmWeight=0;jumpMomentum.copy(Ni);jumpAnchors=groundFeet();
  }
});
const walkOnGround=t_;
t_=function(dt){
  if(jumpPhase==='grounded'){walkOnGround(dt);return;}
  jumpTime+=dt;
  if(jumpPhase==='anticipation'){
    jumpPose(dt,.18*ease(0,.13,jumpTime));
    if(jumpTime>=.13){jumpPhase='airborne';jumpTime=0;jumpVelocity=4.25;jumpY=Xt.root.position.y;}
    return;
  }
  if(jumpPhase==='airborne'){
    const input=Nu(),length=Math.max(1,Math.hypot(input.x,input.y)),speed=Ue.has('ShiftLeft')||Ue.has('ShiftRight')||pe.run?4.5:2.6;
    const desired=new L(Math.sin(Wn)*input.y-Math.cos(Wn)*input.x,0,Math.cos(Wn)*input.y+Math.sin(Wn)*input.x).multiplyScalar(speed/length);
    // Inertia persists in the air; input provides modest steering rather than instant reversals.
    if(Math.hypot(input.x,input.y)>.01)jumpMomentum.lerp(desired,1-Math.exp(-dt*1.5));
    Xt.root.position.addScaledVector(jumpMomentum,dt);Je.resolveCircle(Xt.root.position,.28);jg(Xt.root.position);Je.resolveCircle(Xt.root.position,.28);
    jumpVelocity-=12*dt;jumpY+=jumpVelocity*dt;
    const floor=Je.height(Xt.root.position.x,Xt.root.position.z);
    Xt.root.position.y=jumpY;jumpHeight=Math.max(0,jumpY-floor);
    const tuck=ease(0,.16,jumpTime)*(1-ease(.35,.68,jumpTime));
    jumpPose(dt,.18*(1-ease(0,.10,jumpTime)),.15+.85*tuck);
    if(jumpY<=floor&&jumpVelocity<0){
      Xt.root.position.y=floor;jumpHeight=jumpVelocity=0;jumpPhase='landing';jumpTime=0;
      Xt.animate(0,0,0);jumpAnchors=groundFeet();jumpPose(0,0);Ni.copy(jumpMomentum).multiplyScalar(.4);
    }
    return;
  }
  jumpPose(dt,.18*Math.sin(Math.PI*Mn(jumpTime/.24,0,1)));
  if(jumpTime>=.24){jumpPhase='grounded';jumpTime=0;Xt.animate(0,0,0);}
};
const doorAvailable=dc;dc=()=>jumpPhase==='grounded'&&doorAvailable();
const resetMovement=Oa;oe('resetBtn').removeEventListener('click',resetMovement);Oa=function(){jumpPhase='grounded';jumpTime=jumpHeight=jumpVelocity=0;jumpMomentum.set(0,0,0);resetMovement();};oe('resetBtn').addEventListener('click',Oa);

function driverPad(){const p=Es(new L(1.62,0,-.32));p.y=Je.height(p.x,p.z);return p;}
function clearPad(p){return lakeDistance(p.x,p.z)>11.15&&Math.hypot(p.x,p.z)<87.5&&!Je.colliders.some(c=>Math.hypot(p.x-c.x,p.z-c.z)<c.r+.42);}
function stepArc(a,b,u,lift){const t=ease(0,1,u),p=lerpPoint(a,b,t);p.y+=Math.sin(Math.PI*t)*lift;return p;}
function transitionFeet(u){
  const ground=(x,z)=>{const p=Es(new L(x,0,z));p.y=Je.height(p.x,p.z)+.10;return p;};
  const left=ground(1.60,-.20),right=ground(1.60,-.44);
  const leftSill=Es(new L(.95,.67,-.18)),rightSill=Es(new L(.99,.67,-.40));
  return {
    Left:u<.32?stepArc(left,leftSill,u/.32,.18):stepArc(leftSill,Es(new L(.56,.65,.33)),(u-.32)/.68,.10),
    Right:u<.34?right:u<.69?stepArc(right,rightSill,(u-.34)/.35,.18):stepArc(rightSill,Es(new L(.30,.65,.33)),(u-.69)/.31,.10)
  };
}
function climbingPose(dt,u){
  const outside=Le.pad,step=Es(new L(1.24,.12,-.31)),sitting=Es(new L(.60,.22,-.29)),seat=Es(wu);
  const p=u<.30?lerpPoint(outside,step,ease(0,.30,u)):u<.72?lerpPoint(step,sitting,ease(.30,.72,u)):lerpPoint(sitting,seat,ease(.72,1,u));
  Xt.root.position.copy(p);
  Xt.root.rotation.set(0,Xe-Math.PI/2*(1-ease(.20,.90,u)),0);
  const seated=ease(.32,.92,u),duck=.10*Math.sin(Math.PI*u),feet=transitionFeet(u);
  Xt.animate(dt,0,seated);
  const handWeight=Math.sin(Math.PI*u);
  Xt.poseMotion({label:Le.kind==='enter'?'Step into Jeep':'Step out of Jeep',drop:duck,lean:.24*Math.sin(Math.PI*u),
    feet:{Left:contact(feet.Left,1-ease(.85,1,u)),Right:contact(feet.Right,1-ease(.85,1,u))},
    hands:{Left:contact(Es(new L(.87,1.50,.40)),handWeight),Right:contact(Es(new L(.75,1.28,.12)),handWeight*.8)}});
}
function handlePoint(){
  const angle=zt.getState().panels.driver.angle;
  return Es(new L(.8-.88*Math.sin(angle),1.24,.66-.88*Math.cos(angle)));
}
const oldInteract=Uu;
oe('action').removeEventListener('click',oldInteract);
Uu=function(){
  if(Le)return;
  if(Te==='walking'){
    if(!dc()){hi(jumpPhase!=='grounded'?'Land before getting into the Jeep.':'Walk up to the driverâ€™s door.');return;}
    const pad=driverPad();if(!clearPad(pad)){hi('The driverâ€™s door needs more room.');return;}
    const local=zt.root.worldToLocal(Xt.root.position.clone()),corner=Es(new L(Math.max(1.62,local.x),0,local.z));corner.y=Je.height(corner.x,corner.z);
    const distance=Xt.root.position.distanceTo(corner)+corner.distanceTo(pad);
    Le={kind:'enter',phase:'approach',time:0,from:Xt.root.position.clone(),corner,pad,approachDuration:Math.max(.3,distance/1.55),yaw:Xt.root.rotation.y};
    Te='entering';Ni.set(0,0,0);Ue.clear();pe.x=pe.y=0;Fi='chase';Er=uc(Xe,Wn);
  }else if(Te==='driving'){
    if(Math.abs(le)>.6){hi('Stop the car before getting out.');return;}
    const pad=driverPad();if(!clearPad(pad)){hi('Move the Jeep so the driverâ€™s door has room to open.');return;}
    le=0;bn.attach(Xt.root);Le={kind:'exit',phase:'open',time:0,pad};Te='exiting';Fi='chase';Ue.clear();pe.x=pe.y=0;
    zt.setOpen('driver',true);
  }
};
oe('action').addEventListener('click',Uu);
function nextPhase(phase){Le.phase=phase;Le.time=0;}
s_=function(dt){
  Le.time+=dt;const t=Le.time;
  if(Le.phase==='approach'){
    const previous=Xt.root.position.clone(),d1=Le.from.distanceTo(Le.corner),d2=Le.corner.distanceTo(Le.pad),distance=Mn(t/Le.approachDuration,0,1)*(d1+d2);
    Xt.root.position.copy(distance<d1?lerpPoint(Le.from,Le.corner,distance/Math.max(.001,d1)):lerpPoint(Le.corner,Le.pad,(distance-d1)/Math.max(.001,d2)));
    Xt.root.position.y=Je.height(Xt.root.position.x,Xt.root.position.z);
    const delta=Xt.root.position.clone().sub(previous),speed=delta.length()/dt;
    if(speed>.1)Xt.root.rotation.y+=uc(Xt.root.rotation.y,Math.atan2(delta.x,delta.z))*(1-Math.exp(-12*dt));
    Xt.animate(dt,speed,0);
    if(t>=Le.approachDuration){Le.yaw=Xt.root.rotation.y;nextPhase('reach');}
  }else if(Le.phase==='reach'){
    Xt.root.position.copy(Le.pad);Xt.root.rotation.y=Le.yaw+uc(Le.yaw,Xe-Math.PI/2)*ease(0,.4,t);
    Xt.animate(dt,0,0);const feet=transitionFeet(0);
    Xt.poseMotion({label:'Reach for door',lean:.08*ease(0,.4,t),feet:{Left:contact(feet.Left),Right:contact(feet.Right)},hands:{Right:contact(handlePoint(),ease(0,.4,t))}});
    if(t>=.45){zt.setOpen('driver',true);nextPhase('open');}
  }else if(Le.phase==='open'){
    if(Le.kind==='enter'){
      Xt.animate(dt,0,0);const feet=transitionFeet(0);
      Xt.poseMotion({label:'Open driver door',feet:{Left:contact(feet.Left),Right:contact(feet.Right)},hands:{Right:contact(handlePoint(),1-ease(.25,.65,t))}});
    }else Xt.animate(dt,0,1);
    if(t>=.68)nextPhase('climb');
  }else if(Le.phase==='climb'){
    const progress=Mn(t/2.05,0,1);climbingPose(dt,Le.kind==='enter'?progress:1-progress);
    if(progress>=1){zt.setOpen('driver',false);nextPhase('close');}
  }else{
    if(Le.kind==='enter')Xt.animate(dt,0,1);
    else{Xt.root.position.copy(Le.pad);Xt.animate(dt,0,0);}
    Xt.poseMotion({label:'Close driver door',hands:{[Le.kind==='enter'?'Left':'Right']:contact(handlePoint(),.65*Math.sin(Math.PI*Mn(t/.5,0,1)))}});
    if(t>=.5){
      if(Le.kind==='enter'){
        zt.root.attach(Xt.root);Xt.root.position.copy(wu);Xt.root.rotation.set(0,0,0);Xt.animate(0,0,1);Te='driving';ui||zt.startEngine().catch(()=>hi('Engine sound unavailable.'));
      }else{Te='walking';Wn=Xe-Math.PI/2;Ni.set(0,0,0);zt.stopEngine();Xt.animate(0,0,0);}
      Le=null;
    }
  }
};
const movementState=window.expedition.getState;
window.expedition.getState=()=>({...movementState(),jumpPhase,transition:Le?{kind:Le.kind,phase:Le.phase,time:Le.time}:null});
window.expedition.reset=Oa;
