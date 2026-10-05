// Trees and undergrowth for landscape.js: tiered pines, broadleaf trees (some turning gold and orange), birches, bushes,
// ferns and mushrooms, plus a forest all the way out to the hills. The old trunks and crowns are hidden and replaced at
// exactly the same places, so the collision circles (and everything that depends on them) stay as they were.

// ---- a small geometry kit: parts with gradient vertex colours, baked into one flat-shaded BufferGeometry --------------------------
const TreeGeometry=Object.getPrototypeOf(Oe.prototype).constructor;            // THREE.BufferGeometry
const TreeAttribute=new Oe(1,1,1).getAttribute('position').constructor;        // THREE.Float32BufferAttribute
const treeDummy=new Me(),treeColor=new Wt();
const treeUnit={cylinder:(rt,rb,h,seg=7)=>new en(rt,rb,h,seg,1),ico:(detail=1)=>new cs(1,detail),box:(w,h,d)=>new Oe(w,h,d)};
// part: geometry placed at p, rotated r, scaled s; colour runs c0 (its lowest point) to c1 (its highest)
function treePart(geometry,p,r,s,c0,c1=c0){return {geometry,p,r,s,c0:new Wt(c0),c1:new Wt(c1)};}
function treeBake(parts,{gradient=null}={}){
 const positions=[],colors=[];
 for(const part of parts){
  const g=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
  treeDummy.position.set(...part.p);treeDummy.rotation.set(...part.r);treeDummy.scale.set(...part.s);treeDummy.updateMatrix();
  g.applyMatrix4(treeDummy.matrix);
  const pos=g.getAttribute('position');let lo=1e9,hi=-1e9;
  for(let i=0;i<pos.count;i++){lo=Math.min(lo,pos.getY(i));hi=Math.max(hi,pos.getY(i));}
  for(let i=0;i<pos.count;i++){
   positions.push(pos.getX(i),pos.getY(i),pos.getZ(i));
   const t=hi>lo?(pos.getY(i)-lo)/(hi-lo):0;treeColor.copy(part.c0).lerp(part.c1,t);
   if(gradient){const u=Math.max(0,Math.min(1,(pos.getY(i)-gradient.from)/(gradient.to-gradient.from)));treeColor.multiplyScalar(gradient.dark+(gradient.light-gradient.dark)*u);}
   colors.push(treeColor.r,treeColor.g,treeColor.b);
  }
 }
 const geometry=new TreeGeometry();
 geometry.setAttribute('position',new TreeAttribute(new Float32Array(positions),3));
 geometry.setAttribute('color',new TreeAttribute(new Float32Array(colors),3));
 geometry.computeVertexNormals();geometry.computeBoundingSphere();
 return geometry;
}
let treeSeed=4409;
const treeRand=()=>{treeSeed=(Math.imul(treeSeed,1664525)+1013904223)>>>0;return treeSeed/4294967296;};
const treeRange=(a,b)=>a+treeRand()*(b-a);

