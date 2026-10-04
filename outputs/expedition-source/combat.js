// Click to punch; dragging still rotates the camera. One damage event per swing.
const combat={time:-1,hit:false,hits:0,swings:0,side:'Right',lunge:0,stepped:0,planted:false,hold:0,kick:0,target:false};
const healthHUD=document.createElement('div');healthHUD.style='position:absolute;left:50%;bottom:110px;transform:translateX(-50%);width:210px;padding:12px 16px;border-radius:12px;background:#172921dd;color:#e7e9cf;pointer-events:none;font:13px sans-serif;display:none';
healthHUD.innerHTML='<div id="dwarf-health-label"></div><div style="height:6px;background:#506049;margin-top:8px;border-radius:4px;overflow:hidden"><div id="dwarf-health-fill" style="height:100%;background:#a2d95f;transition:width .15s"></div></div>';document.body.append(healthHUD);
function startPunch(){
 if(Te!=='walking'||Le||rifleBusy||jumpPhase!=='grounded'||combat.time>=0)return false;
 combat.time=0;combat.hit=false;combat.swings++;Xt.root.rotation.y=Wn;
 // Clicks alternate: right cross, left jab, right cross...
 combat.side=combat.swings%2===1?'Right':'Left';
 // Step in just far enough for the fist to arrive when Mosswick is in range; whiff with a short lunge otherwise.
 const p=Xt.root.position,d=poisonDwarf.root.position,dx=d.x-p.x,dz=d.z-p.z,range=Math.hypot(dx,dz);
 const ahead=range>.05&&(dx*Math.sin(Wn)+dz*Math.cos(Wn))/range>.65;
 combat.target=ahead&&range<2.4&&Math.abs(d.y-p.y)<.9;
 combat.planted=Pa<.3;combat.lunge=!combat.planted?0:ahead&&range<=1.5?Mn(range-1.02,0,.34):.10;combat.stepped=0;combat.hold=0;
 return true;
}
let punchPointer=null;
Ae.domElement.addEventListener('pointerdown',event=>{if(event.button===0&&event.pointerType!=='touch'&&lookLocked()){startPunch();punchPointer=null;return;}if(event.button===0&&event.pointerType!=='touch')punchPointer={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now(),drag:false};});
Ae.domElement.addEventListener('pointermove',event=>{if(punchPointer&&event.pointerId===punchPointer.id&&Math.hypot(event.clientX-punchPointer.x,event.clientY-punchPointer.y)>6)punchPointer.drag=true;});
Ae.domElement.addEventListener('pointerup',event=>{if(punchPointer&&event.pointerId===punchPointer.id){if(performance.now()<look.ignoreUpUntil)look.ignoreUpUntil=0;else if(!punchPointer.drag&&performance.now()-punchPointer.time<350)startPunch();punchPointer=null;}});
Ae.domElement.addEventListener('pointercancel',()=>punchPointer=null);addEventListener('blur',()=>punchPointer=null);
function punchContact(){
 const p=Xt.root.position,d=poisonDwarf.root.position,dx=d.x-p.x,dz=d.z-p.z,range=Math.hypot(dx,dz);
 if(range>1.5||Math.abs(d.y-p.y)>.65||range>.05&&(dx*Math.sin(Xt.root.rotation.y)+dz*Math.cos(Xt.root.rotation.y))/range<.65)return false;
 for(const c of world.colliders){const u=Mn(((c.x-p.x)*dx+(c.z-p.z)*dz)/(range*range||1),0,1);if(u>.08&&u<.95&&Math.hypot(p.x+dx*u-c.x,p.z+dz*u-c.z)<c.r&&c.y+c.height>p.y+.9)return false;}
 return poisonDwarf.damage(25,{x:dx/(range||1),z:dz/(range||1)});
}
// ---- punch animation -----------------------------------------------------------------------------------------------
// A boxer's stance: left foot forward, knees bent. Click 1 throws the right cross, click 2 the left jab.
// Timeline (s): 0-.075 coil, .075-.19 strike (hips, then shoulder, then fist), .19 impact (brief hit-pause), .26-.46 recover.
// Hand targets are offsets from the shoulder (x inboard, y up, z forward), so they follow the lean, drop and twist.
const punchGuard={Right:[.10,.02,.30],Left:[-.10,.02,.32]},punchCoil={Right:[.02,-.10,.10],Left:[-.02,-.10,.12]};
const punchChest=new L();
function punchPose(t){
 const side=combat.side,other=side==='Right'?'Left':'Right',sign=side==='Right'?1:-1;
 // the strike accelerates into the target (u^1.6) rather than easing in and out like a slide
 const u=Mn((t-.075)/.115,0,1),coil=ease(0,.075,t),strike=Math.pow(u,1.6),recover=ease(.26,.46,t);
 const reach=strike*(1-recover),wind=coil*(1-strike)*(1-recover),guard=ease(0,.05,t)*(1-ease(.40,.46,t));
 // where the fist is going: Mosswick's chest if he is in front of us, otherwise straight ahead and slightly across
 if(combat.target){
  const d=poisonDwarf.root.position;Xt.root.updateMatrixWorld(true);
  Xt.root.worldToLocal(punchChest.set(d.x,d.y+.80,d.z));
 }else{const s=Xt.getPose().joints[side+'Arm'];punchChest.set(s[0]+sign*.14,s[1]-.08,s[2]+1);}
 punchChest.y+=.12*Math.sin(Math.PI*strike); // the fist travels in a slight arc, not a ruler line
 // fist path: guard -> coil -> impact -> guard
 const base=guardCoil(side,coil*(1-strike));
 const stance=combat.planted?ease(0,.12,t)*(1-ease(.34,.46,t)):0,lunge=combat.stepped;
 const twist=sign*(-.30*wind+(side==='Right'?.50:.30)*reach)*guard;
 Xt.poseMotion({label:side==='Right'?'Cross':'Jab',
  fist:{Right:guard,Left:guard},twist,hipTwist:twist*.7,lean:(.22*reach-.06*wind)*guard,drop:combat.planted?(.07*stance+.03*reach):0,shoulders:{[side]:.24*reach*guard,[other]:-.12*reach*guard},
  feet:combat.planted?{Left:{position:[.17,.10,.22-.9*lunge],weight:stance,free:true},Right:{position:[-.17,.10,-.16-.5*lunge],weight:stance,free:true}}:undefined,
  hands:{[side]:{position:base,relative:true,weight:guard,strike:{point:punchChest.toArray(),reach:.56,amount:reach}},
   [other]:{position:[punchGuard[other][0],punchGuard[other][1]+.03*reach,punchGuard[other][2]-.06*reach],relative:true,weight:guard*.95}}});
}
const guardCoil=(side,k)=>punchGuard[side].map((v,i)=>v+(punchCoil[side][i]-v)*k);
const combatStep=Fu;
Fu=function(dt){
 combatStep(dt);
 if(combat.time>=0){
  if(Te!=='walking'||Le||jumpPhase!=='grounded'){combat.time=-1;return;}
  const before=combat.time;
  if(combat.hold>0)combat.hold-=dt;else combat.time+=dt;
  const t=combat.time;
  // step in: a short lunge that finishes as the fist lands
  const lungeNow=combat.lunge*ease(.04,.19,t),dl=lungeNow-combat.stepped;combat.stepped=lungeNow;
  if(dl){const q=Xt.root.position,yaw=Xt.root.rotation.y;q.x+=Math.sin(yaw)*dl;q.z+=Math.cos(yaw)*dl;Je.resolveCircle(q,.28);jg(q);Je.resolveCircle(q,.28);q.y=Je.walkHeight(q.x,q.z,q.y);}
  punchPose(t);
  if(before<.10&&t>=.10)valleyAudio.punch('swing');
  if(!combat.hit&&before<.19&&t>=.19){combat.hit=true;if(punchContact()){
   combat.hits++;valleyAudio.punch('impact');combat.hold=.05;combat.kick=1;
   const d=poisonDwarf.root.position;puff(new L(d.x-Math.sin(Xt.root.rotation.y)*.28,d.y+.85,d.z-Math.cos(Xt.root.rotation.y)*.28),'#fff0c8',.12,.14,.15,.95);
  }}
  if(t>=.46)combat.time=-1;
 }
 const dwarf=poisonDwarf.state(),near=Xt.root.position.distanceTo(poisonDwarf.root.position)<7;
 healthHUD.style.display=near?'block':'none';document.getElementById('dwarf-health-label').textContent=dwarf.killed?'Mosswick · flattened':dwarf.defeated?'Mosswick · knocked out':'Mosswick · '+dwarf.health+' / 100';document.getElementById('dwarf-health-fill').style.width=dwarf.health+'%';
};
const combatCamera=fc;
fc=function(dt,snap=false){
 combatCamera(dt,snap);
 if(combat.kick>.01){Ze.position.addScaledVector(Ze.getWorldDirection(new L()),.10*combat.kick);combat.kick*=Math.exp(-dt*12);}
};
const combatHUD=pc;pc=function(){combatHUD();if(Te==='walking')oe('controlText').innerHTML+=' <span>·</span> <kbd>Left click</kbd> Punch';};
const combatReset=Oa;Oa=function(){combatReset();combat.time=-1;combat.hit=false;poisonDwarf.resetHealth();healthHUD.style.display='none';};window.expedition.reset=Oa;
const combatState=window.expedition.getState;window.expedition.getState=()=>({...combatState(),combat:{...combat}});
