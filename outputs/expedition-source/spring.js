// Mirror Spring: reflective, depth-tinted, rippling water with foam along the bank, plus everything that lives in and
// around it. Replaces the flat teal plane built in valley.js. All procedural, nothing downloaded.
//   1. the water: a planar reflection of the real scene, depth colour and transparency from the true lakebed,
//      animated ripples, foam, caustics and sun glints
//   2. ripples you make: wading, the Jeep, bullets, falling bodies (shared ripple list, see addRipple)
const SPRING={cx:-22,cz:5,x0:-37,z0:-8,w:30,h:26,texel:.125,reflectScale:.5,adaptive:true};
// The mirror renders the scene a second time. If frames stay slow while the lake is in view it steps down to a smaller
// image, then to a plain sky tint, so a weak machine keeps its frame rate.
const springQuality={levels:[.5,.35,.25,0],level:0,ema:16,last:0,slowFor:0,mirror:{value:1}};
function springAdapt(frameMs){
 if(!SPRING.adaptive||frameMs>250)return; // (a long gap means the lake was out of view)
 springQuality.ema+=(frameMs-springQuality.ema)*.1;
 if(springQuality.ema>32)springQuality.slowFor+=frameMs;else springQuality.slowFor=0;
 if(springQuality.slowFor>2500&&springQuality.level<springQuality.levels.length-1){
  springQuality.level++;SPRING.reflectScale=springQuality.levels[springQuality.level];springQuality.mirror.value=SPRING.reflectScale>0?1:0;springQuality.slowFor=0;springQuality.ema=16;
 }
}

// ---- the true lakebed, sampled once from the same height function the terrain uses --------------------------------------
const bedW=Math.round(SPRING.w/SPRING.texel),bedH=Math.round(SPRING.h/SPRING.texel);
const bedDepth=new Float32Array(bedW*bedH),bedAbove=new Float32Array(bedW*bedH);
{
 const canvas=document.createElement('canvas');canvas.width=bedW;canvas.height=bedH;
 const context=canvas.getContext('2d'),image=context.createImageData(bedW,bedH);
 for(let j=0;j<bedH;j++)for(let i=0;i<bedW;i++){
  const x=SPRING.x0+(i+.5)*SPRING.texel,z=SPRING.z0+(j+.5)*SPRING.texel,h=world.height(x,z),k=j*bedW+i;
  const inLake=lakeDistance(x,z)<12; // the lake's own outline; dips in the ground elsewhere are not water
  bedDepth[k]=inLake?Math.max(0,waterLevel-h):0;bedAbove[k]=inLake?Math.max(0,h-waterLevel):1;
  image.data[k*4]=Math.min(255,bedDepth[k]/2*255);   // R: depth of water, 0..2 m
  image.data[k*4+1]=Math.min(255,bedAbove[k]*255);   // G: height of dry ground above the water, 0..1 m
  image.data[k*4+3]=255;
 }
 context.putImageData(image,0,0);
 var bedTexture=new Ve(canvas);bedTexture.flipY=false;bedTexture.generateMipmaps=false;bedTexture.minFilter=1006;bedTexture.magFilter=1006;bedTexture.needsUpdate=true;
}
// depth of water at a point (0 on dry land), bilinear from the same grid
function waterDepth(x,z){
 const fx=(x-SPRING.x0)/SPRING.texel-.5,fz=(z-SPRING.z0)/SPRING.texel-.5,i=Math.floor(fx),j=Math.floor(fz);
 if(i<0||j<0||i>=bedW-1||j>=bedH-1)return 0;
 const u=fx-i,v=fz-j,k=j*bedW+i;
 return (bedDepth[k]*(1-u)+bedDepth[k+1]*u)*(1-v)+(bedDepth[k+bedW]*(1-u)+bedDepth[k+bedW+1]*u)*v;
}

