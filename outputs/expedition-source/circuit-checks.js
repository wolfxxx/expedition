const results=[];const check=(name,pass,detail)=>results.push({name,pass:!!pass,detail});
try{
const C=expedition.circuit,R=C.layout,ramp=name=>R.ramps.find(r=>r.name===name);
const kicker=ramp('Kicker'),big=ramp('Big kicker'),roller=R.ramps.find(r=>r.name==='Roller');
let sounds=0;const realHit=valleyAudio.rockHit;valleyAudio.rockHit=level=>{sounds++;return realHit(level);};
const step=()=>{Fu(1/60);fc(1/60);}; // the game step without drawing, so the checks run quickly
// put the Jeep at (x,z) heading along z (dir 1 north, -1 south) and drive, holding the speed while the wheels are down
function drive(x,z,dir,speed,seconds){
 Oa();Te='driving';Fi='chase';const yaw=dir>0?0:Math.PI;
 zt.root.position.set(x,world.height(x,z),z);Xe=yaw;zt.root.rotation.set(0,yaw,0);le=speed;fc(1,true);
 const before={launches:rockState.launches,sounds,jumps:C.jumps.count};
 let flights=[],was=false,stopped=false,noseUp=0,airSpeed=null,airYaw=null;
 for(let i=0;i<seconds*60;i++){
  if(!rockState.flying)le=Math.max(le,speed);
  step();
  if(rockState.flying&&rockState.ramp){noseUp=Math.min(noseUp,zt.root.rotation.x);if(airSpeed===null){airSpeed=le;airYaw=Xe;}}
  if(was&&!rockState.flying&&C.jumps.last)flights.push(C.jumps.last);
  was=rockState.flying;if(le===0)stopped=true;
 }
 return {z:zt.root.position.z,flights,stopped,noseUp,launches:rockState.launches-before.launches,sounds:sounds-before.sounds,jumps:C.jumps.count-before.jumps};
}

// ---- the clearing ----
check('Trees and stones were cleared from the circuit ground',C.cleared.colliders>20&&C.cleared.instances>100,C.cleared.colliders+' collision circles, '+C.cleared.instances+' instances');
check('Nothing natural is left standing in the clearing (only the circuit\'s own bales, flags and posts)',Je.colliders.filter(c=>C.clearing(c.x,c.z)&&!c.solid).length===0);
{
 const m=new ue(),p=new L(),keep=new Set([grass,flowerStems,flowerHeads]);let left=0;
 world.root.updateMatrixWorld(true);
 world.root.traverse(o=>{if(!o.isInstancedMesh||!o.visible||keep.has(o))return;for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);if(Math.abs(m.determinant())<1e-9)continue;p.setFromMatrixPosition(m).applyMatrix4(o.matrixWorld);if(C.clearing(p.x,p.z))left++;}});
 check('No trees, bushes or rocks are drawn in the clearing',left===0,left+' left');
}
{
 Oa();Te='driving';zt.root.position.set(47,world.height(47,0),0);expedition.landscape.grassFill();
 const tufts=expedition.landscape.grassData.filter(g=>g.ok),onTrack=tufts.filter(g=>C.track(g.x,g.z)).length;
 check('No grass grows on the dirt track, but it still grows beside it',onTrack===0&&tufts.length>2000,onTrack+' on track of '+tufts.length);
}
check('The ring road is untouched: no ramp on it',Je.loop.every(([x,z])=>C.rampHeight(x,z)===0));
// ---- the ramps are ground ----
check('The kicker lip stands 1.5 m above the ground',Math.abs(world.height(kicker.x,kicker.lip)-C.ground(kicker.x,kicker.lip)-1.5)<.01);
check('The big kicker lip stands 2.2 m above the ground',Math.abs(world.height(big.x,big.lip)-C.ground(big.x,big.lip)-2.2)<.01);
{
 Oa();Te='walking';const x=kicker.x,z=kicker.lip-1;Xt.root.position.set(x,world.height(x,z),z);
 check('On foot you can stand on a ramp',Math.abs(world.walkHeight(x,z,Xt.root.position.y)-world.height(x,z))<.05&&world.height(x,z)-C.ground(x,z)>.8);
}
// ---- driving the ramps ----
{const r=drive(kicker.x,kicker.lip-13,1,5,5);check('At 18 km/h the Jeep rolls over the kicker without flying',r.launches===0&&!r.stopped&&r.z>kicker.lip+kicker.back,'launches '+r.launches+', ended at z '+r.z.toFixed(1));}
{
 const r=drive(kicker.x,kicker.lip-13,1,14,3.5),f=r.flights[0];
 check('At 50 km/h the kicker launches the Jeep once',r.launches===1&&r.jumps===1,'launches '+r.launches);
 check('It flies about a second and 9 to 18 m',f&&f.air>.7&&f.air<1.4&&f.distance>9&&f.distance<18,f&&JSON.stringify(f));
 check('The nose lifts with the ramp on the way up',r.noseUp<-.15,'pitch '+r.noseUp.toFixed(2));
 check('It lands with a thud and the report shows the jump',r.sounds>=1&&/ s · \d+ m · /.test(oe('notice').textContent),oe('notice').textContent);
 for(let i=0;i<30;i++)step();
 check('It is back on its wheels on the ground',!rockState.flying&&Math.abs(zt.root.position.y-world.height(zt.root.position.x,zt.root.position.z))<.15);
}
{
 const r=drive(big.x,big.lip+12,-1,20,3.5),f=r.flights[0];
 check('At 72 km/h the big kicker throws it over 20 m and 3 m high',f&&f.air>1.2&&f.distance>20&&f.height>3,f&&JSON.stringify(f));
}
{
 // in the air: holding the throttle and steering hard does (almost) nothing
 Oa();Te='driving';Fi='chase';zt.root.position.set(big.x,world.height(big.x,big.lip+12),big.lip+12);Xe=Math.PI;zt.root.rotation.set(0,Math.PI,0);le=18;fc(1,true);
 let i=0;for(;i<200&&!rockState.flying;i++){le=Math.max(le,18);step();}
 const speed=le,yaw=Xe;Ue.add('KeyW');Ue.add('KeyA');for(let k=0;k<30&&rockState.flying;k++)step();Ue.clear();
 check('In the air the throttle does not speed it up and steering barely turns it',rockState.flying&&Math.abs(le-speed)<.2&&Math.abs(Xe-yaw)<.12,'speed '+speed.toFixed(1)+' -> '+le.toFixed(1)+', yaw change '+(Xe-yaw).toFixed(3));
}
{const r=drive(roller.x,roller.lip-4,1,8,3);check('The rollers can be driven over at 29 km/h',!r.stopped&&r.z>roller.lip+8,'ended at z '+r.z.toFixed(1));}
{const r=drive(kicker.x,kicker.lip+kicker.back+3,-1,8,3);check('The kicker can be driven over backwards',!r.stopped&&r.z<kicker.lip-kicker.up,'ended at z '+r.z.toFixed(1));}
{
 // the hay bales round the turns are solid: drive straight out of the north turn at the middle one
 const [bx,bz]=C.bales[7],r=drive(bx,bz-9,1,10,3);
 check('The hay bales round the turns stop the Jeep',r.stopped&&zt.root.position.z<bz,'stopped at z '+zt.root.position.z.toFixed(1)+', bale at '+bz.toFixed(1)+', '+C.bales.length+' bales');
}
{
 // a lap with the real controls: steer for a point ahead on the centreline, hold 54 km/h
 Oa();Te='driving';Fi='chase';const P=C.path,n=P.length;zt.root.position.set(R.cx-R.R,world.height(R.cx-R.R,R.start-1),R.start-1);Xe=0;zt.root.rotation.set(0,0,0);le=0;fc(1,true);
 const jumps=C.jumps.count;let off=0,slow=0,frames=28*60;
 for(let i=0;i<frames;i++){
  const p=zt.root.position;let k=0,best=1e9;P.forEach((q,j)=>{const d=Math.hypot(q[0]-p.x,q[1]-p.z);if(d<best){best=d;k=j;}});
  const q=P[(k+9)%n];let err=Math.atan2(q[0]-p.x,q[1]-p.z)-Xe;err=Math.atan2(Math.sin(err),Math.cos(err));
  Ue.clear();if(err>.06)Ue.add('KeyA');else if(err<-.06)Ue.add('KeyD');if(le<15)Ue.add('KeyW');
  step();if(!C.track(p.x,p.z))off++;if(i>120&&le<3)slow++;
 }
 Ue.clear();
 check('A lap at 54 km/h stays on the track, never stalls and takes every jump',off<frames*.03&&slow===0&&C.jumps.count-jumps>=4,'off track '+off+' frames, stalled '+slow+', jumps '+(C.jumps.count-jumps));
}
Oa();check('Reset clears any flight',!rockState.flying&&!rockState.ramp&&C.jumps.current===null);
valleyAudio.rockHit=realHit;
}catch(error){results.push({name:'Script error: '+error.message,pass:false,detail:String(error.stack||'').slice(0,300)});}
const pre=document.createElement('pre');pre.id='circuit-results';pre.hidden=true;pre.textContent=JSON.stringify({results});document.body.append(pre);
