const results=[];const check=(name,pass)=>results.push({name,pass:!!pass});
const R=expedition.rifle,rifleNow=()=>expedition.getState().rifle;
const key=(code,type='keydown')=>dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));
const pointer=(type,x,y=100,button=0)=>Ae.domElement.dispatchEvent(new PointerEvent(type,{button,pointerId:1,pointerType:'mouse',clientX:x,clientY:y,bubbles:true}));
function stand(x=tx+.3,z=tz-1.5,y=lookoutTop){Oa();Xt.root.position.set(x,y,z);Xt.root.rotation.y=0;Wn=0;bs=.3;Da=6;fc(1,true);}
function lie(){stand();R.mount();expedition.advance(1.7);}
// Aim at Mosswick's chest. The eye height shifts slightly with the aim, so converge over a few frames.
function aimAtDwarf(){
 for(let i=0;i<3;i++){
  const e=R.eye(),p=poisonDwarf.root.position,yaw=Math.atan2(p.x-e[0],p.z-e[2]),pitch=Math.atan2(p.y+.7-e[1],Math.hypot(p.x-e[0],p.z-e[2]));
  R.aim(yaw,pitch);expedition.advance(1/60);
 }
}
// Put Mosswick somewhere the muzzle line to him is not blocked by trees or rocks.
function placeDwarfInLine(from=-2.3,to=-1.0){
 for(const dist of [30,40,50,25,35,45,60])for(let a=from;a<to;a+=.05){
  const x=tx+Math.sin(a)*dist,z=tz+Math.cos(a)*dist;poisonDwarf.root.position.set(x,world.height(x,z),z);
  aimAtDwarf();const s=rifleNow(),dir=new L(Math.sin(s.yaw)*Math.cos(s.pitch),Math.sin(s.pitch),Math.cos(s.yaw)*Math.cos(s.pitch));
  if(R.cast(new L(...R.eye()),dir).kind==='dwarf')return {x,z,a,dist};
 }
 return null;
}

// ---- placement and approach ----
check('Rifle model loaded',!!lookoutRifle&&lookoutRifle.userData.size[0]>1.5);
{const m=R.muzzle(),e=R.eye(),pivot=[rifleMount.position.x,rifleMount.position.z];
 check('Muzzle is the forward end of the rifle and the scope eye is at the back',Math.hypot(m[0]-pivot[0],m[2]-pivot[1])>1.2&&Math.hypot(e[0]-pivot[0],e[2]-pivot[1])<.6);
 check('Rifle rests aimed down the valley towards Mirror Spring',Math.abs(Math.atan2(m[0]-e[0],m[2]-e[2])-RIFLE.restYaw)<.03&&Math.abs(RIFLE.restYaw-Math.atan2(-22-tx,5-tz))<.05);}
stand(tx+6,tz);check('Cannot lie down from across the clearing',!R.reach()&&!R.mount());
stand(tx,tz,world.height(tx,tz));check('Cannot reach the rifle from under the deck',!R.reach());
stand(tx+.3,tz-1.5);pc();check('Prompt appears on the deck beside the rifle',R.reach()&&rifleHint.style.display==='block');
// ---- lying down ----
key('KeyE');expedition.advance(.4);check('E starts getting down and locks out movement',rifle.mode==='mounting'&&rifleBusy);
expedition.advance(1.4);const s1=rifleNow();
check('Reaches the prone firing position',s1.mode==='aiming'&&s1.prone===1);
{const feet=bodyRoot();check('Feet are behind the stock, on the deck',Math.abs(Xt.root.position.x-feet.x)<.001&&Math.abs(Xt.root.position.z-feet.z)<.001&&Math.abs(Xt.root.position.y-lookoutTop)<.001);}
// does the lying body fit on the deck at every heading?
{let worstReach=0,lowest=9,highest=0,cameraReach=0,flat=true;
 for(let i=0;i<24;i++){
  R.aim(i/24*Math.PI*2,0);expedition.advance(.1);
  const j=Xt.getPose().joints;
  for(const name of Object.keys(j)){const w=Xt.root.localToWorld(new L(...j[name]));
   worstReach=Math.max(worstReach,Math.abs(w.x-tx),Math.abs(w.z-tz));lowest=Math.min(lowest,w.y-lookoutTop);highest=Math.max(highest,w.y-lookoutTop);}
  const head=Xt.root.localToWorld(new L(...j.Head)),foot=Xt.root.localToWorld(new L(...j.LeftFoot));
  flat=flat&&Math.abs(head.y-foot.y)<.55&&Math.hypot(head.x-foot.x,head.z-foot.z)>1.2;
  cameraReach=Math.max(cameraReach,Math.abs(Ze.position.x-tx),Math.abs(Ze.position.z-tz));
 }
 results.push({name:'Lying body stays inside the rails at all 24 headings',pass:worstReach<1.6,detail:'furthest joint '+worstReach.toFixed(2)+' m from the deck centre on either axis; rail inner face is 1.6 m'});
 results.push({name:'Body is flat on the deck: lowest joint above it, highest below 0.7 m',pass:lowest>-.02&&highest<.7&&flat,detail:'lowest '+lowest.toFixed(3)+' m, highest '+highest.toFixed(3)+' m, head-to-foot level and long: '+flat});
 check('Chase camera stays within the deck outline at every heading',cameraReach<1.75);}
