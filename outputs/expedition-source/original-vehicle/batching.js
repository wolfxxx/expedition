import * as THREE from 'three';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';

/** Batch opaque detail per articulated assembly without changing hinge ownership. */
export function batchVehicle(c){
  const {root,parts,geometries}=c;root.updateMatrixWorld(true);
  for(const owner of [root,...Object.values(parts)]){
    const inverse=owner.matrixWorld.clone().invert(),groups=new Map();
    owner.traverse(o=>{
      if(!o.isMesh||o.isInstancedMesh||o.material.transparent||o.userData.dynamic)return;
      let p=o.parent;while(p&&p!==owner&&!Object.values(parts).includes(p))p=p.parent;
      if(p!==owner)return;
      const arr=groups.get(o.material)||[];arr.push(o);groups.set(o.material,arr);
    });
    for(const [material,list] of groups){
      if(list.length<2)continue;
      const attributeNames=new Set(list.flatMap(o=>Object.keys(o.geometry.attributes)));
      const copies=list.map(o=>{
        const clone=o.geometry.clone(),g=clone.index?clone.toNonIndexed():clone;if(g!==clone)clone.dispose();
        g.clearGroups();g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
        for(const key of attributeNames)if(!g.hasAttribute(key)){
          const original=list.find(v=>v.geometry.hasAttribute(key)).geometry.getAttribute(key);
          g.setAttribute(key,new THREE.BufferAttribute(new Float32Array(g.getAttribute('position').count*original.itemSize),original.itemSize));
        }
        return g;
      });
      const merged=mergeGeometries(copies,false);copies.forEach(g=>g.dispose());if(!merged)throw new Error('Geometry batching failed');
      geometries.add(merged);const m=new THREE.Mesh(merged,material);m.name=material.name+' assembly';m.castShadow=true;m.receiveShadow=true;owner.add(m);list.forEach(o=>o.removeFromParent());
    }
  }
}
