// Responsive touring/off-road drivetrain. All integration runs at the fixed physics step.
const drivetrain={gear:1,rpm:850,shift:0,shifts:0,acceleration:0};
const gearCeilings=[7.5,12.5,18,23,29];
i_=function(dt){
 const input=Nu(),brake=Ue.has('Space')||pe.brake,before=le;
 // airborne off a circuit ramp (rocks.js): the wheels have no grip, so throttle and brakes do nothing and steering barely turns it
 const air=rockState.flying&&rockState.ramp;
 drivetrain.shift=Math.max(0,drivetrain.shift-dt);
 if(air)le=Math.sign(le)*Math.max(0,Math.abs(le)-.3*dt);
 else if(brake)le=Math.sign(le)*Math.max(0,Math.abs(le)-19*dt);
 else if(input.y>0)le=Math.min(27,le+(le<-.1?17:(9.5-4*Math.min(le/27,1))*(drivetrain.shift>0?.25:1))*input.y*dt);
 else if(input.y<0)le=Math.max(-7,le+(le>.1?17:5.2)*input.y*dt);
 else le=Math.sign(le)*Math.max(0,Math.abs(le)-(1.2+Math.abs(le)*.055)*dt);
 const speed=Math.abs(le);
 // Hysteresis prevents hunting between gears on a hill or during light throttle.
 if(le>0&&drivetrain.shift===0){
  if(drivetrain.gear<5&&speed>gearCeilings[drivetrain.gear-1]){drivetrain.gear++;drivetrain.shift=.18;drivetrain.shifts++;}
  else if(drivetrain.gear>1&&speed<gearCeilings[drivetrain.gear-2]*.67){drivetrain.gear--;drivetrain.shift=.14;drivetrain.shifts++;}
 }
 if(speed<.1)drivetrain.gear=1;
 const ceiling=le<0?8:gearCeilings[drivetrain.gear-1];
 const load=!brake&&((input.y>0&&le>=0)||(input.y<0&&le<=0))?Math.abs(input.y):0;
 const targetRpm=850+Math.min(1.05,speed/ceiling)*4250+load*(air?1500:260); // in the air the engine revs freely
 drivetrain.rpm=La(drivetrain.rpm,targetRpm,drivetrain.shift>0?20:10,dt);
 drivetrain.acceleration=(le-before)/dt;
 ci=La(ci,-input.x*.57/(1+speed*.065),10,dt);
 // Sweep in short increments so higher speed cannot skip thin obstacles.
 const pieces=Math.max(1,Math.ceil(speed*dt/.12)),step=dt/pieces;
 for(let j=0;j<pieces;j++){
  const yaw=Xe+le/2.54*Math.tan(ci)*step*(air?.15:1);
  const dx=Math.sin(yaw)*le*step,dz=Math.cos(yaw)*le*step;
  if(e_(zt.root.position.x+dx,zt.root.position.z+dz,yaw)){le=0;break;}
  Xe=yaw;zt.root.position.x+=dx;zt.root.position.z+=dz;cc+=le*step/.486;
 }
 n_(dt);
 for(const [name,wheel] of Object.entries(zt.wheels)){wheel.spin.rotation.x=cc;if(name.startsWith('front'))wheel.mount.rotation.y=ci;}
 zt.steeringWheel.quaternion.copy(Pu).multiply(Qg.setFromAxisAngle(new L(0,0,1),ci*2.5));
 zt.setThrottle({rpm:drivetrain.rpm,load:drivetrain.shift>0?load*.12:load});
 Xt.animate(dt,0,1);
};
const touringHUD=pc;
pc=function(){touringHUD();if(Te==='driving')oe('gear').textContent=(le<-.12?'R':le>.12?'D'+drivetrain.gear:'N')+' · '+(Math.round(drivetrain.rpm/50)*50)+' RPM';};
const touringCamera=fc;
let touringFov=55;
fc=function(dt,snap=false){touringCamera(dt,snap);if(Te==='driving'){const target=(Fi==='cockpit'?70:55)+Math.min(1,Math.abs(le)/27)*9;touringFov=snap?target:La(touringFov,target,3,dt);Ze.fov=touringFov;Ze.updateProjectionMatrix();}else touringFov=Ze.fov;};
const touringReset=Oa;
Oa=function(){touringReset();Object.assign(drivetrain,{gear:1,rpm:850,shift:0,shifts:0,acceleration:0});};
window.expedition.reset=Oa;
const touringState=window.expedition.getState;
window.expedition.getState=()=>({...touringState(),drivetrain:{...drivetrain}});
