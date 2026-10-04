// Mosswick, an original poison-dwarf alchemist. Local geometry, materials and motion.
const poisonDwarf=(()=>{
 const root=new ee(),body=new ee();root.name='Mosswick · poison dwarf';root.add(body);bn.add(root);
 const colors={coat:'#263b32',hood:'#243c35',trim:'#ac9764',skin:'#a9a17a',beard:'#aaa995',leather:'#48382c',boot:'#292e28',iron:'#596c63',poison:'#aaff45'};
 const mats={};for(const [name,color] of Object.entries(colors))mats[name]=new be({color,roughness:name==='iron'?.45:.9,metalness:name==='iron'?.55:0});
 mats.poison.emissive=new Wt('#80f52b');mats.poison.emissiveIntensity=1.5;
 const sphere=new An(1,12,10),cylinder=new en(1,1,1,12),cone=new en(0,1,1,10);
 function shape(geo,mat,p,s,parent=body){const m=new ie(geo,mats[mat]);m.position.set(...p);m.scale.set(...s);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const oval=(mat,p,s,parent)=>shape(sphere,mat,p,s,parent);
 const tube=(mat,p,s,parent)=>shape(cylinder,mat,p,s,parent);
 const tip=(mat,p,s,parent)=>shape(cone,mat,p,s,parent);
 function joint(x,y,z,parent=body){const g=new ee();g.position.set(x,y,z);parent.add(g);return g;}
 // Wide shoulders, short legs, heavy split coat and backpack silhouette.
 oval('coat',[0,.72,0],[.32,.35,.23]);tube('coat',[0,.50,0],[.34,.28,.25]);
 oval('hood',[0,.85,-.14],[.36,.34,.17]);
 oval('leather',[0,.80,-.28],[.25,.28,.13]);tube('trim',[0,1.03,-.28],[.26,.055,.14]);
 tube('leather',[0,.61,0],[.345,.09,.255]);shape(new Oe(1,1,1),'trim',[0,.61,.255],[.12,.1,.04]);
 for(const side of [-1,1]){const strap=shape(new Oe(1,1,1),'leather',[side*.19,.85,.20],[.055,.36,.025]);strap.rotation.z=side*.12;}
 const head=joint(0,1.13,0);
 oval('hood',[0,.03,-.055],[.285,.29,.24],head);
 const hoodTip=tip('hood',[-.05,.25,-.09],[.20,.32,.18],head);hoodTip.rotation.z=.28;
 oval('skin',[0,.015,.12],[.207,.215,.14],head);
 // Deep brows, amber eyes and a large crooked nose keep the face readable at game scale.
 for(const side of [-1,1]){
  oval('boot',[side*.086,.065,.246],[.056,.027,.018],head);
  const eye=oval('poison',[side*.087,.066,.260],[.019,.013,.009],head);eye.castShadow=false;
  const brow=oval('beard',[side*.086,.108,.244],[.073,.028,.022],head);brow.rotation.z=side*.18;
  oval('skin',[side*.17,-.025,.20],[.055,.06,.035],head);
 }
 oval('skin',[0,.008,.284],[.062,.08,.065],head);
 oval('beard',[0,-.13,.18],[.205,.15,.125],head);
 for(let i=0;i<7;i++){
  const x=(i-3)*.048;const tuft=tip('beard',[x,-.23+Math.abs(i-3)*.019,.21],[.058,.27-Math.abs(i-3)*.025,.064],head);tuft.rotation.z=Math.PI+(i-3)*.08;
 }
 for(const side of [-1,1]){tube('trim',[side*.13,-.23,.225],[.044,.045,.045],head);const moustache=oval('beard',[side*.065,-.065,.281],[.08,.037,.045],head);moustache.rotation.z=side*.23;}
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const hip=joint(side*.17,.46,0);tube('coat',[0,-.10,0],[.11,.22,.11],hip);
  const knee=joint(0,-.20,0,hip);tube('leather',[0,-.075,0],[.088,.15,.088],knee);
  oval('boot',[0,-.15,.05],[.12,.09,.17],knee);tube('trim',[0,-.04,0],[.093,.035,.095],knee);legs.push({hip,knee});
  const shoulder=joint(side*.33,.92,0);oval('coat',[side*.015,-.08,0],[.13,.17,.13],shoulder);
  const elbow=joint(0,-.20,0,shoulder);tube('leather',[0,-.075,0],[.075,.16,.075],elbow);oval('skin',[0,-.17,.015],[.079,.085,.074],elbow);arms.push({shoulder,elbow});
 }
 function vial(x,y,z,size,parent=body){
  const g=joint(x,y,z,parent);oval('iron',[0,0,0],[size*1.12,size*1.3,size*1.12],g);oval('poison',[0,.015,.015],[size,size*1.1,size],g);
  tube('iron',[0,size*1.05,0],[size*.43,size*.7,size*.43],g);tube('leather',[0,size*1.5,0],[size*.48,size*.25,size*.48],g);return g;
 }
 const potions=[vial(-.28,.58,.20,.065),vial(.27,.57,.21,.053),vial(-.22,.94,-.35,.085)];
 const staff=joint(0,-.15,.035,arms[1].elbow);
 const shaft=tube('leather',[0,.22,0],[.024,1.15,.024],staff);shaft.rotation.z=-.07;
 oval('iron',[-.025,.77,0],[.07,.045,.065],staff);vial(-.025,.85,0,.085,staff);
 for(const side of [-1,1]){const prong=tube('leather',[side*.075,.84,0],[.014,.26,.014],staff);prong.rotation.z=-side*.24;}
 const motes=[];for(let i=0;i<7;i++){const m=oval('poison',[0,0,0],[.012,.012,.012]);m.castShadow=false;motes.push(m);}
 root.position.set(-5,world.height(-5,3),3);root.rotation.y=2.3;
 let health=100,hurt=0;const knock=new L(),lean={x:0,z:0};let flight=null,killed=false,api,downTime=0;const RESPAWN_SECONDS=25;
 let phase=0,time=0,wait=1.5,target=new L(-9,0,12),distance=0,seen=false,blocked=0,walkBlend=0;
 let rng=891;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 function clear(x,z){
  if(Math.hypot(x,z)>68||lakeDistance(x,z)<12.5)return false;
  if(Math.abs(x-tx)<2.5&&z>stairStart-1&&z<tz+2.5)return false;
  if(Math.hypot(x-zt.root.position.x,z-zt.root.position.z)<2.8)return false;
  if(Te==='walking'&&Math.hypot(x-Xt.root.position.x,z-Xt.root.position.z)<.8)return false;
  return !world.colliders.some(c=>Math.hypot(x-c.x,z-c.z)<c.r+.48);
 }
 function respawn(){
  const from=Te==='walking'?Xt.root.position:zt.root.position;
  for(let i=0;i<60;i++){
   const a=random()*Math.PI*2,r=10+random()*45,x=Math.sin(a)*r,z=Math.cos(a)*r;
   if(!clear(x,z)||Math.hypot(x-from.x,z-from.z)<25||Math.hypot(x-zt.root.position.x,z-zt.root.position.z)<10)continue;
   health=100;hurt=0;killed=false;flight=null;knock.set(0,0,0);downTime=0;
   root.rotation.set(0,random()*Math.PI*2,0);body.rotation.set(0,0,0);body.position.set(0,0,0);
   root.position.set(x,world.height(x,z),z);wait=1.2;choose();api.onRespawn?.(root.position.clone());return true;
  }
  return false;
 }
 function choose(){for(let i=0;i<50;i++){const a=random()*Math.PI*2,r=10+random()*45,x=Math.sin(a)*r,z=Math.cos(a)*r;if(clear(x,z)){target.set(x,0,z);return;}}target.copy(root.position);}
 function update(dt){
  time+=dt;hurt=Math.max(0,hurt-dt);
  for(const name of ['coat','skin','hood']){mats[name].emissive.set('#ac402b');mats[name].emissiveIntensity=hurt>0?.6*(hurt/.35):0;}
  // A blow shoves him away from the puncher; the push fades quickly and never carries him into trees, water or a steep drop.
  if(knock.lengthSq()>1e-3){
   const nx=root.position.x+knock.x*dt,nz=root.position.z+knock.z*dt;
   if(clear(nx,nz)&&Math.abs(world.height(nx,nz)-root.position.y)<.35)root.position.set(nx,world.height(nx,nz),nz);
   knock.multiplyScalar(Math.exp(-dt*14));if(knock.length()<.06)knock.set(0,0,0);
  }
  // Thrown by a vehicle: tumble about the middle of the body under gravity, bounce, then settle where he lands.
  if(flight){
   const c=flight.center,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
   flight.v.y-=15*dt;c.addScaledVector(flight.v,dt);
   body.rotation.x+=flight.spin.x*dt;body.rotation.z+=flight.spin.z*dt;root.rotation.y+=flight.spin.y*dt;
   const ground=world.height(c.x,c.z)+.45;
   if(c.y<ground){
    c.y=ground;
    if(flight.v.y<-2.5&&flight.bounces<3){
     api.onLand?.(new L(c.x,ground-.45,c.z),-flight.v.y,flight.bounces);
     flight.v.y*=-.40;flight.v.x*=.65;flight.v.z*=.65;flight.spin.multiplyScalar(.65);flight.bounces++;
    }else{api.onLand?.(new L(c.x,ground-.45,c.z),0,flight.bounces);body.rotation.x=wrap(body.rotation.x);body.rotation.z=wrap(body.rotation.z);flight=null;}
   }
   if(flight)body.position.set(0,.7,0).sub(new L(0,.7,0).applyEuler(body.rotation));
   root.position.set(c.x,flight?c.y-.7:world.height(c.x,c.z),c.z);
   if(flight)return;
  }
  if(health<=0){
   // After a while he walks it off: back on his feet somewhere quiet, far from the player and the Jeep.
   downTime+=dt;if(downTime>=RESPAWN_SECONDS&&respawn())return;
   body.rotation.z=La(body.rotation.z,-1.45,9,dt);body.rotation.x=La(body.rotation.x,0,9,dt);body.position.x=La(body.position.x,0,9,dt);body.position.z=La(body.position.z,0,9,dt);body.position.y=La(body.position.y,-.25,9,dt);return;}
  if(hurt>0){
   // stagger: the upper body whips away from the blow, then settles
   const k=Math.sin(hurt/.35*Math.PI)*.30,yaw=root.rotation.y,lx=lean.x*Math.cos(yaw)-lean.z*Math.sin(yaw),lz=lean.x*Math.sin(yaw)+lean.z*Math.cos(yaw);
   body.rotation.x=lx||lz?k*lz:-k*.7;body.rotation.z=-k*lx;return;
  }body.rotation.x=0;
  let moved=0;
  if(wait>0)wait-=dt;
  else if(root.position.distanceTo(new L(target.x,root.position.y,target.z))<1){wait=1.5+random()*3;choose();}
  else{
   const desired=Math.atan2(target.x-root.position.x,target.z-root.position.z);let best=null,bestScore=-Infinity;
   for(const offset of [0,.45,-.45,.9,-.9,1.5,-1.5,2.3,-2.3,Math.PI]){
    const angle=desired+offset,lookX=root.position.x+Math.sin(angle)*.75,lookZ=root.position.z+Math.cos(angle)*.75;
    if(!clear(lookX,lookZ)||Math.abs(world.height(lookX,lookZ)-root.position.y)>.3)continue;
    const score=Math.cos(offset)*2+Math.cos(angle-root.rotation.y)*.8;
    if(score>bestScore){bestScore=score;best=angle;}
   }
   if(best!==null){
    root.rotation.y+=uc(root.rotation.y,best)*(1-Math.exp(-6*dt));
    const speed=.95*Math.max(.15,Math.cos(uc(root.rotation.y,best))),x=root.position.x+Math.sin(root.rotation.y)*speed*dt,z=root.position.z+Math.cos(root.rotation.y)*speed*dt;
    if(clear(x,z)&&Math.abs(world.height(x,z)-root.position.y)<.025){root.position.set(x,world.height(x,z),z);moved=speed*dt;distance+=moved;blocked=0;}
   }
   if(moved===0){blocked+=dt;if(blocked>.8){choose();blocked=0;wait=.4;}}
  }
  walkBlend=La(walkBlend,moved>0?1:0,8,dt);phase+=moved*9;
  body.position.y=Math.abs(Math.sin(phase))*.021*walkBlend;body.rotation.z=Math.sin(phase)*.035*walkBlend;
  legs.forEach(({hip,knee},i)=>{const stride=Math.sin(phase+i*Math.PI);hip.rotation.x=stride*.48*walkBlend;knee.rotation.x=Math.max(0,-stride)*.65*walkBlend;});
  arms[0].shoulder.rotation.x=-Math.sin(phase)*.34*walkBlend;arms[0].elbow.rotation.x=-.20;
  arms[1].shoulder.rotation.x=-.16+Math.sin(phase)*.12*walkBlend;arms[1].elbow.rotation.x=-.16;
  head.rotation.y=Math.sin(time*.65)*.10*(1-walkBlend);head.rotation.x=Math.sin(time*1.1)*.025;
  potions.forEach((p,i)=>p.rotation.z=Math.sin(phase+i)*.08*walkBlend);
  motes.forEach((m,i)=>{const age=(time*.35+i/7)%1,a=i*2.4+time*.7;m.position.set(Math.cos(a)*(.22+age*.16),.6+age*.95,Math.sin(a)*.27);m.scale.setScalar(.008+Math.sin(age*Math.PI)*.009);});
  if(!seen&&Math.hypot(root.position.x-Xt.root.position.x,root.position.z-Xt.root.position.z)<4){seen=true;hi('Mosswick · wandering poison alchemist');}
 }
 return api={root,update,fling(v){health=0;hurt=0;killed=true;knock.set(0,0,0);flight={center:new L(root.position.x,root.position.y+.7,root.position.z),v:v.clone(),spin:new L(9+random()*5,(random()-.5)*7,(random()-.5)*10),bounces:0};},damage(amount,push){if(health<=0)return false;health=Math.max(0,health-amount);hurt=.35;wait=.6;if(push){knock.set(push.x*3.2,0,push.z*3.2);lean.x=push.x;lean.z=push.z;}else lean.x=lean.z=0;return true;},resetHealth(){health=100;hurt=0;downTime=0;knock.set(0,0,0);flight=null;killed=false;root.rotation.x=root.rotation.z=0;body.position.set(0,0,0);body.rotation.set(0,0,0);body.position.y=0;},state:()=>({name:'Mosswick',health,maxHealth:100,defeated:health===0,respawnIn:health===0?Math.max(0,RESPAWN_SECONDS-downTime):0,killed,airborne:!!flight,position:root.position.toArray(),distance,walking:walkBlend>.3,target:target.toArray()})};
})();
const dwarfStep=Fu;Fu=function(dt){dwarfStep(dt);poisonDwarf.update(dt);};
const dwarfState=window.expedition.getState;window.expedition.getState=()=>({...dwarfState(),poisonDwarf:poisonDwarf.state()});
const dwarfMap=o_;o_=function(){dwarfMap();const p=poisonDwarf.root.position,c=oe('map').getContext('2d');c.fillStyle='#aaff65';c.beginPath();c.arc(120+p.x*2.03,120-p.z*2.03,3,0,Math.PI*2);c.fill();};
