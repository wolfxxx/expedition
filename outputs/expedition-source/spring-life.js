// Life at Mirror Spring (see spring.js for the water itself): lily pads and flowers, swaying reeds and cattails, weeds and
// stones on the lakebed, a driftwood log, a moored rowboat, ducks, dragonflies and leaping fish, plus ripples and splashes
// from wading, the Jeep, bullets and falling bodies. Everything is built from simple shapes in code.
let spSeed=20481;
const spRand=()=>{spSeed=(Math.imul(spSeed,1664525)+1013904223)>>>0;return spSeed/4294967296;};
const spRange=(a,b)=>a+spRand()*(b-a);
const spGroup=new ee();spGroup.name='Mirror spring life';bn.add(spGroup);
const spMats={};
const spMat=(color,extra={})=>spMats[color+JSON.stringify(extra)] ||= new be({color,roughness:.85,...extra});
const spDummy=new Me();
const spWet=(x,z)=>waterLevel-world.height(x,z); // + under water, - above it
const spInBoardwalk=(x,z)=>Math.abs(x+8.8)<2.2&&z>-.5&&z<10;
const spBoatSpot={x:-12.4,z:4.7},spNearBoat=(x,z)=>Math.hypot(x-spBoatSpot.x,z-spBoatSpot.z)<2.1;
// pick random points whose wetness is within [lo, hi]
function spPoints(count,lo,hi,{near=null,radius=0}={}){
 const out=[];
 for(let tries=0;out.length<count&&tries<count*400;tries++){
  const x=near?near[0]+(spRand()*2-1)*radius:SPRING.cx+(spRand()*2-1)*13,z=near?near[1]+(spRand()*2-1)*radius:SPRING.cz+(spRand()*2-1)*11;
  const w=spWet(x,z);if(w<lo||w>hi||spInBoardwalk(x,z)||spNearBoat(x,z))continue;
  out.push([x,z,w]);
 }
 return out;
}
function spInstanced(geometry,material,count,shadow=false){
 const m=new kn(geometry,material,count);m.castShadow=shadow;m.receiveShadow=true;m.frustumCulled=false;spGroup.add(m);return m;
}

// ---- reeds and cattails, swaying in the wind -------------------------------------------------------------------------------------------
const reedGeometry=new en(.004,.013,1,5);reedGeometry.translate(0,.5,0);
const headGeometry=new en(.024,.024,.17,6);headGeometry.translate(0,0,0);
const reedBases=[];
for(let c=0;c<24;c++){
 const centre=spPoints(1,-.15,.30)[0];if(!centre)continue;
 const stems=Math.round(spRange(6,13));
 for(const [x,z] of spPoints(stems,-.2,.45,{near:centre,radius:.55}))reedBases.push({x,y:world.height(x,z),z,h:spRange(.7,1.7),phase:spRand()*6.28,lean:[spRange(-.06,.06),spRange(-.06,.06)],head:spRand()<.4});
}
const reedsA=spInstanced(reedGeometry,spMat('#6f8f45'),reedBases.length),reedsB=spInstanced(reedGeometry,spMat('#8aa053'),reedBases.length);
const cattailHeads=reedBases.filter(r=>r.head),heads=spInstanced(headGeometry,spMat('#5b3d26'),Math.max(1,cattailHeads.length));
function spUpdateReeds(time){
 reedBases.forEach((r,i)=>{
  const gust=Math.sin(time*.9+r.x*.35+r.phase)*.5+Math.sin(time*2.1+r.phase*2.)*.15;
  const rx=r.lean[0]+gust*.07,rz=r.lean[1]+gust*.09;
  spDummy.position.set(r.x,r.y,r.z);spDummy.rotation.set(rx,0,rz);spDummy.scale.set(1,r.h,1);spDummy.updateMatrix();
  (i%2?reedsB:reedsA).setMatrixAt(i,spDummy.matrix);
 });
 reedsA.instanceMatrix.needsUpdate=true;reedsB.instanceMatrix.needsUpdate=true;
 cattailHeads.forEach((r,k)=>{
  const gust=Math.sin(time*.9+r.x*.35+r.phase)*.5+Math.sin(time*2.1+r.phase*2.)*.15,rx=r.lean[0]+gust*.07,rz=r.lean[1]+gust*.09;
  spDummy.position.set(r.x-rz*r.h*.93,r.y+r.h*.9,r.z+rx*r.h*.93);spDummy.rotation.set(rx,0,rz);spDummy.scale.set(1,1,1);spDummy.updateMatrix();
  heads.setMatrixAt(k,spDummy.matrix);
 });
 heads.instanceMatrix.needsUpdate=true;
}
// reeds A and B share one set of matrices: the i%2 split gives two shades; every stem still needs a slot in both
// (the unused slot of each mesh keeps a zero-scale matrix so nothing appears in the wrong place)
{ const zero=new ue().makeScale(0,0,0);for(let i=0;i<reedBases.length;i++){reedsA.setMatrixAt(i,zero);reedsB.setMatrixAt(i,zero);} }

