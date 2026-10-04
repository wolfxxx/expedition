// Supplied heavy sniper rifle, bipod-mounted in the middle of the lookout deck.
// E beside it: lie prone behind the stock. Drag or W/A/S/D: aim. Z or right-click: scope (wheel zooms).
// Left-click or Space: fire (bolt action). E: get up.
//
// The rifle pivots about its butt, so a lying shooter sweeps a circle of 1.5 m around the deck centre,
// which fits inside the 1.65 m clear half-width of the rails at every heading.
var rifleBusy=false; // mounting, aiming or getting up: read by jumping, punching and footsteps
let lookoutRifle=null;
const RIFLE={
 length:1.55,butt:.31,bipod:.915,           // metres; height of the stock centre above the deck; butt-to-bipod distance
 restYaw:Math.atan2(-40,-30),               // resting heading: down the valley towards Mirror Spring
 back:1.37,side:.15,                        // feet are this far behind the butt, body this far left of the bore line
 pitchMin:-.55,pitchMax:.35,                // aim limits, radians
 cycle:1.6,damage:50,range:320,             // seconds per bolt cycle; dwarf health lost per hit; metres
 right:[-.43,.175,0],left:[-.72,.19,0],     // hand targets, in rifle coordinates (x forward, y up, z right)
 eye:[-.43,.462,0],muzzle:[.82,.35,0]
};
const rifleMount=new ee();rifleMount.name='Rifle mount';rifleMount.rotation.order='YXZ';bn.add(rifleMount);
const rifleReady=HumanRuntime.loadProp('__RIFLE_GLB__',RIFLE.length).then(model=>{
 lookoutRifle=model;model.name='Heavy sniper rifle · lookout';
 // The prop is modelled along +x; turn it to +z so the mount's yaw is the compass heading used by the player.
 model.rotation.y=-Math.PI/2;model.position.set(0,-RIFLE.butt,RIFLE.length/2);rifleMount.add(model);
 placeRifle();return model;
});

const rifle={mode:'idle',t:0,prone:0,yaw:RIFLE.restYaw,pitch:0,kick:0,recoil:0,scoped:false,scope:0,zoom:6,cooldown:0,
 shots:0,hits:0,last:null,range:null,start:{x:0,z:0,yaw:0},held:{yaw:0,pitch:0}};
