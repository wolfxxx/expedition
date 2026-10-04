// Low stones are drivable. A stone no taller than a wheel (0.95 m) does not stop the Jeep if it has the speed: the
// wheels ride up over it, the body tilts with them, and fast enough the Jeep leaves the ground and lands with a thud.
// Taller stones, trees and everything else are still solid. Too slow, and the Jeep stops against the stone as before.
const ROCK={clearance:.32,maxHeight:.95,baseSpeed:2.5,perMetre:3.5,launchSpeed:10,launchGain:1.6,launchPerSpeed:.12,maxLaunch:4.5,gravity:13,profile:.85};
const rockState={hits:0,launches:0,landings:0,flying:false,hy:0,vy:0,prevG:null,contact:null,hint:0,peak:0,rise:0,latch:false,clearTime:0,last:null};

// ---- the stones --------------------------------------------------------------------------------------------------------
let stones=null,solid=null;
function stoneList(){
 if(!stones||solid.length+stones.length!==Je.colliders.length){
  // stones are domes: their collider height equals their radius
  stones=Je.colliders.filter(c=>c.height<=ROCK.maxHeight&&Math.abs(c.height-c.r)<.02);
  solid=Je.colliders.filter(c=>!stones.includes(c));
 }
 return stones;
}
const speedNeeded=c=>ROCK.baseSpeed+ROCK.perMetre*c.height;
// Height of the stones under a point (a flattened dome, a little under the collider's own height).
function rockBump(x,z){
 let top=0;
 for(const c of stoneList()){
  const d=Math.hypot(x-c.x,z-c.z);if(d>=c.r)continue;
  const k=c.height*ROCK.profile*Math.sqrt(1-(d/c.r)*(d/c.r));if(k>top)top=k;
 }
 return top;
}
// Which stones would the Jeep's body overlap at this position? (same three test points as the original check)
function stonesAt(x,z,yaw){
 const hit=[],n=Math.sin(yaw),s=Math.cos(yaw);
 for(const r of [-1.35,0,1.35]){
  const px=x+n*r,pz=z+s*r;
  for(const c of stoneList())if(!hit.includes(c)&&Math.hypot(px-c.x,pz-c.z)<c.r+1)hit.push(c);
 }
 return hit;
}

// ---- collision: stones only stop a Jeep that is too slow ------------------------------------------------------------------
const solidCheck=e_;
e_=function(x,z,yaw){
 stoneList();
 const here=zt.root.position,inside=stonesAt(here.x,here.z,Xe).length>0; // any part of the body already over a stone
 const wanted=stonesAt(x,z,yaw),speed=Math.abs(le);
 // already on a stone (it is not a trap), or fast enough for every stone ahead: ignore the stones, keep everything else solid
 if(!wanted.length||inside||wanted.every(c=>speed>=speedNeeded(c))){
  const all=Je.colliders;Je.colliders=solid;
  try{return solidCheck(x,z,yaw);}finally{Je.colliders=all;}
 }
 if(Fa>rockState.hint){rockState.hint=Fa+4;hi('Too slow to climb that stone. Build up some speed.');}
 return true;
};

