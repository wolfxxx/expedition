// Multiple walkable levels: select support using the person's current feet height.
const lookoutTop=ty+3.10,stairStart=tz-6.79,stairEnd=tz-1.75,stairCount=14,stairDepth=(stairEnd-stairStart)/stairCount;
const stairBase=world.height(tx,stairStart),stairRise=(lookoutTop-stairBase)/stairCount;
const lookoutSurfaces=[],lookoutBarriers=[];
function slab(x,z,w,d,top,thickness,color){
 box(w,thickness,d,color,x,top-thickness/2,z);
 const surface={x,z,w,d,top,bottom:top-thickness};lookoutSurfaces.push(surface);return surface;
}
function rail(x,z,w,d,bottom,top){box(w,top-bottom,d,'#b9a77d',x,(top+bottom)/2,z);lookoutBarriers.push({x,z,w,d,bottom,top});}
for(const x of [-1.4,1.4])for(const z of [-1.4,1.4]){
 const ground=world.height(tx+x,tz+z),top=lookoutTop-.12; // end inside the 0.20 m slab: a top face level with the deck surface z-fights and flickers
 box(.22,top-ground,.22,'#66543a',tx+x,(ground+top)/2,tz+z);
 world.colliders.push({x:tx+x,z:tz+z,r:.16,y:ground,height:lookoutTop-ground});
}
slab(tx,tz,3.5,3.5,lookoutTop,.20,'#a89267');
for(let i=0;i<stairCount;i++)slab(tx,stairStart+(i+.5)*stairDepth,1.4,stairDepth+.01,stairBase+(i+1)*stairRise-(i===stairCount-1?.003:0),.12,'#9c835f'); // the top tread meets the deck: keep it a hair lower so the two surfaces never tie
// Guardrails around the deck with a central opening aligned to the stairs.
rail(tx,tz+1.65,3.4,.10,lookoutTop+.9,lookoutTop+1.02);
for(const side of [-1,1]){
 rail(tx+side*1.65,tz,.10,3.4,lookoutTop+.9,lookoutTop+1.02);
 rail(tx+side*1.22,tz-1.65,.88,.10,lookoutTop+.9,lookoutTop+1.02);
 for(const z of [-1.65,0,1.65])rail(tx+side*1.65,tz+z,.10,.10,lookoutTop,lookoutTop+1);
 // Continuous sloping handrails, supported at regular intervals.
 const length=Math.hypot(stairEnd-stairStart,lookoutTop-stairBase);
 const beam=box(.09,.09,length,'#b9a77d',tx+side*.78,(stairBase+lookoutTop)/2+.95,(stairStart+stairEnd)/2);
 beam.rotation.x=-Math.atan2(lookoutTop-stairBase,stairEnd-stairStart);
 const stringer=box(.14,.20,length,'#66543a',tx+side*.60,(stairBase+lookoutTop)/2-.12,(stairStart+stairEnd)/2);stringer.rotation.x=beam.rotation.x;
 for(let i=0;i<=stairCount;i+=2){const z=stairStart+i*stairDepth,y=stairBase+i*stairRise;box(.08,.95,.08,'#847152',tx+side*.78,y+.475,z);}
}
box(.08,6,.08,'#5c5141',tx+1.4,ty+3,tz+1.4);
const flag=box(1.25,.65,.025,'#dc864b',tx+2,ty+5.65,tz+1.4);
const contains=(s,x,z,pad=0)=>Math.abs(x-s.x)<s.w/2+pad&&Math.abs(z-s.z)<s.d/2+pad;
world.walkHeight=function(x,z,feetY,step=.25){
 let floor=world.height(x,z);
 for(const s of lookoutSurfaces)if(contains(s,x,z)&&s.top<=feetY+step+.001)floor=Math.max(floor,s.top);
 return floor;
};
world.walkCeiling=function(x,z,feetY){
 let ceiling=Infinity;
 for(const s of lookoutSurfaces)if(contains(s,x,z,.20)&&s.bottom>=feetY+1.70)ceiling=Math.min(ceiling,s.bottom);
 return ceiling;
};
const resolveBeforeLookout=world.resolveCircle;
world.resolveCircle=function(p,r,...rest){
 let hit=resolveBeforeLookout(p,r,...rest);
 const barriers=[...lookoutBarriers,...lookoutSurfaces.filter(s=>p.y<s.top-.251)];
 if(p.z>stairStart&&p.z<stairEnd){const level=stairBase+(p.z-stairStart)/(stairEnd-stairStart)*(lookoutTop-stairBase);
  if(p.y>level-.4)for(const side of [-1,1])barriers.push({x:tx+side*.78,z:p.z,w:.08,d:.1,bottom:level,top:level+1.02});
 }
 for(const s of barriers){
  if(p.y>=s.top||p.y+1.75<=s.bottom||!contains(s,p.x,p.z,r))continue;
  const dx=p.x-s.x,dz=p.z-s.z,px=s.w/2+r-Math.abs(dx),pz=s.d/2+r-Math.abs(dz);
  if(px<pz)p.x+=(dx>=0?1:-1)*px;else p.z+=(dz>=0?1:-1)*pz;hit=true;
 }
 return hit;
};
// Vehicles stay outside the staircase; pedestrian support does not lift the Jeep.
const vehicleBeforeLookout=e_;
e_=function(x,z,yaw){return (Math.abs(x-tx)<1.7&&z>stairStart-1&&z<stairEnd+1)||vehicleBeforeLookout(x,z,yaw);};