const rifleDeck=()=>lookoutTop+.015;
const aimDir=(yaw=rifle.yaw,pitch=rifle.pitch)=>new L(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
const rifleAt=(p,out=new L())=>{rifleMount.updateMatrixWorld(true);return lookoutRifle.localToWorld(out.set(p[0],p[1],p[2]));};
const lerp=(a,b,t)=>a+(b-a)*t;

// Feet position of the lying body for a heading: behind the butt, a little left so the bore line passes the right shoulder.
function bodyRoot(yaw=rifle.yaw){
 const s=Math.sin(yaw),c=Math.cos(yaw);
 return new L(tx-s*RIFLE.back+c*RIFLE.side,lookoutTop,tz-c*RIFLE.back-s*RIFLE.side);
}
// The rifle model follows the aim up to a limit; below the limit the butt rises so the bipod never sinks into the deck.
function placeRifle(){
 const pitch=Mn(rifle.pitch+rifle.kick,-.16,.16),s=Math.sin(rifle.yaw),c=Math.cos(rifle.yaw);
 const lift=Math.max(RIFLE.butt,RIFLE.butt*Math.cos(pitch)-RIFLE.bipod*Math.sin(pitch));
 rifleMount.position.set(tx-s*rifle.recoil*.10,rifleDeck()+lift,tz-c*rifle.recoil*.10);
 rifleMount.rotation.set(-pitch,rifle.yaw,0);
}

// ---- interaction -------------------------------------------------------------------------------------------------
const rifleReach=()=>!!lookoutRifle&&rifle.mode==='idle'&&Te==='walking'&&!Le&&jumpPhase==='grounded'
 &&Math.abs(Xt.root.position.y-lookoutTop)<.3&&Math.hypot(Xt.root.position.x-tx,Xt.root.position.z-tz)<2.1;
// Mouse-look: the pointer is captured while aiming so no button has to be held. Esc frees it; dragging still aims then.
const mouseLocked=()=>document.pointerLockElement===rifleCanvas;
function lockMouse(){lookCapture();}
function freeMouse(){} // the capture stays on after getting up: it is now the normal way to look around (Esc frees it)
function mountRifle(){
 if(!rifleReach()||dc())return false;
 const p=Xt.root.position;Object.assign(rifle.start,{x:p.x,z:p.z,yaw:Xt.root.rotation.y});
 rifle.held.yaw=Wn;rifle.held.bs=bs;rifle.held.Da=Da;Ni.set(0,0,0);Ue.clear();pe.x=pe.y=0;Xt.setElevationOffset(0);
 rifle.camFrom={pos:Ze.position.clone(),at:Ze.position.clone().addScaledVector(Ze.getWorldDirection(new L()),8)};
 rifle.mode='mounting';rifle.t=0;rifleBusy=true;lockMouse();return true;
}
function dismountRifle(){
 if(rifle.mode!=='aiming')return false;
 rifle.mode='dismounting';rifle.t=0;rifle.scoped=false;freeMouse();return true;
}
function endRifle(){
 rifle.mode='idle';rifle.t=0;rifle.prone=0;rifle.scoped=false;rifle.scope=0;rifle.cooldown=0;rifle.kick=rifle.recoil=0;
 rifle.yaw=RIFLE.restYaw;rifle.pitch=0;rifleBusy=false;freeMouse();
 if(lookoutRifle)lookoutRifle.visible=true;Xt.setFirstPerson(false);Xt.animate(0,0,0);placeRifle();
}
function toggleScope(on=!rifle.scoped){if(rifle.mode==='aiming')rifle.scoped=on;}

// ---- character -----------------------------------------------------------------------------------------------------
function rifleStep(dt){
 const root=Xt.root,feet=bodyRoot();
 rifle.cooldown=Math.max(0,rifle.cooldown-dt);
 rifle.recoil*=Math.exp(-dt*6);rifle.kick*=Math.exp(-dt*5);
 let handWeight=0;
 if(rifle.mode==='mounting'){
  rifle.t+=dt;const t=rifle.t,walk=ease(0,.55,t),before=root.position.clone();
  root.position.set(lerp(rifle.start.x,feet.x,walk),lookoutTop,lerp(rifle.start.z,feet.z,walk));
  root.rotation.y=rifle.start.yaw+uc(rifle.start.yaw,rifle.yaw)*ease(.05,.55,t);
  rifle.prone=ease(.55,1.5,t);handWeight=ease(.9,1.5,t);
  Xt.animate(dt,t<.55?before.distanceTo(root.position)/dt:0,0);
  if(t>=1.5){rifle.mode='aiming';rifle.prone=1;handWeight=1;}
 }else if(rifle.mode==='dismounting'){
  rifle.t+=dt;rifle.prone=1-ease(0,.9,rifle.t);handWeight=1-ease(0,.4,rifle.t);
  root.position.copy(feet);root.rotation.y=rifle.yaw;Xt.animate(dt,0,0);
  if(rifle.t>=.9){
   Wn=rifle.yaw;bs=.29;Da=rifle.held.Da||6;rifle.mode='idle';rifle.prone=0;rifleBusy=false;rifle.scope=0;
   lookoutRifle.visible=true;Xt.setFirstPerson(false);Xt.animate(0,0,0);return;
  }
 }else{
  const input=Nu(),zoom=rifle.scope>.5?55/scopeFov():1;
  rifle.yaw-=input.x*dt*.7/zoom;rifle.pitch=Mn(rifle.pitch+input.y*dt*.45/zoom,RIFLE.pitchMin,RIFLE.pitchMax);
  root.position.copy(feet);root.rotation.y=rifle.yaw;handWeight=1;Xt.animate(dt,0,0);
 }
 placeRifle();
 // The right hand wraps the pistol grip (handshake grip: fingers forward, palm facing left); the left hand cups the butt from below.
 const q=rifleMount.quaternion,forward=new L(0,0,1).applyQuaternion(q),left=new L(1,0,0).applyQuaternion(q),up=new L(0,1,0).applyQuaternion(q);
 Xt.poseMotion({label:'Prone at rifle',prone:{amount:rifle.prone,lift:.15},fist:{Right:.7*handWeight,Left:.45*handWeight},hands:{
  Right:{position:rifleAt(RIFLE.right).toArray(),world:true,weight:handWeight,pole:[-.55,-.75,-.15],orient:{fingers:forward.toArray(),palm:left.toArray()}}, // elbows splay out and rest on the deck
  Left:{position:rifleAt(RIFLE.left).toArray(),world:true,weight:handWeight,pole:[.9,-.15,-.4],orient:{fingers:forward.toArray(),palm:up.toArray()}}}});
}
const rifleWalking=t_;
t_=function(dt){if(rifle.mode==='idle')rifleWalking(dt);else rifleStep(dt);};

// ---- camera: chase view behind the shooter, or down the scope -------------------------------------------------------
const scopeFov=()=>Math.max(2.5,55/rifle.zoom);
const chase=new L(),chaseAim=new L(),eyePos=new L(),eyeAim=new L();
function rifleCamera(dt,snap){
 const s=Math.sin(rifle.yaw),c=Math.cos(rifle.yaw);
 // chase: just behind the heels and above the lying body, inside the rails, looking along the rifle
 const flat=Math.tan(Mn(rifle.pitch,-.5,.35));
 chaseAim.set(tx+s*1.3,rifleDeck()+.30+1.3*flat,tz+c*1.3);
 chase.set(tx-s*1.62,rifleDeck()+1.12,tz-c*1.62);
 // scope: at the eyepiece, looking along the true aim
 rifleAt(RIFLE.eye,eyePos);eyeAim.copy(eyePos).addScaledVector(aimDir(rifle.yaw,rifle.pitch+rifle.kick),10);
 rifle.scope=Mn(rifle.scope+(rifle.scoped?1:-1)*dt*5,0,1);
 const k=rifle.scope*rifle.scope*(3-2*rifle.scope),at=new L().lerpVectors(chaseAim,eyeAim,k),pos=new L().lerpVectors(chase,eyePos,k);
 const fov=lerp(58,scopeFov(),k);
 if(rifle.mode==='mounting'){ // glide from the walking camera while getting down
  const w=ease(.3,1.5,rifle.t);pos.lerpVectors(rifle.camFrom.pos,pos,w);at.lerpVectors(rifle.camFrom.at,at,w);Ze.position.copy(pos);
 }else if(rifle.mode==='dismounting'){ // glide out to the normal walking camera while standing up
  const w=ease(0,.9,rifle.t),p=Xt.root.position,ty=p.y+1.18,da=rifle.held.Da||6;
  pos.lerp(new L(p.x-s*da*Math.cos(.29),ty+Math.sin(.29)*da+.45,p.z-c*da*Math.cos(.29)),w);at.lerp(new L(p.x,ty,p.z),w);Ze.position.copy(pos);
 }else if(snap||rifle.scope>.98)Ze.position.copy(pos);else Ze.position.lerp(pos,1-Math.exp(-14*dt));
 Ze.up.set(0,1,0);if(Math.abs(Ze.fov-fov)>.01){Ze.fov=fov;Ze.updateProjectionMatrix();}
 Ze.lookAt(at);
 // hide the body and rifle while looking through the scope so neither fills the lens
 const hidden=rifle.scope>.9;Xt.setFirstPerson(hidden);if(lookoutRifle)lookoutRifle.visible=!hidden;
}
const rifleCameraBase=fc;
fc=function(dt,snap=false){if(rifle.mode==='idle')rifleCameraBase(dt,snap);else rifleCamera(dt,snap);};

// ---- shooting ------------------------------------------------------------------------------------------------------
function cylinderHit(o,d,cx,cz,r,y0,y1,max){
 const ox=o.x-cx,oz=o.z-cz,a=d.x*d.x+d.z*d.z;if(a<1e-9)return Infinity;
 const b=ox*d.x+oz*d.z,disc=b*b-a*(ox*ox+oz*oz-r*r);if(disc<0)return Infinity;
 const q=Math.sqrt(disc);
 for(const t of [(-b-q)/a,(-b+q)/a]){if(t<0||t>max)continue;const y=o.y+d.y*t;if(y>=y0&&y<=y1)return t;}
 return Infinity;
}
// Nearest thing along a ray: the dwarf, a tree or rock, or the ground.
function castShot(o,d,max=RIFLE.range){
 let best={distance:max,kind:'sky'};
 const dwarf=poisonDwarf.state();
 if(!dwarf.defeated){
  const p=poisonDwarf.root.position,t=cylinderHit(o,d,p.x,p.z,.42,p.y,p.y+1.45,best.distance);
  if(t<best.distance)best={distance:t,kind:'dwarf'};
 }
 for(const c of world.colliders){
  if(Math.hypot(c.x-o.x,c.z-o.z)>best.distance+c.r)continue;
  const t=cylinderHit(o,d,c.x,c.z,c.r,c.y,c.y+c.height,best.distance);
  if(t<best.distance)best={distance:t,kind:'obstacle'};
 }
 // terrain: march in 0.75 m steps, then bisect the crossing
 let prev=0;
 for(let t=.75;t<=best.distance+.75;t+=.75){
  const tt=Math.min(t,best.distance);
  if(o.y+d.y*tt<world.height(o.x+d.x*tt,o.z+d.z*tt)){
   let lo=prev,hi=tt;for(let i=0;i<6;i++){const m=(lo+hi)/2;if(o.y+d.y*m<world.height(o.x+d.x*m,o.z+d.z*m))hi=m;else lo=m;}
   if(hi<best.distance)best={distance:hi,kind:'ground'};break;
  }
  prev=tt;if(tt>=best.distance)break;
 }
 best.point=o.clone().addScaledVector(d,best.distance);return best;
}
// Short-lived effects: muzzle flash, tracer, smoke and dust.
const fxList=[],fxSphere=new An(1,8,6),fxBox=new Oe(1,1,1);
function fxAdd(mesh,life,update){mesh.castShadow=false;mesh.receiveShadow=false;bn.add(mesh);fxList.push({mesh,life,age:0,update});return mesh;}
function puff(point,color,size,life,rise=.3,opacity=.75){
 const m=new ie(fxSphere,new be({color,roughness:1,transparent:true,opacity}));m.position.copy(point);
 fxAdd(m,life,(f,u)=>{m.scale.setScalar(size*(.25+.75*Math.sqrt(u)));m.position.y+=rise*(1/60);m.material.opacity=opacity*(1-u);});
}
function flash(point,dir){
 const m=new ie(fxSphere,new be({color:'#fff2c9',emissive:new Wt('#ffb04a'),emissiveIntensity:4,roughness:1,transparent:true,opacity:1}));
 m.position.copy(point);m.lookAt(point.clone().add(dir));
 fxAdd(m,.07,(f,u)=>{m.scale.set(.17*(1-u*.4),.17*(1-u*.4),.75*(1-u*.3));m.material.opacity=1-u;});
}
function tracer(from,to){
 const length=from.distanceTo(to);if(length<.5)return;
 const m=new ie(fxBox,new be({color:'#fff6df',emissive:new Wt('#ffd48a'),emissiveIntensity:3,roughness:1,transparent:true,opacity:.9}));
 m.position.copy(from).lerp(to,.5);m.lookAt(to);m.scale.set(.05,.05,length);
 fxAdd(m,.22,(f,u)=>{m.material.opacity=.9*(1-u);m.scale.x=m.scale.y=.05*(1-u*.6);});
}
function stepEffects(dt){
 for(let i=fxList.length-1;i>=0;i--){
  const f=fxList[i];f.age+=dt;const u=Math.min(1,f.age/f.life);f.update(f,u);
  if(u>=1){f.mesh.removeFromParent();f.mesh.material.dispose();fxList.splice(i,1);}
 }
}
const rifleFx=Fu;Fu=function(dt){rifleFx(dt);stepEffects(dt);};

function fireRifle(){
 if(rifle.mode!=='aiming'||rifle.cooldown>0||!lookoutRifle)return false;
 rifle.cooldown=RIFLE.cycle;rifle.shots++;
 placeRifle();
 const dir=aimDir(),origin=rifleAt(RIFLE.eye),muzzle=rifleAt(RIFLE.muzzle);
 const hit=castShot(origin,dir);
 rifle.last={kind:hit.kind,distance:hit.distance,point:hit.point.toArray()};
 rifle.recoil=1;rifle.kick=.05;rifle.pitch=Mn(rifle.pitch+.012,RIFLE.pitchMin,RIFLE.pitchMax);
 flash(muzzle.clone().addScaledVector(dir,.1),dir);if(rifle.scope<.5)puff(muzzle.clone().addScaledVector(dir,.3),'#d9d9d0',.4,1.6,.4,.4); // not through the lens
 tracer(muzzle,hit.point);valleyAudio.shot();
 const delay=hit.distance/343*1000;
 if(hit.kind==='dwarf'){
  const took=poisonDwarf.damage(RIFLE.damage);rifle.hits++;
  puff(hit.point,'#ffe6b0',.45,.3,.1,.9);
  const d=poisonDwarf.state();showHit(d.defeated?'Mosswick · knocked out':'Mosswick · '+d.health+' / 100');
  setTimeout(()=>valleyAudio.punch('impact'),delay);
 }else if(hit.kind!=='sky'){
  puff(hit.point,hit.kind==='ground'?'#cdbd90':'#9b8a68',.9,1.1,.35,.7);
  setTimeout(()=>valleyAudio.rifleImpact(),delay);
 }
 return true;
}
// Range to whatever is under the crosshair, for the readout.
function updateRange(){
 if(rifle.mode!=='aiming'||!lookoutRifle)return;
 const hit=castShot(rifleAt(RIFLE.eye),aimDir());rifle.range=hit.kind==='sky'?null:hit.distance;
}

// ---- input -------------------------------------------------------------------------------------------------------
addEventListener('keydown',e=>{
 if(rifle.mode!=='aiming'||e.repeat)return;
 if(e.code==='Space')fireRifle();else if(e.code==='KeyZ')toggleScope();
});
const rifleCanvas=Ae.domElement;let rifleDrag=null;
rifleCanvas.addEventListener('contextmenu',e=>{if(rifle.mode!=='idle')e.preventDefault();});
rifleCanvas.addEventListener('pointerdown',e=>{
 if(rifle.mode!=='aiming')return;
 if(e.button===2){toggleScope();return;}
 if(e.button!==0)return;
 if(mouseLocked()){fireRifle();return;} // captured mouse: a press is simply a shot
 lockMouse(); // first click re-captures the mouse (after Esc); it also counts as a click
 rifleDrag={id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now(),drag:false};
});
rifleCanvas.addEventListener('pointermove',e=>{
 if(rifle.mode==='idle')return;
 Wn=rifle.held.yaw;bs=rifle.held.bs; // the walking camera must not follow a drag made while aiming
 if(rifle.mode==='aiming'&&mouseLocked()){
  const zoom=rifle.scope>.5?55/scopeFov():1;
  rifle.yaw-=e.movementX*.0030/zoom;rifle.pitch=Mn(rifle.pitch-e.movementY*.0022/zoom,RIFLE.pitchMin,RIFLE.pitchMax);return;
 }
 if(!rifleDrag||e.pointerId!==rifleDrag.id)return;
 const dx=e.clientX-rifleDrag.x,dy=e.clientY-rifleDrag.y;
 if(Math.hypot(dx,dy)>6)rifleDrag.drag=true;
 if(rifle.mode!=='aiming'||!rifleDrag.drag)return;
 rifleDrag.x=e.clientX;rifleDrag.y=e.clientY;
 const zoom=rifle.scope>.5?55/scopeFov():1;
 rifle.yaw-=dx*.0042/zoom;rifle.pitch=Mn(rifle.pitch-dy*.003/zoom,RIFLE.pitchMin,RIFLE.pitchMax);
});
rifleCanvas.addEventListener('pointerup',e=>{
 if(rifleDrag&&e.pointerId===rifleDrag.id){if(!rifleDrag.drag&&performance.now()-rifleDrag.time<350)fireRifle();rifleDrag=null;}
});
rifleCanvas.addEventListener('pointercancel',()=>rifleDrag=null);addEventListener('blur',()=>rifleDrag=null);
rifleCanvas.addEventListener('wheel',e=>{if(rifle.mode==='aiming'&&rifle.scoped)rifle.zoom=Mn(rifle.zoom*Math.exp(-e.deltaY*.0015),3,16);},{passive:true});

const rifleInteract=Uu;
oe('action').removeEventListener('click',rifleInteract);
Uu=function(){
 if(rifle.mode==='aiming')return void dismountRifle();
 if(rifle.mode!=='idle')return;
 if(!dc()&&mountRifle())return;
 rifleInteract();
};
oe('action').addEventListener('click',Uu);
const rifleReset=Oa;Oa=function(){rifleReset();endRifle();};window.expedition.reset=Oa;

// ---- interface -----------------------------------------------------------------------------------------------------
const rifleStyle='position:fixed;pointer-events:none;color:#e7e9cf;font:13px sans-serif;';
const rifleHint=document.createElement('button');
rifleHint.style=rifleStyle+'left:50%;bottom:160px;transform:translateX(-50%);padding:11px 18px;border-radius:12px;border:0;background:#172921ee;pointer-events:auto;cursor:pointer;display:none;font-size:14px';
rifleHint.innerHTML='<kbd style="border:1px solid #8a9a7b;border-radius:5px;padding:1px 6px;margin-right:8px">E</kbd>Lie down at the sniper rifle';
rifleHint.addEventListener('click',()=>mountRifle());document.body.append(rifleHint);
const rifleHud=document.createElement('div');
rifleHud.style=rifleStyle+'left:50%;bottom:34px;transform:translateX(-50%);padding:9px 16px;border-radius:12px;background:#172921dd;display:none;text-align:center;line-height:1.5;z-index:6';
document.body.append(rifleHud);
// On-screen buttons for touch players, who have no Z key or right mouse button.
const rifleButtons=document.createElement('div');
rifleButtons.style=rifleStyle+'left:50%;bottom:104px;transform:translateX(-50%);display:none;gap:8px;z-index:6';
for(const [label,action] of [['Scope',()=>toggleScope()],['Fire',()=>fireRifle()],['Get up',()=>dismountRifle()]]){
 const b=document.createElement('button');b.textContent=label;
 b.style='pointer-events:auto;padding:8px 18px;border-radius:10px;border:0;background:#172921ee;color:#e7e9cf;font:13px sans-serif;cursor:pointer';
 b.addEventListener('click',e=>{e.stopPropagation();action();});rifleButtons.append(b);
}
document.body.append(rifleButtons);
const hitHud=document.createElement('div');
hitHud.style=rifleStyle+'left:50%;top:58%;transform:translateX(-50%);padding:6px 14px;border-radius:10px;background:#7a2a1ecc;display:none;font-size:14px;z-index:6';
document.body.append(hitHud);let hitUntil=0;
function showHit(text){hitHud.textContent=text;hitHud.style.display='block';hitUntil=Fa+2.5;}
// Crosshair for the chase view (placed where the bullet will go) and the scope reticle.
const crosshair=document.createElement('div');
crosshair.style=rifleStyle+'z-index:5;width:22px;height:22px;margin:-11px 0 0 -11px;display:none;background:'
 +'linear-gradient(#fff,#fff) 50% 0/2px 7px no-repeat,linear-gradient(#fff,#fff) 50% 100%/2px 7px no-repeat,'
 +'linear-gradient(#fff,#fff) 0 50%/7px 2px no-repeat,linear-gradient(#fff,#fff) 100% 50%/7px 2px no-repeat;filter:drop-shadow(0 0 2px #000)';
document.body.append(crosshair);
const reticle=document.createElement('div');
reticle.style=rifleStyle+'inset:0;z-index:4;display:none;background:radial-gradient(circle at 50% 50%,transparent 0,transparent 41vmin,#000 41.4vmin)';
reticle.innerHTML='<svg viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;width:100%;height:100%" stroke="#0b0d0a" stroke-width=".35" fill="#0b0d0a">'
 +'<path d="M-82 0H-6M6 0H82M0 -82V-6M0 6V82"/><path d="M-82 0H-30M30 0H82M0 -82V-30M0 30V82" stroke-width=".9"/>'
 +[-40,-30,-20,-10,10,20,30,40].map(v=>`<circle cx="${v}" cy="0" r=".8" stroke="none"/><circle cx="0" cy="${v}" r=".8" stroke="none"/>`).join('')
 +'<circle cx="0" cy="0" r=".5" stroke="none"/></svg>';
document.body.append(reticle);
const rifleProject=new L();
function updateRifleHud(){
 const active=rifle.mode!=='idle';
 rifleHint.style.display=!active&&rifleReach()&&!dc()?'block':'none';
 rifleHud.style.display=rifle.mode==='aiming'?'block':'none';
 rifleButtons.style.display=rifle.mode==='aiming'?'flex':'none';
 reticle.style.display=active&&rifle.scope>.02?'block':'none';reticle.style.opacity=Mn(rifle.scope*1.4,0,1);
 crosshair.style.display=rifle.mode==='aiming'&&rifle.scope<.5?'block':'none';
 if(crosshair.style.display==='block'){
  rifleProject.copy(rifleAt(RIFLE.eye)).addScaledVector(aimDir(),80).project(Ze);
  crosshair.style.left=(rifleProject.x*.5+.5)*innerWidth+'px';crosshair.style.top=(-rifleProject.y*.5+.5)*innerHeight+'px';
 }
 if(hitHud.style.display==='block'&&Fa>hitUntil)hitHud.style.display='none';
 if(rifle.mode==='aiming'){
  updateRange();
  const ready=rifle.cooldown<=0;
  rifleHud.innerHTML=(rifle.range?'Range <b>'+Math.round(rifle.range)+' m</b>':'Range <b>—</b>')+' · '+(rifle.scoped?'Scope <b>'+rifle.zoom.toFixed(1)+'×</b>':'Scope off')+' · '
   +(ready?'<b style="color:#a2d95f">Ready</b>':'<span style="color:#e0b070">Cycling bolt…</span>')
   +'<br><span style="opacity:.8">'+(mouseLocked()?'Mouse aims · Esc frees the mouse':'Click to capture the mouse · or drag / W A S D')+' · Click / Space fire · Z or right-click scope · Wheel zoom · E get up</span>';
 }
}
const rifleHudBase=pc;
pc=function(){
 rifleHudBase();updateRifleHud();
 if(rifle.mode==='idle')return;
 oe('mode').textContent={mounting:'GETTING DOWN',aiming:'PRONE · RIFLE',dismounting:'GETTING UP'}[rifle.mode];
 oe('controlTitle').textContent='SNIPER RIFLE';
 oe('controlText').innerHTML='<kbd>Mouse</kbd> Aim <span>·</span> <kbd>Click</kbd> Fire<br><kbd>Z</kbd> Scope <span>·</span> <kbd>E</kbd> Get up';
 oe('action').hidden=true;oe('boost').hidden=true;
};
const rifleState=window.expedition.getState;
window.expedition.getState=()=>({...rifleState(),
 lookoutRifle:lookoutRifle?{loaded:true,position:rifleMount.position.toArray(),...lookoutRifle.userData}:{loaded:false},
 rifle:{mode:rifle.mode,prone:rifle.prone,yaw:rifle.yaw,pitch:rifle.pitch,scoped:rifle.scoped,scope:rifle.scope,zoom:rifle.zoom,
  cooldown:rifle.cooldown,shots:rifle.shots,hits:rifle.hits,last:rifle.last,range:rifle.range}});
window.expedition.rifle={mount:mountRifle,dismount:dismountRifle,fire:fireRifle,scope:toggleScope,reach:rifleReach,cast:castShot,
 aim(yaw,pitch){rifle.yaw=yaw;rifle.pitch=Mn(pitch,RIFLE.pitchMin,RIFLE.pitchMax);},
 eye:()=>rifleAt(RIFLE.eye).toArray(),muzzle:()=>rifleAt(RIFLE.muzzle).toArray(),bodyRoot:y=>bodyRoot(y).toArray(),
 tune:RIFLE,mount3:rifleMount,model:()=>lookoutRifle};
