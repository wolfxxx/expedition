// Base camp, rebuilt: a living campfire (smooth stone ring, charred logs, glowing embers, animated flames, sparks, smoke and
// a flickering warm light), split-log benches, a proper A-frame tent, plank crates, a woodpile and a chopping block.
// Bark, end grain, planks and canvas are drawn into small textures in code. The old blocky pieces are hidden; collision
// circles that were there stay, and the new benches and woodpile get their own.
const CAMP={fire:new L(fireX,fireY,fireZ),tent:new L(-7,world.height(-7,-7),-7),light:{color:'#ff9a4a',intensity:1.6,distance:9}};
let campSeed=90211;const campRand=()=>{campSeed=(Math.imul(campSeed,1664525)+1013904223)>>>0;return campSeed/4294967296;};
const campRange=(a,b)=>a+campRand()*(b-a);
const campHash=(x,y,z)=>{const s=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return s-Math.floor(s);};

// ---- textures drawn in code ---------------------------------------------------------------------------------------------
function campTexture(w,h,draw,repeat=[1,1]){
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new xn(c);t.colorSpace=xe;t.wrapS=t.wrapT=1000;t.repeat.set(...repeat);t.anisotropy=4;return t;
}
const barkTexture=campTexture(256,256,(g,w,h)=>{
 g.fillStyle='#5b4632';g.fillRect(0,0,w,h);
 for(let i=0;i<1400;i++){const x=campRand()*w,y=campRand()*h,l=8+campRand()*50;g.strokeStyle=campRand()<.55?'rgba(40,28,18,.55)':'rgba(130,104,74,.35)';g.lineWidth=1+campRand()*2.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+campRange(-2,2),y+l);g.stroke();}
 for(let i=0;i<40;i++){const x=campRand()*w,y=campRand()*h;g.strokeStyle='rgba(30,20,12,.6)';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+campRange(6,20),y+campRange(-2,2));g.stroke();}
},[2,1]);
const endTexture=campTexture(128,128,(g,w,h)=>{
 g.fillStyle='#c4a272';g.fillRect(0,0,w,h);
 for(let r=4;r<60;r+=3+campRand()*3){g.strokeStyle=`rgba(140,100,60,${.25+campRand()*.35})`;g.lineWidth=1+campRand();g.beginPath();g.arc(64+campRange(-1,1),64+campRange(-1,1),r,0,7);g.stroke();}
 g.strokeStyle='#4a3626';g.lineWidth=7;g.beginPath();g.arc(64,64,60,0,7);g.stroke();
 g.strokeStyle='rgba(60,40,24,.5)';g.lineWidth=1.5;for(let i=0;i<4;i++){const a=campRand()*6.28;g.beginPath();g.moveTo(64,64);g.lineTo(64+Math.cos(a)*58,64+Math.sin(a)*58);g.stroke();}
});
const plankTexture=campTexture(256,256,(g,w,h)=>{
 const rows=4,rh=h/rows;
 for(let r=0;r<rows;r++){
  const base=[150+campRange(-14,14),118+campRange(-12,12),78+campRange(-10,10)];g.fillStyle=`rgb(${base})`;g.fillRect(0,r*rh,w,rh);
  for(let i=0;i<26;i++){const y=r*rh+campRand()*rh;g.strokeStyle=`rgba(90,62,36,${.15+campRand()*.25})`;g.lineWidth=1;g.beginPath();g.moveTo(0,y);for(let x=0;x<=w;x+=16)g.lineTo(x,y+Math.sin(x*.05+i)*2.5);g.stroke();}
  if(campRand()<.7){const kx=campRand()*w,ky=r*rh+rh*campRange(.3,.7);g.fillStyle='rgba(80,52,30,.7)';g.beginPath();g.ellipse(kx,ky,7,4,0,0,7);g.fill();}
  g.fillStyle='#3c2a1a';g.fillRect(0,r*rh,w,2.5);
 }
});
const fabricTexture=campTexture(256,256,(g,w,h)=>{
 g.fillStyle='#cdbf96';g.fillRect(0,0,w,h);
 const img=g.getImageData(0,0,w,h),d=img.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,weave=((x%4<2)!==(y%4<2))?6:-6,n=(campRand()-.5)*14;d[i]+=weave+n;d[i+1]+=weave+n;d[i+2]+=weave*.8+n;}
 g.putImageData(img,0,0);
 for(let i=0;i<10;i++){const x=campRand()*w,y=h*campRange(.55,1),r=campRange(15,45),grad=g.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,'rgba(110,92,60,.22)');grad.addColorStop(1,'rgba(110,92,60,0)');g.fillStyle=grad;g.fillRect(x-r,y-r,2*r,2*r);}
 g.strokeStyle='rgba(120,104,72,.5)';g.lineWidth=2;for(const x of [w*.33,w*.66]){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
},[2,1]);
const softTexture=campTexture(64,64,(g,w,h)=>{const grad=g.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.4,'rgba(255,255,255,.5)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,w,h);});
const scorchTexture=campTexture(128,128,(g,w,h)=>{
 const grad=g.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(22,18,14,.95)');grad.addColorStop(.45,'rgba(40,32,24,.75)');grad.addColorStop(.8,'rgba(70,58,40,.25)');grad.addColorStop(1,'rgba(70,58,40,0)');g.fillStyle=grad;g.fillRect(0,0,w,h);
 for(let i=0;i<260;i++){const a=campRand()*6.28,r=Math.sqrt(campRand())*40;g.fillStyle=campRand()<.5?'rgba(190,185,175,.45)':'rgba(10,8,6,.5)';g.fillRect(64+Math.cos(a)*r,64+Math.sin(a)*r,1.5,1.5);}
});
const barkMaterial=new be({map:barkTexture,roughness:.95,vertexColors:true});
const endMaterial=new be({map:endTexture,roughness:.9,vertexColors:true});
const plankMaterial=new be({map:plankTexture,roughness:.88});
const fabricMaterial=new be({map:fabricTexture,roughness:.97,side:Be,vertexColors:true});
const darkWood=new be({color:'#4a3725',roughness:.9});

// ---- geometry helpers -------------------------------------------------------------------------------------------------------
const campGeometry=()=>Object.getPrototypeOf(Oe.prototype).constructor; // BufferGeometry
const CampAttr=new Oe(1,1,1).getAttribute('position').constructor;      // Float32BufferAttribute
// weld duplicate vertices of a non-indexed geometry, so displaced shapes shade smoothly
function campWeld(geometry){
 const pos=geometry.getAttribute('position'),map=new Map(),out=[],index=[];
 for(let i=0;i<pos.count;i++){const k=pos.getX(i).toFixed(4)+','+pos.getY(i).toFixed(4)+','+pos.getZ(i).toFixed(4);let j=map.get(k);if(j===undefined){j=out.length/3;map.set(k,j);out.push(pos.getX(i),pos.getY(i),pos.getZ(i));}index.push(j);}
 const g=new (campGeometry())();g.setAttribute('position',new CampAttr(out,3));g.setIndex(index);return g;
}
// a rounded, irregular stone: a subdivided sphere pushed in and out by smooth noise, flattened, greys and browns
function campStone(size,flat,tint){
 const g=campWeld(new cs(1,3)),p=g.getAttribute('position'),colors=[],s1=campRand()*50,c=new Wt();
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=.78+.22*Math.sin(x*2.3+s1)*Math.cos(z*2.1-s1)+.1*Math.sin(y*5.1+x*3.7+s1);
  p.setXYZ(i,x*n*size,Math.max(-.3,y)*n*size*flat,z*n*size);
  c.set(tint).multiplyScalar(.78+.3*campHash(x,y,z)+.12*y);colors.push(c.r,c.g,c.b);
 }
 g.setAttribute('color',new CampAttr(colors,3));g.computeVertexNormals();return g;
}
// a log: a bark-textured cylinder with an uneven surface and end-grain caps; char darkens it towards `charEnd` (+1 top, -1 bottom)
function campLog(radius,length,charEnd=0,charAmount=0){
 const g=new en(radius,radius*campRange(.9,1.05),length,14,5),p=g.getAttribute('position'),colors=[],c=new Wt(),s1=campRand()*30;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),r=Math.hypot(x,z);
  if(r>radius*.5){const bump=1+.06*Math.sin(a*5+s1)+.04*Math.sin(y*9+a*3);p.setX(i,x*bump);p.setZ(i,z*bump);}
  const along=y/length+.5,charred=charEnd?Math.pow(Math.max(0,charEnd>0?along:1-along),2.2)*charAmount:0;
  c.setRGB(1,1,1).lerp(new Wt('#1a1410'),Math.min(.92,charred));colors.push(c.r,c.g,c.b);
 }
 g.setAttribute('color',new CampAttr(colors,3));g.computeVertexNormals();
 const m=new ie(g,[barkMaterial,endMaterial,endMaterial]);m.castShadow=m.receiveShadow=true;return m;
}
function campAdd(object,x,y,z,parent=world.root){object.position.set(x,y,z);parent.add(object);return object;}
const campBox=(w,h,d,material)=>{const m=new ie(new Oe(w,h,d),material);m.castShadow=m.receiveShadow=true;return m;};
const campRod=(from,to,radius,material,sides=6)=>{const a=new L(...from),b=new L(...to),d=b.clone().sub(a),m=new ie(new en(radius,radius,d.length(),sides),material);
 m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new L(0,1,0),d.normalize());m.castShadow=true;return m;};