R.aim(RIFLE.restYaw,0);expedition.advance(.3);
check('Pitch is limited',(R.aim(0,9),rifleNow().pitch<=RIFLE.pitchMax+1e-9)&&(R.aim(0,-9),rifleNow().pitch>=RIFLE.pitchMin-1e-9));
R.aim(RIFLE.restYaw,0);
{const before=jumpPhase;key('Space');key('Space','keyup');check('Space fires and does not jump while prone',jumpPhase===before&&rifleNow().shots===1);}
check('Cannot punch while prone',!startPunch());
// ---- aiming with the pointer ----
expedition.advance(1.7);const yaw0=rifleNow().yaw,shots0=rifleNow().shots;
pointer('pointerdown',100);pointer('pointermove',160);pointer('pointerup',160);
check('Dragging turns the aim without firing',rifleNow().shots===shots0&&Math.abs(rifleNow().yaw-yaw0)>.1);
check('Dragging while prone does not move the walking camera',Wn===rifle.held.yaw);
pointer('pointerdown',100);pointer('pointerup',100);
check('A click fires',rifleNow().shots===shots0+1);
check('The bolt must cycle before the next shot',!R.fire()&&rifleNow().cooldown>1);
// ---- captured mouse: aim without holding a button ----
{expedition.advance(1.7);const y0=rifleNow().yaw,p0=rifleNow().pitch,n0=rifleNow().shots;
 Object.defineProperty(document,'pointerLockElement',{get:()=>Ae.domElement,configurable:true}); // pretend the browser granted pointer lock
 Ae.domElement.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,pointerType:'mouse',movementX:100,movementY:-40,clientX:500,clientY:300,bubbles:true}));
 check('With the mouse captured, moving it aims with no button held',rifleNow().yaw<y0-.2&&rifleNow().pitch>p0+.05&&rifleNow().shots===n0);
 const y1=rifleNow().yaw;rifle.zoom=12;rifle.scoped=true;rifle.scope=1;
 Ae.domElement.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,pointerType:'mouse',movementX:100,movementY:0,clientX:500,clientY:300,bubbles:true}));
 check('Aim is slower when zoomed in',Math.abs(rifleNow().yaw-y1)<.1);
 rifle.scoped=false;rifle.scope=0;rifle.zoom=6;
 Ae.domElement.dispatchEvent(new PointerEvent('pointerdown',{button:0,pointerId:1,pointerType:'mouse',clientX:500,clientY:300,bubbles:true}));
 check('With the mouse captured, a press fires at once',rifleNow().shots===n0+1);
 Ae.domElement.dispatchEvent(new PointerEvent('pointerup',{button:0,pointerId:1,pointerType:'mouse',clientX:500,clientY:300,bubbles:true}));
 delete document.pointerLockElement; // back to the real (unlocked) state
 const y2=rifleNow().yaw;Ae.domElement.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,pointerType:'mouse',movementX:100,movementY:0,clientX:600,clientY:300,bubbles:true}));
 check('Without capture, moving with no button held does nothing',rifleNow().yaw===y2);}
