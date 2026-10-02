// Click to punch; dragging still rotates the camera. One damage event per swing.
const combat={time:-1,hit:false,hits:0,swings:0};
const healthHUD=document.createElement('div');healthHUD.style='position:absolute;left:50%;bottom:110px;transform:translateX(-50%);width:210px;padding:12px 16px;border-radius:12px;background:#172921dd;color:#e7e9cf;pointer-events:none;font:13px sans-serif;display:none';
healthHUD.innerHTML='<div id="dwarf-health-label"></div><div style="height:6px;background:#506049;margin-top:8px;border-radius:4px;overflow:hidden"><div id="dwarf-health-fill" style="height:100%;background:#a2d95f;transition:width .15s"></div></div>';document.body.append(healthHUD);
function startPunch(){
 if(Te!=='walking'||Le||jumpPhase!=='grounded'||combat.time>=0)return false;
 combat.time=0;combat.hit=false;combat.swings++;Xt.root.rotation.y=Wn;return true;
}
let punchPointer=null;
Ae.domElement.addEventListener('pointerdown',event=>{if(event.button===0&&event.pointerType!=='touch')punchPointer={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now(),drag:false};});
Ae.domElement.addEventListener('pointermove',event=>{if(punchPointer&&event.pointerId===punchPointer.id&&Math.hypot(event.clientX-punchPointer.x,event.clientY-punchPointer.y)>6)punchPointer.drag=true;});
Ae.domElement.addEventListener('pointerup',event=>{if(punchPointer&&event.pointerId===punchPointer.id){if(!punchPointer.drag&&performance.now()-punchPointer.time<350)startPunch();punchPointer=null;}});
Ae.domElement.addEventListener('pointercancel',()=>punchPointer=null);addEventListener('blur',()=>punchPointer=null);
function punchContact(){
 const p=Xt.root.position,d=poisonDwarf.root.position,dx=d.x-p.x,dz=d.z-p.z,range=Math.hypot(dx,dz);
 if(range>1.5||Math.abs(d.y-p.y)>.65||range>.05&&(dx*Math.sin(Xt.root.rotation.y)+dz*Math.cos(Xt.root.rotation.y))/range<.65)return false;
 for(const c of world.colliders){const u=Mn(((c.x-p.x)*dx+(c.z-p.z)*dz)/(range*range||1),0,1);if(u>.08&&u<.95&&Math.hypot(p.x+dx*u-c.x,p.z+dz*u-c.z)<c.r&&c.y+c.height>p.y+.9)return false;}
 return poisonDwarf.damage(25);
}
const combatStep=Fu;
Fu=function(dt){
 combatStep(dt);
 if(combat.time>=0){
  if(Te!=='walking'||Le||jumpPhase!=='grounded'){combat.time=-1;return;}
  const before=combat.time;combat.time+=dt;const t=combat.time;
  // Draw the fist back, drive the shoulder through a fast cross, then recover.
  const smooth=x=>{x=Mn(x,0,1);return x*x*(3-2*x);};
  const weight=smooth(t/.07)*(1-smooth((t-.34)/.17));
  const extend=smooth((t-.11)/.07),recover=smooth((t-.24)/.17),reach=extend*(1-recover);
  const wind=(1-extend)*smooth(t/.07);
  Xt.poseMotion({label:'Punch',fist:weight,twist:(-.28*wind+.48*reach)*weight,lean:.15*reach,hands:{Right:{position:[-.30+.20*reach,1.27-.08*reach,-.12+.99*reach],weight},Left:{position:[.20,1.29,.28],weight:weight*.9}}});
  if(before<.115&&t>=.115)valleyAudio.punch('swing');
  if(!combat.hit&&before<.19&&t>=.19){combat.hit=true;if(punchContact()){combat.hits++;valleyAudio.punch('impact');}}
  if(t>=.52)combat.time=-1;
 }
 const dwarf=poisonDwarf.state(),near=Xt.root.position.distanceTo(poisonDwarf.root.position)<7;
 healthHUD.style.display=near?'block':'none';document.getElementById('dwarf-health-label').textContent=dwarf.defeated?'Mosswick · knocked out':'Mosswick · '+dwarf.health+' / 100';document.getElementById('dwarf-health-fill').style.width=dwarf.health+'%';
};
const combatHUD=pc;pc=function(){combatHUD();if(Te==='walking')oe('controlText').innerHTML+=' <span>·</span> <kbd>Left click</kbd> Punch';};
const combatReset=Oa;Oa=function(){combatReset();combat.time=-1;combat.hit=false;poisonDwarf.resetHealth();healthHUD.style.display='none';};window.expedition.reset=Oa;
const combatState=window.expedition.getState;window.expedition.getState=()=>({...combatState(),combat:{...combat}});
