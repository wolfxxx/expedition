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
 return poisonDwarf.damage(25,{x:dx/(range||1),z:dz/(range||1)},'punch');
}
// ---- punch animation -----------------------------------------------------------------------------------------------
// The Mixamo punch (ranger.glb 'Punch', a right cross from guard and back; 'PunchLeft' is it mirrored into a left jab, both
// baked by add-mixamo-clips.py). Click 1 throws the cross, click 2 the jab. The clip is retimed so its full extension
// (clip 0.30 s) lands on the game's impact moment (.19 s) and its return to guard (0.63 s) ends the swing (.46 s); it blends
// in and out over the first and last few hundredths. Thrown on the move, only the upper body punches and the legs keep walking.
const PUNCH_CLIP={impact:.30,end:.63},PUNCH_IMPACT=.19,PUNCH_END=.46;
function punchPose(t){
 const clipTime=t<PUNCH_IMPACT?t*PUNCH_CLIP.impact/PUNCH_IMPACT:PUNCH_CLIP.impact+(t-PUNCH_IMPACT)*(PUNCH_CLIP.end-PUNCH_CLIP.impact)/(PUNCH_END-PUNCH_IMPACT);
 const weight=ease(0,.05,t)*(1-ease(PUNCH_END-.06,PUNCH_END,t));
 Xt.poseMotion({label:combat.side==='Right'?'Cross':'Jab'});
 Xt.applyClip(combat.side==='Right'?'Punch':'PunchLeft',clipTime,weight,combat.planted?null:'upper');
}
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