// ---- lily pads and flowers -------------------------------------------------------------------------------------------------------------------
const padGeometry=new en(1,1,.012,14);
const pads=[];
for(let c=0;c<7;c++){
 const centre=spPoints(1,.28,.75)[0];if(!centre)continue;
 for(const [x,z] of spPoints(Math.round(spRange(5,10)),.25,.9,{near:centre,radius:1.1}))pads.push({x,z,s:spRange(.15,.30),phase:spRand()*6.28,spin:spRange(-.05,.05),tilt:[spRange(-.05,.05),spRange(-.05,.05)],flower:spRand()<.22,pink:spRand()<.4});
}
const padsA=spInstanced(padGeometry,spMat('#2f6d3a'),Math.max(1,pads.length)),padsB=spInstanced(padGeometry,spMat('#3f7d3a'),Math.max(1,pads.length));
const flowerPads=pads.filter(p=>p.flower);
const petalGeometry=new cs(1,0),petalsWhite=spInstanced(petalGeometry,spMat('#f5f2e8'),Math.max(1,flowerPads.length)),petalsPink=spInstanced(petalGeometry,spMat('#e8a7b8'),Math.max(1,flowerPads.length));
const flowerCore=spInstanced(petalGeometry,spMat('#e5c24a',{emissive:new Wt('#7a5a10'),emissiveIntensity:.5}),Math.max(1,flowerPads.length));
function spUpdatePads(time){
 const zero=new ue().makeScale(0,0,0);
 pads.forEach((p,i)=>{
  const bob=Math.sin(time*1.3+p.phase)*.004;
  spDummy.position.set(p.x,waterLevel+.014+bob,p.z);spDummy.rotation.set(p.tilt[0]+Math.sin(time*.8+p.phase)*.015,time*p.spin+p.phase,p.tilt[1]);spDummy.scale.set(p.s,1,p.s);spDummy.updateMatrix();
  (i%2?padsB:padsA).setMatrixAt(i,spDummy.matrix);(i%2?padsA:padsB).setMatrixAt(i,zero);
 });
 padsA.instanceMatrix.needsUpdate=true;padsB.instanceMatrix.needsUpdate=true;
 flowerPads.forEach((p,k)=>{
  const bob=Math.sin(time*1.3+p.phase)*.004;
  spDummy.position.set(p.x,waterLevel+.045+bob,p.z);spDummy.rotation.set(0,p.phase,0);spDummy.scale.set(.075,.04,.075);spDummy.updateMatrix();
  (p.pink?petalsPink:petalsWhite).setMatrixAt(k,spDummy.matrix);(p.pink?petalsWhite:petalsPink).setMatrixAt(k,zero);
  spDummy.position.y+=.012;spDummy.scale.set(.028,.028,.028);spDummy.updateMatrix();flowerCore.setMatrixAt(k,spDummy.matrix);
 });
 petalsWhite.instanceMatrix.needsUpdate=true;petalsPink.instanceMatrix.needsUpdate=true;flowerCore.instanceMatrix.needsUpdate=true;
}

// ---- on the lakebed: stones and swaying weeds, seen through the shallows ---------------------------------------------------------------------
{
 const stoneSpots=spPoints(170,.1,1.35),stoneMeshes=[spInstanced(petalGeometry,spMat('#8d8575'),stoneSpots.length),spInstanced(petalGeometry,spMat('#6f6a5c'),stoneSpots.length),spInstanced(petalGeometry,spMat('#a29a85'),stoneSpots.length)];
 const zero=new ue().makeScale(0,0,0);
 stoneSpots.forEach(([x,z],i)=>{
  const s=spRange(.05,.2);spDummy.position.set(x,world.height(x,z)+s*.25,z);spDummy.rotation.set(spRand()*3,spRand()*6,spRand()*3);spDummy.scale.set(s*1.4,s*.6,s);spDummy.updateMatrix();
  stoneMeshes.forEach((m,k)=>m.setMatrixAt(i,k===i%3?spDummy.matrix:zero));
 });
 stoneMeshes.forEach(m=>m.instanceMatrix.needsUpdate=true);
}
const weedGeometry=new en(.002,.012,1,4);weedGeometry.translate(0,.5,0);
const weedBases=[];
for(let c=0;c<42;c++){
 const centre=spPoints(1,.25,1.1)[0];if(!centre)continue;
 for(const [x,z] of spPoints(5,.2,1.2,{near:centre,radius:.4}))weedBases.push({x,y:world.height(x,z),z,h:Math.min(spRange(.25,.75),spWet(x,z)*.85),phase:spRand()*6.28});
}
const weeds=spInstanced(weedGeometry,spMat('#4d7a3b'),Math.max(1,weedBases.length));
function spUpdateWeeds(time){
 weedBases.forEach((w,i)=>{
  spDummy.position.set(w.x,w.y,w.z);spDummy.rotation.set(Math.sin(time*.8+w.phase)*.22,0,Math.cos(time*.7+w.phase*1.3)*.22);spDummy.scale.set(1,Math.max(.1,w.h),1);spDummy.updateMatrix();weeds.setMatrixAt(i,spDummy.matrix);
 });
 weeds.instanceMatrix.needsUpdate=true;
}