// a pine, one unit tall: a dark trunk and 5 to 7 overlapping tiers, dark under each tier and lighter at its tip
function buildPine(){
 const tiers=5+Math.floor(treeRand()*3),foliage=[],trunk=[];
 trunk.push(treePart(treeUnit.cylinder(.012,.03,.66,6),[0,.33,0],[0,0,0],[1,1,1],'#4a3a2a','#5e4a34'));
 for(let k=0;k<tiers;k++){
  const t=k/(tiers-1),h=.34-.13*t,yBase=.10+.62*t,radius=(.34-.25*t)*treeRange(.92,1.1);
  const lean=treeRange(-.05,.05);
  foliage.push(treePart(treeUnit.cylinder(0,radius,h,7+(k%2)),[treeRange(-.012,.012),yBase+h/2,treeRange(-.012,.012)],[lean,treeRand()*6,lean*.7],[treeRange(.92,1.08),1,treeRange(.92,1.08)],
   k%2?'#1c4632':'#1f4a37',k%2?'#3e7a4a':'#437f4d'));
 }
 foliage.push(treePart(treeUnit.cylinder(0,.05,.16,6),[0,.95,0],[0,0,0],[1,1,1],'#3f7a4b','#5a9457'));
 return {trunk:treeBake(trunk),foliage:treeBake(foliage)};
}
// a broadleaf tree, one unit tall: a leaning trunk with branch stubs and a canopy of overlapping blobs, lighter on top
function buildBroadleaf(palette){
 const trunk=[],foliage=[],lean=treeRange(-.10,.10);
 trunk.push(treePart(treeUnit.cylinder(.034,.052,.36,6),[0,.18,0],[0,0,0],[1,1,1],'#4b3a2a','#5d4932'));
 trunk.push(treePart(treeUnit.cylinder(.022,.034,.34,6),[-lean*.4,.50,0],[0,0,lean],[1,1,1],'#5d4932','#6c563b'));
 for(const side of [-1,1])trunk.push(treePart(treeUnit.cylinder(.010,.022,.30,5),[side*.07,.60,treeRange(-.04,.04)],[treeRange(-.2,.2),0,-side*treeRange(.6,.95)],[1,1,1],'#5d4932','#6c563b'));
 const blobs=7+Math.floor(treeRand()*3);
 for(let i=0;i<blobs;i++){
  const a=i/blobs*6.283+treeRand(),spread=i===0?0:treeRange(.10,.24),y=i===0?.92:treeRange(.52,.88),radius=i===0?treeRange(.19,.24):treeRange(.17,.27);
  foliage.push(treePart(treeUnit.ico(1),[Math.cos(a)*spread,y,Math.sin(a)*spread],[treeRand()*3,treeRand()*3,treeRand()*3],[radius*treeRange(1.0,1.2),radius*treeRange(.78,.95),radius*treeRange(1.0,1.2)],
   palette[0],palette[1]));
 }
 return {trunk:treeBake(trunk),foliage:treeBake(foliage,{gradient:{from:.4,to:1.05,dark:.62,light:1.12}})};
}
// a birch, one unit tall: a pale trunk with dark marks and a light, airy crown
function buildBirch(){
 const trunk=[],foliage=[];
 for(let k=0;k<6;k++){const t0=k/6,t1=(k+1)/6,r0=.020-.010*t0,r1=.020-.010*t1;
  trunk.push(treePart(treeUnit.cylinder(r1,r0,.7/6*1.02,6),[treeRange(-.006,.006)*k,.05+.7*(t0+t1)/2,0],[0,0,0],[1,1,1],k%2?'#dcd7c6':'#ebe7da',k%2?'#e7e2d3':'#d8d3c2'));}
 for(let m=0;m<9;m++){const a=treeRand()*6.283,y=treeRange(.10,.68);trunk.push(treePart(treeUnit.box(.026,.010,.026),[Math.cos(a)*(.018-.010*y),y,Math.sin(a)*(.018-.010*y)],[0,a,0],[1,1,1],'#34322c'));}
 for(const side of [-1,1])trunk.push(treePart(treeUnit.cylinder(.005,.011,.26,5),[side*.06,.62,0],[0,0,-side*.8],[1,1,1],'#d8d3c2','#bdb7a4'));
 const blobs=5+Math.floor(treeRand()*2);
 for(let i=0;i<blobs;i++){
  const a=treeRand()*6.283,spread=i===0?0:treeRange(.07,.17),y=i===0?.97:treeRange(.62,.92),radius=treeRange(.12,.19);
  foliage.push(treePart(treeUnit.ico(1),[Math.cos(a)*spread,y,Math.sin(a)*spread],[treeRand()*3,treeRand()*3,treeRand()*3],[radius,radius*.85,radius],'#6f9a3c','#b6d065'));
 }
 return {trunk:treeBake(trunk),foliage:treeBake(foliage,{gradient:{from:.55,to:1.05,dark:.75,light:1.1}})};
}
// a bush: a cluster of blobs about a metre across
function buildBush(){
 const parts=[],n=4+Math.floor(treeRand()*2);
 for(let i=0;i<n;i++){const a=i/n*6.283+treeRand(),spread=i===0?0:treeRange(.18,.34),radius=treeRange(.22,.36);
  parts.push(treePart(treeUnit.ico(1),[Math.cos(a)*spread,radius*.7,Math.sin(a)*spread],[treeRand()*3,treeRand()*3,treeRand()*3],[radius*1.15,radius*.85,radius*1.15],'#33602a','#6f9f3f'));}
 return treeBake(parts,{gradient:{from:0,to:.6,dark:.7,light:1.1}});
}
// a fern: eight arching fronds that taper to a point
function buildFern(){
 const positions=[],colors=[],dark=new Wt('#2f5a2a'),light=new Wt('#74a84a');
 for(let f=0;f<8;f++){
  const yaw=f/8*6.283+treeRange(-.2,.2),pitch=treeRange(.55,.95),length=treeRange(.38,.52),droop=treeRange(.5,.9);
  const row=(u)=>{const w=(.07*Math.pow(1-u,.65)+.006)*(u<.12?u/.12*1.0+.2:1);const x=u*length,y=Math.sin(pitch)*x*(1-.15*u)-droop*x*x;const px=Math.cos(pitch)*x;
   return [[Math.cos(yaw)*px-Math.sin(yaw)*(-w),y,Math.sin(yaw)*px+Math.cos(yaw)*(-w)],[Math.cos(yaw)*px-Math.sin(yaw)*w,y,Math.sin(yaw)*px+Math.cos(yaw)*w]];};
  const steps=6;
  for(let k=0;k<steps;k++){
   const a=row(k/steps),b=row((k+1)/steps),ta=k/steps,tb=(k+1)/steps;
   for(const [p,t] of [[a[0],ta],[a[1],ta],[b[0],tb],[a[1],ta],[b[1],tb],[b[0],tb]]){positions.push(...p);treeColor.copy(dark).lerp(light,t);colors.push(treeColor.r,treeColor.g,treeColor.b);}
  }
 }
 const geometry=new TreeGeometry();
 geometry.setAttribute('position',new TreeAttribute(new Float32Array(positions),3));geometry.setAttribute('color',new TreeAttribute(new Float32Array(colors),3));
 geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
function buildMushroom(capColor){
 return treeBake([
  treePart(treeUnit.cylinder(.010,.014,.07,6),[0,.035,0],[0,0,0],[1,1,1],'#e8e0cc'),
  treePart(treeUnit.cylinder(.002,.052,.05,8),[0,.085,0],[0,0,0],[1,1,1],capColor,capColor),
  treePart(treeUnit.ico(0),[.02,.108,.01],[0,0,0],[.008,.006,.008],'#f4efe6'),treePart(treeUnit.ico(0),[-.016,.102,-.02],[0,0,0],[.007,.005,.007],'#f4efe6'),treePart(treeUnit.ico(0),[.002,.112,-.012],[0,0,0],[.006,.005,.006],'#f4efe6'),
 ]);
}

// ---- materials: vertex colours, flat shading and wind -------------------------------------------------------------------------------------------
function treeMaterial(amplitude,{double=false}={}){
 const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.92,metalness:0,vertexColors:true,flatShading:true,side:double?2:0});
 material.onBeforeCompile=shader=>{
  shader.uniforms.uWind=landWind;
  shader.vertexShader='uniform float uWind;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vec3 twp=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
   float th=max(position.y,0.);
   float sway=sin(uWind*1.05+twp.x*.21+twp.z*.17)*.65+sin(uWind*2.5+twp.x*.5+twp.z*.3)*.2;
   transformed.x+=sway*th*th*${amplitude.toFixed(4)};
   transformed.z+=cos(uWind*.9+twp.z*.23+twp.x*.1)*th*th*${(amplitude*.6).toFixed(4)};
  `);
 };
 return material;
}
const pineMaterial=treeMaterial(.018),broadMaterial=treeMaterial(.026),birchMaterial=treeMaterial(.040),bushMaterial=treeMaterial(.03),fernMaterial=treeMaterial(.07,{double:true}),trunkMaterialPine=treeMaterial(.018),trunkMaterialBroad=treeMaterial(.026),trunkMaterialBirch=treeMaterial(.040),mushroomMaterial=treeMaterial(0);
function treeInstances(geometry,material,count,shadow=true){
 const m=new kn(geometry,material,Math.max(1,count));m.count=count;m.castShadow=shadow;m.receiveShadow=true;m.frustumCulled=false;world.root.add(m);return m;
}

// ---- what is there now, and where new trees may go -------------------------------------------------------------------------------------------------
const treeOld=world.root.children.filter(o=>o.isInstancedMesh&&['655438','73815a','294c42','365c49','527452'].includes(o.material.color.getHexString())||o.isInstancedMesh&&o.material.color.getHexString()==='594c38'&&o.count===180);
const treeMat=new ue();
function treeRead(mesh){const out=[];for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,treeMat);const e=treeMat.elements;out.push({x:e[12],y:e[13],z:e[14],sy:Math.hypot(e[4],e[5],e[6])});}return out;}
const oldPines=treeRead(world.root.children.find(o=>o.isInstancedMesh&&o.material.color.getHexString()==='594c38'&&o.count===180));
const oldBroad=treeRead(world.root.children.find(o=>o.isInstancedMesh&&o.material.color.getHexString()==='655438'));
treeOld.forEach(o=>{o.visible=false;});

const TREES={pines:[],broad:[],birch:[],bushes:[],ferns:[],mushrooms:[],far:{pines:[],broad:[]}};
oldPines.forEach(t=>{const H=t.sy/.84;TREES.pines.push({x:t.x,z:t.z,y:t.y-t.sy/2,H});});
oldBroad.forEach(t=>{const base=t.y-t.sy/2;TREES.broad.push({x:t.x,z:t.z,y:base,H:Math.max(3.6,t.sy*2.7)});});
const treeTaken=[...TREES.pines,...TREES.broad];
function treeFree(x,z,gap){
 for(const t of treeTaken)if(Math.hypot(t.x-x,t.z-z)<gap)return false;
 for(const c of world.colliders)if(Math.hypot(c.x-x,c.z-z)<c.r+gap*.5)return false;
 return true;
}
function treeOkAt(x,z,{road=6.5,lake=13,camp=14}={}){
 if(world.roadDistance(x,z)<road||lakeDistance(x,z)<lake||lookoutClearing(x,z))return false;
 if(Math.hypot(x,z)<camp||Math.abs(x-18)<8&&z>18&&z<46)return false;
 if(spInBoardwalk(x,z)||Math.hypot(x-spBoatSpot.x,z-spBoatSpot.z)<4)return false;
 return true;
}
function treeScatter(count,{rMin,rMax,gap,solid=true,road,lake,camp,test=()=>true,make}){
 const out=[];
 for(let tries=0;out.length<count&&tries<count*80;tries++){
  const a=treeRand()*6.283,r=rMin+Math.sqrt(treeRand())*(rMax-rMin),x=Math.sin(a)*r,z=Math.cos(a)*r;
  if(!treeOkAt(x,z,{road,lake,camp})||!test(x,z)||!treeFree(x,z,gap))continue;
  const t=make(x,z);treeTaken.push(t);out.push(t);
 }
 return out;
}
// new trees close enough to be walked into get a collision circle like the old ones
const addCollider=(t,r)=>world.colliders.push({x:t.x,z:t.z,r,y:t.y,height:t.H});
TREES.pines.push(...treeScatter(70,{rMin:26,rMax:86,gap:3.4,make:(x,z)=>{const t={x,z,y:world.height(x,z),H:treeRange(4.5,9.5)};addCollider(t,.28);return t;}}));
TREES.broad.push(...treeScatter(34,{rMin:18,rMax:80,gap:4.2,lake:14,make:(x,z)=>{const t={x,z,y:world.height(x,z),H:treeRange(4.2,6.4)};addCollider(t,.3);return t;}}));
TREES.birch.push(...treeScatter(70,{rMin:14,rMax:84,gap:3,lake:13.5,test:(x,z)=>landFbm(x*.05+11,z*.05-3)>.5||lakeDistance(x,z)<24,make:(x,z)=>{const t={x,z,y:world.height(x,z),H:treeRange(4.6,6.8)};addCollider(t,.18);return t;}}));
// the forest beyond the walkable valley, out to the hills (no collision: you cannot get there)
TREES.far.pines=treeScatter(280,{rMin:90,rMax:136,gap:3.2,road:0,lake:0,camp:0,make:(x,z)=>({x,z,y:world.height(x,z),H:treeRange(5.5,11)})});
TREES.far.broad=treeScatter(80,{rMin:90,rMax:134,gap:4.5,road:0,lake:0,camp:0,make:(x,z)=>({x,z,y:world.height(x,z),H:treeRange(4.6,7)})});

// ---- build and place --------------------------------------------------------------------------------------------------------------------------------
const treeTint=new Wt();
const placeMatrix=new Me();
function treePlace(mesh,i,t,{width=null,tilt=.04}={}){
 const w=width??t.H*treeRange(.62,.8);
 placeMatrix.position.set(t.x,t.y-.05,t.z);placeMatrix.rotation.set(treeRange(-tilt,tilt),treeRand()*6.283,treeRange(-tilt,tilt));placeMatrix.scale.set(w,t.H,w);placeMatrix.updateMatrix();
 mesh.setMatrixAt(i,placeMatrix.matrix);
}
function treeFill(list,variants,{width,tint,tilt}={}){
 // split the trees between the geometry variants; each variant is a (trunk, foliage) pair of instanced meshes
 const groups=variants.map(()=>[]);list.forEach(t=>groups[Math.floor(treeRand()*variants.length)].push(t));
 const built=[];
 variants.forEach((variant,v)=>{
  const trunkMesh=treeInstances(variant.trunk,variant.trunkMaterial,groups[v].length),leafMesh=treeInstances(variant.foliage,variant.leafMaterial,groups[v].length);
  groups[v].forEach((t,i)=>{
   treePlace(trunkMesh,i,t,{width:width?.(t),tilt});
   trunkMesh.getMatrixAt(i,treeMat);leafMesh.setMatrixAt(i,treeMat); // the foliage uses exactly the trunk's placement
   treeTint.set('#ffffff');tint&&tint(treeTint,t,v);leafMesh.setColorAt(i,treeTint);
  });
  trunkMesh.instanceMatrix.needsUpdate=true;leafMesh.instanceMatrix.needsUpdate=true;if(leafMesh.instanceColor)leafMesh.instanceColor.needsUpdate=true;
  built.push(trunkMesh,leafMesh);
 });
 return built;
}
const brighten=(c,t)=>c.setScalar(.88+.22*landHash(t.x*1.3,t.z*0.7));
const pineVariants=[0,1,2].map(()=>{const g=buildPine();return {trunk:g.trunk,foliage:g.foliage,trunkMaterial:trunkMaterialPine,leafMaterial:pineMaterial};});
const greenBroad=[['#2c5a2a','#5f9638'],['#32622c','#6ba03d'],['#2a5628','#58903a']];
const broadVariants=[...greenBroad.map(p=>{const g=buildBroadleaf(p);return {trunk:g.trunk,foliage:g.foliage,trunkMaterial:trunkMaterialBroad,leafMaterial:broadMaterial};}),
 ...[['#8a6a1d','#e0b43c'],['#9a4c1a','#e2792b']].map(p=>{const g=buildBroadleaf(p);return {trunk:g.trunk,foliage:g.foliage,trunkMaterial:trunkMaterialBroad,leafMaterial:broadMaterial};})];
const birchVariants=[0,1,2].map(()=>{const g=buildBirch();return {trunk:g.trunk,foliage:g.foliage,trunkMaterial:trunkMaterialBirch,leafMaterial:birchMaterial};});
// most broadleaf trees stay green; a few of the variants are the autumn ones (gold, orange)
const broadList=[...TREES.broad,...TREES.far.broad];
const broadGroupsByLook=broadList.map(t=>{const roll=landHash(t.x*2.1,t.z*1.7);return roll<.78?Math.floor(roll/.78*3):roll<.92?3:4;});
{
 const built=broadVariants.map((variant,v)=>{
  const members=broadList.filter((t,i)=>broadGroupsByLook[i]===v);
  const trunkMesh=treeInstances(variant.trunk,variant.trunkMaterial,members.length),leafMesh=treeInstances(variant.foliage,variant.leafMaterial,members.length);
  members.forEach((t,i)=>{treePlace(trunkMesh,i,t,{width:t.H*treeRange(.78,.98)});trunkMesh.getMatrixAt(i,treeMat);leafMesh.setMatrixAt(i,treeMat);treeTint.setScalar(.9+.2*landHash(t.x,t.z));leafMesh.setColorAt(i,treeTint);});
  trunkMesh.instanceMatrix.needsUpdate=true;leafMesh.instanceMatrix.needsUpdate=true;if(leafMesh.instanceColor)leafMesh.instanceColor.needsUpdate=true;
  return [trunkMesh,leafMesh,members.length];
 });
 TREES.broadMeshes=built;
}
TREES.pineMeshes=treeFill([...TREES.pines,...TREES.far.pines],pineVariants,{width:t=>t.H*treeRange(.62,.78),tint:(c,t)=>{brighten(c,t);if(landHash(t.x,t.z*1.9)<.18)c.multiply(new Wt('#dcf0e6'));}});
TREES.birchMeshes=treeFill(TREES.birch,birchVariants,{width:t=>t.H*treeRange(.55,.7),tint:brighten});

// ---- undergrowth ---------------------------------------------------------------------------------------------------------------------------------------
const bushGeometries=[buildBush(),buildBush()];
const nearTrees=[...TREES.pines,...TREES.broad,...TREES.birch];
const understorey=(count,make,test)=>{const out=[];for(let tries=0;out.length<count&&tries<count*60;tries++){
  let x,z;
  if(treeRand()<.55){const t=nearTrees[Math.floor(treeRand()*nearTrees.length)],a=treeRand()*6.283,d=treeRange(1.0,3.2);x=t.x+Math.cos(a)*d;z=t.z+Math.sin(a)*d;}
  else{const a=treeRand()*6.283,r=Math.sqrt(treeRand())*84;x=Math.sin(a)*r;z=Math.cos(a)*r;}
  if(!treeOkAt(x,z,{road:3.2,lake:12.4,camp:9})||!test(x,z))continue;
  out.push(make(x,z));}return out;};
TREES.bushes=understorey(320,(x,z)=>({x,z,y:world.height(x,z),H:treeRange(.7,1.3)}),(x,z)=>landFbm(x*.06+2,z*.06+8)>.34);
TREES.ferns=understorey(520,(x,z)=>({x,z,y:world.height(x,z),H:treeRange(.7,1.4)}),(x,z)=>true);
TREES.mushrooms=understorey(90,(x,z)=>({x,z,y:world.height(x,z),H:treeRange(.7,1.5)}),(x,z)=>true);
{
 const half=Math.ceil(TREES.bushes.length/2);
 TREES.bushMeshes=bushGeometries.map((geometry,v)=>{
  const list=TREES.bushes.filter((t,i)=>i%2===v),mesh=treeInstances(geometry,bushMaterial,list.length);
  list.forEach((t,i)=>{treePlace(mesh,i,t,{width:t.H,tilt:.08});const hue=landHash(t.x*3.1,t.z*2.7);treeTint.set(hue<.18?'#e6e98a':hue<.3?'#f0c070':'#ffffff').multiplyScalar(.85+.3*landHash(t.z,t.x));mesh.setColorAt(i,treeTint);});
  mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;return mesh;
 });
 const fernMesh=treeInstances(buildFern(),fernMaterial,TREES.ferns.length,false);
 TREES.ferns.forEach((t,i)=>{treePlace(fernMesh,i,t,{width:t.H,tilt:.05});treeTint.setScalar(.85+.3*landHash(t.x*5.1,t.z));fernMesh.setColorAt(i,treeTint);});
 fernMesh.instanceMatrix.needsUpdate=true;if(fernMesh.instanceColor)fernMesh.instanceColor.needsUpdate=true;TREES.fernMesh=fernMesh;
 TREES.mushroomMeshes=[['#c0392b'],['#a9835b']].map(([cap],v)=>{
  const list=TREES.mushrooms.filter((t,i)=>i%2===v),mesh=treeInstances(buildMushroom(cap),mushroomMaterial,list.length,false);
  list.forEach((t,i)=>treePlace(mesh,i,t,{width:t.H,tilt:.2}));mesh.instanceMatrix.needsUpdate=true;return mesh;
 });
}
window.expedition.landscape.trees=TREES;
window.expedition.landscape.treeCounts=()=>({pines:TREES.pines.length,broadleaf:TREES.broad.length,birches:TREES.birch.length,bushes:TREES.bushes.length,ferns:TREES.ferns.length,mushrooms:TREES.mushrooms.length,farPines:TREES.far.pines.length,farBroadleaf:TREES.far.broad.length});