// ---- hide the old pieces -----------------------------------------------------------------------------------------------------
{
 const near=(o,x,z,r)=>{const p=o.getWorldPosition(new L());return Math.hypot(p.x-x,p.z-z)<r;};
 world.root.updateMatrixWorld(true);const hide=[];
 world.root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh)return;const hex=o.material.color?.getHexString();
  if(near(o,fireX,fireZ,1.1)&&(['8e8a74','514232'].includes(hex)||o===flame))hide.push(o);           // fire stones, logs, flame
  else if(hex==='776346'&&near(o,-4,-6,.6))hide.push(o);                                             // the box bench
  else if(hex==='ada077'&&near(o,-7,-7,.5))hide.push(o.parent);                                     // the tent and its poles and pegs
  else if(o.geometry.type==='BoxGeometry'&&['655438','383f36'].includes(hex)&&o.position.y<.5&&near(o,7.3,-7,1.1))hide.push(o); // crates
 });
 for(const o of hide)o.visible=false;
}

// ---- the fire ---------------------------------------------------------------------------------------------------------------
const campFire=new ee();campFire.name='Campfire';campAdd(campFire,fireX,fireY,fireZ);campFire.updateMatrixWorld(true);
{
 // scorched ground and ash
 const scorch=new ie(new Ge(2.2,2.2),new Xs({map:scorchTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
 scorch.rotation.x=-Math.PI/2;scorch.position.y=.03;scorch.receiveShadow=true;campFire.add(scorch);
 // a ring of smooth stones, a few half-buried
 for(let i=0;i<14;i++){
  const a=i/14*6.283+campRange(-.08,.08),r=.62+campRange(-.04,.05),size=campRange(.13,.2);
  const s=new ie(campStone(size,campRange(.55,.75),campRand()<.3?'#6e6658':'#74736d'),new be({vertexColors:true,roughness:.92}));
  s.position.set(Math.cos(a)*r,size*.25,Math.sin(a)*r);s.rotation.set(campRange(-.3,.3),campRand()*6,campRange(-.3,.3));s.castShadow=s.receiveShadow=true;campFire.add(s);
 }
 // logs in a teepee, charred where they meet, and two burning across the bottom
 for(let i=0;i<5;i++){
  const a=i/5*6.283+.3,log=campLog(.055,.78,1,.95);{const c=log.geometry.getAttribute('color');for(let k=0;k<c.count;k++)c.setXYZ(k,c.getX(k)*.6,c.getY(k)*.55,c.getZ(k)*.5);}
  log.position.set(Math.cos(a)*.2,.27,Math.sin(a)*.2);log.lookAt(new L(0,.62,0).add(campFire.position));log.rotateX(Math.PI/2);
  campFire.add(log);log.updateMatrix();
 }
 for(const [a,len] of [[.4,.7],[2.1,.62]]){const log=campLog(.06,len,-1,0);log.geometry.translate(0,0,0);log.rotation.set(0,a,Math.PI/2);log.position.set(0,.07,0);
  const g=log.geometry.getAttribute('color');for(let i=0;i<g.count;i++){const k=.35+.3*campHash(i,1,2);g.setXYZ(i,g.getX(i)*k,g.getY(i)*k,g.getZ(i)*k);}campFire.add(log);}
}
// glowing ember bed: charcoal with cracks of light that breathe
const emberMaterial=new tn({uniforms:{uTime:landWind},vertexShader:'varying vec2 vP;void main(){vP=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uTime;varying vec2 vP;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 void main(){float r=length(vP)/.42;if(r>1.)discard;float c=n(vP*18.)*.6+n(vP*41.)*.4,pulse=.65+.35*sin(uTime*3.1+c*9.);
  float glow=smoothstep(.55,.85,c)*pulse*(1.-r*.7);vec3 col=mix(vec3(.05,.04,.035),vec3(1.,.38,.06),glow)+vec3(1.,.75,.3)*pow(glow,3.)*.8;
  gl_FragColor=vec4(col,smoothstep(1.,.85,r));}`,transparent:true});
{const g=new Ge(.84,.84);g.rotateX(-Math.PI/2);const embers=new ie(g,emberMaterial);embers.position.y=.05;embers.renderOrder=1;campFire.add(embers);}
// flames: camera-facing sheets of scrolling noise, white-yellow at the root to orange and deep red at the tips
// (normal blending, not additive: additive flames vanish against a bright daytime scene; the glow behind them is additive)
const flameMaterial=seed=>new tn({uniforms:{uTime:landWind,uSeed:{value:seed}},transparent:true,depthWrite:false,side:Be,
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:`uniform float uTime,uSeed;varying vec2 vUv;
 float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p=p*2.07+vec2(1.7,9.2);a*=.5;}return s;}
 void main(){float y=vUv.y,x=(vUv.x-.5)*2.;float q=fbm(vec2(vUv.x*2.6+uSeed,y*2.2-uTime*2.4));
  float sway=(q-.5)*.55*y+sin(uTime*2.+uSeed)*.08*y;float width=(1.-y)*(.55+.5*q)+.04;
  float body=smoothstep(width,width*.45,abs(x+sway))*smoothstep(1.,.2,y+q*.45)*smoothstep(0.,.1,y);
  vec3 col=mix(vec3(1.,.93,.66),vec3(1.,.5,.1),smoothstep(.08,.5,y+q*.25));col=mix(col,vec3(.75,.16,.03),smoothstep(.45,.9,y+q*.35));
  gl_FragColor=vec4(col*1.25,clamp(body*1.6,0.,.95));}`});
const campFlames=[];
for(const [w,h,x,z,seed] of [[.95,1.45,0,0,1.3],[.7,1.1,.1,.06,4.7],[.62,.95,-.12,-.04,8.1],[.5,.75,.04,-.13,2.9]]){
 const g=new Ge(w,h);g.translate(0,h/2,0);const f=new ie(g,flameMaterial(seed));f.position.set(x,.08,z);f.renderOrder=3;campFire.add(f);campFlames.push(f);
}
const campGlow=new ie(new Ge(2.6,2.6),new Xs({map:softTexture,color:'#ff8a3a',transparent:true,opacity:.35,depthWrite:false,blending:2}));
campGlow.position.y=.55;campGlow.renderOrder=2;campFire.add(campGlow);
const campLight=new fr(CAMP.light.color,CAMP.light.intensity,CAMP.light.distance,1.6);campLight.position.set(0,.65,0);campFire.add(campLight);
// sparks and smoke
const sparkCount=36,sparks=new kn(new cs(1,0),new Xs({color:'#ff9030',transparent:true,depthWrite:false,blending:2}),sparkCount);
sparks.frustumCulled=false;campFire.add(sparks);
const sparkState=Array.from({length:sparkCount},()=>({life:campRand()*2,max:1,p:new L(),v:new L(),s:0}));
const smokeMaterialBase=new Xs({map:softTexture,color:'#9a958c',transparent:true,depthWrite:false,opacity:0});
const smoke=Array.from({length:7},(_,i)=>{const m=new ie(new Ge(1,1),smokeMaterialBase.clone());m.renderOrder=4;campFire.add(m);return {m,age:i/7*4.2,life:4.2,drift:new L()};});
const campDummy=new Me();
function campStep(dt){
 const t=landWind.value,cam=Ze.position;
 // flames and glow turn to face the camera; the light flickers with the flames
 for(const f of [...campFlames,campGlow]){const w=f.getWorldPosition(new L());f.rotation.set(0,Math.atan2(cam.x-w.x,cam.z-w.z),0);}
 const flicker=.82+.1*Math.sin(t*13.1)+.06*Math.sin(t*23.7+1.3)+.05*Math.sin(t*5.3);
 campLight.intensity=CAMP.light.intensity*flicker;campGlow.material.opacity=.28+.1*flicker;
 campFlames.forEach((f,i)=>{f.scale.set(1,.9+.12*Math.sin(t*(7+i)+i*2),1);});
 for(let i=0;i<sparkCount;i++){
  const s=sparkState[i];s.life+=dt;
  if(s.life>=s.max){s.life=0;s.max=campRange(.5,1.3);s.p.set(campRange(-.15,.15),.35,campRange(-.15,.15));s.v.set(campRange(-.2,.2),campRange(.9,1.7),campRange(-.2,.2));s.s=campRange(.006,.011);}
  s.v.x+=Math.sin(t*3+i)*.6*dt;s.v.z+=Math.cos(t*2.6+i*1.7)*.6*dt;s.v.y*=1-.5*dt;s.p.addScaledVector(s.v,dt);
  const k=1-s.life/s.max;campDummy.position.copy(s.p);campDummy.scale.setScalar(s.s*(.4+k));campDummy.updateMatrix();sparks.setMatrixAt(i,campDummy.matrix);
 }
 sparks.instanceMatrix.needsUpdate=true;
 for(const p of smoke){
  p.age+=dt;if(p.age>p.life){p.age-=p.life;p.drift.set(campRange(-.15,.15),0,campRange(-.15,.15));}
  const u=p.age/p.life,w=p.m.getWorldPosition(new L());
  p.m.position.set(p.drift.x+.35*u*Math.sin(t*.3),.9+u*2.6,p.drift.z+.25*u);p.m.scale.setScalar(.35+u*1.6);
  p.m.rotation.set(0,Math.atan2(cam.x-w.x,cam.z-w.z),u*2);p.m.material.opacity=.22*Math.sin(Math.PI*u)*(1-u*.3);
 }
}

// ---- benches: split logs on stumps round the fire ------------------------------------------------------------------------------
function campBench(x,z,yaw){
 const bench=new ee(),y=world.height(x,z),len=1.7;
 const log=campLog(.2,len);log.rotation.z=Math.PI/2;log.position.y=.33;log.scale.set(1,1,.62);bench.add(log); // squashed: a split half-log
 const seat=campBox(.24,.025,len*.98,plankMaterial);seat.rotation.y=Math.PI/2;seat.position.y=.45;bench.add(seat);
 for(const s of [-.6,.6]){const stump=campLog(.13,.24);stump.position.set(s,.12,0);bench.add(stump);}
 bench.position.set(x,y,z);bench.rotation.y=yaw;world.root.add(bench);
 for(const s of [-.55,.55])world.colliders.push({x:x+Math.cos(yaw)*s,z:z-Math.sin(yaw)*s,r:.28,y,height:.5,solid:true});
 return bench;
}
campBench(fireX,fireZ-1.95,0);campBench(fireX+1.75,fireZ+.95,-1.05);campBench(fireX-1.8,fireZ+.85,1.1);

// ---- the tent: an A-frame of sagging canvas, door tied back, poles, guy ropes and pegs ------------------------------------------
const campTent=new ee();campTent.name='Tent';campAdd(campTent,CAMP.tent.x,CAMP.tent.y,CAMP.tent.z);
{
 const H=1.85,W=1.55,D=1.45,col=new Wt(),panel=side=>{
  const positions=[],uvs=[],colors=[],index=[],nu=12,nv=7;
  for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
   const u=i/nu,v=j/nv,z=-D+2*D*u,sag=.07*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)+.012*Math.sin(u*31+v*7)*v;
   const x=side*(W*v),y=H*(1-v)+.02,nx=side*H,ny=W,len=Math.hypot(nx,ny);       // outward normal of the panel
   positions.push(x-sag*nx/len,y-sag*ny/len,z);uvs.push(u*2,v);
   col.setRGB(1,1,1).multiplyScalar(.82+.18*(1-v)).lerp(new Wt('#8f7f5a'),Math.max(0,v-.8)*2.2);colors.push(col.r,col.g,col.b);
  }
  for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+nu+1;index.push(a,b,a+1,b,b+1,a+1);}
  const g=new (campGeometry())();g.setAttribute('position',new CampAttr(positions,3));g.setAttribute('uv',new CampAttr(uvs,2));g.setAttribute('color',new CampAttr(colors,3));g.setIndex(index);g.computeVertexNormals();
  const m=new ie(g,fabricMaterial);m.castShadow=m.receiveShadow=true;campTent.add(m);
 };
 panel(1);panel(-1);
 const tri=(pts,material)=>{const g=new (campGeometry())();g.setAttribute('position',new CampAttr(pts.flat(),3));g.setAttribute('uv',new CampAttr(pts.map(p=>[p[0]/W*.5+.5,1-p[1]/H]).flat(),2));
  g.setAttribute('color',new CampAttr(pts.map(()=>[.86,.84,.8]).flat(),3));g.computeVertexNormals();const m=new ie(g,material);m.castShadow=m.receiveShadow=true;campTent.add(m);return m;};
 tri([[-W,.02,-D],[0,H+.02,-D],[W,.02,-D]],fabricMaterial);                                         // closed back
 tri([[-W,.02,D],[0,H+.02,D],[-.05,.02,D+.05]],fabricMaterial);                                       // left door flap, closed
 const roll=new ie(new en(.075,.075,1.75,12),new be({map:fabricTexture,roughness:.97}));roll.position.set(W*.5+.03,H*.5,D+.03);roll.rotation.z=Math.atan2(W,H);roll.castShadow=true;campTent.add(roll); // right flap rolled and tied back
 const floor=campBox(W*1.9,.012,D*2,new be({color:'#3f4a3a',roughness:.95}));floor.position.y=.01;campTent.add(floor);
 const bedroll=campLog(.13,.9);bedroll.rotation.x=Math.PI/2;bedroll.material=[new be({color:'#6b3a2c',roughness:.9}),new be({color:'#7d4a38',roughness:.9}),new be({color:'#7d4a38',roughness:.9})];bedroll.position.set(-.45,.13,.3);campTent.add(bedroll);
 const pack=campBox(.38,.5,.26,new be({color:'#4f5a3c',roughness:.85}));pack.position.set(.55,.26,.55);pack.rotation.y=.3;campTent.add(pack);
 const flap=campBox(.36,.14,.27,new be({color:'#5a6644',roughness:.85}));flap.position.set(.55,.5,.56);flap.rotation.y=.3;campTent.add(flap);
 const wood=new be({color:'#6d5236',roughness:.85}),rope=new be({color:'#d6ccad',roughness:.9});
 for(const s of [-1,1]){
  campTent.add(campRod([0,0,s*(D+.04)],[0,H+.16,s*(D+.04)],.025,wood,7));
  campTent.add(campRod([0,H+.12,s*(D+.04)],[0,0,s*(D+1.05)],.006,rope));
  const peg=campRod([0,.12,s*(D+1.05)],[0,-.05,s*(D+1.1)],.016,darkWood,4);campTent.add(peg);
  for(const z of [-D*.95,D*.95]){campTent.add(campRod([s*W,.04,z],[s*(W+.32),.0,z],.005,rope));campTent.add(campRod([s*(W+.32),.08,z],[s*(W+.34),-.04,z],.014,darkWood,4));}
 }
 campTent.add(campRod([0,H+.03,-D],[0,H+.03,D],.03,wood,7));                                          // ridge pole
}

// ---- crates, a woodpile and a chopping block ---------------------------------------------------------------------------------
function campCrate(x,z,size,yaw,stackOn=0){
 const c=new ee(),edge=new be({color:'#6a4c30',roughness:.9}),body=campBox(size,size,size,plankMaterial);c.add(body);
 const e=size*.09,h=size/2-e/2;
 for(const [a,b] of [[1,1],[1,-1],[-1,1],[-1,-1]]){
  const at=(m,x,y,z)=>{m.position.set(x,y,z);c.add(m);};
  at(campBox(e,size+.004,e,edge),a*h,0,b*h);at(campBox(size+.004,e,e,edge),0,a*h,b*h);at(campBox(e,e,size+.004,edge),a*h,b*h,0);
 }
 for(const s of [-1,1]){const brace=campBox(size*1.25,e*.8,e*.6,edge);brace.rotation.z=.78*s;brace.position.z=s*(size/2+.004);c.add(brace);}
 const y=world.height(x,z)+size/2+stackOn;c.position.set(x,y,z);c.rotation.y=yaw;c.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});world.root.add(c);return c;
}
campCrate(6.9,-6.6,.62,.1);campCrate(7.7,-6.65,.58,-.15);campCrate(6.95,-7.42,.6,.25);campCrate(6.92,-6.6,.5,-.3,.62);
{
 const pile=new ee(),x=-5.3,z=-8.9,y=world.height(x,z);
 const rows=[[0,4],[1,3],[2,2],[3,1]];
 for(const [row,count] of rows)for(let i=0;i<count;i++){const log=campLog(.075,.62);log.rotation.x=Math.PI/2;log.position.set((i-(count-1)/2)*.155,.075+row*.13,campRange(-.04,.04));pile.add(log);}
 pile.position.set(x,y,z);pile.rotation.y=.35;world.root.add(pile);
 world.colliders.push({x,z,r:.45,y,height:.6,solid:true});
 const bx=-2.2,bz=-7.1,by=world.height(bx,bz),block=campLog(.22,.42);block.position.set(bx,by+.21,bz);world.root.add(block);
 const handle=campRod([bx+.05,by+.42,bz],[bx+.42,by+.78,bz+.12],.018,new be({color:'#8a6a44',roughness:.8}),6);world.root.add(handle);
 const head=campBox(.16,.03,.07,new be({color:'#5b636a',roughness:.4,metalness:.7}));head.position.set(bx+.04,by+.43,bz);head.rotation.set(0,0,.8);world.root.add(head);
 world.colliders.push({x:bx,z:bz,r:.26,y:by,height:.45,solid:true});
 for(let i=0;i<5;i++){const chip=campBox(campRange(.04,.08),.012,campRange(.02,.04),plankMaterial);chip.position.set(bx+campRange(-.5,.5),by+.01,bz+campRange(-.5,.5));chip.rotation.y=campRand()*3;world.root.add(chip);}
}
if(typeof hideInMirror==='function'){for(const f of campFlames)hideInMirror(f);hideInMirror(campGlow);hideInMirror(sparks);smoke.forEach(p=>hideInMirror(p.m));}


// ---- the lookout flag: a rippling cloth with a ranger badge and a frayed free edge, on a round pole with a finial ------------------
const FLAG={length:1.3,height:.74,wave:.11,speed:5.2};
{
 world.root.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh&&(o===flag||o.material.color?.getHexString()==='5c5141'&&Math.abs(o.position.x-(tx+1.4))<.01&&Math.abs(o.position.z-(tz+1.4))<.01))o.visible=false;});
}
const flagPole=new ee();flagPole.name='Lookout flagpole';campAdd(flagPole,tx+1.4,ty,tz+1.4);
{
 const paint=new be({color:'#dedad0',roughness:.45,metalness:.25});
 const pole=new ie(new en(.032,.048,6.15,14),paint);pole.position.y=3.075;pole.castShadow=true;flagPole.add(pole);
 const ball=new ie(new An(.075,16,12),new be({color:'#d4a640',roughness:.3,metalness:.85}));ball.position.y=6.22;flagPole.add(ball);
 const collar=new ie(new en(.06,.06,.05,14),paint);collar.position.y=6.12;flagPole.add(collar);
 const rope=new be({color:'#e8e2cc',roughness:.9});
 flagPole.add(campRod([.05,6.1,0],[.05,1.25,0],.005,rope));flagPole.add(campRod([.07,6.1,0],[.07,1.3,0],.005,rope));
 const cleat=campBox(.03,.14,.03,new be({color:'#7b7f80',roughness:.4,metalness:.7}));cleat.position.set(.055,1.25,0);flagPole.add(cleat);
 const base=new ie(new en(.12,.14,.12,14),new be({color:'#8c8a82',roughness:.8}));base.position.y=.06;flagPole.add(base);
}
const flagTexture=campTexture(512,290,(g,w,h)=>{
 g.clearRect(0,0,w,h);
 // the cloth, its free edge torn into ragged tails (transparent beyond), a darker hoist band and a ranger badge
 g.beginPath();g.moveTo(0,0);g.lineTo(w*.9,0);
 for(let y=0;y<=h;y+=h/22)g.lineTo(w*(.88+.11*campRand()),y);
 g.lineTo(0,h);g.closePath();g.fillStyle='#d9733a';g.fill();
 g.save();g.clip();
 g.fillStyle='#b9572a';g.fillRect(0,0,w*.08,h);
 for(let i=0;i<9000;i++){g.fillStyle=campRand()<.5?'rgba(255,230,200,.06)':'rgba(90,30,10,.07)';g.fillRect(campRand()*w,campRand()*h,2,2);}
 const cx=w*.47,cy=h*.5,r=h*.33;
 g.fillStyle='#f3e6c4';g.beginPath();g.moveTo(cx,cy-r*1.08);g.quadraticCurveTo(cx+r,cy-r*1.0,cx+r*.92,cy-r*.15);g.quadraticCurveTo(cx+r*.75,cy+r*.75,cx,cy+r*1.12);g.quadraticCurveTo(cx-r*.75,cy+r*.75,cx-r*.92,cy-r*.15);g.quadraticCurveTo(cx-r,cy-r,cx,cy-r*1.08);g.fill();
 const s=.84;g.fillStyle='#2f4f3c';g.beginPath();g.moveTo(cx,cy-r*1.08*s);g.quadraticCurveTo(cx+r*s,cy-r*s,cx+r*.92*s,cy-r*.15*s);g.quadraticCurveTo(cx+r*.75*s,cy+r*.75*s,cx,cy+r*1.12*s);g.quadraticCurveTo(cx-r*.75*s,cy+r*.75*s,cx-r*.92*s,cy-r*.15*s);g.quadraticCurveTo(cx-r*s,cy-r*s,cx,cy-r*1.08*s);g.fill();
 g.fillStyle='#f3e6c4';for(const [y,wd] of [[-.62,.2],[-.32,.34],[0,.48],[.3,.6]]){g.beginPath();g.moveTo(cx,cy+r*(y-.34));g.lineTo(cx+r*wd,cy+r*y);g.lineTo(cx-r*wd,cy+r*y);g.fill();}
 g.fillRect(cx-r*.07,cy+r*.3,r*.14,r*.24);
 g.font='bold '+Math.round(h*.085)+'px sans-serif';g.textAlign='center';g.fillText('RANGER',cx,cy+r*.86);
 g.restore();
});
flagTexture.wrapS=flagTexture.wrapT=1001;
const flagMaterial=new be({map:flagTexture,roughness:.85,side:Be,alphaTest:.5,transparent:false});
flagMaterial.onBeforeCompile=shader=>{
 shader.uniforms.uWind=landWind;
 const wave=`float fk=clamp(position.x/${FLAG.length.toFixed(3)},0.,1.),fa=${FLAG.wave.toFixed(3)}*pow(fk,1.25);
  float fph=position.x*4.1-uWind*${FLAG.speed.toFixed(2)}+position.y*1.3;
  float fz=fa*(sin(fph)+.35*sin(fph*2.3+1.7-uWind*1.9)+.15*sin(position.y*7.+uWind*3.1));
  float fdz=fa*(4.1*cos(fph)+.35*2.3*4.1*cos(fph*2.3+1.7-uWind*1.9))+${FLAG.wave.toFixed(3)}*1.25*pow(max(fk,.001),.25)/${FLAG.length.toFixed(3)}*(sin(fph));
  float fdy=fa*(1.3*cos(fph)+.35*2.3*1.3*cos(fph*2.3+1.7-uWind*1.9)+.15*7.*cos(position.y*7.+uWind*3.1));`;
 shader.vertexShader='uniform float uWind;\n'+shader.vertexShader
  .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>\n{${wave}\n objectNormal=normalize(vec3(-fdz,-fdy,1.));}`)
  .replace('#include <begin_vertex>',`#include <begin_vertex>\n{${wave}\n transformed.z+=fz;transformed.y-=.06*fk*fk;transformed.x-=.04*fk*abs(sin(fph));}`);
};
{
 const g=new Ge(FLAG.length,FLAG.height,32,14);g.translate(FLAG.length/2,0,0);
 const cloth=new ie(g,flagMaterial);cloth.position.set(.06,5.6,0);cloth.name='Lookout flag';flagPole.add(cloth);
 window.expedition.flag={cloth,pole:flagPole,settings:FLAG};
}
const flagFrame=Fu;Fu=function(dt){flagFrame(dt);flagPole.children.find(o=>o.name==='Lookout flag').rotation.y=.35+Math.sin(landWind.value*.21)*.25;};
const campFrame=Fu;Fu=function(dt){campFrame(dt);campStep(dt);};
window.expedition.camp={fire:campFire,tent:campTent,light:campLight,flames:campFlames,settings:CAMP};
