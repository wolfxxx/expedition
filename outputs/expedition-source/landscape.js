// Landscape: a lusher meadow floor, dense wind-blown grass that follows you, wildflowers, and (see landscape-trees.js)
// richer trees and undergrowth. Everything is built from simple shapes and shaders in code.
const LAND={windSpeed:1,grassRadius:32,grassTufts:22000,grassPerFrame:2600,quality:1,adaptive:true};
// If frames stay slow the grass thins out (fewer tufts drawn), and fills back in if the machine copes again.
const landQuality={levels:[1,.6,.35,.15],level:0,ema:16,slowFor:0,fastFor:0,last:0};
function landAdapt(frameMs){
 if(!LAND.adaptive||frameMs>250)return;
 landQuality.ema+=(frameMs-landQuality.ema)*.08;
 if(landQuality.ema>30){landQuality.slowFor+=frameMs;landQuality.fastFor=0;}else if(landQuality.ema<20){landQuality.fastFor+=frameMs;landQuality.slowFor=0;}else{landQuality.slowFor=landQuality.fastFor=0;}
 if(landQuality.slowFor>3000&&landQuality.level<landQuality.levels.length-1){landQuality.level++;landQuality.slowFor=0;landQuality.ema=24;}
 else if(landQuality.fastFor>12000&&landQuality.level>0){landQuality.level--;landQuality.fastFor=0;}
 LAND.quality=landQuality.levels[landQuality.level];
}
const landWind={value:0};                                   // game time, drives all swaying
let landSeed=77031;
const landRand=()=>{landSeed=(Math.imul(landSeed,1664525)+1013904223)>>>0;return landSeed/4294967296;};
const landRange=(a,b)=>a+landRand()*(b-a);
const landHash=(x,z)=>{let h=Math.imul(Math.floor(x*73.1)^0x5bd1e995,0x27d4eb2d)^Math.imul(Math.floor(z*91.7)+1013,0x165667b1);h=(h^(h>>>15))>>>0;return h/4294967296;};
// smooth value noise on the CPU (the same idea as in the shaders) to place meadows, flower fields and woods
function landNoise(x,z){
 const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,sx=fx*fx*(3-2*fx),sz=fz*fz*(3-2*fz);
 const a=landHash(ix,iz),b=landHash(ix+1,iz),c=landHash(ix,iz+1),d=landHash(ix+1,iz+1);
 return a+(b-a)*sx+(c-a)*sz+(a-b-c+d)*sx*sz;
}
const landFbm=(x,z)=>landNoise(x,z)*.5+landNoise(x*2.03+17.1,z*2.03+9.7)*.25+landNoise(x*4.1+3.3,z*4.1+5.9)*.125+landNoise(x*8.3+1.1,z*8.3+2.3)*.0625;

// ---- the ground: patches of lush and dry meadow, mottling and fine streaks, drawn in the terrain's own shader ---------------
{
 const terrainMaterial=world.terrain.material,previous=terrainMaterial.onBeforeCompile;
 terrainMaterial.onBeforeCompile=(shader,renderer)=>{
  if(previous)previous.call(terrainMaterial,shader,renderer);
  shader.vertexShader='varying vec3 vGroundWorld;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGroundWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=`varying vec3 vGroundWorld;
float gdHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float gdNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(gdHash(i),gdHash(i+vec2(1.,0.)),f.x),mix(gdHash(i+vec2(0.,1.)),gdHash(i+vec2(1.,1.)),f.x),f.y);}
float gdFbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*gdNoise(p);p=p*2.03+vec2(17.1,9.7);a*=.5;}return s;}
`+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 gdC=diffuseColor.rgb;
   float gdDist=length(vViewPosition);
   float gdGrassy=smoothstep(.60,.84,gdC.g/max(gdC.r,.001));          // dirt and sand are redder than grass
   float gdBig=gdFbm(vGroundWorld.xz*.040),gdMid=gdFbm(vGroundWorld.xz*.19+7.),gdFine=gdNoise(vGroundWorld.xz*vec2(15.,38.));
   vec3 gdLush=gdC*vec3(.60,1.34,.50),gdDry=gdC*vec3(1.05,1.04,.74);
   gdC=mix(gdC,mix(gdDry,gdLush,smoothstep(.18,.52,gdBig)),gdGrassy*.95);
   gdC*=.84+.32*gdMid;
   gdC*=1.-.10*(1.-smoothstep(20.,70.,gdDist))*(.5-gdFine);           // fine streaks near the camera, fading out
   diffuseColor.rgb=gdC;
  `);
 };
 terrainMaterial.needsUpdate=true;
}