// ---- ride: wheels follow the stones, the body can leave the ground ---------------------------------------------------------
n_=function(dt){
 const c=Math.cos(Xe),s=Math.sin(Xe),x0=zt.root.position.x,z0=zt.root.position.z;
 let bumpy=false;
 const sample=(l,k)=>{const x=x0+l*c+k*s,z=z0-l*s+k*c,b=rockBump(x,z);if(b>.02)bumpy=true;return Je.height(x,z)+b;};
 // the underside of the body: a stone narrower than the wheel track still lifts the chassis that passes over it
 const belly=k=>Math.max(sample(-.5,k),sample(0,k),sample(.5,k))-ROCK.clearance;
 const fl=sample(.88,1.29),fr=sample(-.88,1.29),rl=sample(.88,-1.25),rr=sample(-.88,-1.25);
 const frontAvg=Math.max((fl+fr)/2,belly(1.2)),rearAvg=Math.max((rl+rr)/2,belly(-1.2));
 const ground=Math.max((frontAvg+rearAvg)/2,belly(0));
 const speed=Math.abs(le),rise=rockState.prevG===null?0:(ground-rockState.prevG)/dt;rockState.prevG=ground;
 // first touch of a stone: a thump, a jolt, and the Jeep loses some speed
 const front=sample(0,1.3)-Je.height(x0+s*1.3,z0+c*1.3);
 const touching=front>.08;
 if(touching&&!rockState.contact&&speed>1.5){
  rockState.contact=true;rockState.hits++;
  const level=Math.min(1.2,speed/16);
  valleyAudio.rockHit(level);roadkill.shake=Math.max(roadkill.shake,.12+.2*level);
  le*=1-Math.min(.22,.05+.012*speed);
 }else if(!touching&&front<.02)rockState.contact=null;
 // smoothed upward speed of the ground under the car
 rockState.rise=rockState.rise*.6+rise*.4;
 if(!bumpy){rockState.clearTime+=dt;if(rockState.clearTime>.3)rockState.latch=false;}else rockState.clearTime=0;
 if(!rockState.flying){
  rockState.hy=ground;
  // launch at the crest: the ground was rising fast and has just stopped rising, and the Jeep is quick enough to keep going
  if(bumpy&&!rockState.latch&&speed>=ROCK.launchSpeed&&rockState.rise>1.1&&rise<rockState.rise*.35){
   rockState.flying=true;rockState.latch=true;rockState.vy=Math.min(ROCK.maxLaunch,rockState.rise*ROCK.launchGain+speed*ROCK.launchPerSpeed);rockState.launches++;rockState.peak=0;
  }
 }else{
  rockState.vy-=ROCK.gravity*dt;rockState.hy+=rockState.vy*dt;rockState.peak=Math.max(rockState.peak,rockState.hy-ground);
  if(rockState.hy<=ground&&rockState.vy<0){
   const impact=-rockState.vy;rockState.flying=false;rockState.hy=ground;rockState.landings++;
   rockState.last={launchHeight:+rockState.peak.toFixed(2),impact:+impact.toFixed(2)};
   if(impact>1.2){
    valleyAudio.rockHit(Math.min(1.2,.35+impact/6));roadkill.shake=Math.max(roadkill.shake,.15+.05*impact);le*=.94;
    for(const side of [-.9,.9])puff(new L(x0+c*side+s*1.2,ground,z0-s*side+c*1.2),'#cdbd90',.7,.8,.4,.55);
   }
  }else if(rockState.hy<ground)rockState.hy=ground; // the ground came up under it: ride on
 }
 // body height: follows the stones exactly while on or just off one, otherwise the original soft ride

 if(rockState.flying||bumpy)zt.root.position.y=rockState.hy;
 else zt.root.position.y=La(zt.root.position.y,ground,16,dt);
 zt.root.rotation.y=Xe;
 const pitchAir=rockState.flying?-Mn(rockState.vy*.03,-.25,.25):0,quick=bumpy||rockState.flying?16:9;
 zt.root.rotation.x=La(zt.root.rotation.x,-Math.atan2(frontAvg-rearAvg,2.54)+pitchAir,quick,dt);
 zt.root.rotation.z=La(zt.root.rotation.z,Math.atan2((fl+rl-fr-rr)*.5,1.76)-ci*le*.003,quick,dt);
};
const rocksReset=Oa;Oa=function(){rocksReset();Object.assign(rockState,{flying:false,vy:0,contact:null,hint:0,prevG:null,rise:0,latch:false,clearTime:0});};window.expedition.reset=Oa;
const rocksState=window.expedition.getState;
window.expedition.getState=()=>({...rocksState(),rocks:{hits:rockState.hits,launches:rockState.launches,landings:rockState.landings,flying:rockState.flying,last:rockState.last}});
window.expedition.stones=()=>stoneList().map(c=>({x:c.x,z:c.z,r:c.r,height:c.height}));
