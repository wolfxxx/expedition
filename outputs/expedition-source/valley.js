/* Expedition: Wildhaven additions. Runs inside the original offline bundle.
   The alias table keeps the supplied Three.js build and Jeep fully intact. */
const THREE = { Group:ee, Mesh:ie, BoxGeometry:Oe, CylinderGeometry:en,
  SphereGeometry:An, IcosahedronGeometry:cs, MeshStandardMaterial:be,
  InstancedMesh:kn, Object3D:Me, Vector3:L, Color:Wt, PlaneGeometry:Ge };
const scene=bn, world=Je, car=zt, explorer=Xt, renderer=Ae;
const materials={};
function material(color){return materials[color] ||= new THREE.MeshStandardMaterial({color,roughness:.93});}
function mesh(geometry,color,x,y,z,parent=world.root){
  const m=new THREE.Mesh(geometry,material(color));m.position.set(x,y,z);
  m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
function box(w,h,d,color,x,y,z,parent){return mesh(new THREE.BoxGeometry(w,h,d),color,x,y,z,parent);}
let seed=4801;
function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function instances(geometry,color,items){
  const m=new THREE.InstancedMesh(geometry,material(color),items.length),dummy=new THREE.Object3D();
  items.forEach((v,i)=>{dummy.position.set(...v.p);dummy.scale.set(...v.s);dummy.rotation.set(0,v.r||0,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);});
  m.castShadow=true;m.receiveShadow=true;world.root.add(m);return m;
}

// Tall pines frame the existing drivable loop. Keep every road and camp clear.
const trunks=[],needles=[[],[],[]];
for(let i=0;i<230;i++){
  const a=random()*Math.PI*2,r=22+random()*63,x=Math.sin(a)*r,z=Math.cos(a)*r;
  if(world.roadDistance(x,z)<5.8 || lakeDistance(x,z)<13 || lookoutClearing(x,z))continue;
  const y=world.height(x,z),h=4+random()*5;
  trunks.push({p:[x,y+h*.42,z],s:[.16,h*.84,.16]});
  for(let j=0;j<3;j++)needles[j].push({p:[x,y+h*(.43+j*.2),z],s:[h*(.27-j*.046),h*.52,h*(.27-j*.046)],r:random()*6});
  world.colliders.push({x,z,r:.28,y,height:h});
}
instances(new THREE.CylinderGeometry(.7,1,1,7),'#594c38',trunks);
needles.forEach((v,j)=>instances(new THREE.CylinderGeometry(0,1,1,9),['#294c42','#365c49','#527452'][j],v));
const flowers=[[],[]];
for(let i=0;i<700;i++){
  const x=(random()-.5)*135,z=(random()-.5)*135;
  if(lookoutClearing(x,z)||world.roadDistance(x,z)<3.5||Math.hypot(x,z)<12||lakeDistance(x,z)<12.6)continue;
  const s=.055+random()*.065;
  flowers[i%2].push({p:[x,world.height(x,z)+.18,z],s:[s,s*.7,s]});
}
flowers.forEach((items,i)=>{const f=instances(new THREE.IcosahedronGeometry(1,0),i?'#e8d295':'#d3b3ba',items);f.castShadow=false;});

// Distant angular mountain silhouettes with pale summits.
for(let i=0;i<22;i++){
  const a=i/22*Math.PI*2,r=155+random()*45,h=28+random()*35;
  const x=Math.cos(a)*r,z=Math.sin(a)*r,y=world.height(x,z);
  mesh(new THREE.CylinderGeometry(0,24+random()*13,h,6),'#748779',x,y+h*.3,z).rotation.y=random()*6;
  mesh(new THREE.CylinderGeometry(0,7,h*.25,6),'#dbddd0',x,y+h*.8,z);
}

// Water extends under the bank; terrain hides the boundary of the flat surface.
const waterLevel=-.25,waterTime={value:0};
const waterGeometry=new THREE.PlaneGeometry(30,26);waterGeometry.rotateX(-Math.PI/2);
const lake=mesh(waterGeometry,'#3d7476',-22,waterLevel,5);
lake.name='Mirror spring — terrain-clipped water';lake.castShadow=false;
lake.material=new THREE.MeshStandardMaterial({color:'#ffffff',metalness:.18,roughness:.27});
lake.material.onBeforeCompile=shader=>{
  shader.uniforms.uWaterTime=waterTime;
  shader.vertexShader='varying vec3 vLakeWorld;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLakeWorld=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader='uniform float uWaterTime;varying vec3 vLakeWorld;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec2 shoreP=vec2(vLakeWorld.x+22.,(vLakeWorld.z-5.)/.8);
    float shoreA=atan(shoreP.y,shoreP.x);
    float shoreD=length(shoreP)/(1.+.09*sin(3.*shoreA)+.055*cos(5.*shoreA));
    if(shoreD>12.0) discard;
    float shallows=smoothstep(8.6,10.35,shoreD);
    float lightRipple=sin(vLakeWorld.x*2.1+vLakeWorld.z*1.3+uWaterTime*.7)*sin(vLakeWorld.z*2.8-vLakeWorld.x*.4-uWaterTime*.5);
    diffuseColor.rgb=mix(vec3(.035,.16,.18),vec3(.22,.31,.23),shallows)+lightRipple*.013;
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    normal=normalize(normal+vec3(.045*sin(vLakeWorld.x*2.1+vLakeWorld.z*1.3+uWaterTime*.7),.03*cos(vLakeWorld.z*2.8-uWaterTime*.5),0.));
  `);
};
// The spring is traversable: normal terrain collision follows its sloped lakebed.
const bankStones=[],reedStems=[];
for(let i=0;i<100;i++){
  const a=random()*Math.PI*2,d=10.7+random()*1.8,k=1+.09*Math.sin(3*a)+.055*Math.cos(5*a);
  const x=-22+Math.cos(a)*d*k,z=5+Math.sin(a)*d*k*.8,y=world.height(x,z);
  if(x>-10.6&&z>0&&z<10)continue;
  if(i%3===0){const s=.10+random()*.20;bankStones.push({p:[x,y+s*.2,z],s:[s*1.6,s*.6,s],r:random()*6});}
  else if(x<-13){for(let j=0;j<3;j++){const h=.28+random()*.48;reedStems.push({p:[x+j*.045,y+h*.5,z+j*.025],s:[.012,h,.012],r:0});}}
}
instances(new THREE.IcosahedronGeometry(1,1),'#827f69',bankStones);
instances(new THREE.CylinderGeometry(.6,1,1,4),'#758054',reedStems);
// Level boardwalk supported by short posts; foot height matches the planks.
let deckHeight=-Infinity;
for(let i=0;i<18;i++)deckHeight=Math.max(deckHeight,world.height(-8.8,1+i*.45)+.12);
for(let i=0;i<18;i++){
  const z=1+i*.45;box(1.2,.12,.42,'#aa9168',-8.8,deckHeight,z);
  if(i%4===0)for(const x of [-9.28,-8.32]){const floor=world.height(x,z),h=Math.max(.08,deckHeight-floor);box(.12,h,.12,'#62543e',x,floor+h/2,z);}
}
const terrainHeight=world.height;
world.height=(x,z)=>Math.abs(x+8.8)<.6&&z>.79&&z<8.86?Math.max(terrainHeight(x,z),deckHeight+.06):terrainHeight(x,z);

// Lookout platform and ranger flag beside the north-east trail.
const tx=18,tz=35,ty=world.height(tx,tz);
// Geometry and layered pedestrian collisions are built in lookout.js.

// Base-camp fire ring, logs, and warm flickering light.
const fireX=-4,fireZ=-4,fireY=world.height(fireX,fireZ);
for(let i=0;i<11;i++){const a=i/11*Math.PI*2;mesh(new THREE.IcosahedronGeometry(.2,0),'#8e8a74',fireX+Math.cos(a)*.65,fireY+.1,fireZ+Math.sin(a)*.65);}
for(let i=0;i<3;i++){let log=mesh(new THREE.CylinderGeometry(.12,.12,1,8),'#514232',fireX,fireY+.17,fireZ);log.rotation.z=Math.PI/2;log.rotation.y=i*1.1;}
const flame=mesh(new THREE.CylinderGeometry(0,.22,.7,7),'#ffb74c',fireX,fireY+.45,fireZ);
flame.material=new be({color:'#ffc467',emissive:'#ff7225',emissiveIntensity:2,roughness:1});flame.castShadow=false;
box(1.8,.35,.45,'#776346',-4,fireY+.17,-6);

// Character appearance and blended animation are managed by human-runtime.js.

// Discovery journal gives the open world three destinations without a forced route.
const places=[{name:'Mirror spring',x:-11,z:5,r:5},{name:'Ranger lookout',x:tx,z:tz,r:7},{name:'South pass',x:0,z:-33,r:6}];
const visited=new Set();
const journal=document.createElement('section');journal.className='journal glass';
journal.innerHTML='<div class="eyebrow">FIELD NOTES / 01</div><strong>The valley is yours.</strong><p>Find the spring, lookout & south pass.</p><div id="discoveries">0 / 3 places discovered</div>';
document.body.append(journal);
const lightButton=document.createElement('button');lightButton.textContent='Golden hour  L';document.querySelector('.toolbar').append(lightButton);
let golden=false;
function toggleLight(){golden=!golden;Sn.color.set(golden?'#ffbc78':'#ffe5b6');Sn.intensity=golden?2.7:3;bn.fog.color.set(golden?'#b8aa8c':'#b2bb9f');renderer.toneMappingExposure=golden?1.08:1.05;lightButton.textContent=golden?'Daylight  L':'Golden hour  L';}
lightButton.onclick=toggleLight;addEventListener('keydown',e=>{if(e.code==='KeyL'&&!e.repeat)toggleLight();});
let jumpHeight=0,jumpVelocity=0;
// Jumping and vehicle transitions are implemented in motion.js.
const uiOriginal=pc;pc=function(){uiOriginal();if(Te==='walking')oe('controlText').innerHTML='<kbd>W A S D</kbd> Walk <span>·</span> <kbd>Shift</kbd> Run <span>·</span> <kbd>Space</kbd> Jump<br><kbd>Drag</kbd> Look <span>·</span> <kbd>Scroll</kbd> Zoom <span>·</span> <kbd>E</kbd> Enter car';};
const mapOriginal=o_;o_=function(){mapOriginal();const c=oe('map').getContext('2d');places.forEach(p=>{c.fillStyle=visited.has(p.name)?'#c7dba2':'#edac69';c.beginPath();c.arc(120+p.x*2.03,120-p.z*2.03,3.5,0,Math.PI*2);c.fill();});};
const stepOriginal=Fu;Fu=function(dt){
  stepOriginal(dt);flame.scale.set(1+Math.sin(Fa*13)*.15,1+Math.sin(Fa*19)*.2,1);
  flag.rotation.y=Math.sin(Fa*2)*.12;
  waterTime.value=Fa;
  const p=Te==='walking'?explorer.root.position:car.root.position;
  places.forEach(place=>{if(!visited.has(place.name)&&Math.hypot(p.x-place.x,p.z-place.z)<place.r){visited.add(place.name);hi('Discovered: '+place.name);document.getElementById('discoveries').textContent=visited.size+' / 3 places discovered'+(visited.size===3?' · Valley explored!':'');}});
};
const stateOriginal=window.expedition.getState;
window.expedition.getState=()=>({...stateOriginal(),discovered:[...visited],jumpHeight,goldenHour:golden});
window.expedition.reset=Oa;
window.expedition.advance=function(seconds){for(let t=0;t<seconds;t+=1/60)Fu(1/60);pc();Na();};
document.title='Expedition · Wildhaven Valley';
document.querySelector('h1').innerHTML='Expedition<span>Wildhaven Valley</span>';
document.querySelector('.map span').textContent='WILDHAVEN / TRAIL NETWORK';
