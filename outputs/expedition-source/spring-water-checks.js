const results=[];const check=(name,pass,detail)=>results.push({name,pass:!!pass,detail});
try{
const E=expedition,S=E.spring;
S.settings.adaptive=false; // (the software renderer used for testing is slow; it would trip the safety valve tested at the end)
// count splash sounds and ripples without needing real audio
let sounds=0;const realSplash=valleyAudio.splash;valleyAudio.splash=level=>{sounds++;return realSplash(level);};
let quacks=0;const realQuack=valleyAudio.quack;valleyAudio.quack=level=>{quacks++;return realQuack(level);};
const rippleAges=()=>S.ripples.filter(r=>Fa-r.z<4&&r.w>0);
const near=(x,z,r,maxAge=4)=>S.ripples.filter(q=>q.w>0&&Fa-q.z<maxAge&&Math.hypot(q.x-x,q.y-z)<r).length;
const clearRipples=()=>S.ripples.forEach(r=>r.set(0,0,-99,0));
function atEastBank(){Oa();Te='walking';Xt.root.position.set(-6.5,world.height(-6.5,6),6);Wn=-1.4;Xt.root.rotation.y=-1.4;Da=2.2;bs=.25;Ue.clear();fc(1,true);E.advance(.3);}

// ---- the water itself ----
check('The water is a transparent, tinted material with no depth write',lake.material===S.material&&S.material.transparent&&S.material.depthWrite===false);
atEastBank();
check('The water shader compiled without errors',(()=>{const p=Ae.properties.get(S.material).currentProgram;return !!p&&!p.diagnostics;})());
{const [w,h]=S.state().reflect;check('The scene is mirrored into a render target about half the screen size',S.target.width===w&&Math.abs(w-Ae.getDrawingBufferSize(new L()).x*.5)<2&&w>=128,w+' x '+h);}
{const rt=S.target;check('The reflection has real content (not a blank texture)',(()=>{const gl=Ae.getContext();const buf=new Uint8Array(rt.width*rt.height*4);Ae.readRenderTargetPixels(rt,0,0,rt.width,rt.height,buf);let lit=0,distinct=new Set();for(let i=0;i<buf.length;i+=4*97){if(buf[i]+buf[i+1]+buf[i+2]>30)lit++;distinct.add((buf[i]>>4)+','+(buf[i+1]>>4)+','+(buf[i+2]>>4));}return lit>50&&distinct.size>12;})());}

// ---- the lakebed grid ----
check('The lakebed is 1.4 m deep in the middle and dry well away from the lake',Math.abs(S.waterDepth(-22,5)-1.4)<.05&&S.waterDepth(0,0)===0&&S.waterDepth(-36,17)===0,S.waterDepth(-22,5).toFixed(2)+' m');
check('Depth grows steadily from the bank to the middle',S.waterDepth(-10.6,5)<S.waterDepth(-12,5)&&S.waterDepth(-12,5)<S.waterDepth(-14,5)&&S.waterDepth(-14,5)<=S.waterDepth(-22,5)+.001);
{let worst=0;for(let i=0;i<300;i++){const x=-34+Math.random()*24,z=-4+Math.random()*18,exact=lakeDistance(x,z)<12?Math.max(0,waterLevel-world.height(x,z)):0;worst=Math.max(worst,Math.abs(S.waterDepth(x,z)-exact));}
 check('The sampled depth matches the real terrain to within 4 cm at 300 random points',worst<.04,'worst '+(worst*100).toFixed(1)+' cm');}

// ---- ripples ----
clearRipples();{const t=Fa;S.addRipple(-20,5,.8);check('A ripple is stored with its position, start time and strength',S.ripples.some(r=>r.x===-20&&r.y===5&&Math.abs(r.z-t)<1e-9&&Math.abs(r.w-.8)<1e-9));}
{clearRipples();for(let i=0;i<14;i++)S.addRipple(i,i,1);check('Only 12 ripples can be alive at once; the oldest are replaced',S.ripples.filter(r=>r.w>0).length===12&&!S.ripples.some(r=>r.x===0&&r.y===0&&r.w>0));}
{clearRipples();Oa();Xt.root.position.set(0,world.height(0,-30),-30);S.addRipple(-20,5,1);E.advance(6);
 check('Ripples fade out after four seconds',near(-20,5,.01)===0);}

// ---- the life around the water ----
{const c=S.counts;check('Reeds, cattails, lily pads, flowers and lakebed weeds are all planted',c.reeds>=100&&c.heads>=20&&c.pads>=25&&c.flowers>=3&&c.weeds>=100,JSON.stringify(c));}
check('There are three ducks and three dragonflies',S.ducks.length===3&&S.flies.length===3);
{const a=reedBases[0];const m1=reedsA.instanceMatrix.array.slice(0,16).join(),m2=(()=>{E.advance(1.3);return reedsA.instanceMatrix.array.slice(0,16).join();})();
 check('The reeds sway in the wind',m1!==m2);}
{const b=S.boat;check('A rowboat floats at its mooring in water deep enough for it',Math.abs(b.position.y-(waterLevel+.055))<.04&&waterDepth(b.position.x,b.position.z)>.3,waterDepth(b.position.x,b.position.z).toFixed(2)+' m deep');}
check('The boat is solid: nobody can stand inside it',(()=>{const p=new L(spBoatBase.x,world.height(spBoatBase.x,spBoatBase.z),spBoatBase.z);Je.resolveCircle(p,.28);return world.colliders.filter(c=>c.height===.5&&Math.hypot(c.x-spBoatBase.x,c.z-spBoatBase.z)<1.2).every(c=>Math.hypot(p.x-c.x,p.z-c.z)>=c.r+.28-.02);})());
check('Nothing grows through the boat',![...reedBases,...pads].some(r=>Math.hypot((r.x)-spBoatSpot.x,(r.z)-spBoatSpot.z)<2.0));
check('Lily pads float on the surface and reeds stand at the water\'s edge',pads.every(p=>spWet(p.x,p.z)>.2)&&reedBases.every(r=>{const w=spWet(r.x,r.z);return w>-.25&&w<.5;}));

// ---- ducks ----
Oa();Xt.root.position.set(0,world.height(0,-30),-30);Te='walking';
{let minDepth=9,inside=true;for(let i=0;i<120;i++){E.advance(.5);for(const d of S.ducks){minDepth=Math.min(minDepth,waterDepth(d.x,d.z));if(d.x<-36||d.x>-7||d.z<-8||d.z>18)inside=false;}}
 check('In a minute of swimming the ducks never touch the bank or leave the lake',minDepth>.3&&inside,'shallowest '+minDepth.toFixed(2)+' m');}
{const d=S.ducks[0];d.x=-14;d.z=5;d.fleeing=0;d.target=[-14,5];
 Oa();Te='walking';Xt.root.position.set(-10.3,world.height(-10.3,5),5);Wn=-1.57;Xt.root.rotation.y=-1.57;fc(1,true);Ue.add('KeyW');
 const before=Math.hypot(d.x-Xt.root.position.x,d.z-Xt.root.position.z);E.advance(.4);const started=d.fleeing>0;Ue.clear();
 check('A person walking up to a duck makes it swim away',started,'fleeing '+d.fleeing.toFixed(1)+' s');}
{Ue.clear();Oa();const d=S.ducks[1];Xt.root.position.set(d.x+5,world.height(d.x+5,d.z),d.z);d.fleeing=0;E.advance(1);
 check('Someone standing still at a distance does not scare them',d.fleeing===0);}

// ---- dragonflies and fish ----
Oa();Xt.root.position.set(-6.5,world.height(-6.5,6),6);fc(1,true);
{let ok=true,low=9,high=0;for(let i=0;i<80;i++){E.advance(.25);for(const f of S.flies){if(f.x<-38||f.x>-6||f.z<-9||f.z>19)ok=false;low=Math.min(low,f.y-waterLevel);high=Math.max(high,f.y-waterLevel);}}
 check('Dragonflies hover and dart above the water and the bank',ok&&low>.2&&high<2.2,'between '+low.toFixed(2)+' and '+high.toFixed(2)+' m above the surface');}
{const jumps=S.fish.jumps;let splashes=sounds,seenAir=false;for(let i=0;i<200&&S.fish.jumps===jumps;i++)E.advance(.25);
 for(let i=0;i<8;i++){E.advance(.1);if(S.fish.active)seenAir=true;}
 check('A fish leaps now and then when you are nearby, and splashes',S.fish.jumps>jumps&&sounds>splashes);
 for(let i=0;i<10;i++)E.advance(.2);check('...and is gone again afterwards',!S.fish.active);}

// ---- you in the water ----
atEastBank();clearRipples();
{Xt.root.position.set(-9.4,world.height(-9.4,2),2);Wn=-1.57;Xt.root.rotation.y=-1.57;fc(1,true);const s0=sounds;Ue.add('KeyW');Ue.add('ShiftLeft');
 for(let i=0;i<14;i++)E.advance(.15);Ue.clear();
 const p=Xt.root.position;
 check('Wading in makes ripples around you',waterDepth(p.x,p.z)>.1&&near(p.x,p.z,3)>0,'depth '+waterDepth(p.x,p.z).toFixed(2)+' m');
 check('...and a splash sound',sounds>s0);
 check('...and spray',fxList.length>0);
 E.advance(1);clearRipples();E.advance(1.5);const quiet=near(p.x,p.z,1.5,1.4); // (a second to come to a stop first)
 check('Standing still in the water makes no ripples of its own',quiet===0,quiet+' near you');}
// ---- the Jeep ----
Oa();Te='driving';zt.root.position.set(-9.5,world.height(-9.5,2),2);Xe=-1.57;zt.root.rotation.set(0,-1.57,0);le=9;fc(1,true);clearRipples();
{const s0=sounds;for(let i=0;i<70;i++){le=Math.max(le,9);E.advance(1/60);}
 const p=zt.root.position;check('Driving through the water leaves a wake of ripples',near(p.x,p.z,6)>=3,near(p.x,p.z,6)+' ripples');
 check('...and splashes',sounds>s0);}
// ---- bullets ----
{const origin=new L(18,3.7,35),down=new L(-.80,-.075,-.60).normalize();
 const hit=S.bullet(origin,down,200);
 check('A shot that crosses the lake surface reports the point where it enters',!!hit&&Math.abs(hit.point.y-waterLevel)<1e-6&&waterDepth(hit.point.x,hit.point.z)>.05,hit?hit.distance.toFixed(0)+' m':'none');
 check('A shot over dry land does not splash',S.bullet(origin,new L(1,-.05,0).normalize(),200)===null);
 check('A shot that points up does not splash',S.bullet(origin,new L(-.8,.1,-.6).normalize(),200)===null);
 check('A shot that hits something nearer than the water does not splash',S.bullet(origin,down,hit.distance-5)===null);
 Oa();Xt.root.position.set(tx+.3,lookoutTop,tz-1.5);Xt.root.rotation.y=0;Wn=0;fc(1,true);E.rifle.mount();E.advance(1.8);
 E.rifle.aim(Math.atan2(-40,-30),-.075);E.advance(.2);const s0=sounds,before=rippleAges().length;E.rifle.fire();
 const hitAt=E.getState().rifle.last.point;
 check('A rifle shot into the lake lands as a splash at the surface',E.getState().rifle.last.kind==='water'&&near(hitAt[0],hitAt[2],1,1)>0,E.getState().rifle.last.kind);} // (its sound arrives after the delay of the speed of sound)
// ---- Mosswick in the lake ----
Oa();Te='walking';Xt.root.position.set(0,world.height(0,-30),-30);clearRipples();
{const d=poisonDwarf;d.resetHealth();d.root.position.set(-11.2,world.height(-11.2,5),5);const s0=sounds;d.fling(new L(-7,5,0)); // thrown from the bank, out over the water
 let wet=false;for(let i=0;i<60;i++){E.advance(.1);if(near(d.root.position.x,d.root.position.z,4,6)>0)wet=true;}
 check('A body thrown into the lake splashes on the surface',sounds>s0&&wet);
 check('...and floats there rather than sinking to the bed',d.state().defeated&&d.root.position.y>waterLevel-.25,'y '+d.root.position.y.toFixed(2));
 d.resetHealth();}
// ---- the boat and the ducks are solid ----
{const hull=[Math.sin(spBoatBase.heading),Math.cos(spBoatBase.heading)],boatCols=world.colliders.filter(c=>c.boat);
 check('The boat has four collision circles lined up along its hull (not across it)',boatCols.length===4&&boatCols.every(c=>Math.abs((c.x-spBoatBase.x)*hull[1]-(c.z-spBoatBase.z)*hull[0])<.01)&&Math.hypot(boatCols[0].x-boatCols[3].x,boatCols[0].z-boatCols[3].z)>1.8);
 check('...and they are never mistaken for drivable stones',boatCols.every(c=>c.solid&&!stoneList().includes(c)));
 const walkAt=(fromAhead,yaw)=>{Oa();Te='walking';Xt.root.position.set(spBoatBase.x+hull[0]*fromAhead,world.height(spBoatBase.x+hull[0]*fromAhead,spBoatBase.z+hull[1]*fromAhead),spBoatBase.z+hull[1]*fromAhead);Wn=yaw;Xt.root.rotation.y=yaw;fc(1,true);E.advance(.2);
  let closest=99;Ue.clear();Ue.add('KeyW');for(let i=0;i<30;i++){E.advance(.1);closest=Math.min(closest,Math.hypot(Xt.root.position.x-(spBoatBase.x+hull[0]*.2),Xt.root.position.z-(spBoatBase.z+hull[1]*.2)));}Ue.clear();return closest;};
 const fromBow=walkAt(4,Math.atan2(-hull[0],-hull[1])),fromStern=walkAt(-4,Math.atan2(hull[0],hull[1]));
 check('Walking straight at the bow stops you short of the boat',fromBow>.75,'closest '+fromBow.toFixed(2)+' m to the middle');
 check('Walking straight at the stern stops you short of the boat',fromStern>.75,'closest '+fromStern.toFixed(2)+' m to the middle');
 // the Jeep
 Oa();Te='driving';zt.root.position.set(-9.4,world.height(-9.4,spBoatBase.z),spBoatBase.z);Xe=-1.57;zt.root.rotation.set(0,-1.57,0);le=8;fc(1,true);
 const hitsBefore=rockState.hits;let rode=0;for(let i=0;i<150;i++){le=Math.max(le,8);E.advance(1/60);rode=Math.max(rode,zt.root.position.y-world.height(zt.root.position.x,zt.root.position.z));}
 check('The Jeep stops against the boat instead of riding over it',zt.root.position.x>spBoatBase.x+1&&rockState.hits===hitsBefore&&rode<.4,'stopped at x '+zt.root.position.x.toFixed(1)+', body rose '+rode.toFixed(2)+' m');}
{Oa();Te='walking';const d=S.ducks[0];d.air=null;d.x=-18;d.z=2;d.fleeing=0;const p=new L(d.x+.1,world.height(d.x,d.z),d.z);Je.resolveCircle(p,.28);
 check('A duck is solid: standing on one pushes you out of it',Math.hypot(p.x-d.x,p.z-d.z)>=.26*d.mesh.scale.x+.28-.01,Math.hypot(p.x-d.x,p.z-d.z).toFixed(2)+' m');}
{ // the Jeep drives into a duck
 Oa();Te='driving';const d=S.ducks[2];d.air=null;d.x=-12.2;d.z=1.6;d.fleeing=0;d.target=[d.x,d.z];
 zt.root.position.set(-8.6,world.height(-8.6,1.6),1.6);Xe=-1.57;zt.root.rotation.set(0,-1.57,0);le=8;fc(1,true);
 const q0=quacks,fx0=fxList.length,x0=d.x,z0=d.z;let flew=false,minLe=99;
 for(let i=0;i<120&&!flew;i++){le=Math.max(le,8);E.advance(1/60);d.fleeing=0;if(d.air){flew=true;}minLe=Math.min(minLe,le);}
 check('Driving into a duck sends it flapping into the air',flew);
 check('...with a honk and a cloud of feathers',quacks>q0&&fxList.length>fx0,'honks '+(quacks-q0));
 check('...and the Jeep carries on (a duck does not stop it)',le>5,'speed '+le.toFixed(1));
 for(let i=0;i<30&&d.air;i++)E.advance(.1);
 check('The duck lands again on the water, somewhere else on the lake',!d.air&&waterDepth(d.x,d.z)>.3&&Math.hypot(d.x-x0,d.z-z0)>2.5,'moved '+Math.hypot(d.x-x0,d.z-z0).toFixed(1)+' m');}
{ // a Jeep passing at a distance only makes them swim off
 Oa();Te='driving';const d=S.ducks[0];d.air=null;d.x=-20;d.z=5;d.fleeing=0;zt.root.position.set(-9.5,world.height(-9.5,-1),-1);Xe=-1.57;zt.root.rotation.set(0,-1.57,0);le=6;fc(1,true);
 for(let i=0;i<60;i++){le=Math.max(le,6);E.advance(1/60);}
 check('A Jeep passing well clear does not make a duck fly, only swim away',!d.air);}

// ---- slow machines ----
{S.settings.adaptive=true;S.quality.level=0;S.settings.reflectScale=.5;S.quality.mirror.value=1;S.quality.ema=16;S.quality.slowFor=0;
 for(let i=0;i<30;i++)S.adapt(16.7);check('At 60 fps the mirror stays at full quality',S.settings.reflectScale===.5&&S.quality.level===0);
 for(let i=0;i<20;i++)S.adapt(80);check('A second of slow frames is not enough to change anything',S.quality.level===0);
 for(let i=0;i<15;i++)S.adapt(80);check('About 2.5 s of slow frames shrink the mirror one step',S.quality.level===1&&S.settings.reflectScale===.35,'scale '+S.settings.reflectScale);
 for(let i=0;i<35;i++)S.adapt(80);check('...and another 2.5 s shrinks it again',S.quality.level===2&&S.settings.reflectScale===.25,'scale '+S.settings.reflectScale);
 for(let i=0;i<400;i++)S.adapt(80);check('At the last step the mirror is switched off in favour of a sky tint',S.settings.reflectScale===0&&S.quality.mirror.value===0);
 S.adapt(400);check('A long gap (lake out of view) is not counted as a slow frame',S.settings.reflectScale===0);
 Oa();Te='walking';Xt.root.position.set(-6.5,world.height(-6.5,6),6);fc(1,true);E.advance(.3);
 check('With the mirror off the water still renders (no errors)',(()=>{const p=Ae.properties.get(S.material).currentProgram;return !!p&&!p.diagnostics;})());
 S.settings.adaptive=false;S.quality.level=0;S.settings.reflectScale=.5;S.quality.mirror.value=1;}
// ---- the rest of the game is undisturbed ----
Oa();check('Reset leaves the spring in place',lake.material===S.material&&S.ducks.length===3);
valleyAudio.splash=realSplash;valleyAudio.quack=realQuack;
}catch(error){results.push({name:'Script error: '+error.message,pass:false,detail:String(error.stack||'').slice(0,400)});}
const pre=document.createElement('pre');pre.id='spring-water-results';pre.hidden=true;pre.textContent=JSON.stringify({results});document.body.append(pre);
