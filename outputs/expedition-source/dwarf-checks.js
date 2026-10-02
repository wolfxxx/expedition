const results=[];const check=(name,pass)=>results.push({name,pass:!!pass});
let submerged=false,invalid=false,minClearance=Infinity,maxStep=0;let previous=poisonDwarf.root.position.clone();
for(let i=0;i<60*180;i++){
 poisonDwarf.update(1/60);const p=poisonDwarf.root.position;
 submerged ||= lakeDistance(p.x,p.z)<12;invalid ||= !Number.isFinite(p.y)||Math.abs(p.y-world.height(p.x,p.z))>.001;
 maxStep=Math.max(maxStep,p.distanceTo(previous));previous.copy(p);
 for(const c of world.colliders)minClearance=Math.min(minClearance,Math.hypot(p.x-c.x,p.z-c.z)-c.r);
}
check('Dwarf roams more than 60 metres in three minutes',poisonDwarf.state().distance>60);
check('Dwarf stays out of deep water',!submerged);check('Dwarf follows terrain',!invalid);check('Dwarf avoids trees and rocks',minClearance>.45);check('Dwarf moves continuously without teleporting',maxStep<.03);
const travelled=poisonDwarf.state().distance;
poisonDwarf.root.position.set(-5,world.height(-5,3),3);poisonDwarf.root.rotation.y=.2;
const p=poisonDwarf.root.position;Ze.position.set(p.x+1.7,p.y+1.45,p.z+2.8);Ze.fov=42;Ze.updateProjectionMatrix();Ze.lookAt(p.x,p.y+.75,p.z);Fu=()=>{};
const pre=document.createElement('pre');pre.id='dwarf-results';pre.hidden=true;pre.textContent=JSON.stringify({results,travelled,minClearance,maxStep});document.body.append(pre);