// ---- grass --------------------------------------------------------------------------------------------------------------------------------------
// Tufts live in a window around the player. When one falls out of the window it is carried to the opposite edge and
// planted on the ground there, a few thousand checks per frame, so the field is always full and nothing pops in view.
const grassTuft=(()=>{
 // a fan of tapered, curved blades; the height of a vertex (0 at the root, 1 at the tip) is its y coordinate
 const positions=[],normals=[],indices=[];
 const blades=10;
 for(let k=0;k<blades;k++){
  const angle=k/blades*6.283+landRange(-.3,.3),root=landRange(0,.075),height=landRange(.5,1),width=landRange(.016,.028),lean=landRange(.10,.45);
  const dir=[Math.cos(angle),Math.sin(angle)],across=[-dir[1],dir[0]],rx=dir[0]*root,rz=dir[1]*root,base=positions.length/3;
  const row=(t,half)=>{
   const out=lean*t*t*height*.5,y=t*height;
   for(const side of [-1,1]){positions.push(rx+dir[0]*out+across[0]*half*side,y,rz+dir[1]*out+across[1]*half*side);normals.push(dir[0]*.35,.9,dir[1]*.35);}
  };
  row(0,width);row(.5,width*.75);
  positions.push(rx+dir[0]*lean*height*.5,height,rz+dir[1]*lean*height*.5);normals.push(dir[0]*.35,.9,dir[1]*.35);
  indices.push(base,base+1,base+2,base+1,base+3,base+2,base+2,base+3,base+4);
 }
 const geometry=new Oe(1,1,1).clone();                       // any BufferGeometry to start from
 geometry.deleteAttribute('uv');
 geometry.setAttribute('position',new (geometry.getAttribute('position').constructor)(new Float32Array(positions),3));
 geometry.setAttribute('normal',new (geometry.getAttribute('normal').constructor)(new Float32Array(normals),3));
 geometry.setIndex(indices);geometry.computeBoundingSphere();
 return geometry;
})();
const grassMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.95,metalness:0,side:2});
grassMaterial.onBeforeCompile=shader=>{
 shader.uniforms.uWind=landWind;
 shader.vertexShader='uniform float uWind;varying float vBladeH;varying float vFade;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
  vBladeH=position.y;
  vec3 gwp=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
  float gdist=distance(gwp.xz,cameraPosition.xz);
  float bend=position.y*position.y;
  float gust=sin(uWind*1.7+gwp.x*.33+gwp.z*.21)*.55+sin(uWind*3.3+gwp.x*.9+gwp.z*.5)*.18;
  transformed.x+=gust*bend*.45;transformed.z+=cos(uWind*1.3+gwp.z*.37+gwp.x*.1)*bend*.26;
  // tufts shrink away to nothing at the edge of the field
  vFade=1.-smoothstep(${(LAND.grassRadius*.72).toFixed(1)},${(LAND.grassRadius*.97).toFixed(1)},gdist);
  transformed*=vec3(1.,vFade,1.);
 `);
 shader.fragmentShader='varying float vBladeH;varying float vFade;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  diffuseColor.rgb*=mix(.42,1.18,smoothstep(0.,.95,vBladeH));       // dark in the roots, bright at the tips
  if(vFade<.02)discard;
 `);
};
const grassCount=LAND.grassTufts;
const grass=new kn(grassTuft,grassMaterial,grassCount);
grass.name='Meadow grass';grass.castShadow=false;grass.receiveShadow=true;grass.frustumCulled=false;
grass.instanceMatrix.setUsage&&grass.instanceMatrix.setUsage(35048); // dynamic draw: we rewrite matrices as the window moves
world.root.add(grass);
grass.setColorAt(0,new Wt('#6b8f3a'));
const grassData=Array.from({length:grassCount},()=>({x:0,z:0,yaw:0,h:1,w:1,hue:0,ok:false}));
const grassPalette=['#5f8a34','#6f9a3a','#7aa63f','#86ab45','#5a7f32','#93ab4c','#a9a352'].map(c=>new Wt(c));
const grassTint=new Wt(),grassMatrix=new ue(),grassDummy=new Me();
function grassAllowed(x,z){
 if(lakeDistance(x,z)<11.2||lookoutClearing(x,z)||circuitTrack(x,z))return false; // circuitTrack: the ramp circuit's dirt
 if(world.roadDistance(x,z)<2.3||Math.hypot(x,z)<10||Math.hypot(x,z)>96)return false;
 if(spInBoardwalk(x,z)||Math.abs(x-18)<6&&z>22&&z<44)return false;
 return true;
}
function grassPlant(i,x,z){
 const g=grassData[i];g.x=x;g.z=z;
 const dense=landFbm(x*.07,z*.07);                       // meadow patches: thick here, thin there
 g.ok=grassAllowed(x,z)&&landHash(x*3.7,z*5.3)<.40+.8*dense;
 if(!g.ok){grassDummy.scale.set(0,0,0);grassDummy.updateMatrix();grass.setMatrixAt(i,grassDummy.matrix);return;}
 const y=world.height(x,z),tall=landNoise(x*.11+4,z*.11-9);
 g.yaw=landHash(x,z)*6.283;g.h=.20+.16*landHash(z,x)+Math.max(0,tall-.55)*.55;g.w=.8+.5*landHash(x+9,z-4);
 grassDummy.position.set(x,y-.02,z);grassDummy.rotation.set(0,g.yaw,0);grassDummy.scale.set(g.w,g.h,g.w);grassDummy.updateMatrix();
 grass.setMatrixAt(i,grassDummy.matrix);
 // colour: mostly greens, with a few dry golden tufts; lusher where the ground is lush
 const pick=Math.floor(landHash(x*1.9,z*2.3)*6.99),lush=landFbm(x*.040,z*.040);
 grassTint.copy(grassPalette[pick]);if(lush<.4)grassTint.lerp(grassPalette[6],.5);
 grass.setColorAt(i,grassTint);
}
let grassCursor=0,grassReady=false;
function grassCentre(){return Te==='walking'?Xt.root.position:zt.root.position;}
function grassFill(){
 const c=grassCentre(),R=LAND.grassRadius;
 for(let i=0;i<grassCount;i++)grassPlant(i,c.x+(landRand()*2-1)*R,c.z+(landRand()*2-1)*R);
 grass.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;grassReady=true;
}
function grassUpdate(){
 if(!grassReady)return;
 const c=grassCentre(),R=LAND.grassRadius,size=R*2;let changed=false;
 for(let n=0;n<LAND.grassPerFrame;n++){
  const i=grassCursor;grassCursor=(grassCursor+1)%grassCount;
  const g=grassData[i];let x=g.x,z=g.z,moved=false;
  while(x<c.x-R){x+=size;moved=true;}while(x>c.x+R){x-=size;moved=true;}
  while(z<c.z-R){z+=size;moved=true;}while(z>c.z+R){z-=size;moved=true;}
  if(moved){grassPlant(i,x,z);changed=true;}
 }
 if(changed){grass.instanceMatrix.needsUpdate=true;if(grass.instanceColor)grass.instanceColor.needsUpdate=true;}
}
// ---- wildflowers: meadow patches of daisies, buttercups, violets, pinks and cornflowers ---------------------------------------------------
const flowerStemGeometry=new en(.0035,.0035,1,4);flowerStemGeometry.translate(0,.5,0);
const flowerHeadGeometry=new cs(1,0);
const flowerSpots=[];
for(let tries=0;flowerSpots.length<2400&&tries<60000;tries++){
 const a=landRand()*6.283,r=10+Math.sqrt(landRand())*74,x=Math.sin(a)*r,z=Math.cos(a)*r;
 if(!grassAllowed(x,z))continue;
 const patch=landFbm(x*.050+30,z*.050-12);if(patch<.60||landRand()>(patch-.55)*3)continue;     // clustered in patches
 const kind=Math.floor(landFbm(x*.02+5,z*.02+5)*24)%6; // neighbouring patches cycle through the six colours
 flowerSpots.push({x,z,y:world.height(x,z),h:landRange(.18,.34),kind,s:landRange(.9,1.3)});
}
const flowerPalette=['#f6f3e8','#f3cf45','#a77fd1','#ec8fb2','#6f9be0','#f0904a'].map(c=>new Wt(c));
const flowerStems=new kn(flowerStemGeometry,new be({color:'#5f8a34',roughness:.9}),Math.max(1,flowerSpots.length)),flowerHeads=new kn(flowerHeadGeometry,new be({color:'#ffffff',roughness:.7,flatShading:true}),Math.max(1,flowerSpots.length));
flowerStems.count=flowerHeads.count=flowerSpots.length;flowerStems.frustumCulled=flowerHeads.frustumCulled=false;flowerStems.castShadow=flowerHeads.castShadow=false;
flowerSpots.forEach((f,i)=>{
 grassDummy.position.set(f.x,f.y-.01,f.z);grassDummy.rotation.set(landRange(-.12,.12),0,landRange(-.12,.12));grassDummy.scale.set(1,f.h,1);grassDummy.updateMatrix();flowerStems.setMatrixAt(i,grassDummy.matrix);
 grassDummy.position.set(f.x,f.y+f.h*.97,f.z);grassDummy.rotation.set(0,landRand()*6.28,0);grassDummy.scale.set(.034*f.s,.016*f.s,.034*f.s);grassDummy.updateMatrix();flowerHeads.setMatrixAt(i,grassDummy.matrix);
 flowerHeads.setColorAt(i,flowerPalette[f.kind]);
});
flowerStems.instanceMatrix.needsUpdate=flowerHeads.instanceMatrix.needsUpdate=true;if(flowerHeads.instanceColor)flowerHeads.instanceColor.needsUpdate=true;
world.root.add(flowerStems,flowerHeads);
// the old floating blobs and 4-triangle spikes are replaced by the flowers and grass above
world.root.children.filter(o=>o.isInstancedMesh&&(['d3b3ba','e8d295'].includes(o.material.color.getHexString())||o.material.color.getHexString()==='85834d'&&o.count===994)).forEach(o=>{o.visible=false;});

// the mirror in the spring leaves the grass out (the cost is not worth it at that distance and angle)
if(typeof hideInMirror==='function')hideInMirror(grass);

// ---- per-frame --------------------------------------------------------------------------------------------------------------------------------
const landscapeStep=Fu;
Fu=function(dt){
 landscapeStep(dt);
 landWind.value=Fa*LAND.windSpeed;
 if(!grassReady)grassFill();else grassUpdate();
 grass.count=Math.max(1,Math.floor(grassCount*LAND.quality));
};
// frame timing for the grass quality (its own animation-frame clock, independent of the game loop)
{ let previous=performance.now(); const tick=now=>{landAdapt(now-previous);previous=now;requestAnimationFrame(tick);}; requestAnimationFrame(tick); }
window.expedition.landscape={settings:LAND,grass,grassData,grassUpdate,grassFill,wind:landWind,flowers:flowerSpots,quality:landQuality,adapt:landAdapt,
 state:()=>({tufts:grassData.filter(g=>g.ok).length,tuftSlots:grassCount,flowers:flowerSpots.length})};
