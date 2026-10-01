import * as THREE from 'three';

export function buildExterior(c) {
  const {root,parts,M,mesh,box,round,cyl,sphere,tube,rod,geometries,materials,textures,random}=c;
  root.children.filter(o=>o.name==='prototypeWheel').forEach(o=>root.remove(o));
  const gTread=new THREE.BoxGeometry(.061,.048,.060); geometries.add(gTread);
  const gBolt=new THREE.CylinderGeometry(.009,.009,.012,6);geometries.add(gBolt);
  function instances(g,m,transforms,parent=root) {
    const i=new THREE.InstancedMesh(g,m,transforms.length),dummy=new THREE.Object3D();
    transforms.forEach((t,k)=>{dummy.position.set(...t.p);dummy.rotation.set(...(t.r||[0,0,0]));dummy.scale.set(...(t.s||[1,1,1]));dummy.updateMatrix();i.setMatrixAt(k,dummy.matrix)});
    i.castShadow=true;i.receiveShadow=true;parent.add(i);return i;
  }
  function makeWheel(parent,spare=false) {
    mesh(new THREE.TorusGeometry(.34,.125,16,56),M.rubber,[0,0,0],parent).rotation.y=Math.PI/2;
    const tread=[];for(let row=0;row<4;row++)for(let n=0;n<36;n++) {
      const a=(n+(row%2)*.46)*Math.PI*2/36;
      tread.push({p:[(row-1.5)*.067,.463*Math.cos(a),.463*Math.sin(a)],r:[a,0,(row<2?1:-1)*.26],s:[1,1,.97]});
    }instances(gTread,M.rubber,tread,parent);
    const rimShape=new THREE.Shape();rimShape.absarc(0,0,.224,0,2*Math.PI,false);
    const hubHole=new THREE.Path();hubHole.absarc(0,0,.058,0,2*Math.PI,true);rimShape.holes.push(hubHole);
    for(let i=0;i<6;i++){const a=i*Math.PI/3;const h=new THREE.Path();h.absarc(.144*Math.cos(a),.144*Math.sin(a),.038,0,2*Math.PI,true);rimShape.holes.push(h)}
    const rimG=new THREE.ExtrudeGeometry(rimShape,{depth:.024,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:1,curveSegments:12});rimG.rotateY(Math.PI/2);
    for(const side of [-1,1]) {
      mesh(rimG,M.rim,[side*.128,0,0],parent);
      mesh(new THREE.TorusGeometry(.227,.016,8,48),M.rim,[side*.131,0,0],parent).rotation.y=Math.PI/2;
      mesh(new THREE.TorusGeometry(.255,.009,6,48),M.rubber,[side*.126,0,0],parent).rotation.y=Math.PI/2;
      mesh(new THREE.TorusGeometry(.389,.004,4,48),M.rubber,[side*.092,0,0],parent).rotation.y=Math.PI/2;
      cyl(.060,.065,[side*.153,0,0],M.steel,parent,'x',16);
      for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(.011,.024,[side*.15,.086*Math.cos(a),.086*Math.sin(a)],M.steel,parent,'x',6)}
    }
    // Sidewall lettering is on an actual wheel surface, never a reference billboard.
    const cv=document.createElement('canvas');cv.width=cv.height=512;const ctx=cv.getContext('2d');ctx.clearRect(0,0,512,512);ctx.fillStyle='#8c8671';ctx.font='bold 20px sans-serif';ctx.textAlign='center';
    const write=(word,angle,r)=>{for(let i=0;i<word.length;i++){const a=angle+(i-word.length/2)*.065;ctx.save();ctx.translate(256+Math.sin(a)*r,256-Math.cos(a)*r);ctx.rotate(a);ctx.fillText(word[i],0,0);ctx.restore()}};
    write('EXPEDITION  ALL TERRAIN',0,194);write('LT 265 / 75 R16',Math.PI,191);
    const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;textures.add(tex);
    const decal=new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:1,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false});materials.add(decal);
    for(const side of [-1,1]){const face=mesh(new THREE.PlaneGeometry(.76,.76),decal,[side*.128,0,0],parent);face.rotation.y=side*Math.PI/2;}
  }
  for(const side of [-1,1])for(const z of [1.29,-1.25]){const w=new THREE.Group();w.name='Off-road wheel';w.position.set(side*.88,.486,z);root.add(w);makeWheel(w);}
  const spare=new THREE.Group();spare.name='Rear spare';spare.position.set(-.58,.37,-.24);spare.rotation.y=Math.PI/2;parts.rear.add(spare);makeWheel(spare,true);
  // Spare carrier and captive brackets follow the rear access door.
  box([.48,.08,.16],[-.57,.37,-.10],M.steel,parts.rear);
  rod([-.75,.12,-.10],[-.58,.37,-.15],.029,M.steel,parts.rear);
  rod([.0,.12,-.10],[-.58,.37,-.15],.029,M.steel,parts.rear);
  round([.38,.39,.085],[-.57,.33,-.385],M.canvas,parts.rear,.035);
  box([.025,.42,.02],[-.73,.34,-.436],M.strap,parts.rear);box([.025,.42,.02],[-.40,.34,-.436],M.strap,parts.rear);
  for(const side of [-1,1]) {
    box([.10,.14,3.23],[side*.49,.54,-.03],M.steel);
    rod([side*.80,.74,.74],[side*.80,.74,-1.56],.026,M.steel);
    rod([side*.82,.72,.75],[side*.82,.72,-1.56],.017,M.rim);
    for(const z of [1.29,-1.25]) {
      cyl(.065,.13,[side*.51,.46,z],M.steel,root,'y');
      // Layered leaf springs and dampers.
      for(let k=0;k<4;k++)tube([[side*.52,.48-k*.01,z-.39+k*.04],[side*.52,.40-k*.01,z],[side*.52,.48-k*.01,z+.39-k*.04]],.012,M.steel,root,16);
      rod([side*.55,.45,z-.12],[side*.64,.75,z+.16],.025,M.steel);
      rod([side*.55,.45,z-.12],[side*.60,.62,z+.055],.038,M.aluminum);
      box([.07,.045,.12],[side*.53,.51,z],M.steel);
    }
    for(const z of [-1.65,-.52,.48,1.64])box([.88,.065,.10],[0,.55,z],M.steel);
    // Window rubbers and the rear-side protective mesh.
    for(const z of [-.73,-1.40]) {
      const len=z===-.73?.54:.61;
      for(const y of [1.39,1.82])box([.055,.024,len],[side*.804,y,z],M.black);
      for(const e of [-1,1])box([.055,.435,.025],[side*.806,1.60,z+e*len/2],M.black);
    }
    const door=parts[side===1?'driver':'passenger'];
    round([.037,.07,.14],[side*.026,.40,-.90],M.black,door,.009);
    box([.018,.014,.11],[side*.049,.413,-.90],M.rim,door);
    for(const y of [.15,.46]){
      box([.028,.062,.073],[side*.029,y,-.025],M.rim,door);cyl(.012,.070,[side*.042,y,-.002],M.steel,door);
    }
    rod([side*.02,.64,-.09],[side*.21,.74,-.12],.015,M.steel,door);
    round([.085,.195,.155],[side*.24,.78,-.12],M.steel,door,.017);
    box([.006,.158,.12],[side*.287,.78,-.12],M.aluminum,door);
    rod([side*.025,.56,-.08],[side*.025,.98,-.21],.008,M.black,door);
    box([.043,.017,.87],[0,.58,-.61],M.black,door);
    for(const z of [1.82,.86,-.52,-1.63])for(const y of [1.30,.87])cyl(.008,.013,[side*.819,y,z],M.rim,root,'x',6);
    box([.035,.13,.10],[side*.825,1.08,.81],M.paint);
    for(let k=0;k<5;k++)box([.004,.007,.12],[side*.847,1.105-k*.025,.86],M.black);
    cyl(.047,.016,[side*.823,1.05,-.62],M.steel,root,'x');
    // Side equipment rack: two secured cans, shovel and pickaxe.
    if(side===1){
      for(const y of [1.39,1.82])rod([.86,y,-1.07],[.86,y,-1.72],.015,M.steel);
      for(const z of [-1.07,-1.72])rod([.86,1.39,z],[.86,1.82,z],.015,M.steel);
      for(let k=0;k<9;k++)rod([.855,1.4,-1.10-k*.07],[.855,1.81,-1.10-k*.07],.004,M.steel);
      for(let k=0;k<6;k++)rod([.855,1.43+k*.067,-1.08],[.855,1.43+k*.067,-1.72],.004,M.steel);
      for(let i=0;i<2;i++) {
        const z=-1.15-i*.34;
        const canMat=i?M.red:M.paint;round([.19,.38,.29],[.925,1.47,z],canMat,root,.026);
        box([.19,.026,.30],[.925,1.27,z],M.steel);
        cyl(.030,.025,[.94,1.68,z+.08],M.steel);
        tube([[.90,1.67,z-.09],[.90,1.71,z-.07],[.90,1.71,z+.02],[.90,1.67,z+.04]],.012,M.steel);
        rod([1.024,1.33,z-.10],[1.024,1.60,z+.10],.013,M.rim);rod([1.024,1.33,z+.10],[1.024,1.60,z-.10],.013,M.rim);
        box([.022,.40,.024],[1.035,1.48,z],M.strap);
      }
      rod([.886,1.20,-.51],[.886,1.20,-1.63],.021,M.canvas);
      round([.028,.22,.16],[.891,1.12,-.57],M.steel,root,.015);
      rod([.91,1.10,-.68],[.91,1.10,-1.63],.017,M.canvas);
      rod([.91,.99,-1.61],[.91,1.24,-1.61],.018,M.steel);
      for(const z of [-.92,-1.53])tube([[.84,1.07,z],[.96,1.07,z],[.96,1.24,z],[.84,1.24,z]],.009,M.strap);
    }
    for(const z of [.87,1.77]){box([.030,.047,.05],[side*.745,-.076,z-.72],M.steel,parts.hood);}
  }
  for(const z of [1.29,-1.25]) {
    cyl(.055,1.64,[0,.465,z],M.steel,root,'x');
    const diff=sphere(.125,[.1,.44,z],M.steel);diff.scale.set(1.25,.85,1);
    cyl(.088,.035,[.1,.44,z+.117],M.rim,root,'z');
    rod([.1,.44,z],[0,.54,0],.037,M.steel);
  }
  round([.38,.10,.63],[0,.48,.36],M.aluminum,root,.025);
  rod([-.39,.40,-1.78],[-.37,.44,.3],.026,M.steel);cyl(.057,.42,[-.39,.44,-.71],M.steel,root,'z');
  // Front crossmember, bull bar, fairlead and cable drum.
  round([1.88,.19,.19],[0,.79,2.14],M.steel,root,.015);
  round([1.72,.15,.14],[0,.73,-1.91],M.steel,root,.012);
  tube([[-.87,.77,2.20],[-.87,1.31,2.20],[-.76,1.43,2.20],[.76,1.43,2.20],[.87,1.31,2.20],[.87,.77,2.20]],.038,M.steel);
  for(const x of [-.35,.35])tube([[x,.74,2.24],[x,1.39,2.24]],.033,M.steel);
  rod([-.85,1.01,2.21],[.85,1.01,2.21],.026,M.steel);
  cyl(.083,.40,[0,.89,2.13],M.steel,root,'x');
  for(let i=0;i<24;i++)mesh(new THREE.TorusGeometry(.082,.008,5,20),M.rim,[-.17+i*.014,.89,2.13]).rotation.y=Math.PI/2;
  for(const x of [-.23,.23])cyl(.11,.045,[x,.89,2.13],M.steel,root,'x');
  cyl(.064,.17,[.32,.89,2.13],M.steel,root,'x');
  round([.39,.11,.03],[0,.83,2.268],M.aluminum,root,.015);
  box([.25,.044,.035],[0,.83,2.290],M.black);
  tube([[0,.83,2.30],[-.14,.77,2.31],[-.24,.77,2.33]],.009,M.rim);
  for(const x of [-.66,.66]){
    box([.08,.18,.026],[x,.75,2.255],M.steel);
    const hook=mesh(new THREE.TorusGeometry(.060,.015,8,18,Math.PI*1.75),M.rust,[x,.69,2.29]);hook.rotation.z=-.42;
    cyl(.021,.09,[x,.74,2.28],M.rim,root,'x');
    mesh(new THREE.TorusGeometry(.050,.012,7,18),M.rust,[x,.65,-2.00]);
  }
  // Radiator grille, recessed reflectors and wire headlamp protection.
  box([.69,.28,.045],[0,1.10,2.025],M.black);
  for(let i=0;i<13;i++)box([.011,.27,.025],[-.315+i*.052,1.10,2.055],M.steel);
  for(let y of [1.0,1.09,1.20])box([.68,.014,.025],[0,y,2.07],M.rim);
  round([.23,.028,.02],[0,1.21,2.09],M.rim,root,.005);
  for(const x of [-.57,.57]) {
    cyl(.145,.09,[x,1.12,2.025],M.black,root,'z',32);
    cyl(.121,.026,[x,1.12,2.08],M.aluminum,root,'z',32);
    cyl(.110,.02,[x,1.12,2.105],M.lens,root,'z',32);
    mesh(new THREE.TorusGeometry(.126,.008,6,36),M.rim,[x,1.12,2.12]);
    for(const d of [-.06,0,.06]){const len=2*Math.sqrt(.112*.112-d*d);box([.006,len,.007],[x+d,1.12,2.128],M.steel);box([len,.006,.007],[x,1.12+d,2.129],M.steel);}
    round([.11,.11,.050],[x*1.42,1.17,2.053],M.amber,root,.01);
    for(let k=0;k<4;k++)box([.095,.003,.002],[x*1.42,1.14+k*.017,2.08],M.rim);
  }
  for(const x of [-.71,.71]){for(let i=0;i<3;i++)round([.11,.085,.043],[x,.87+i*.105,-1.825],i===1?M.amber:M.red,root,.01);}
  // Wipers follow the external windshield, hood carries the stamped ribs.
  for(const x of [-.37,.37]){rod([x,1.38,.683],[x-.17,1.43,.657],.010,M.steel);rod([x-.29,1.44,.65],[x-.06,1.47,.64],.012,M.black);}
  for(const x of [-.45,.45])round([.09,.023,.80],[x,.018,.60],M.paint,parts.hood,.008);
  for(const x of [-.59,.59])for(let k=0;k<6;k++)box([.006,.007,.065],[x,.018,.29+k*.067],M.black,parts.hood);
  // Raised air intake secured along the windscreen pillar.
  tube([[.88,1.20,.94],[.88,1.31,.68],[.88,1.76,.53],[.88,2.03,.50]],.051,M.steel,root,32);
  round([.145,.12,.11],[.88,2.03,.53],M.black,root,.02);
  for(let i=0;i<5;i++)box([.125,.006,.004],[.88,1.998+i*.015,.589],M.rim);
  for(const y of [1.45,1.73])rod([.80,y,.59],[.88,y,.59],.014,M.steel);
  // Roof basket and crossbars: cargo never floats above the roof.
  for(const x of [-.73,.73]){
    rod([x,2.03,-1.72],[x,2.03,.43],.020,M.steel);rod([x,2.16,-1.72],[x,2.16,.43],.022,M.steel);
    for(const z of [-1.65,-1.1,-.6,-.1,.34]){rod([x,1.95,z],[x,2.15,z],.015,M.steel);box([.085,.025,.10],[x,1.969,z],M.steel);}
  }
  for(const z of [-1.72,.43]){rod([-.73,2.03,z],[.73,2.03,z],.022,M.steel);rod([-.73,2.16,z],[.73,2.16,z],.022,M.steel);}
  for(let i=0;i<10;i++)rod([-.73,2.029,-1.62+i*.217],[.73,2.029,-1.62+i*.217],.010,M.steel);
  for(const [x,z,w,l] of [[-.25,-.37,.62,.70],[.29,-.69,.55,.72],[-.30,-1.20,.62,.54]]) {
    const bag=round([w,.23,l],[x,2.155,z],M.canvas,root,.07);bag.rotation.y=(random()-.5)*.09;
    for(const dz of [-l*.30,l*.30]){box([w+.014,.021,.026],[x,2.274,z+dz],M.strap);box([.026,.25,.026],[x-w/2-.01,2.15,z+dz],M.strap);box([.026,.25,.026],[x+w/2+.01,2.15,z+dz],M.strap);}
    for(let k=0;k<4;k++)rod([x-w*.45,2.18+k*.025,z+l*.495],[x+w*.45,2.18+k*.025,z+l*.495],.0025,M.strap);
  }
  for(const x of [-.53,-.18,.18,.53]){
    round([.22,.185,.09],[x,2.105,.49],M.steel,root,.018);
    round([.17,.13,.013],[x,2.108,.544],M.lens,root,.012);
    for(let k=0;k<3;k++)box([.004,.144,.008],[x-.055+k*.055,2.107,.556],M.steel);
    for(let k=0;k<3;k++)box([.185,.004,.008],[x,2.063+k*.045,.557],M.steel);
    rod([x,1.99,.46],[x,2.035,.49],.018,M.steel);
  }
  // Rear ladder is chassis mounted, clear of the opening door and spare.
  for(const x of [-.74,-.50]){rod([x,.84,-1.92],[x,2.18,-1.92],.015,M.steel);rod([x,2.18,-1.92],[x,2.18,-1.72],.015,M.steel);}
  for(let i=0;i<6;i++)rod([-.74,.90+i*.22,-1.925],[-.50,.90+i*.22,-1.925],.013,M.steel);
  const bolts=[];
  for(const side of [-1,1])for(const z of [-1.74,-1.03,-.43,.65])for(const y of [.88,1.04,1.25,1.83])bolts.push({p:[side*.824,y,z],r:[0,0,Math.PI/2]});
  instances(gBolt,M.rim,bolts);
}
