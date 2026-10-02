const results=[];
function check(name,condition){results.push({name,pass:!!condition});}
function key(code,down){dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code,bubbles:true}));}
function move(code,seconds){key(code,true);expedition.advance(seconds);key(code,false);expedition.advance(.2);}
function bendMetrics(p){
  const out=[];
  for(const side of ['Left','Right']){
    const a=p[side+'UpLeg'],b=p[side+'Leg'],c=p[side+'Foot'];
    const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-b[i]);
    const flex=Math.acos(Math.max(-1,Math.min(1,u.reduce((n,x,i)=>n+x*v[i],0)/(Math.hypot(...u)*Math.hypot(...v)))))*180/Math.PI;
    const t=(b[1]-a[1])/(c[1]-a[1]);
    out.push({flex,forward:b[2]-(a[2]+t*(c[2]-a[2]))});
  }
  return out;
}
expedition.reset();
const initial=expedition.getState();
check('Real skinned human loaded',initial.pose.loaded && initial.pose.bones>60);
check('Head above hips',initial.pose.joints.Head[1]>initial.pose.joints.Hips[1]+.4);
check('Feet below hips',initial.pose.joints.LeftFoot[1]<initial.pose.joints.Hips[1]-.5);
key('ShiftLeft',true);key('KeyW',true);expedition.advance(.5);
check('Run animation selected',expedition.getState().pose.animation==='Run');
key('KeyW',false);key('ShiftLeft',false);expedition.reset();
move('KeyW',.95);
check('Walking changes position',Math.abs(expedition.getState().humanPosition[2]-initial.humanPosition[2])>1);
check('Driver side reachable on foot',expedition.getState().nearDoor);
const standing=expedition.getState();
key('Space',true);key('Space',false);expedition.advance(.1);
const crouching=expedition.getState();
check('Preparation lowers hips',crouching.pose.joints.Hips[1]<standing.pose.joints.Hips[1]-.10);
check('Preparation keeps feet planted',Math.abs(crouching.pose.joints.LeftFoot[1]-.1)<.035&&Math.abs(crouching.pose.joints.RightFoot[1]-.1)<.035);
check('Jump has grounded anticipation',expedition.getState().jumpPhase==='anticipation'&&expedition.getState().jumpHeight===0);
expedition.advance(.3);
check('Jump lifts character',expedition.getState().jumpHeight>.3);
const airborneJoints=expedition.getState().pose.joints;
check('Jump elbows stay near torso',Math.abs(airborneJoints.LeftForeArm[0])<.36&&Math.abs(airborneJoints.RightForeArm[0])<.36);
check('Jump elbows stay below shoulders',airborneJoints.LeftForeArm[1]<airborneJoints.LeftArm[1]&&airborneJoints.RightForeArm[1]<airborneJoints.RightArm[1]);
key('KeyE',true);key('KeyE',false);check('Cannot enter while airborne',expedition.getState().mode==='walking');
expedition.advance(1);check('Jump lands',expedition.getState().jumpHeight===0);
key('KeyE',true);key('KeyE',false);
let sawReach=false,sawClimb=false,doorReady=true,kneesLimited=true,kneesForward=true;
for(let i=0;i<360;i++){expedition.advance(1/60);const s=expedition.getState();sawReach ||= s.transition?.phase==='reach';if(s.transition?.phase==='climb'){sawClimb=true;for(const k of bendMetrics(s.pose.joints)){kneesLimited &&= k.flex<132;kneesForward &&= k.forward>-.03;}doorReady &&= s.panels.driver.value>.98;}}
check('Entry reaches for handle before climbing',sawReach&&sawClimb);
check('Door clears opening before climb',doorReady);
check('Entry knees respect flexion limits',kneesLimited);
check('Entry knees bend forward',kneesForward);
check('Enter attaches seated character to car',expedition.getState().mode==='driving'&&expedition.getState().humanInCar&&expedition.getState().pose.seated===1);
check('Seated knees ahead of hips',expedition.getState().pose.joints.LeftLeg[2]>expedition.getState().pose.joints.Hips[2]+.2);
const before=expedition.getState().position;
move('KeyW',1); // Measure before the faster Jeep reaches the trees ahead.
check('Throttle moves Jeep',expedition.getState().speed>0&&expedition.getState().position[2]>before[2]+3);
key('KeyE',true);key('KeyE',false);
check('Cannot exit moving car',expedition.getState().mode==='driving');
key('KeyC',true);key('KeyC',false);check('Cockpit camera toggles',expedition.getState().cameraView==='cockpit');
move('Space',2);check('Handbrake stops Jeep',expedition.getState().speed===0);
key('KeyE',true);key('KeyE',false);
let exitKnees=true;for(let i=0;i<360;i++){expedition.advance(1/60);const s=expedition.getState();if(s.transition?.phase==='climb')for(const k of bendMetrics(s.pose.joints))exitKnees &&= k.flex<132&&k.forward>-.03;}
check('Exit knees bend forward within limits',exitKnees);
check('Exit restores walking',expedition.getState().mode==='walking'&&!expedition.getState().humanInCar);
move('KeyW',.4);check('Walking after exit works',expedition.getState().mode==='walking');
key('KeyL',true);key('KeyL',false);check('Golden hour toggles',expedition.getState().goldenHour);
expedition.reset();check('Reset restores spawn',Math.abs(expedition.getState().humanPosition[0]-2.5)<.01);
key('Space',true);key('Space',false);expedition.advance(.3);document.getElementById('resetBtn').click();check('Reset button cancels airborne motion',expedition.getState().jumpPhase==='grounded'&&expedition.getState().jumpHeight===0);
check('Reset restores standing feet',expedition.getState().pose.joints.LeftFoot[1]<.14&&expedition.getState().pose.joints.RightFoot[1]<.14);
expedition.reset();
let previousHands=expedition.getState().pose.joints,maxHandStep=0;
key('Space',true);key('Space',false);
for(let frame=0;frame<75;frame++){
 expedition.advance(1/60);const joints=expedition.getState().pose.joints;
 for(const side of ['LeftHand','RightHand']){const step=Math.hypot(...joints[side].map((v,i)=>v-previousHands[side][i]));if(step>maxHandStep){maxHandStep=step;window.armDiagnostic={frame,step,side,before:previousHands[side],after:joints[side],phase:expedition.getState().jumpPhase};}}
 previousHands=joints;
}
check('Jump hands blend continuously through takeoff and landing',maxHandStep<.09);
expedition.reset();
const gaitContacts={};
for(const gait of ['walk','run']){
 expedition.reset();key('KeyW',true);if(gait==='run')key('ShiftLeft',true);
 let prior=expedition.getState(),events=[];
 for(let i=0;i<180;i++){
  expedition.advance(1/60);const now=expedition.getState();
  for(const side of ['Left','Right'])if(now.worldAudio.contacts[side]>prior.worldAudio.contacts[side])events.push({side,height:now.pose.joints[side+'Foot'][1],time:i/60});
  prior=now;
 }
 key('KeyW',false);key('ShiftLeft',false);gaitContacts[gait]=events;
 check(gait+' footsteps follow both animated feet',events.filter(e=>e.side==='Left').length>=2&&events.filter(e=>e.side==='Right').length>=2);
 check(gait+' contact sounds occur at planted foot height',events.every(e=>e.height<(gait==='walk'?.116:.176)));
 check(gait+' left and right contacts alternate',events.every((e,i)=>!i||e.side!==events[i-1].side));
}
expedition.reset();const beforeIdle=expedition.getState().worldAudio.contacts;
expedition.advance(1);const afterIdle=expedition.getState().worldAudio.contacts;
check('Idle has no footstep contacts',beforeIdle.Left===afterIdle.Left&&beforeIdle.Right===afterIdle.Right);
key('Space',true);key('Space',false);expedition.advance(.5);const inAir=expedition.getState().worldAudio.contacts;
check('Jump has no walking footstep contacts',afterIdle.Left===inAir.Left&&afterIdle.Right===inAir.Right);
expedition.reset();
const report=document.createElement('pre');report.id='test-results';report.style='position:absolute;inset:20px;background:#10271fee;color:white;z-index:999;padding:20px;overflow:auto';report.textContent=JSON.stringify({gaitContacts,armDiagnostic:window.armDiagnostic,results,final:expedition.getState()},null,2);document.body.append(report);