// ---- ripples -------------------------------------------------------------------------------------------------------------------------
const ripples=Array.from({length:12},()=>new se(0,0,-99,0)); // x, z, start time, strength
let rippleNext=0;
function addRipple(x,z,strength=1){ripples[rippleNext].set(x,z,Fa,strength);rippleNext=(rippleNext+1)%ripples.length;}

// ---- the water material --------------------------------------------------------------------------------------------------------------
const reflectTarget=new wn(512,256,{depthBuffer:true});
const textureMatrix=new ue(),reflectCamera=new De();
const lakeMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',metalness:0,roughness:.07,transparent:true});
lakeMaterial.depthWrite=false;
lakeMaterial.onBeforeCompile=shader=>{
 Object.assign(shader.uniforms,{uWaterTime:waterTime,uReflect:{value:reflectTarget.texture},uBed:{value:bedTexture},uTexMatrix:{value:textureMatrix},uRipples:{value:ripples},uMirror:springQuality.mirror});
 shader.vertexShader='varying vec3 vLakeWorld;varying vec4 vReflectUv;uniform mat4 uTexMatrix;\n'+shader.vertexShader.replace('#include <begin_vertex>',
  '#include <begin_vertex>\nvLakeWorld=(modelMatrix*vec4(position,1.0)).xyz;vReflectUv=uTexMatrix*vec4(vLakeWorld,1.0);');
 shader.fragmentShader=`uniform float uWaterTime;uniform sampler2D uReflect;uniform sampler2D uBed;uniform vec4 uRipples[12];uniform float uMirror;
varying vec3 vLakeWorld;varying vec4 vReflectUv;
float lkHash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float lkNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(lkHash(i),lkHash(i+vec2(1.,0.)),f.x),mix(lkHash(i+vec2(0.,1.)),lkHash(i+vec2(1.,1.)),f.x),f.y);}
float lkFbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*lkNoise(p);p=p*2.03+vec2(17.1,9.7);a*=.5;}return s;}
// slope of the surface: four crossing swells plus fine wind-streaked detail
vec2 lkSlope(vec2 p,float t,float fade){
 vec2 g=vec2(0.);
 g+=vec2(.80,.60)*cos(dot(p,vec2(.80,.60))*1.30+t*.70)*.034;
 g+=vec2(-.50,.85)*cos(dot(p,vec2(-.50,.85))*2.10-t*.90)*.032;
 g+=vec2(.20,-.97)*cos(dot(p,vec2(.20,-.97))*3.70+t*1.30)*.033;
 g+=vec2(-.90,-.40)*cos(dot(p,vec2(-.90,-.40))*5.90-t*1.70)*.030;
 vec2 q=p*9.+vec2(t*.45,-t*.30);float e=.12,n0=lkNoise(q);
 g+=vec2(lkNoise(q+vec2(e,0.))-n0,lkNoise(q+vec2(0.,e))-n0)/e*.0045*fade;
 return g;
}
// rings spreading from splashes, wading feet, wheels, ducks and rising fish
vec2 lkRipples(vec2 p,float t){
 vec2 g=vec2(0.);
 for(int i=0;i<12;i++){
  vec4 r=uRipples[i];float age=t-r.z;
  if(age<0.||age>4.||r.w<=0.)continue;
  vec2 d=p-r.xy;float dist=length(d)+1e-4,x=dist-age*1.5;
  g+=d/dist*cos(x*16.)*exp(-x*x*9.)*exp(-age*.95)*r.w*smoothstep(0.,.2,age)*.5;
 }
 return g;
}
`+shader.fragmentShader;
 shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
  vec2 lkUv=(vLakeWorld.xz-vec2(${SPRING.x0.toFixed(1)},${SPRING.z0.toFixed(1)}))/vec2(${SPRING.w.toFixed(1)},${SPRING.h.toFixed(1)});
  vec4 lkBed=texture2D(uBed,lkUv);
  if(lkUv.x<0.||lkUv.y<0.||lkUv.x>1.||lkUv.y>1.||lkBed.g>.004)discard;
  float lkDepth=lkBed.r*2.;
  float lkAbs=1.-exp(-lkDepth*1.15);
  vec3 lkShallow=mix(vec3(.20,.36,.29),vec3(.10,.27,.15),lkFbm(vLakeWorld.xz*.35));
  diffuseColor.rgb=mix(lkShallow,vec3(.010,.060,.085),lkAbs);
  diffuseColor.a=mix(.20,.97,1.-exp(-lkDepth*2.6));
 `);
 shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
  float lkDist=length(vViewPosition),lkFade=1.-smoothstep(30.,90.,lkDist);
  vec2 lkSl=lkSlope(vLakeWorld.xz,uWaterTime,lkFade)*(.35+.65*lkFade)+lkRipples(vLakeWorld.xz,uWaterTime);
  normal=normalize((viewMatrix*vec4(normalize(vec3(-lkSl.x,1.,-lkSl.y)),0.)).xyz);
 `);
 shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
  vec3 lkV=normalize(vViewPosition);
  // what the water mirrors: the real scene, bent by the ripples; more in deep water, less over the shallows
  float lkFres=.03+.97*pow(1.-clamp(dot(normal,lkV),0.,1.),4.2);
  vec2 lkR=vReflectUv.xy/vReflectUv.w+lkSl*.05*(.4+.6*lkFade);
  vec3 lkRefl=mix(vec3(.50,.66,.78),texture2D(uReflect,clamp(lkR,.002,.998)).rgb,uMirror);
  outgoingLight=mix(outgoingLight,lkRefl,clamp(lkFres*(.6+.4*lkAbs),0.,.96));
  // sunlight patterns dancing on the bed in the shallows
  float lkC=pow(1.-abs(lkFbm(vLakeWorld.xz*2.4+uWaterTime*.18)*2.-1.),7.)+pow(1.-abs(lkFbm(vLakeWorld.xz*3.1-uWaterTime*.14+4.)*2.-1.),7.);
  outgoingLight+=vec3(.55,.68,.52)*lkC*.20*(1.-smoothstep(.12,1.1,lkDepth));
  // sun glitter
  #if NUM_DIR_LIGHTS > 0
  float lkGlint=pow(max(dot(reflect(-normalize(directionalLights[0].direction),normal),lkV),0.),220.);
  outgoingLight+=vec3(1.,.93,.78)*lkGlint*(.8+2.2*lkNoise(vLakeWorld.xz*26.+uWaterTime*2.))*lkFade;
  #endif
  // foam where the bank laps the water
  float lkN1=lkFbm(vLakeWorld.xz*3.1+vec2(uWaterTime*.07,0.));
  float lkLap=.5+.5*sin(uWaterTime*.85+lkN1*7.);
  float lkFoam=smoothstep(.17,.0,lkDepth-.04*lkLap)*smoothstep(.22,.62,lkN1+.35*lkLap);
  float lkLine=smoothstep(.016,.0,abs(lkDepth-.11-.07*lkLap))*smoothstep(.35,.75,lkFbm(vLakeWorld.xz*7.));
  float lkFoamAll=clamp(lkFoam*.85+lkLine*.7,0.,1.);
  outgoingLight=mix(outgoingLight,vec3(.92,.96,.94),lkFoamAll);
  diffuseColor.a=clamp(max(diffuseColor.a,max(lkFres*.9,lkFoamAll)),0.,1.);
  #include <opaque_fragment>`);
};
lake.material=lakeMaterial;lake.renderOrder=2;

