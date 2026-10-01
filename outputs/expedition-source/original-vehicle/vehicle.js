import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { buildExterior } from './exterior.js';
import { applyWeathering } from './weathering.js';
import { buildInterior } from './interior.js';
import { EngineAudio } from './engine-audio.js';
import { batchVehicle } from './batching.js';

/** Y up; +Z front. Origin is ground-level center. All dimensions in metres. */
export function createExpeditionVehicle({ phase = 7, seed = 731 } = {}) {
  const root = new THREE.Group(); root.name = 'Expedition4x4';
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const audio=new EngineAudio();
  const parts = {}; const targets = []; let disposed = false;
  let randomState = seed >>> 0;
  const random = () => { randomState = (1664525 * randomState + 1013904223) >>> 0; return randomState / 4294967296; };
  const mat = (name, color, roughness = .85, metalness = 0, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }); m.name = name; materials.add(m); return m;
  };
  const M = {
    paint: mat('Olive drab enamel', '#626951', .82, .25),
    roof: mat('Faded roof enamel', '#888873', .87, .17),
    steel: mat('Oxidized chassis steel', '#35332e', .88, .65),
    rubber: mat('Worn tire rubber', '#252522', .98),
    rim: mat('Aged steel wheels', '#8d8674', .79, .7),
    black: mat('Seals and hardware', '#20241f', .9),
    glass: mat('Clear aged glass', '#a8b5aa', .11, .1, { transparent:true, opacity:.22, depthWrite:false, side:THREE.DoubleSide }),
    lens: mat('Headlamp glass', '#d9d0ac', .17, .1, { transparent:true, opacity:.72 }),
    amber: mat('Amber lenses', '#ab591f', .3, .1), red:mat('Rear lenses','#78382d',.3,.1),
    canvas: mat('Canvas luggage', '#7d7257', .99), strap:mat('Webbing','#4a4534',.98),
    rust: mat('Rust','#724629',1,.03), mud:mat('Dried mud','#75634b',1),
    leather:mat('Worn vinyl seats','#45463b',.94), interior:mat('Dashboard','#323630',.9),
    aluminum:mat('Dull engine metal','#9a9b8e',.7,.8)
  };
  function mesh(g, m, p = [0,0,0], parent = root, name = '') {
    geometries.add(g); const o = new THREE.Mesh(g,m); o.position.set(...p); o.castShadow=true; o.receiveShadow=true; o.name=name; parent.add(o); return o;
  }
  const boxG = new THREE.BoxGeometry(1,1,1); geometries.add(boxG);
  const box = (size,p,m,parent=root,name='') => { const o=mesh(boxG,m,p,parent,name);o.scale.set(...size);return o; };
  const round = (size,p,m,parent=root,r=.025) => mesh(new RoundedBoxGeometry(...size,2,r),m,p,parent);
  const cyl = (r, length, p, m, parent=root, axis='y', segments=24) => {
    const o=mesh(new THREE.CylinderGeometry(r,r,length,segments),m,p,parent);
    if(axis==='x')o.rotation.z=Math.PI/2;if(axis==='z')o.rotation.x=Math.PI/2;return o;
  };
  const sphere = (r,p,m,parent=root) => mesh(new THREE.SphereGeometry(r,16,10),m,p,parent);
  const tube = (points,r,m,parent=root,segments=40) => {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    return mesh(new THREE.TubeGeometry(curve,segments,r,8,false),m,[0,0,0],parent);
  };
  const rod = (a,b,r,m,parent=root) => {
    const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A);
    const o=cyl(r,d.length(),A.clone().add(B).multiplyScalar(.5).toArray(),m,parent);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;
  };
  function sidePanel(points, thickness, x, m, parent=root, name='') {
    const s=new THREE.Shape();points.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:true,bevelSize:.007,bevelThickness:.007,bevelSegments:2,steps:1});
    g.rotateY(-Math.PI/2);return mesh(g,m,[x+thickness/2,0,0],parent,name);
  }
  const pivots = {};
  function pivot(name, position, axis, angle) {
    const p=new THREE.Group();p.name=name; p.position.set(...position);root.add(p);
    p.userData.vehiclePanel=name;targets.push(p);
    pivots[name]={object:p,axis,max:angle,value:0,target:0};parts[name]=p;return p;
  }
  // Body: actual open cabin shell, separated from the hood and doors.
  box([1.54,.075,3.37],[0,.67,-.03],M.steel);
  box([1.56,.09,2.25],[0,.83,-.64],M.paint);
  const wheelArch = z => [[z+.53,.75],[z+.49,1.02],[z+.29,1.14],[z-.29,1.14],[z-.49,1.02],[z-.53,.75]];
  for(const side of [-1,1]) {
    const x=side*.79;
    sidePanel([[.72,1.34],[1.98,1.27],[1.98,.72],[1.82,.72],[1.78,1.02],[1.58,1.14],[1.0,1.14],[.80,1.02],[.76,.72],[.72,.72]],.035,x,M.paint);
    sidePanel([[-.43,1.34],[-1.77,1.34],[-1.77,.73],[-1.76,.73],[-1.73,1.03],[-1.53,1.17],[-.97,1.17],[-.77,1.03],[-.73,.73],[-.43,.73]],.04,x,M.paint);
    box([.045,.07,2.15],[x,.86,-.60],M.paint);
    box([.05,.59,.045],[x,1.62,-.43],M.paint);
    box([.05,.59,.055],[x,1.62,-1.03],M.paint);
    box([.06,.60,.065],[x,1.62,-1.75],M.paint);
    box([.055,.07,2.35],[x,1.87,-.62],M.roof);
    for(const z of [-.73,-1.40]) {
      box([.009,.42,z===-.73?.50:.57],[side*.805,1.60,z],M.glass);
      box([.052,.035,z===-.73?.55:.61],[x,1.37,z],M.black);
    }
    // Flared wheel arches: faceted pressed-metal rims with actual open centers.
    for(const z of [1.29,-1.25]) {
      const q=wheelArch(z); const yy=z<0?-.045:0;
      for(let i=0;i<q.length-1;i++) {
        const a=[side*.87,q[i][1]+yy,q[i][0]], b=[side*.87,q[i+1][1]+yy,q[i+1][0]];
        const mid=new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5);
        const d=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
        const o=box([.25,.055,d.length()],mid.toArray(),M.paint);o.rotation.x=-Math.atan2(d.y,d.z);
      }
    }
    // A-pillar slopes gently back with the windshield.
    rod([x,1.33,.68],[x,1.86,.50],.031,M.paint);
    box([.09,.07,1.10],[x,.80,.10],M.paint);
    const door=pivot(side===1?'driver':'passenger',[side*.80,.83,.66],'y',side*-1.24);
    round([.037,.48,1.055],[0,.265,-.535],M.paint,door,.012).name="Door skin";
    box([.041,.045,1.055],[0,.535,-.535],M.paint,door);
    box([.014,.40,.84],[0,.78,-.605],M.glass,door);
    rod([0,.55,-.025],[0,1.02,-.18],.022,M.paint,door);
    box([.04,.046,.88],[0,1.02,-.61],M.paint,door);
    box([.041,.49,.037],[0,.78,-1.05],M.paint,door);
  }
  box([1.56,.14,.075],[0,1.29,.69],M.paint);
  box([1.57,.05,.043],[0,1.86,.49],M.paint);
  const windshield=box([1.47,.49,.012],[0,1.60,.585],M.glass);windshield.rotation.x=.328;
  box([.021,.50,.025],[0,1.60,.585],M.black).rotation.x=.328;
  round([1.66,.075,2.36],[0,1.92,-.63],M.roof,root,.033);
  for(const side of [-1,1])box([.22,.49,.048],[side*.68,1.09,-1.78],M.paint);
  box([1.58,.065,.06],[0,.815,-1.78],M.paint);
  box([.13,.48,.05],[-.72,1.61,-1.78],M.paint);
  box([.13,.48,.05],[.72,1.61,-1.78],M.paint);
  box([1.56,.06,.06],[0,1.86,-1.78],M.paint);
  const rear=pivot('rear',[.58,.87,-1.815],'y',-1.45);
  box([1.10,.44,.035],[-.58,.23,0],M.paint,rear);
  box([1.1,.05,.042],[-.58,.49,0],M.paint,rear);
  box([1.01,.37,.012],[-.58,.73,0],M.glass,rear);
  box([.04,.43,.04],[-1.12,.73,0],M.paint,rear);box([.04,.43,.04],[-.04,.73,0],M.paint,rear);
  box([1.10,.045,.045],[-.58,.94,0],M.paint,rear);
  const hood=pivot('hood',[0,1.335,.72],'x',-1.13);
  round([1.43,.07,1.28],[0,-.025,.65],M.paint,hood,.023);
  box([1.47,.23,.045],[0,1.15,2.01],M.paint);
  for(const side of [-1,1])for(const z of [1.29,-1.25]) {
    const w=new THREE.Group();w.position.set(side*.88,.486,z);w.name='prototypeWheel';root.add(w);
    const tire=mesh(new THREE.TorusGeometry(.335,.12,12,44),M.rubber,[0,0,0],w);tire.rotation.y=Math.PI/2;
    cyl(.222,.23,[0,0,0],M.rim,w,'x',32);
  }

  const context={root,parts,M,mesh,box,round,cyl,sphere,tube,rod,sidePanel,random,geometries,materials,textures,pivots,targets};
  if(phase>=2) buildExterior(context);
  if(phase>=4) buildInterior(context);
  let hoodSupport;
  if(phase>=5){hoodSupport={outer:cyl(.012,1,[0,0,0],M.steel),inner:cyl(.007,1,[0,0,0],M.aluminum)};Object.values(hoodSupport).forEach(o=>o.userData.dynamic=true);}
  if(phase>=3) applyWeathering(context);

  if(phase>=7) batchVehicle(context);

  function update(dt) { if(disposed)return;const alpha=1-Math.exp(-Math.max(0,Math.min(dt,.1))*6);for(const p of Object.values(pivots)){p.value+=(p.target-p.value)*alpha;if(Math.abs(p.target-p.value)<.0001)p.value=p.target;p.object.rotation[p.axis]=p.value*p.max;}
    if(hoodSupport){hood.updateMatrix();const a=new THREE.Vector3(-.64,1.09,1.0),b=new THREE.Vector3(-.64,-.082,.75).applyMatrix4(hood.matrix),d=b.clone().sub(a);const length=d.length();for(const [o,t] of [[hoodSupport.outer,.275],[hoodSupport.inner,.725]]){o.position.copy(a).addScaledVector(d,t);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());o.scale.y=length*.55;}}
  }
  function setOpen(name,open=true,{immediate=false}={}) { const p=pivots[name];if(!p)throw new Error(`Unknown panel: ${name}`);p.target=open?1:0;if(immediate){p.value=p.target;p.object.rotation[p.axis]=p.value*p.max;}
    if(hoodSupport){hood.updateMatrix();const a=new THREE.Vector3(-.64,1.09,1.0),b=new THREE.Vector3(-.64,-.082,.75).applyMatrix4(hood.matrix),d=b.clone().sub(a);const length=d.length();for(const [o,t] of [[hoodSupport.outer,.275],[hoodSupport.inner,.725]]){o.position.copy(a).addScaledVector(d,t);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());o.scale.y=length*.55;}}
  }
  function toggle(name){if(!pivots[name])throw new Error(`Unknown panel: ${name}`);setOpen(name,pivots[name].target<.5);}
  function dispose(){if(disposed)return Promise.resolve();disposed=true;const audioClose=audio.dispose();root.removeFromParent();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());return audioClose;}
  function handleInteraction(object){for(let o=object;o&&o!==root;o=o.parent){if(o.userData.vehiclePanel){toggle(o.userData.vehiclePanel);return true;}}return false;}
  update(0);
  const size=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  return {root,parts,interactionTargets:targets,handleInteraction,update,setOpen,toggle,dispose,
    startEngine:()=>disposed?Promise.resolve(false):audio.start(),stopEngine:()=>audio.stop(),setThrottle:value=>audio.setThrottle(value),audioDiagnostics:()=>audio.diagnostics(),
    getState:()=>({engine:audio.getState(),panels:Object.fromEntries(Object.entries(pivots).map(([k,p])=>[k,{open:p.target>0,value:p.value,angle:p.object.rotation[p.axis]}])),disposed}),
    dimensions:{length:size.z,width:size.x,height:size.y,bodyWidth:1.66},
  };
}
