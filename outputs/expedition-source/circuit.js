// Ramp circuit: a cleared stretch of meadow east of the ring road with a dirt loop, kickers, a tabletop and rollers to
// fly the Jeep off. The layout (where everything is, and the ramp shapes) is in circuit-layout.js; the take-off, flight
// and landing are in rocks.js, and the airborne handling in driving.js. This file clears the ground, adds the ramps to
// the terrain height, builds the scenery, draws the circuit on the minimap and reports each jump.
const CIRCUIT=circuitLayout();
const circuitJumps={count:0,best:null,last:null,current:null};

// ---- clear the ground: trees, stones, bushes and their collision circles go; grass stays off the track (landscape.js) --------
const circuitCleared={colliders:0,instances:0};
{
 const matrix=new ue(),at=new L(),gone=new ue().makeScale(0,0,0),keep=new Set([grass,flowerStems,flowerHeads]);
 world.root.updateMatrixWorld(true);
 world.root.traverse(o=>{
  if(!o.isInstancedMesh||keep.has(o))return;
  let changed=false;
  for(let i=0;i<o.count;i++){
   o.getMatrixAt(i,matrix);at.setFromMatrixPosition(matrix).applyMatrix4(o.matrixWorld);
   if(circuitClearing(at.x,at.z)){o.setMatrixAt(i,gone);changed=true;circuitCleared.instances++;}
  }
  if(changed)o.instanceMatrix.needsUpdate=true;
 });
 for(let i=world.colliders.length-1;i>=0;i--)if(circuitClearing(world.colliders[i].x,world.colliders[i].z)){world.colliders.splice(i,1);circuitCleared.colliders++;}
}

// ---- the ramps are part of the ground: the Jeep, walking and everything else that asks for the height ride over them --------
const circuitGround=world.height;
world.height=(x,z)=>circuitGround(x,z)+circuitRampHeight(x,z);

// ---- building helpers ------------------------------------------------------------------------------------------------------------------
const circuitMaterial=new be({vertexColors:true,roughness:1});
const circuitTint=new Wt();
function circuitMesh(positions,colors,indices){
 const g=new Se();g.setAttribute('position',new $t(positions,3));g.setAttribute('color',new $t(colors,3));
 if(indices)g.setIndex(indices);g.computeVertexNormals();
 const m=new ie(g,circuitMaterial);m.receiveShadow=true;world.root.add(m);return m;
}
// a dirt ribbon along a path of [x,z] points; lateral samples run across the width, with ruts and soft grassy edges
function circuitRibbon(points,half,closed){
 const positions=[],colors=[],indices=[],across=10,n=points.length;
 for(let k=0;k<n;k++){
  const prev=points[closed?(k-1+n)%n:Math.max(0,k-1)],next=points[closed?(k+1)%n:Math.min(n-1,k+1)];
  const dx=next[0]-prev[0],dz=next[1]-prev[1],len=Math.hypot(dx,dz)||1;
  for(let j=0;j<=across;j++){
   const off=(j/across*2-1)*half,x=points[k][0]+dz/len*off,z=points[k][1]-dx/len*off;
   positions.push(x,circuitGround(x,z)+.03,z);
   const edge=Math.abs(off)/half,rut=Math.exp(-Math.pow((Math.abs(off)-1.1)*3,2));
   circuitTint.set('#a3875f').lerp(new Wt('#735f42'),rut*.55).lerp(new Wt('#87865a'),Math.max(0,edge-.75)*2.4);
   circuitTint.multiplyScalar(.93+landHash(x*2.1,z*1.7)*.12);colors.push(circuitTint.r,circuitTint.g,circuitTint.b);
  }
  if(k<n-1||closed){const a=k*(across+1),b=((k+1)%n)*(across+1);for(let j=0;j<across;j++)indices.push(a+j,b+j,a+j+1,b+j,b+j+1,a+j+1);}
 }
 return circuitMesh(positions,colors,indices);
}

// ---- the dirt loop and the link from the ring road ---------------------------------------------------------------------------------------
const circuitPath=[];
{
 const {cx,z0,z1,R}=CIRCUIT;
 for(let z=z0;z<z1;z+=1)circuitPath.push([cx-R,z]);                                        // inner straight, driven north
 for(let a=Math.PI;a>0;a-=Math.PI/28)circuitPath.push([cx+R*Math.cos(a),z1+R*Math.sin(a)]); // north turn
 for(let z=z1;z>z0;z-=1)circuitPath.push([cx+R,z]);                                        // outer straight, driven south
 for(let a=0;a>-Math.PI;a-=Math.PI/28)circuitPath.push([cx+R*Math.cos(a),z0+R*Math.sin(a)]);// south turn
}
const circuitLoop=circuitRibbon(circuitPath,CIRCUIT.half,true);circuitLoop.name='Ramp circuit track';
{const l=CIRCUIT.link,pts=[];for(let x=l.x0;x<=l.x1;x+=1)pts.push([x,l.z]);circuitRibbon(pts,l.half,false).name='Ramp circuit link';}

