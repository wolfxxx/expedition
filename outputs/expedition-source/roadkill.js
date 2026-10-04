// Mosswick meets the Jeep. Hit him at speed and he is launched, tumbling, in a burst of shattered potions,
// with a slow-motion beat, a camera slam and a crash. R brings him back.
const roadkill={hits:0,shake:0,slow:0,cam:0,last:null,killCam:new L(),basePos:new L()};
const ROADKILL={minSpeed:2,halfWidth:1.30,rear:-2.3,front:2.5,slowSeconds:.85,slowScale:.28,camSeconds:2.6};

// ---- collision --------------------------------------------------------------------------------------------------------
function carHitsDwarf(){
 if(Te!=='driving'||Math.abs(le)<ROADKILL.minSpeed||poisonDwarf.state().defeated)return null;
 zt.root.updateMatrixWorld(true);
 const p=poisonDwarf.root.position,local=zt.root.worldToLocal(new L(p.x,zt.root.position.y,p.z));
 return Math.abs(local.x)<ROADKILL.halfWidth&&local.z>ROADKILL.rear&&local.z<ROADKILL.front?local:null;
}

// ---- debris ---------------------------------------------------------------------------------------------------------------
const rkCylinder=new en(1,1,1,8);
// A piece that flies under gravity, bounces, comes to rest and fades.
function chunk(geometry,color,glow,from,velocity,spin,size,life){
 const m=new ie(geometry,new be({color,roughness:.7,emissive:new Wt(glow||'#000000'),emissiveIntensity:glow?2.2:0,transparent:true,opacity:1}));
 m.position.copy(from);m.scale.copy(size);m.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);
 const v=velocity.clone(),w=spin.clone();
 fxAdd(m,life,(f,u)=>{
  const dt=f.age-(f.last||0);f.last=f.age;
  v.y-=15*dt;m.position.addScaledVector(v,dt);m.rotation.x+=w.x*dt;m.rotation.y+=w.y*dt;m.rotation.z+=w.z*dt;
  const floor=world.height(m.position.x,m.position.z)+size.y*.5;
  if(m.position.y<floor){m.position.y=floor;if(Math.abs(v.y)>1.5){v.y*=-.35;v.x*=.6;v.z*=.6;w.multiplyScalar(.6);}else{v.set(0,0,0);w.set(0,0,0);}}
  if(u>.75)m.material.opacity=1-(u-.75)/.25;
 });
}
const rnd=(a,b)=>a+Math.random()*(b-a);
function scatter(point,heading,speed){
 const up=new L(0,1,0);
 // everything he was carrying
 chunk(rkCylinder,'#5a4330',null,point.clone().add(up),heading.clone().multiplyScalar(speed*.7).add(new L(rnd(-2,2),rnd(5,9),rnd(-2,2))),new L(rnd(-9,9),rnd(-9,9),rnd(-9,9)),new L(.035,1.3,.035),4);
 for(let i=0;i<5;i++)chunk(fxSphere,'#7be03a','#8dff35',point.clone().add(up),heading.clone().multiplyScalar(speed*rnd(.3,.9)).add(new L(rnd(-4,4),rnd(4,10),rnd(-4,4))),new L(rnd(-12,12),rnd(-12,12),rnd(-12,12)),new L(.07,.09,.07),3.5);
 for(let i=0;i<6;i++)chunk(fxBox,'#263b32',null,point.clone().add(up),heading.clone().multiplyScalar(speed*rnd(.2,.7)).add(new L(rnd(-5,5),rnd(3,9),rnd(-5,5))),new L(rnd(-14,14),rnd(-14,14),rnd(-14,14)),new L(rnd(.12,.24),.025,rnd(.1,.18)),3);
 // shattered glass and splashed poison
 for(let i=0;i<34;i++)chunk(fxBox,'#a4ff4a','#7dff2a',point.clone().add(up),heading.clone().multiplyScalar(speed*rnd(0,.8)).add(new L(rnd(-6,6),rnd(2,11),rnd(-6,6))),new L(rnd(-20,20),rnd(-20,20),rnd(-20,20)),new L(.045,.045,.045),rnd(1.2,2.4));
 for(let i=0;i<9;i++){
  const o=point.clone().add(new L(rnd(-.5,.5),rnd(.6,1.4),rnd(-.5,.5)));
  puff(o,i%3?'#9be05a':'#cfe9b0',rnd(.7,1.3),rnd(1.1,1.9),rnd(.5,1.4),.7);
 }
 puff(point.clone().add(up),'#ffffff',1.6,.25,.2,.9); // the flash of the impact itself
 splash(point);
}
// a ring of poison that spreads across the ground
function splash(point){
 const m=new ie(rkCylinder,new be({color:'#8cff3a',emissive:new Wt('#6cdc1c'),emissiveIntensity:1.5,roughness:1,transparent:true,opacity:.8}));
 m.position.set(point.x,world.height(point.x,point.z)+.04,point.z);
 fxAdd(m,1.4,(f,u)=>{const r=.5+3.2*Math.sqrt(u);m.scale.set(r,.02,r);m.material.opacity=.8*(1-u);});
}

