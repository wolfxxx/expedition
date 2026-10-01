import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { createExpeditionVehicle } from './vehicle.js';
const container=document.querySelector('#viewport');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;container.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#192220');scene.fog=new THREE.Fog('#192220',14,30);
const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.45;room.dispose();pmrem.dispose();
const camera=new THREE.PerspectiveCamera(38,1,.05,80);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,1.03,0);controls.minDistance=.6;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.49;
scene.add(new THREE.HemisphereLight('#e6efdb','#6b6048',.9));
function light(color,intensity,p){const l=new THREE.DirectionalLight(color,intensity);l.position.set(...p);scene.add(l);return l;}
const key=light('#fff0d0',2.6,[4,7,5]);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.normalBias=.025;key.shadow.bias=-.0002;light('#a8c8c6',1.7,[-4,3,-3]);light('#e4d1ac',1.4,[2,3,-5]);
// The environment belongs to this demo only, never to the reusable vehicle.
const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshStandardMaterial({color:'#303932',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;scene.add(floor);
const phase=Number(new URLSearchParams(location.search).get('phase')||7);
const vehicle=createExpeditionVehicle({phase});scene.add(vehicle.root);
const views={front:[[5.4,3.3,6.8],[0,1.05,0]],side:[[7.4,2.15,.01],[0,1.05,0]],rear:[[4.8,2.9,-6.9],[0,1.05,-.3]],cabin:[[1.75,1.70,-.65],[.05,1.18,.22]],engine:[[1.65,2.45,3.3],[0,1.1,1.2]],underbody:[[3,.65,4.1],[0,.46,0]]};
let activeView='front';
function setView(name){activeView=name;const [p,t]=views[name]||views.front;controls.target.set(...t);camera.position.set(...p).sub(controls.target).multiplyScalar(Math.max(1,.95/camera.aspect)).add(controls.target);controls.update();}
setView('front');
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{if(b.dataset.view==='cabin')vehicle.setOpen('driver',true);if(b.dataset.view==='engine')vehicle.setOpen('hood',true);setView(b.dataset.view);};
for(const b of document.querySelectorAll('[data-panel]'))b.onclick=()=>vehicle.toggle(b.dataset.panel);
document.querySelector('#close').onclick=()=>Object.keys(vehicle.parts).forEach(k=>vehicle.setOpen(k,false));
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();let down;
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY]});
renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>4)return;const r=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);const h=raycaster.intersectObject(vehicle.root,true)[0];if(h)vehicle.handleInteraction?.(h.object);});
const start=document.querySelector('#start'),stop=document.querySelector('#stop'),status=document.querySelector('#engine-status'),throttle=document.querySelector('#throttle');
start.onclick=async()=>{try{const ok=await vehicle.startEngine?.();status.textContent=ok?'Starting…':'Audio unavailable';}catch(e){status.textContent='Audio unavailable';console.warn(e.message)}};
stop.onclick=()=>{vehicle.stopEngine?.();status.textContent='Off'};throttle.oninput=()=>vehicle.setThrottle?.(Number(throttle.value));
function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();setView(activeView);}addEventListener('resize',resize);resize();
let last=performance.now();function frame(now){const dt=Math.min((now-last)/1000,.1);last=now;vehicle.update(dt);controls.update();renderer.render(scene,camera);for(const b of document.querySelectorAll('[data-panel]'))b.setAttribute('aria-pressed',String(vehicle.getState().panels[b.dataset.panel].open));if(vehicle.getState().engine)status.textContent=vehicle.getState().engine;document.querySelector('#stats').textContent=`${renderer.info.render.triangles.toLocaleString()} triangles · ${renderer.info.render.calls} draws`;requestAnimationFrame(frame)}requestAnimationFrame(frame);
window.demo={vehicle,scene,camera,renderer,controls,setView,phase};
window.addEventListener('pagehide',()=>{vehicle.dispose();controls.dispose();env.dispose();floor.geometry.dispose();floor.material.dispose();renderer.dispose();});