// ---- stones and a log on the bank ---------------------------------------------------------------------------------------------------------------
{
 const bank=spPoints(110,-.45,.12),meshes=[spInstanced(petalGeometry,spMat('#827f69'),bank.length,true),spInstanced(petalGeometry,spMat('#9a9580'),bank.length,true)];
 const zero=new ue().makeScale(0,0,0);
 bank.forEach(([x,z],i)=>{
  const s=spRange(.05,.26);spDummy.position.set(x,world.height(x,z)+s*.15,z);spDummy.rotation.set(spRand()*.6,spRand()*6,spRand()*.6);spDummy.scale.set(s*1.5,s*.6,s);spDummy.updateMatrix();
  meshes.forEach((m,k)=>m.setMatrixAt(i,k===i%2?spDummy.matrix:zero));
 });
 meshes.forEach(m=>m.instanceMatrix.needsUpdate=true);
 // driftwood, half in the water on the north-west bank
 const logSpot=spPoints(1,-.1,.12,{near:[-28,-3.2],radius:3})[0]||[-28,-3.2];
 const log=new ie(new en(.13,.15,2.5,8),spMat('#6b5a45'));log.rotation.set(0,spRange(0,3),Math.PI/2-.05);
 log.position.set(logSpot[0],world.height(logSpot[0],logSpot[1])+.1,logSpot[1]);log.castShadow=true;log.receiveShadow=true;spGroup.add(log);
 const stump=new ie(new en(.045,.07,.5,6),spMat('#5a4a38'));stump.position.copy(log.position).add(new L(.2,.18,.05));stump.rotation.set(.5,0,.3);spGroup.add(stump);
}

