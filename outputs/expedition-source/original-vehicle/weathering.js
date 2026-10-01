import * as THREE from 'three';

// Closed-pose attributes preserve each part's patina as the articulated panels move.
export function applyWeathering(c) {
  const {root,M,geometries,random}=c;
  root.updateMatrixWorld(true);
  const affected=new Map([[M.paint,0],[M.roof,1],[M.steel,2],[M.rim,2],[M.rubber,3],[M.canvas,4],[M.red,0],[M.aluminum,2]]);
  root.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||!affected.has(o.material))return;
    const g=o.geometry.clone();geometries.add(g);o.geometry=g;
    const position=g.getAttribute('position'),normal=g.getAttribute('normal');
    const p=new Float32Array(position.count*3),n=new Float32Array(position.count*3),e=new Float32Array(position.count*2);
    g.computeBoundingBox();const lo=g.boundingBox.min, span=g.boundingBox.getSize(new THREE.Vector3());
    const v=new THREE.Vector3(),nm=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
    for(let i=0;i<position.count;i++){
      v.fromBufferAttribute(position,i);const q=v.clone().sub(lo).divide(span);const nv=new THREE.Vector3().fromBufferAttribute(normal,i);
      const axes=Math.abs(nv.x)>.7?['y','z']:Math.abs(nv.y)>.7?['x','z']:['x','y'];e[i*2]=q[axes[0]];e[i*2+1]=q[axes[1]];
      v.applyMatrix4(o.matrixWorld).toArray(p,i*3);nv.applyMatrix3(nm).normalize().toArray(n,i*3);
    }
    g.setAttribute('weatherPosition',new THREE.BufferAttribute(p,3));g.setAttribute('weatherNormal',new THREE.BufferAttribute(n,3));g.setAttribute('weatherEdge',new THREE.BufferAttribute(e,2));
  });
  for(const [m,kind] of affected) {
    m.onBeforeCompile=shader=>{
      shader.uniforms.uWearKind={value:kind};
      shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>\nattribute vec3 weatherPosition;\nattribute vec3 weatherNormal;\nattribute vec2 weatherEdge;\nvarying vec2 vWearEdge;\nvarying vec3 vWearPosition;\nvarying vec3 vWearNormal;`)
        .replace('#include <begin_vertex>',`#include <begin_vertex>\nvWearPosition=weatherPosition;\n#ifdef USE_INSTANCING\nvWearPosition=(modelMatrix*instanceMatrix*vec4(position,1.0)).xyz;\n#endif\nvWearEdge=weatherEdge;\nvWearNormal=weatherNormal;`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      uniform float uWearKind; varying vec2 vWearEdge; varying vec3 vWearPosition; varying vec3 vWearNormal;
      float wh(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
      float wn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(wh(i),wh(i+vec3(1,0,0)),f.x),mix(wh(i+vec3(0,1,0)),wh(i+vec3(1,1,0)),f.x),f.y),mix(mix(wh(i+vec3(0,0,1)),wh(i+vec3(1,0,1)),f.x),mix(wh(i+vec3(0,1,1)),wh(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float wf(vec3 p){return wn(p)*.58+wn(p*2.03)*.27+wn(p*4.11)*.15;}
      `).replace('#include <color_fragment>',`#include <color_fragment>
      vec3 wp=vWearPosition; float grain=wn(wp*185.);float cloud=wf(wp*3.2);float wearPatch=wf(wp*23.);
      float lower=1.-smoothstep(.70,1.27,wp.y+.08*wn(wp*9.));
      float grime=lower*smoothstep(.33,.71,wf(wp*15.));
      float edge=1.-smoothstep(.005,.025,min(min(vWearEdge.x,vWearEdge.y),min(1.-vWearEdge.x,1.-vWearEdge.y)));
      float chip=smoothstep(.74,.86,wearPatch+.045*grain+edge*.21+lower*.055);
      float scratch=smoothstep(.93,.99,wn(vec3(wp.x*92.,wp.y*290.,wp.z*18.)))*smoothstep(.35,.60,cloud);
      if(uWearKind<1.5){
        diffuseColor.rgb*=.73+cloud*.46;
        vec3 rustColor=mix(vec3(.065,.028,.013),vec3(.18,.077,.026),grain);
        diffuseColor.rgb=mix(diffuseColor.rgb,rustColor,max(chip,scratch*.67));
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.18,.137,.088),grime*.62);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.25,.24,.16),smoothstep(.71,.91,cloud)*.13);
      }else if(uWearKind<2.5){
        diffuseColor.rgb*=.72+grain*.31+cloud*.15;
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.22,.105,.037),chip*.68);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.20,.16,.105),grime*.64);
      }else if(uWearKind<3.5){
        diffuseColor.rgb*=.75+grain*.25;
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.11,.079,.045),smoothstep(.48,.76,wf(wp*38.))*.38);
      }else{
        float weave=sin(wp.x*630.)*sin(wp.z*630.);diffuseColor.rgb*=.76+cloud*.36+weave*.035;
      }
      `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+chip*.13+grime*.12,0.,1.);`);
    };
    m.customProgramCacheKey=()=>`expedition-wear-v1-${kind}`;m.needsUpdate=true;
  }
  // Dried splashes cluster at wheel arches and sills. Canvas alpha creates ragged edges.
  const cv=document.createElement('canvas');cv.width=cv.height=256;const ctx=cv.getContext('2d');
  ctx.clearRect(0,0,256,256);
  for(let i=0;i<140;i++){const x=128+(random()-.5)*180,y=128+(random()-.5)*180;const d=Math.hypot(x-128,y-128);if(random()>d/150){ctx.fillStyle=`rgba(116,94,64,${.30+random()*.55})`;ctx.beginPath();ctx.ellipse(x,y,3+random()*10,2+random()*6,random()*6,0,Math.PI*2);ctx.fill();}}
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;c.textures.add(tex);
  const splatter=new THREE.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.06,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});c.materials.add(splatter);
  for(const side of [-1,1]){
    for(const [z,y,size] of [[1.85,1.06,.22],[.81,1.12,.20],[-.58,.99,.25],[-1.69,1.05,.22],[-.48,.88,.22]]){
      const o=c.mesh(new THREE.PlaneGeometry(size,size),splatter,[side*.831,y,z]);o.rotation.y=side*Math.PI/2;
    }
    const door=c.parts[side===1?'driver':'passenger'];
    for(let k=0;k<5;k++){const o=c.mesh(new THREE.PlaneGeometry(.23,.17),splatter,[side*.023,.12+random()*.08,-.14-k*.19],door);o.rotation.y=side*Math.PI/2;}
  }
}