// ---- scope ----
expedition.advance(1.7);R.aim(RIFLE.restYaw,0);
pointer('pointerdown',100,100,2);pointer('pointerup',100,100,2);expedition.advance(.5);
check('Right-click raises the scope: narrow field of view, body hidden',rifleNow().scoped&&rifleNow().scope>.99&&Ze.fov<12&&lookoutRifle.visible===false);
{const e=R.eye();check('Scope camera sits at the eyepiece',Math.hypot(Ze.position.x-e[0],Ze.position.y-e[1],Ze.position.z-e[2])<.02);}
key('KeyZ');expedition.advance(.5);check('Z lowers the scope: normal view, body visible',!rifleNow().scoped&&Math.abs(Ze.fov-58)<.5&&lookoutRifle.visible===true);
// ---- hitting things ----
expedition.advance(1.7);
const spot=placeDwarfInLine();check('A clear line to Mosswick exists',!!spot);
if(spot){
 const hp=poisonDwarf.state().health;aimAtDwarf();
 check('Shot at Mosswick connects and takes 50 health',R.fire()&&poisonDwarf.state().health===hp-RIFLE.damage&&rifleNow().last.kind==='dwarf');
 expedition.advance(1.7);placeDwarfInLine(spot.a-.2,spot.a+.2);aimAtDwarf();
 check('Second shot knocks him out',R.fire()&&poisonDwarf.state().defeated);
 expedition.advance(1.7);aimAtDwarf();R.fire();check('A knocked-out dwarf is no longer a target',rifleNow().last.kind!=='dwarf');
}
// ---- headshots: one shot through the head ----
function aimAtHead(){
 for(let i=0;i<3;i++){
  const e=R.eye(),h=new L();poisonDwarf.head.getWorldPosition(h);const yaw=Math.atan2(h.x-e[0],h.z-e[2]),pitch=Math.atan2(h.y+.03-e[1],Math.hypot(h.x-e[0],h.z-e[2]));
  R.aim(yaw,pitch);expedition.advance(1/60);
 }
}
if(spot){
 poisonDwarf.resetHealth();expedition.advance(1.7);placeDwarfInLine(spot.a-.2,spot.a+.2);aimAtHead();
 const spokenBefore=expedition.getState().voice.spoken,before=rifleNow().headshots||0,fired=R.fire(),d=poisonDwarf.state(),last=rifleNow().last;
 check('A headshot kills Mosswick in one shot',fired&&last.kind==='dwarf'&&last.head&&d.defeated&&d.health===0);
 check('His head is gone after a headshot',d.beheaded&&!poisonDwarf.head.visible&&rifleNow().headshots===before+1);
 check('A headshot plays out in slow motion and is announced',roadkill.slow>0&&/HEADSHOT/.test(document.body.innerText));
 expedition.advance(.5);
 {const v=expedition.getState().voice;check('No last words from a man without a head',!(v.last&&v.last.cat==='ko'&&v.spoken>spokenBefore)&&!v.speaking);}
 Oa();check('Reset gives him his head back',!poisonDwarf.state().beheaded&&poisonDwarf.head.visible&&!poisonDwarf.state().defeated);
 lie();placeDwarfInLine(spot.a-.2,spot.a+.2);aimAtDwarf();R.fire();
 check('A body shot still takes 50 health, not his head',rifleNow().last.kind==='dwarf'&&!rifleNow().last.head&&poisonDwarf.state().health===50&&!poisonDwarf.state().beheaded);
 poisonDwarf.damage(100,null,'rifle');expedition.advance(1.7); // leave him knocked out, as the checks below expect
}
// ---- ducks on Mirror Spring ----
{
 lie();const S=expedition.spring,dirOf=s=>new L(Math.sin(s.yaw)*Math.cos(s.pitch),Math.sin(s.pitch),Math.cos(s.yaw)*Math.cos(s.pitch));
 const aimAtDuck=d=>{for(let i=0;i<3;i++){const e=R.eye(),p=d.mesh.position,yaw=Math.atan2(p.x-e[0],p.z-e[2]),pitch=Math.atan2(p.y+.08-e[1],Math.hypot(p.x-e[0],p.z-e[2]));R.aim(yaw,pitch);expedition.advance(1/60);}};
 const duck=S.ducks.find(d=>{aimAtDuck(d);return R.cast(new L(...R.eye()),dirOf(rifleNow())).kind==='duck';});
 check('A duck on the spring can be lined up from the lookout',!!duck);
 if(duck){
  aimAtDuck(duck);const n=rifleNow().ducks,fired=R.fire();
  check('Shooting a duck brings it down',fired&&rifleNow().last.kind==='duck'&&!!duck.dead&&rifleNow().ducks===n+1&&expedition.getState().spring.ducksShot>=1&&/Duck down/.test(document.body.innerText));
  check('A shot duck is no longer a target',(expedition.advance(1.7),aimAtDuck(duck),R.cast(new L(...R.eye()),dirOf(rifleNow())).kind!=='duck'));
  for(let i=0;i<4*60;i++)Fu(1/60);
  check('It floats belly up on the water',Math.abs(duck.mesh.rotation.z-Math.PI)<.3&&Math.abs(duck.mesh.position.y-(waterLevel+.09))<.05);
  for(let i=0;i<27*60;i++)Fu(1/60);
  check('After 30 s a duck swims on the spring again',!duck.dead&&Math.abs(duck.mesh.rotation.z)<.1);
  aimAtDuck(S.ducks.find(d=>!d.dead));R.fire();Oa();check('Reset brings shot ducks back',S.ducks.every(d=>!d.dead));
 }
}
// ---- smooth aim: a sudden mouse jump is eased in over a few steps instead of landing in one ----
{
 lie();const start=rifle.yaw;rifle.want.yaw=start+.3;const steps=[];
 for(let i=0;i<10;i++){const b=rifle.yaw;Fu(1/60);steps.push(rifle.yaw-b);}
 check('The aim eases toward the mouse: no single step jumps, and it arrives within a few frames',steps[0]<.15&&steps.every((d,i)=>i===0||d<=steps[i-1]+1e-9)&&Math.abs(rifle.yaw-start-.3)<.01);
}
{const eye=new L(...R.eye());
 const tree=world.colliders.find(c=>c.r>=.25&&c.r<=.3&&c.height>3&&Math.hypot(c.x-tx,c.z-tz)>12&&Math.hypot(c.x-tx,c.z-tz)<60);
 const d=new L(tree.x-eye.x,tree.y+1.5-eye.y,tree.z-eye.z),len=d.length();d.normalize();
 const hit=R.cast(eye,d);check('A tree trunk stops the bullet',hit.kind==='obstacle'&&hit.distance<len+.1);
 const down=R.cast(eye,new L(Math.sin(1)*Math.cos(.3),-Math.sin(.3),Math.cos(1)*Math.cos(.3)));
 check('A downward shot hits the ground at the terrain height',down.kind==='ground'&&Math.abs(down.point.y-world.height(down.point.x,down.point.z))<.05);
 check('A shot into the sky hits nothing',R.cast(eye,new L(0,.3,.95)).kind==='sky');}