// ---- a rowboat moored by the boardwalk -----------------------------------------------------------------------------------------------------------
const spBoat=new ee();spBoat.name='Rowboat';
{
 const paint=spMat('#4f7f8f'),rim=spMat('#e9e3cf'),wood=spMat('#b8a07a'),dark=spMat('#6b5236');
 const part=(geo,mat,x,y,z,rx=0,ry=0,rz=0)=>{const m=new ie(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.castShadow=true;m.receiveShadow=true;spBoat.add(m);return m;};
 part(new Oe(.82,.05,2.1),wood,0,.02,0);                        // floor
 for(const side of [-1,1]){
  part(new Oe(.05,.30,2.0),paint,side*.40,.17,0,0,0,side*-.22);   // flared sides
  part(new Oe(.07,.03,2.0),rim,side*.44,.32,0,0,0,side*-.22);     // gunwale
 }
 part(new Oe(.82,.32,.05),paint,0,.17,-1.02);                      // stern
 part(new Oe(.86,.03,.07),rim,0,.33,-1.04);
 for(const side of [-1,1]){                                         // bow: two planks from the sides, meeting at a point
  part(new Oe(.53,.30,.05),paint,side*.20,.17,1.125,0,side*.72,0);
  part(new Oe(.55,.03,.07),rim,side*.20,.33,1.125,0,side*.72,0);
 }
 for(const z of [-.45,.3])part(new Oe(.86,.04,.22),wood,0,.26,z);   // thwarts
 for(const side of [-1,1]){                                         // oars resting across the seats
  part(new en(.018,.018,1.7,6),dark,side*.1,.31,-.07,0,0,Math.PI/2-.08*side);
  part(new Oe(.22,.015,.07),dark,side*.88,.30,-.08);
 }
}
const spBoatBase={x:spBoatSpot.x,z:spBoatSpot.z,heading:.12};
spBoat.position.set(spBoatBase.x,waterLevel+.06,spBoatBase.z);spBoat.rotation.y=spBoatBase.heading;spGroup.add(spBoat);
{
 // a mooring post on the bank and a rope to the bow
 const post=new ie(new en(.07,.08,.9,6),spMat('#5a4a38'));
 const bank=spPoints(1,-.55,-.15,{near:[-10.3,4.2],radius:.5})[0]||[-10.2,4.2];
 post.position.set(bank[0],world.height(bank[0],bank[1])+.4,bank[1]);post.castShadow=true;spGroup.add(post);
 const bow=new L(spBoatBase.x+Math.sin(spBoatBase.heading)*1.5+1.0,waterLevel+.2,spBoatBase.z+Math.cos(spBoatBase.heading)*1.5);
 const top=post.position.clone().add(new L(0,.4,0)),rope=new ie(new en(.012,.012,1,5),spMat('#8a7355'));
 const mid=top.clone().lerp(bow,.5);rope.position.copy(mid);rope.scale.y=top.distanceTo(bow);rope.lookAt(bow);rope.rotateX(Math.PI/2);spGroup.add(rope);
 // boat collision: three circles so the player, the Jeep and bullets treat it as an obstacle
 // (the hull runs along the boat's local z axis, from the stern at -1.05 to the bow tip at about 1.45)
 const hullDir=[Math.sin(spBoatBase.heading),Math.cos(spBoatBase.heading)];
 for(const [along,r] of [[-.75,.52],[-.05,.52],[.65,.5],[1.2,.36]])world.colliders.push({x:spBoatBase.x+hullDir[0]*along,z:spBoatBase.z+hullDir[1]*along,r,y:world.height(spBoatBase.x,spBoatBase.z),height:.5,solid:true,boat:true});
}
function spUpdateBoat(time){
 spBoat.position.y=waterLevel+.055+Math.sin(time*1.1)*.016;
 spBoat.rotation.set(Math.sin(time*.8)*.014,spBoatBase.heading+Math.sin(time*.35)*.04,Math.sin(time*.95+1)*.026);
}

// ---- splashes: droplets and foam ------------------------------------------------------------------------------------------------------------------
const spDropGeometry=new An(1,6,5);
function spDroplets(x,z,count,speed,y=waterLevel){
 for(let i=0;i<count;i++){
  const a=spRand()*6.28,out=spRange(.2,1)*speed*.5,velocity=new L(Math.cos(a)*out,spRange(.55,1)*speed,Math.sin(a)*out),size=spRange(.014,.034);
  const m=new ie(spDropGeometry,new be({color:'#dff3f0',roughness:.2,transparent:true,opacity:.85}));m.position.set(x,y+.03,z);m.scale.setScalar(size);
  let landed=false;
  fxAdd(m,1.4,(f,u)=>{
   const dt=Math.max(0,f.age-(f.last||0));f.last=f.age;
   if(!landed){velocity.y-=9.8*dt;m.position.addScaledVector(velocity,dt);if(m.position.y<=waterLevel&&velocity.y<0){landed=true;m.visible=false;if(spRand()<.25)addRipple(m.position.x,m.position.z,.25);}}
  });
 }
}
// foam: a speckled white patch lying on the surface that spreads and fades (spheres looked wrong against the water)
const spFoamTexture=(()=>{
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');
 const grad=g.createRadialGradient(64,64,4,64,64,62);grad.addColorStop(0,'rgba(255,255,255,.95)');grad.addColorStop(.55,'rgba(255,255,255,.55)');grad.addColorStop(1,'rgba(255,255,255,0)');
 g.fillStyle=grad;g.fillRect(0,0,128,128);
 g.globalCompositeOperation='destination-out';
 for(let i=0;i<110;i++){const a=spRand()*6.28,r=spRand()*58;g.fillStyle='rgba(0,0,0,'+spRange(.15,.55).toFixed(2)+')';g.beginPath();g.arc(64+Math.cos(a)*r,64+Math.sin(a)*r,spRange(1.5,6),0,6.28);g.fill();}
 return new Ve(c);
})();
spFoamTexture.needsUpdate=true;
const spFoamGeometry=new Ge(1,1);spFoamGeometry.rotateX(-Math.PI/2);
function spFoam(x,z,size=.5,life=1,opacity=.8){
 const m=new ie(spFoamGeometry,new Xs({map:spFoamTexture,transparent:true,opacity,depthWrite:false}));
 m.position.set(x,waterLevel+.012,z);m.rotation.y=spRand()*6.28;m.renderOrder=3;
 fxAdd(m,life,(f,u)=>{const r=size*(.4+1.0*Math.sqrt(u));m.scale.set(r*2,1,r*2);m.material.opacity=opacity*(1-u)*(1-u*.4);});
}
// a splash at the surface: ring ripple, spray, foam and the sound. size 0..1.5
function spSplash(x,z,size=1,delay=0){
 addRipple(x,z,Math.min(1.4,.5+size*.6));
 spDroplets(x,z,Math.round(4+size*8),2+size*2.4);
 spFoam(x,z,.28+size*.4,.9+size*.4);
 if(delay>0)setTimeout(()=>valleyAudio.splash(Math.min(1.4,.3+size*.6)),delay);else valleyAudio.splash(Math.min(1.4,.3+size*.6));
}
// a bullet meets the water (called from the rifle): returns the point on the surface, or null
function springBullet(origin,direction,maxDistance){
 if(direction.y>=-1e-4)return null;
 const t=(waterLevel-origin.y)/direction.y;if(t<=0||t>maxDistance)return null;
 const x=origin.x+direction.x*t,z=origin.z+direction.z*t;
 if(waterDepth(x,z)<.05)return null;
 spSplash(x,z,1.1,t/343*1000);
 return {point:new L(x,waterLevel,z),distance:t};
}

// ---- ducks ---------------------------------------------------------------------------------------------------------------------------------------
function spMakeDuck(){
 const duck=new ee();
 const part=(geo,color,x,y,z,sx=1,sy=1,sz=1,rx=0)=>{const m=new ie(geo,spMat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.x=rx;m.castShadow=true;duck.add(m);return m;};
 part(spDropGeometry,'#9c978c',0,.04,0,.17,.12,.30);                 // body
 part(spDropGeometry,'#7b4a2f',0,.06,.20,.14,.11,.13);               // chestnut breast
 part(spDropGeometry,'#a9a59a',0,.10,-.02,.13,.06,.26);              // back
 const neck=new ee();neck.position.set(0,.10,.27);duck.add(neck);
 const neckMesh=new ie(new en(.034,.042,.18,6),spMat('#1e5c46'));neckMesh.position.set(0,.09,.03);neckMesh.rotation.x=.25;neckMesh.castShadow=true;neck.add(neckMesh);
 const ring=new ie(new en(.036,.036,.014,6),spMat('#f1efe6'));ring.position.set(0,.02,.0);neck.add(ring);
 const head=new ee();head.position.set(0,.19,.075);neck.add(head);
 const headMesh=new ie(spDropGeometry,spMat('#1e5c46'));headMesh.scale.setScalar(.068);headMesh.castShadow=true;head.add(headMesh);
 const beak=new ie(new Oe(.04,.018,.09),spMat('#d9b83a'));beak.position.set(0,-.012,.075);head.add(beak);
 for(const side of [-1,1]){const eye=new ie(spDropGeometry,spMat('#111111'));eye.scale.setScalar(.011);eye.position.set(side*.045,.014,.035);head.add(eye);}
 const tail=new ie(new en(.0,.05,.14,5),spMat('#2b2b2b'));tail.position.set(0,.09,-.33);tail.rotation.x=-1.0;tail.castShadow=true;duck.add(tail);
 const wings=[-1,1].map(side=>{const w=part(spDropGeometry,'#3a5a9a',side*.12,.10,-.02,.02,.045,.2);w.userData.side=side;return w;});
 duck.userData={neck,head,wings};
 return duck;
}
const spDucks=[];
{
 const deep=spPoints(12,.65,1.5);
 for(let i=0;i<3&&i<deep.length;i++){
  const d=spMakeDuck();d.scale.setScalar(spRange(.95,1.15));
  const state={mesh:d,x:deep[i][0],z:deep[i][1],heading:spRand()*6.28,speed:.3,target:null,wakeTimer:0,dip:0,dipTimer:spRange(3,9),fleeing:0,id:i};
  d.position.set(state.x,waterLevel+.045,state.z);spGroup.add(d);spDucks.push(state);
 }
}
function spPickWater(minDepth=.7){const p=spPoints(1,minDepth,1.5)[0];return p?[p[0],p[1]]:[SPRING.cx,SPRING.cz];}
// feathers: small flat pale pieces that drift down
const spFeatherGeometry=new Oe(.05,.004,.02);
function spFeathers(x,y,z,count=10){
 for(let i=0;i<count;i++){
  const m=new ie(spFeatherGeometry,new be({color:i%3?'#f1efe6':'#b9b5a6',roughness:.9,transparent:true,opacity:1}));m.position.set(x,y,z);
  const v=new L(spRange(-1.4,1.4),spRange(.6,2.4),spRange(-1.4,1.4)),spin=new L(spRange(-9,9),spRange(-9,9),spRange(-9,9));
  fxAdd(m,spRange(1.3,2),(f,u)=>{
   const dt=Math.max(0,f.age-(f.last||0));f.last=f.age;
   v.y-=2.2*dt;v.x*=1-.9*dt;v.z*=1-.9*dt;m.position.addScaledVector(v,dt);if(m.position.y<waterLevel+.01){m.position.y=waterLevel+.01;v.set(0,0,0);spin.multiplyScalar(0);}
   m.rotation.x+=spin.x*dt;m.rotation.y+=spin.y*dt;m.rotation.z+=spin.z*dt;if(u>.7)m.material.opacity=1-(u-.7)/.3;
  });
 }
}
// startled into flight: the duck beats its wings, flies a short hop to another part of the lake and splashes down
function spStartle(duck,awayFrom,quackLevel=1){
 if(duck.air)return;
 let best=null,bestScore=-1;
 for(let k=0;k<10;k++){
  const p=spPickWater(.8);if(!p)continue;
  const hop=Math.hypot(p[0]-duck.x,p[1]-duck.z),fromThreat=Math.hypot(p[0]-awayFrom.x,p[1]-awayFrom.z);
  if(hop<3||hop>9||Math.hypot(p[0]-spBoatSpot.x,p[1]-spBoatSpot.z)<2.4)continue;
  if(fromThreat>bestScore){bestScore=fromThreat;best=p;}
 }
 if(!best){const a=Math.atan2(duck.x-awayFrom.x,duck.z-awayFrom.z);best=[duck.x+Math.sin(a)*4,duck.z+Math.cos(a)*4];if(spWet(best[0],best[1])<.5)best=[duck.x,duck.z];}
 duck.air={t:0,T:1.25,g:5,fx:duck.x,fz:duck.z,tx:best[0],tz:best[1]};
 duck.air.vy=duck.air.g*duck.air.T/2;duck.fleeing=2.5;duck.target=null;
 spFeathers(duck.x,waterLevel+.15,duck.z,12);addRipple(duck.x,duck.z,.8);valleyAudio.quack(quackLevel);
}
function spUpdateDucks(dt,time,threats){ // threats: [{x, z, radius}]
 for(const duck of spDucks){
  if(duck.air){ // in the air
   const a=duck.air,m=duck.mesh;a.t+=dt;const u=Math.min(1,a.t/a.T);
   duck.x=a.fx+(a.tx-a.fx)*u;duck.z=a.fz+(a.tz-a.fz)*u;duck.heading=Math.atan2(a.tx-a.fx,a.tz-a.fz);
   const rise=a.vy*a.t-.5*a.g*a.t*a.t;
   m.position.set(duck.x,waterLevel+.045+Math.max(0,rise),duck.z);
   m.rotation.set(-Math.atan2(a.vy-a.g*a.t,Math.hypot(a.tx-a.fx,a.tz-a.fz)/a.T)*.7,duck.heading,Math.sin(a.t*30)*.15);
   m.userData.wings.forEach(w=>{w.rotation.z=w.userData.side*(.4+Math.sin(a.t*48)*.9);});
   m.userData.neck.rotation.x=-.2;
   if(u>=1){duck.air=null;m.userData.wings.forEach(w=>{w.rotation.z=0;});spSplash(duck.x,duck.z,.45);}
   continue;
  }

  // danger: the player or the Jeep close by makes them swim off briskly
  let danger=null,nearest=99;
  for(const t of threats){const d=Math.hypot(t.x-duck.x,t.z-duck.z);if(d<t.radius&&d<nearest){nearest=d;danger=t;}}
  if(danger&&duck.fleeing<=0){
   duck.fleeing=2.5;if(spRand()<.5)valleyAudio.quack(.35);
   // swim to the part of the lake furthest from the threat
   let best=null,far=-1;for(let k=0;k<8;k++){const p=spPickWater();const d=Math.hypot(p[0]-danger.x,p[1]-danger.z);if(d>far){far=d;best=p;}}
   duck.target=best;
  }
  duck.fleeing=Math.max(0,duck.fleeing-dt);
  if(!duck.target||Math.hypot(duck.target[0]-duck.x,duck.target[1]-duck.z)<.8)duck.target=spPickWater();
  const want=Math.atan2(duck.target[0]-duck.x,duck.target[1]-duck.z);
  let turn=want-duck.heading;turn=Math.atan2(Math.sin(turn),Math.cos(turn));
  duck.heading+=turn*(1-Math.exp(-1.6*dt));
  const speed=duck.fleeing>0?1.0:.28+.1*Math.sin(time*.2+duck.id);
  const nx=duck.x+Math.sin(duck.heading)*speed*dt,nz=duck.z+Math.cos(duck.heading)*speed*dt;
  if(spWet(nx,nz)>.45&&Math.hypot(nx-spBoatSpot.x,nz-spBoatSpot.z)>1.9){duck.x=nx;duck.z=nz;}else duck.target=spPickWater();
  // dabbling now and then
  duck.dipTimer-=dt;if(duck.dipTimer<=0&&duck.fleeing<=0){duck.dip=1.2;duck.dipTimer=spRange(5,12);}
  duck.dip=Math.max(0,duck.dip-dt);
  const dipAmount=Math.sin(Math.PI*Math.min(1,duck.dip/1.2))*(duck.dip>0?1:0);
  const m=duck.mesh;
  m.position.set(duck.x,waterLevel+.045+Math.sin(time*1.7+duck.id*2)*.006,duck.z);
  m.rotation.set(Math.sin(time*1.1+duck.id)*.03+dipAmount*.35,duck.heading,Math.sin(time*.9+duck.id*3)*.04);
  m.userData.neck.rotation.x=dipAmount*.9+.15;m.userData.head.rotation.x=dipAmount*.5+Math.sin(time*.6+duck.id)*.06;
  m.userData.head.rotation.y=Math.sin(time*.4+duck.id*5)*.25*(1-dipAmount);
  // a little V of ripples behind them
  duck.wakeTimer-=dt;if(duck.wakeTimer<=0&&(speed>.5||dipAmount>.3)){duck.wakeTimer=speed>.5?.35:.8;addRipple(duck.x-Math.sin(duck.heading)*.3,duck.z-Math.cos(duck.heading)*.3,speed>.5?.5:.3);}
  else if(duck.wakeTimer<=0){duck.wakeTimer=1.6;addRipple(duck.x-Math.sin(duck.heading)*.3,duck.z-Math.cos(duck.heading)*.3,.18);}
 }
}

// ---- dragonflies ----------------------------------------------------------------------------------------------------------------------------------
const spFlies=[];
{
 const wingGeometry=new Ge(.075,.018),wingMaterial=new Xs({color:'#eef6f8',transparent:true,opacity:.45,side:2,depthWrite:false});
 for(const color of ['#2a7fd0','#2fb59a','#d4543a']){
  const fly=new ee(),bodyMat=new be({color,roughness:.4,emissive:new Wt(color),emissiveIntensity:.5});
  const body=new ie(new en(.005,.003,.1,5),bodyMat);body.rotation.x=Math.PI/2;fly.add(body);
  const head=new ie(spDropGeometry,bodyMat);head.scale.setScalar(.011);head.position.z=.055;fly.add(head);
  const wings=[];
  for(const [side,z] of [[-1,.02],[1,.02],[-1,-.005],[1,-.005]]){const w=new ie(wingGeometry,wingMaterial);w.rotation.x=-Math.PI/2;w.position.set(side*.04,.004,z);fly.add(w);wings.push({mesh:w,side});}
  const home=spPoints(1,.1,1.0)[0]||[SPRING.cx,SPRING.cz];
  const state={mesh:fly,wings,x:home[0],y:waterLevel+spRange(.5,1.1),z:home[1],tx:home[0],ty:waterLevel+.7,tz:home[1],hover:spRange(.3,1.5),dart:0,heading:0,phase:spRand()*6};
  fly.position.set(state.x,state.y,state.z);spGroup.add(fly);spFlies.push(state);
 }
}
function spUpdateFlies(dt,time){
 for(const f of spFlies){
  if(f.dart>0){
   f.dart-=dt;const dx=f.tx-f.x,dy=f.ty-f.y,dz=f.tz-f.z,d=Math.hypot(dx,dy,dz)||1,step=Math.min(d,3.6*dt);
   f.x+=dx/d*step;f.y+=dy/d*step;f.z+=dz/d*step;f.heading=Math.atan2(dx,dz);
   if(d<.1)f.dart=0;
  }else{
   f.hover-=dt;
   f.x+=Math.sin(time*7+f.phase)*.002;f.y+=Math.sin(time*9+f.phase*2)*.0015;
   if(f.hover<=0){
    const p=spPoints(1,-.2,1.2)[0];if(p){f.tx=p[0];f.tz=p[1];f.ty=waterLevel+spRange(.4,1.2);f.dart=1.5;}
    f.hover=spRange(.6,2.2);
   }
  }
  f.mesh.position.set(f.x,f.y,f.z);f.mesh.rotation.y=f.heading;
  const flap=Math.sin(time*160+f.phase)*.5;
  f.wings.forEach((w,i)=>{w.mesh.rotation.z=w.side*(.15+flap*(i<2?1:-1));});
 }
}

// ---- fish leaping --------------------------------------------------------------------------------------------------------------------------------
const spFish=new ie(spDropGeometry,spMat('#b9c7c9',{metalness:.5,roughness:.3}));spFish.scale.set(.035,.035,.14);spFish.visible=false;spGroup.add(spFish);
const spFishState={active:false,t:0,x:0,z:0,vx:0,vz:0,vy:0,timer:6,jumps:0};
function spUpdateFish(dt,focus){
 const s=spFishState;
 if(!s.active){
  s.timer-=dt;
  if(s.timer<=0){
   const p=spPoints(1,.7,1.5)[0];s.timer=spRange(7,16);
   if(p&&Math.hypot(p[0]-focus.x,p[1]-focus.z)<45){
    s.active=true;s.t=0;s.x=p[0];s.z=p[1];const a=spRand()*6.28;s.vx=Math.cos(a)*.9;s.vz=Math.sin(a)*.9;s.vy=3.3;s.jumps++;
    spSplash(s.x,s.z,.35);spFish.visible=true;
   }
  }
  return;
 }
 s.t+=dt;s.vy-=9.8*dt;s.x+=s.vx*dt;s.z+=s.vz*dt;
 const y=waterLevel+(s.t*3.3-4.9*s.t*s.t);
 spFish.position.set(s.x,y,s.z);
 spFish.rotation.set(0,Math.atan2(s.vx,s.vz),0);spFish.rotateX(-Math.atan2(s.vy,Math.hypot(s.vx,s.vz)));
 if(y<=waterLevel&&s.t>.1){s.active=false;spFish.visible=false;spSplash(s.x,s.z,.5);}
}

// ducks are solid for the player on foot: you cannot walk through one (it will usually have swum off first)
{
 const resolveBeforeDucks=world.resolveCircle;
 world.resolveCircle=function(p,r,...rest){
  let hit=resolveBeforeDucks.call(this,p,r,...rest);
  for(const duck of spDucks){
   if(duck.air)continue;
   const min=.26*duck.mesh.scale.x+r,dx=p.x-duck.x,dz=p.z-duck.z,distance=Math.hypot(dx,dz);
   if(distance<min){const nx=distance>1e-4?dx/distance:1,nz=distance>1e-4?dz/distance:0;p.x=duck.x+nx*min;p.z=duck.z+nz*min;hit=true;}
  }
  return hit;
 };
}

// ---- you, the Jeep and what falls in -------------------------------------------------------------------------------------------------------------
const spWade={timer:0,inWater:false,jump:'grounded',soundTimer:0};
const spWheels=[[.88,1.27],[-.88,1.27],[.88,-1.25],[-.88,-1.25]],spWheelTimers=[0,0,0,0],spJeepSound={timer:0};
function spUpdateInteractions(dt){
 // on foot
 if(Te==='walking'&&rifle.mode==='idle'){
  const p=Xt.root.position,depth=waterDepth(p.x,p.z),speed=Pa||0,wet=depth>.06;
  if(wet&&!spWade.inWater&&speed>.3)spSplash(p.x,p.z,.7+Math.min(.5,speed/6));
  spWade.inWater=wet;
  // landing from a jump in the water
  if(jumpPhase==='landing'&&spWade.jump!=='landing'&&wet)spSplash(p.x,p.z,1.1);
  spWade.jump=jumpPhase;
  spWade.timer-=dt;
  if(wet&&speed>.4&&spWade.timer<=0&&jumpPhase==='grounded'){
   spWade.timer=speed>3?.2:.36;addRipple(p.x,p.z,.35+Math.min(.45,speed/9)+Math.min(.2,depth*.15));
   spDroplets(p.x,p.z,Math.round(1+Math.min(5,speed*1.1)),1.2+Math.min(1.8,speed*.5));
   spWade.soundTimer-=1;if(spWade.soundTimer<=0){valleyAudio.splash(.18+Math.min(.35,speed/12));spWade.soundTimer=speed>3?1:2;}
  }
 }else spWade.inWater=false;
 // the Jeep
 if(Te==='driving'&&Math.abs(le)>.6){
  const c=Math.cos(Xe),s=Math.sin(Xe);let wheelsWet=0;
  spWheels.forEach(([l,k],i)=>{
   const x=zt.root.position.x+l*c+k*s,z=zt.root.position.z-l*s+k*c,depth=waterDepth(x,z);
   spWheelTimers[i]-=dt;
   if(depth>.06){
    wheelsWet++;
    if(spWheelTimers[i]<=0){
     spWheelTimers[i]=Math.max(.1,.5/Math.max(1,Math.abs(le)*.35));
     addRipple(x,z,.4+Math.min(.7,Math.abs(le)/16));
     spDroplets(x,z,Math.round(2+Math.abs(le)*.5),1.8+Math.min(3,Math.abs(le)*.18));
     if(Math.abs(le)>3)spFoam(x,z,.3+Math.min(.5,Math.abs(le)/25),.9,.6);
    }
   }
  });
  // driving into a duck: it bursts into flight, honking, rather than being driven through
  zt.root.updateMatrixWorld(true);
  for(const duck of spDucks){
   if(duck.air)continue;
   const local=zt.root.worldToLocal(new L(duck.x,zt.root.position.y,duck.z));
   if(Math.abs(local.x)<1.25&&local.z>-2.2&&local.z<2.4){spStartle(duck,{x:zt.root.position.x,z:zt.root.position.z});le*=.93;roadkill.shake=Math.max(roadkill.shake,.12);}
  }
  spJeepSound.timer-=dt;
  if(wheelsWet&&spJeepSound.timer<=0){valleyAudio.splash(Math.min(1.2,.3+Math.abs(le)/14));spJeepSound.timer=.35;}
 }
}
// a body thrown into the water (Mosswick after a Jeep hit)
{
 const landBefore=poisonDwarf.onLand;
 poisonDwarf.onLand=(point,impact,bounce)=>{
  landBefore&&landBefore(point,impact,bounce);
  if(waterDepth(point.x,point.z)>.05&&impact>.5)spSplash(point.x,point.z,Math.min(1.5,.5+impact/9));
 };
}

// ---- per-frame update --------------------------------------------------------------------------------------------------------------------------
const springStep=Fu;
let spLastTime=0;
Fu=function(dt){
 springStep(dt);
 const time=Fa;
 spUpdateReeds(time);spUpdatePads(time);spUpdateWeeds(time);spUpdateBoat(time);
 const who=Te==='walking'?Xt.root.position:zt.root.position;
 // a person standing still can get close; walking, running or driving up to them startles them from further away
 const moving=Te==='driving'?Math.abs(le)>1:(Pa||0)>.5;
 spUpdateDucks(dt,time,[{x:who.x,z:who.z,radius:Te==='driving'?11:moving?7:3.5}]);
 spUpdateFlies(dt,time);
 spUpdateFish(dt,{x:who.x,z:who.z});
 spUpdateInteractions(dt);
};
Object.assign(window.expedition.spring,{splash:spSplash,bullet:springBullet,ducks:spDucks,flies:spFlies,fish:spFishState,boat:spBoat,wade:spWade,
 counts:{reeds:reedBases.length,pads:pads.length,flowers:flowerPads.length,weeds:weedBases.length,heads:cattailHeads.length}});
const springLifeState=window.expedition.getState;
window.expedition.getState=()=>({...springLifeState(),spring:{ducks:spDucks.length,dragonflies:spFlies.length,fishJumps:spFishState.jumps,...window.expedition.spring.counts,activeRipples:ripples.filter(r=>Fa-r.z<4&&r.w>0).length}});