// things that are left out of the mirror pass (dense grass is not worth drawing twice)
const mirrorHidden=[];
function hideInMirror(object){mirrorHidden.push(object);}

// ---- mirror: render the scene upside-down about the water surface just before the water is drawn --------------------------
// (a global clipping plane would linger in the outer render and slice the water off, so the mirror camera's near plane is
// tilted to the water surface instead, the usual oblique-projection trick)
const surface=new Tn(),surfaceNormal=new L(0,1,0),surfacePoint=new L(0,waterLevel,0),clipVector=new se(),clipCorner=new se();
const camPos=new L(),camForward=new L(),camUp=new L(),mirrorTarget=new L();
lake.onBeforeRender=(renderer,scene,camera)=>{
 const now=performance.now();springAdapt(now-springQuality.last);springQuality.last=now;
 if(SPRING.reflectScale<=0)return;
 camera.getWorldPosition(camPos);
 if(camPos.y<=waterLevel+.05)return;               // underwater: nothing to mirror
 if(Math.hypot(camPos.x-SPRING.cx,camPos.z-SPRING.cz)>95)return; // too far to matter
 const size=renderer.getDrawingBufferSize(new L());
 const wantW=Math.max(128,Math.round(size.x*SPRING.reflectScale)),wantH=Math.max(64,Math.round(size.y*SPRING.reflectScale));
 if(reflectTarget.width!==wantW||reflectTarget.height!==wantH)reflectTarget.setSize(wantW,wantH);
 camera.getWorldDirection(camForward);camUp.set(0,1,0).applyQuaternion(camera.quaternion);
 // mirror the camera's position, view target and up about y = waterLevel
 reflectCamera.position.set(camPos.x,2*waterLevel-camPos.y,camPos.z);
 mirrorTarget.set(camPos.x+camForward.x,2*waterLevel-(camPos.y+camForward.y),camPos.z+camForward.z);
 reflectCamera.up.set(camUp.x,-camUp.y,camUp.z);reflectCamera.lookAt(mirrorTarget);
 reflectCamera.far=camera.far;reflectCamera.near=camera.near;reflectCamera.projectionMatrix.copy(camera.projectionMatrix);
 reflectCamera.updateMatrixWorld();
 textureMatrix.set(.5,0,0,.5, 0,.5,0,.5, 0,0,.5,.5, 0,0,0,1);
 textureMatrix.multiply(reflectCamera.projectionMatrix);textureMatrix.multiply(reflectCamera.matrixWorldInverse);
 // tilt the near plane onto the water surface so only what is above the water is drawn
 surface.setFromNormalAndCoplanarPoint(surfaceNormal,surfacePoint).applyMatrix4(reflectCamera.matrixWorldInverse);
 clipVector.set(surface.normal.x,surface.normal.y,surface.normal.z,surface.constant);
 const m=reflectCamera.projectionMatrix.elements;
 clipCorner.set((Math.sign(clipVector.x)+m[8])/m[0],(Math.sign(clipVector.y)+m[9])/m[5],-1,(1+m[10])/m[14]);
 clipVector.multiplyScalar(2/clipVector.dot(clipCorner));
 m[2]=clipVector.x;m[6]=clipVector.y;m[10]=clipVector.z+1-.003;m[14]=clipVector.w;
 // draw the scene without the water itself
 const previousTarget=renderer.getRenderTarget(),previousShadows=renderer.shadowMap.autoUpdate;
 const hiddenWas=mirrorHidden.map(o=>o.visible);mirrorHidden.forEach(o=>{o.visible=false;});
 lake.visible=false;renderer.shadowMap.autoUpdate=false;
 renderer.setRenderTarget(reflectTarget);renderer.state.buffers.depth.setMask(true);
 renderer.render(scene,reflectCamera);
 renderer.setRenderTarget(previousTarget);renderer.shadowMap.autoUpdate=previousShadows;lake.visible=true;mirrorHidden.forEach((o,i)=>{o.visible=hiddenWas[i];});
};

window.expedition.spring={addRipple,waterDepth,ripples,material:lakeMaterial,target:reflectTarget,settings:SPRING,quality:springQuality,adapt:springAdapt,
 state:()=>({reflect:[reflectTarget.width,reflectTarget.height],scale:SPRING.reflectScale,mirror:springQuality.mirror.value})};