// ---- getting up ----
key('KeyE');expedition.advance(.3);check('E begins getting up',rifleNow().mode==='dismounting');
expedition.advance(.8);check('Back on foot and free to move',rifleNow().mode==='idle'&&!rifleBusy&&Te==='walking');
{const j=Xt.getPose().joints;check('Standing upright again',j.Head[1]>1.4);}
key('Space');check('Jumping works again',jumpPhase==='anticipation');expedition.advance(1.5);
check('Walking camera field of view restored',Math.abs(Ze.fov-55)<.01);
// ---- reset mid-aim ----
lie();Oa();check('Reset while prone puts everything back',rifleNow().mode==='idle'&&!rifleBusy&&lookoutRifle.visible&&rifleNow().prone===0&&Math.abs(rifleNow().yaw-RIFLE.restYaw)<1e-9);
// ---- the other modes are not disturbed ----
stand(tx+.3,tz-1.5);Te='driving';check('E does not lie down while driving',!R.mount());Te='walking';
const pre=document.createElement('pre');pre.id='rifle-results';pre.hidden=true;pre.textContent=JSON.stringify({results,tune:{length:RIFLE.length,back:RIFLE.back,side:RIFLE.side,restYaw:RIFLE.restYaw,damage:RIFLE.damage,cycle:RIFLE.cycle}});document.body.append(pre);
