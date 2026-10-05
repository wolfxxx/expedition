const results=[];const check=(name,pass,detail)=>results.push({name,pass:!!pass,detail});
try{
const E=expedition;
// ---- finding stones with a clear run-up (heading +z, 15 m before and 8 m beyond, 2.6 m either side) ----
const clearRun=(c,pool)=>pool.every(o=>o===c||!(Math.abs(o.x-c.x)<2.0+o.r&&o.z>c.z-13.5-o.r&&o.z<c.z+8+o.r));
const inRange=c=>Math.hypot(c.x,c.z)<70&&c.z-15>-80;
const stonesIn=(lo,hi)=>stoneList().filter(c=>c.height>=lo&&c.height<=hi&&inRange(c)&&clearRun(c,Je.colliders));
const bigRocks=Je.colliders.filter(c=>c.height>ROCK.maxHeight&&c.height<1.4&&Math.abs(c.height-c.r)<.02&&inRange(c)&&clearRun(c,Je.colliders));
const trees=Je.colliders.filter(c=>c.height>3&&c.r<.4&&inRange(c)&&clearRun(c,Je.colliders));

let sounds=0;const realHit=valleyAudio.rockHit;valleyAudio.rockHit=level=>{sounds++;return realHit(level);};
// drive at a stone from 12 m away along +z, holding the speed so only the stone can slow the Jeep
function drive(c,speed,seconds=3){
 Oa();Te='driving';Fi='chase';const sx=c.x,sz=c.z-12;
 zt.root.position.set(sx,world.height(sx,sz),sz);Xe=0;zt.root.rotation.set(0,0,0);le=speed;fc(1,true);
 const before={hits:rockState.hits,launches:rockState.launches,landings:rockState.landings,sounds};
 let maxLift=0,flew=false,passedAt=null,minLe=99;
 for(let i=0;i<seconds*60;i++){
  if(le>=0)le=Math.max(le,speed);else le=speed;
  E.advance(1/60);
  const p=zt.root.position;maxLift=Math.max(maxLift,p.y-world.height(p.x,p.z));flew=flew||rockState.flying;minLe=Math.min(minLe,le);
  if(passedAt===null&&p.z>c.z+2)passedAt=i/60;
 }
 return {z:zt.root.position.z-c.z,maxLift,flew,passedAt,hits:rockState.hits-before.hits,launches:rockState.launches-before.launches,landings:rockState.landings-before.landings,sounds:sounds-before.sounds,minLe};
}

// ---- the stones ----
const stones=stoneList();
check('Low stones are recognised (at least 20, none taller than a wheel)',stones.length>=20&&stones.every(c=>c.height<=ROCK.maxHeight),stones.length+' stones');
check('Taller rocks and trees are not drivable',Je.colliders.filter(c=>c.height>ROCK.maxHeight).every(c=>!stones.includes(c)));
const low=stonesIn(.6,.95).sort((a,b)=>b.height-a.height)[0]; // the tallest clear one gives the steepest crest
check('A stone with a clear run-up exists for testing',!!low);
if(low){
 const need=speedNeeded(low);
 // ---- speed decides ----
 const slow=drive(low,need*.6,4);
 check('Too slow: the Jeep stops against the stone, as before',slow.z<-.3&&slow.passedAt===null,'stopped '+(-slow.z).toFixed(1)+' m short');
 const ok=drive(low,need*1.5,3);
 check('Fast enough: it drives over',ok.passedAt!==null&&ok.z>2,'speed '+(need*1.5).toFixed(1)+' m/s, need '+need.toFixed(1));
 check('Driving over it lifts the body and tilts the car',ok.maxLift>.15,'body rose '+ok.maxLift.toFixed(2)+' m');
 check('It keeps most of its speed',ok.minLe>need*1.5*.7);
 check('Touching the stone makes a thump',ok.hits===1&&ok.sounds>=1);
 // ---- launch ----
 const fast=drive(low,14,3); // 14 m/s: this stone crests sharply enough to launch at that speed (faster runs only bounce the body)
 check('At speed the Jeep leaves the ground once',fast.flew&&fast.launches===1,fast.launches+' launch(es); stone '+JSON.stringify({x:+low.x.toFixed(1),z:+low.z.toFixed(1),h:low.height,r:low.r})+' ended z '+fast.z.toFixed(1)+' hits '+fast.hits+' flew '+fast.flew);
 check('It rises a good way (over 0.4 m)',fast.maxLift>.4,'peak '+fast.maxLift.toFixed(2)+' m');
 check('It lands with a heavy thud',fast.landings>=1&&rockState.last&&rockState.last.impact>1.2&&fast.sounds>=2,'impact '+(rockState.last&&rockState.last.impact));
 for(let i=0;i<30;i++)E.advance(1/60); // let the suspension settle
 check('It comes back down onto the ground',!rockState.flying&&Math.abs(zt.root.position.y-world.height(zt.root.position.x,zt.root.position.z))<.4,'flying '+rockState.flying+', y offset '+(zt.root.position.y-world.height(zt.root.position.x,zt.root.position.z)).toFixed(2)+' at z '+zt.root.position.z.toFixed(1));
 const hop=drive(low,need*1.5,3);
 check('Just above the minimum speed there is no launch',hop.launches===0,hop.launches+' launches');
 // ---- never a trap ----
 Oa();Te='driving';zt.root.position.set(low.x,world.height(low.x,low.z),low.z-.5);Xe=0;zt.root.rotation.set(0,0,0);le=0;
 const startZ=zt.root.position.z;for(let i=0;i<180;i++){le=-3;E.advance(1/60);}
 check('A Jeep sitting on a stone can always reverse off it',zt.root.position.z<startZ-2,'moved back '+(startZ-zt.root.position.z).toFixed(1)+' m');
 Oa();Te='driving';zt.root.position.set(low.x,world.height(low.x,low.z),low.z-.5);Xe=0;le=0;
 const startZ2=zt.root.position.z;for(let i=0;i<120;i++){le=Math.max(le,0)+.2;E.advance(1/60);if(le>6)le=6;}
 check('...and drive on over it from a standstill on top',zt.root.position.z>startZ2+1.5);
}
// ---- everything else stays solid ----
if(bigRocks.length){const r=drive(bigRocks[0],20,4);check('A rock taller than a wheel stops the Jeep even at 72 km/h',r.passedAt===null&&r.z<0,'stopped '+(-r.z).toFixed(1)+' m short');}
else check('(no isolated tall rock to test)',true);
if(trees.length){const r=drive(trees[0],20,4);check('A tree stops the Jeep at speed',r.passedAt===null&&r.z<0);}
else check('(no isolated tree to test)',true);
// ---- ordinary driving is unaffected ----
{Oa();Te='driving';zt.root.position.set(0,world.height(0,0),0);Xe=0;zt.root.rotation.set(0,0,0);le=10;fc(1,true);
 const hits=rockState.hits,launches=rockState.launches;let worst=0;
 for(let i=0;i<120;i++){le=Math.max(le,10);E.advance(1/60);const p=zt.root.position;if(!Je.colliders.some(c=>Math.hypot(c.x-p.x,c.z-p.z)<c.r+3))worst=Math.max(worst,Math.abs(p.y-world.height(p.x,p.z)));}
 check('On open ground nothing changes: no hits, no launches, body on the terrain',rockState.hits===hits&&rockState.launches===launches&&worst<.25,'worst height error '+worst.toFixed(2));}
// ---- reset ----
Oa();check('Reset clears any airborne state',!rockState.flying&&rockState.vy===0);
valleyAudio.rockHit=realHit;
}catch(error){results.push({name:'Script error: '+error.message,pass:false,detail:String(error.stack||'').slice(0,300)});}
const pre=document.createElement('pre');pre.id='rocks-results';pre.hidden=true;pre.textContent=JSON.stringify({results});document.body.append(pre);