// ---- the ramps: packed earth, the kickers faced with timber planks ----------------------------------------------------------------------
for(const r of CIRCUIT.ramps){
 const bevel=Math.max(1,r.H*.9),side=r.w+bevel,positions=[],colors=[],indices=[];
 const rows=[];for(let t=-(r.up+r.top);t<r.back;t+=.3)rows.push(t);rows.push(r.back);
 const cols=Math.ceil(side*2/.25);
 rows.forEach((t,k)=>{
  for(let j=0;j<=cols;j++){
   const u=-side+j*side*2/cols,x=r.x+u,z=r.lip+t*r.dir,h=circuitRampHeight(x,z);
   positions.push(x,circuitGround(x,z)+Math.max(.05,h),z);
   const plank=r.wood&&t<=.01&&Math.abs(u)<r.w+.15;
   if(plank)circuitTint.set(k%2?'#a8814c':'#7b5a36').multiplyScalar(Math.abs(u)>r.w-.12?.65:1);
   else circuitTint.set('#8e7651').lerp(new Wt('#a3875f'),1-Math.min(1,h/r.H)).multiplyScalar(.9+landHash(x*3.3,z*2.9)*.16);
   colors.push(circuitTint.r,circuitTint.g,circuitTint.b);
  }
  if(k)for(let j=0;j<cols;j++){const a=(k-1)*(cols+1)+j,b=k*(cols+1)+j;indices.push(a,b,a+1,b,b+1,a+1);}
 });
 const m=circuitMesh(positions,colors,indices);m.castShadow=true;m.name='Circuit ramp: '+r.name;
 m.material=new be({vertexColors:true,roughness:.95,side:Be});
}

// ---- small scenery: flags at the kicker lips, hay bales round the outside of the turns, a start gantry and a road sign ---------------
const circuitParts=new Set();
function circuitPart(geometry,color,x,y,z,parent=world.root){const m=new ie(geometry,material(color));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);circuitParts.add(m);return m;}
function circuitLabel(text,w,h,fill,ink){
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(64,Math.round(1024*h/w));
 const g=canvas.getContext('2d');g.fillStyle=fill;g.fillRect(0,0,canvas.width,canvas.height);
 g.fillStyle=ink;g.font='bold '+Math.round(Math.min(canvas.height*.5,1024/text.length*1.1))+'px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,512,canvas.height*.54);
 const texture=new xn(canvas);texture.colorSpace=xe;
 return new ie(new Ge(w,h),new be({map:texture,roughness:1}));
}
const flagCloth=new Se();flagCloth.setAttribute('position',new $t([0,0,0,0,-.42,0,.62,-.21,0],3));flagCloth.computeVertexNormals();
const circuitFlags=[];
for(const r of CIRCUIT.ramps)if(r.wood)for(const s of [-1,1]){
 const x=r.x+s*(r.w+Math.max(1,r.H*.9)+.7),z=r.lip,y=circuitGround(x,z);
 circuitPart(new en(.05,.05,2.4,6),'#e8e2d0',x,y+1.2,z);
 const f=new ie(flagCloth,new be({color:'#f06a2a',roughness:.8,side:Be}));f.position.set(x,y+2.38,z);f.castShadow=true;world.root.add(f);circuitFlags.push(f);
 world.colliders.push({x,z,r:.12,y,height:2.4,solid:true});
}
const baleGeometry=new en(.7,.7,1.2,14);baleGeometry.rotateZ(Math.PI/2);
const circuitBales=[];                                  // close enough together that the Jeep cannot slip between them
for(const [z,from,to] of [[CIRCUIT.z1,.15,Math.PI-.15],[CIRCUIT.z0,-Math.PI+.15,-.15]])
 for(let a=from;a<=to+1e-6;a+=(to-from)/14){
  const x=CIRCUIT.cx+Math.cos(a)*(CIRCUIT.R+CIRCUIT.half+1.7),bz=z+Math.sin(a)*(CIRCUIT.R+CIRCUIT.half+1.7),y=circuitGround(x,bz);
  const b=circuitPart(baleGeometry,'#c9a75a',x,y+.66,bz);b.rotation.y=Math.PI/2-a; // rolled along the turn
  world.colliders.push({x,z:bz,r:.75,y,height:1.4,solid:true});circuitBales.push([x,bz]);
 }
{
 // start gantry: two posts and a banner over the start/finish line, and a chequered line across the track
 const x0=CIRCUIT.cx-CIRCUIT.R,z=CIRCUIT.start,span=CIRCUIT.half+.8,y=Math.max(circuitGround(x0-span,z),circuitGround(x0+span,z));
 for(const s of [-1,1]){circuitPart(new Oe(.22,4.6,.22),'#3f3a33',x0+s*span,y+2.3,z);world.colliders.push({x:x0+s*span,z,r:.2,y,height:4.6,solid:true});}
 const banner=circuitLabel('RAMP CIRCUIT',span*2,1,'#2f3b33','#f2e6c4');banner.position.set(x0,y+4.05,z-.05);banner.rotation.y=Math.PI;world.root.add(banner);
 const back=circuitLabel('RAMP CIRCUIT',span*2,1,'#2f3b33','#f2e6c4');back.position.set(x0,y+4.05,z+.05);world.root.add(back);
 const positions=[],colors=[],cell=CIRCUIT.half*2/10;
 for(let i=0;i<10;i++)for(let j=0;j<2;j++){
  const xa=x0-CIRCUIT.half+i*cell,za=z-cell+j*cell,corner=(x,zz)=>[x,circuitGround(x,zz)+.05,zz];
  const q=[corner(xa,za),corner(xa+cell,za),corner(xa,za+cell),corner(xa+cell,za+cell)];
  positions.push(...q[0],...q[2],...q[1],...q[1],...q[2],...q[3]);
  const c=(i+j)%2?[.92,.9,.84]:[.12,.12,.12];for(let v=0;v<6;v++)colors.push(...c);
 }
 circuitMesh(positions,colors,null).name='Circuit start line';
}
{
 // a sign beside the ring road where the link leaves it
 const l=CIRCUIT.link,x=l.x0+2.6,z=l.z+l.half+1.2,y=circuitGround(x,z);
 circuitPart(new en(.07,.07,2.2,8),'#655438',x,y+1.1,z);world.colliders.push({x,z,r:.12,y,height:2.2,solid:true});
 const board=circuitLabel('RAMP CIRCUIT  >',1.9,.46,'#69583c','#ddd4b4');board.position.set(x-.06,y+1.8,z);board.rotation.y=-Math.PI/2;board.castShadow=true;world.root.add(board);
}
stoneList(); // the collider list changed: let rocks.js sort stones from solid things again

