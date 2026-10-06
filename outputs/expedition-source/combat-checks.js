const results=[];const check=(name,pass)=>results.push({name,pass:!!pass});
function setup(range=1.1,yaw=0){Oa();Xt.root.position.set(-5,world.height(-5,3-range),3-range);poisonDwarf.root.position.set(-5,world.height(-5,3),3);Wn=yaw;Xt.root.rotation.y=yaw;}
setup();check('Punch starts on foot',startPunch());check('Cooldown rejects repeated input',!startPunch());expedition.advance(.23);check('Close punch deals 25 damage',poisonDwarf.state().health===75);expedition.advance(.35);check('One hit per swing',poisonDwarf.state().health===75);
setup(3);startPunch();expedition.advance(.55);check('Out-of-range punch misses',poisonDwarf.state().health===100);
setup(1.1,Math.PI);startPunch();expedition.advance(.55);check('Punch behind player misses',poisonDwarf.state().health===100);
setup();Te='driving';check('Cannot punch while driving',!startPunch());setup();jumpPhase='airborne';check('Cannot punch during jump',!startPunch());jumpPhase='grounded';
setup();for(let i=0;i<4;i++){startPunch();expedition.advance(.56);}check('Four hits knock dwarf out',poisonDwarf.state().health===0&&poisonDwarf.state().defeated);const stopped=poisonDwarf.root.position.clone();expedition.advance(3);check('Knocked-out dwarf stops roaming',poisonDwarf.root.position.distanceTo(stopped)<.001);Oa();check('Reset restores dwarf health',poisonDwarf.state().health===100);
setup();function pointer(type,x){Ae.domElement.dispatchEvent(new PointerEvent(type,{button:0,pointerId:1,pointerType:'mouse',clientX:x,clientY:100,bubbles:true}));}
pointer('pointerdown',100);pointer('pointermove',140);pointer('pointerup',140);check('Camera drag does not punch',combat.time<0);
pointer('pointerdown',100);pointer('pointerup',100);check('Left click starts punch',combat.time===0);
expedition.advance(.0833);const windPose=Xt.getPose().joints;expedition.advance(.1);const strikePose=Xt.getPose().joints;
const hand=combat.side+'Hand',arm=combat.side+'Arm'; // clicks alternate right cross / left jab
check('Striking fist drives forward more than 30 cm (the motion-captured cross)',strikePose[hand][2]-windPose[hand][2]>.30);
{// thrown while running, the punch still goes forward (only the upper body plays the clip; the torso must not keep the stance's hip turn)
 Oa();Xt.root.position.set(-2,world.height(-2,-14),-14);Wn=Math.PI/2;Xt.root.rotation.y=Wn;Ue.add('KeyW');Ue.add('ShiftLeft');for(let i=0;i<60;i++)Fu(1/60);
 const fist=[];for(let k=0;k<2;k++){startPunch();const side=combat.side;for(let i=0;i<11;i++)Fu(1/60);const j=Xt.getPose().joints;fist.push({side,hand:j[side+'Hand'],planted:combat.planted});for(let i=0;i<30;i++)Fu(1/60);}
 Ue.delete('KeyW');Ue.delete('ShiftLeft');
 check('Punching on the run, both fists reach forward in front of the body, not out to the side',fist.every(f=>!f.planted&&f.hand[2]>.30&&Math.abs(f.hand[0])<.32),JSON.stringify(fist.map(f=>[f.side,f.hand.map(v=>+v.toFixed(2))])));
 Oa();}
check('Shoulder drives forward with torso',strikePose[arm][2]-windPose[arm][2]>.04);
check('Punches alternate between right and left hands',(()=>{expedition.advance(.6);combat.swings=0;startPunch();const a=combat.side;expedition.advance(.6);startPunch();const b=combat.side;expedition.advance(.6);return a==='Right'&&b==='Left';})());
const p=Xt.root.position;Ze.position.set(p.x+2,p.y+1.9,p.z+2.5);Ze.fov=50;Ze.updateProjectionMatrix();Ze.lookAt(p.x,p.y+.9,p.z+.5);Fu=()=>{};
const pre=document.createElement('pre');pre.id='combat-results';pre.hidden=true;pre.textContent=JSON.stringify({results});document.body.append(pre);

const soundButton=document.createElement('button');soundButton.textContent='Test punch sounds';soundButton.style='position:absolute;left:45%;top:20px;z-index:999';document.body.append(soundButton);
soundButton.onclick=async()=>{soundButton.disabled=true;const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(100);const initial=valleyAudio.state();valleyAudio.punch('swing');await wait(60);const swing=valleyAudio.state();await wait(180);valleyAudio.punch('impact');await wait(35);const impact=valleyAudio.state();check('Swing creates audible output',swing.swings===initial.swings+1&&swing.outputRms>.001);check('Impact creates audible output',impact.impacts===initial.impacts+1&&impact.outputRms>.001);ui=true;valleyAudio.sync();valleyAudio.punch('impact');check('Shared mute silences punch effects',valleyAudio.state().impacts===impact.impacts);ui=false;valleyAudio.sync();pre.textContent=JSON.stringify({results,swing,impact});soundButton.textContent='Sound checks complete';};