// ---- the hit ----------------------------------------------------------------------------------------------------------------
function runDown(local){
 const speed=Math.abs(le),sign=le<0?-1:1,heading=new L(Math.sin(Xe)*sign,0,Math.cos(Xe)*sign),side=new L(Math.cos(Xe),0,-Math.sin(Xe));
 const launch=heading.clone().multiplyScalar(speed*1.05+3).addScaledVector(side,local.x*3.2);launch.y=7+Math.min(speed,27)*.5;
 const at=poisonDwarf.root.position.clone();
 poisonDwarf.fling(launch);
 scatter(at,heading,speed);
 valleyAudio.crash();
 le*=.7;                                // the Jeep shrugs it off, but not entirely
 roadkill.hits++;roadkill.shake=1;roadkill.slow=ROADKILL.slowSeconds;
 // kill-cam: a spot beside the road and a little ahead of the impact, looking back at the flight
 roadkill.cam=ROADKILL.camSeconds;roadkill.basePos.copy(Ze.position);
 roadkill.killCam.copy(at).addScaledVector(side,(local.x>=0?-1:1)*9).addScaledVector(heading,9);roadkill.killCam.y=Math.max(at.y+2.6,world.height(roadkill.killCam.x,roadkill.killCam.z)+2.2);
 roadkill.last={speed,at:at.toArray(),launch:launch.toArray()};
 hi('Mosswick has been flattened.');
}
poisonDwarf.onLand=(point,impact,bounce)=>{
 if(impact>0){puff(point.clone().add(new L(0,.2,0)),'#cdbd90',.9+.2*bounce,.9,.4,.6);splash(point);}
 else puff(point.clone().add(new L(0,.3,0)),'#9be05a',1.3,1.4,.5,.65); // final slump
};

poisonDwarf.onRespawn=point=>{puff(point.clone().add(new L(0,.5,0)),'#9be05a',1.2,1.2,.6,.7);splash(point);valleyAudio.punch('swing');hi('Mosswick is back on his feet.');};

// slow motion for the beat after impact, and the car check once per step
const roadkillStep=Fu;
Fu=function(dt){
 if(roadkill.slow>0){
  // ease back to full speed over the last third
  const k=roadkill.slow/ROADKILL.slowSeconds,scale=k>.35?ROADKILL.slowScale:ROADKILL.slowScale+(1-ROADKILL.slowScale)*(1-k/.35);
  roadkill.slow=Math.max(0,roadkill.slow-dt);dt*=scale;
 }
 roadkill.cam=Math.max(0,roadkill.cam-dt);
 roadkillStep(dt);
 const local=carHitsDwarf();if(local)runDown(local);
 roadkill.shake*=Math.exp(-dt*5);
};
// the camera slams with the impact
const roadkillCamera=fc;
fc=function(dt,snap=false){
 const killShot=roadkill.cam>0;
 if(killShot)Ze.position.copy(roadkill.basePos); // let the normal camera follow its own path underneath
 roadkillCamera(dt,snap);
 if(killShot){
  roadkill.basePos.copy(Ze.position);
  const age=1-roadkill.cam/ROADKILL.camSeconds,w=ease(0,.1,age)*(1-ease(.82,1,age));
  const q0=Ze.quaternion.clone(),flying=poisonDwarf.root.position;
  Ze.position.lerp(roadkill.killCam,w);Ze.lookAt(flying.x,flying.y+.8,flying.z);
  Ze.quaternion.slerp(q0.clone(),1-w); // blend the aim between the chase view and the dwarf
 }
 if(roadkill.shake>.02){const a=.35*roadkill.shake;Ze.position.x+=(Math.random()-.5)*a;Ze.position.y+=(Math.random()-.5)*a;Ze.position.z+=(Math.random()-.5)*a;}
};
const roadkillReset=Oa;Oa=function(){roadkillReset();roadkill.shake=0;roadkill.slow=0;roadkill.cam=0;};window.expedition.reset=Oa;
const roadkillState=window.expedition.getState;
window.expedition.getState=()=>({...roadkillState(),roadkill:{hits:roadkill.hits,slow:roadkill.slow,last:roadkill.last}});