// ---- the minimap ---------------------------------------------------------------------------------------------------------------------------
const circuitMap=o_;o_=function(){
 circuitMap();
 const c=oe('map').getContext('2d'),s=p=>[120+p[0]*2.03,120-p[1]*2.03];
 c.save();c.globalCompositeOperation='destination-over'; // under the Jeep and the markers already drawn
 c.strokeStyle='#c9a46a99';c.lineWidth=5;c.beginPath();
 circuitPath.forEach((p,i)=>{const [x,y]=s(p);i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.stroke();
 c.lineWidth=3;c.beginPath();c.moveTo(...s([CIRCUIT.link.x0,CIRCUIT.link.z]));c.lineTo(...s([CIRCUIT.link.x1,CIRCUIT.link.z]));c.stroke();
 c.fillStyle='#f06a2a';for(const r of CIRCUIT.ramps)if(r.H>1){const [x,y]=s([r.x,r.lip]);c.fillRect(x-2.5,y-2.5,5,5);}
 c.restore();
};

// ---- jumps: measure each flight off a ramp and say how it went ----------------------------------------------------------------------------
const circuitStep=Fu;
Fu=function(dt){
 circuitStep(dt);
 for(const f of circuitFlags)f.rotation.y=Math.sin(Fa*3+f.position.x)*.35;
 const p=zt.root.position,j=circuitJumps;
 if(rockState.flying&&rockState.ramp){
  if(!j.current)j.current={from:[p.x,p.z],start:Fa,peak:0};
  j.current.peak=Math.max(j.current.peak,rockState.peak);
 }else if(j.current){
  const air=Fa-j.current.start,distance=Math.hypot(p.x-j.current.from[0],p.z-j.current.from[1]);
  j.last={air:+air.toFixed(2),distance:+distance.toFixed(1),height:+j.current.peak.toFixed(1),impact:rockState.last?rockState.last.impact:0};j.current=null;
  if(air>.35){
   j.count++;const record=!j.best||distance>j.best.distance;if(record)j.best=j.last;
   hi((air>1.2?'Huge air! ':air>.8?'Big air! ':'Air: ')+air.toFixed(1)+' s · '+Math.round(distance)+' m · '+j.last.height.toFixed(1)+' m high'+(record&&j.count>1?' · new best!':j.best&&!record?' · best '+Math.round(j.best.distance)+' m':''));
  }
 }
};
const circuitReset=Oa;Oa=function(){circuitReset();circuitJumps.current=null;};window.expedition.reset=Oa;
window.expedition.circuit={layout:CIRCUIT,jumps:circuitJumps,cleared:circuitCleared,ground:circuitGround,rampHeight:circuitRampHeight,bales:circuitBales,track:circuitTrack,clearing:circuitClearing,path:circuitPath};
