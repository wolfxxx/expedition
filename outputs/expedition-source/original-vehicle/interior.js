import * as THREE from 'three';

export function buildInterior(c) {
  const {root,parts,M,mesh,box,round,cyl,sphere,tube,rod,materials,textures,random}=c;
  function canvasMaterial(w,h,draw,name) {
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;draw(cv.getContext('2d'),w,h);
    const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;textures.add(tex);
    const m=new THREE.MeshStandardMaterial({map:tex,roughness:.83});m.name=name;materials.add(m);return m;
  }
  const upholstery=canvasMaterial(512,512,(ctx,w,h)=>{
    ctx.fillStyle='#454b3d';ctx.fillRect(0,0,w,h);
    for(let i=0;i<8000;i++){const x=random()*w,y=random()*h;ctx.fillStyle=`rgba(150,145,114,${random()*.075})`;ctx.fillRect(x,y,1,1)}
    for(const x of [43,469]){ctx.strokeStyle='#797963';ctx.setLineDash([3,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,10);ctx.lineTo(x,500);ctx.stroke();}
    ctx.setLineDash([]);for(let k=0;k<4;k++){ctx.strokeStyle='#353c32';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(80+k*115,45);ctx.lineTo(80+k*115,470);ctx.stroke();}
    const wear=ctx.createRadialGradient(255,380,20,255,380,180);wear.addColorStop(0,'#99907740');wear.addColorStop(1,'#99907700');ctx.fillStyle=wear;ctx.fillRect(0,0,w,h);
  },'Stitched and worn seat vinyl');
  const gauge=(label,max,needle,unit)=>canvasMaterial(256,256,(ctx)=>{
    ctx.fillStyle='#181e19';ctx.fillRect(0,0,256,256);ctx.strokeStyle='#cbc9a5';ctx.fillStyle='#cbc9a5';ctx.font='16px monospace';ctx.textAlign='center';
    for(let i=0;i<=40;i++){const a=(-.73+i/40*1.46)*Math.PI;const r=i%5?101:91;ctx.lineWidth=i%5?1:2;ctx.beginPath();ctx.moveTo(128+Math.sin(a)*r,128-Math.cos(a)*r);ctx.lineTo(128+Math.sin(a)*110,128-Math.cos(a)*110);ctx.stroke();if(i%10===0)ctx.fillText(String(Math.round(max*i/40)),128+Math.sin(a)*73,133-Math.cos(a)*73);}
    ctx.font='bold 17px monospace';ctx.fillText(label,128,171);ctx.font='13px monospace';ctx.fillText(unit,128,190);
    const a=(-.73+needle*1.46)*Math.PI;ctx.strokeStyle='#bd6f38';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(128,128);ctx.lineTo(128+Math.sin(a)*89,128-Math.cos(a)*89);ctx.stroke();ctx.fillStyle='#a4a38c';ctx.beginPath();ctx.arc(128,128,9,0,7);ctx.fill();
  },label+' gauge face');
  // Cabin bulkhead, dashboard and actual footwells.
  box([1.51,.49,.06],[0,1.055,.67],M.paint);
  round([1.48,.19,.22],[0,1.255,.51],M.interior,root,.032);
  round([1.50,.045,.28],[0,1.35,.52],M.black,root,.012);
  round([.44,.16,.023],[.42,1.26,.388],M.black,root,.012);
  for(const [x,y,r,label,max,needle,unit] of [[.40,1.275,.056,'SPEED',140,.08,'km/h'],[.55,1.275,.041,'RPM',50,.17,'x100'],[.27,1.275,.038,'FUEL',100,.61,'%'],[.34,1.20,.022,'TEMP',120,.55,'C']]) {
    cyl(r+.005,.013,[x,y,.371],M.rim,root,'z',32);
    const face=mesh(new THREE.CircleGeometry(r,32),gauge(label,max,needle,unit),[x,y,.360]);face.rotation.y=Math.PI;
  }
  for(const x of [.47,.51,.55])sphere(.006,[x,1.198,.356],x===.47?M.amber:M.red);
  for(const x of [-.66,.69]){box([.08,.07,.010],[x,1.268,.388],M.black);for(let i=0;i<5;i++)box([.070,.006,.015],[x,1.240+i*.013,.379],M.rim);}
  round([.44,.13,.017],[-.40,1.248,.390],M.paint,root,.009);box([.12,.014,.018],[-.40,1.28,.374],M.black);
  const radio=canvasMaterial(512,256,(ctx)=>{ctx.fillStyle='#293128';ctx.fillRect(0,0,512,256);ctx.fillStyle='#b2b69a';ctx.font='28px monospace';ctx.fillText('RADIO  ·  FM',30,50);ctx.font='bold 50px monospace';ctx.fillText('87.6',120,133);ctx.strokeStyle='#9f9d80';for(let i=0;i<30;i++){ctx.beginPath();ctx.moveTo(30+i*15,168);ctx.lineTo(30+i*15,168+(i%5?10:25));ctx.stroke()}},'Vintage radio markings');
  const radioFace=mesh(new THREE.PlaneGeometry(.20,.085),radio,[0,1.267,.388]);radioFace.rotation.y=Math.PI;
  for(const x of [-.087,.087])cyl(.011,.014,[x,1.267,.371],M.black,root,'z');
  for(const x of [-.09,-.03,.03,.09]){box([.027,.029,.013],[x,1.191,.388],M.black);box([.012,.004,.016],[x,1.201,.379],M.rim);}
  // Steering assembly angled toward the driver's seat.
  const steering=new THREE.Group();steering.position.set(.43,1.28,.17);steering.rotation.x=-Math.PI+.48;root.add(steering);
  mesh(new THREE.TorusGeometry(.155,.014,10,40),M.black,[0,0,0],steering);
  cyl(.038,.035,[0,0,0],M.black,steering,'z');
  for(let i=0;i<3;i++){const a=i*2*Math.PI/3;rod([.032*Math.cos(a),.032*Math.sin(a),0],[.142*Math.cos(a),.142*Math.sin(a),0],.010,M.rim,steering);}
  rod([.43,1.28,.17],[.43,1.17,.49],.022,M.black);
  rod([.43,1.26,.21],[.55,1.27,.23],.006,M.rim);sphere(.016,[.55,1.27,.23],M.black);
  for(const [x,w] of [[.30,.037],[.40,.047],[.53,.028]]){
    rod([x,1.025,.57],[x,.91,.35],.009,M.steel);const p=round([w,.05,.019],[x,.92,.35],M.black,root,.004);p.rotation.x=-.40;
  }
  round([.24,.13,.78],[0,.90,-.02],M.interior,root,.025);
  for(const z of [.10,-.16]){const boot=round([.095,.044,.10],[0,1.005,z],M.black,root,.02);rod([0,1.02,z],[.02,1.18,z-.026],.010,M.steel);sphere(.026,[.02,1.185,z-.026],M.black);for(let i=0;i<3;i++)box([.09,.007,.10],[0,1.015+i*.008,z],M.interior);}
  rod([.10,.995,-.33],[.11,1.065,-.16],.014,M.black);
  for(const side of [-1,1]) {
    // Rubber mats sit on the floor, in front of the seat runners.
    round([.50,.009,.48],[side*.43,.879,.28],M.black,root,.014);
    for(let i=0;i<13;i++)box([.42,.004,.004],[side*.43,.886,.07+i*.030],M.interior);
    for(const x of [side*.43-.155,side*.43+.155])box([.035,.06,.48],[x,.92,-.26],M.steel);
    const seat=new THREE.Group();seat.position.set(side*.43,1.025,-.29);root.add(seat);
    round([.45,.11,.47],[0,0,0],upholstery,seat,.036);
    const back=round([.45,.47,.105],[0,.24,-.20],upholstery,seat,.03);back.rotation.x=-.105;
    for(const x of [-.12,.12])rod([x,.45,-.22],[x,.535,-.22],.007,M.rim,seat);
    round([.275,.12,.095],[0,.545,-.23],upholstery,seat,.026);
    for(const dx of [-.18,.18]){rod([dx,-.025,-.23],[dx,.435,-.238],.008,M.black,seat);}
    // Belt anchor, retractor and diagonal webbing.
    box([.044,.062,.022],[side*.737,1.22,-.418],M.black);
    tube([[side*.74,1.59,-.413],[side*.53,1.22,-.37],[side*.22,1.045,-.37]],.009,M.strap,root,18);
    round([.026,.055,.025],[side*.205,1.07,-.28],M.red,root,.004);
    const door=parts[side===1?'driver':'passenger'];
    round([.025,.39,.91],[-side*.032,.26,-.53],M.interior,door,.012);
    box([.030,.034,.79],[-side*.050,.435,-.54],M.black,door);
    round([.061,.035,.29],[-side*.064,.335,-.58],M.black,door,.01);
    round([.006,.080,.15],[-side*.049,.371,-.86],M.rim,door,.01);
    rod([-side*.057,.383,-.91],[-side*.057,.383,-.81],.007,M.black,door);
    rod([-side*.063,.244,-.37],[-side*.063,.285,-.29],.008,M.rim,door);sphere(.011,[-side*.065,.285,-.29],M.black,door);
    cyl(.065,.011,[-side*.050,.18,-.75],M.black,door,'x');
    for(let i=0;i<8;i++)box([.012,.002,.09],[-side*.059,.155+i*.007,-.75],M.interior,door);
    for(const [y,z] of [[.10,-.13],[.41,-.13],[.10,-.92],[.41,-.92]])cyl(.004,.008,[-side*.050,y,z],M.rim,door,'x',6);
    rod([-side*.005,.028,-1.0],[-side*.005,.50,-1.0],.007,M.black,door);
    // Rear wheel tubs inside the cargo compartment.
    round([.23,.21,.85],[side*.655,.98,-1.23],M.paint,root,.02);
    round([.30,.095,.70],[side*.52,1.135,-1.12],upholstery,root,.022);
    round([.085,.30,.69],[side*.688,1.31,-1.12],upholstery,root,.022);
    box([.025,.036,.23],[side*.725,1.385,-.80],M.black);
  }
  // Ribbed load-area floor, strapped crate and practical rear trim.
  for(let i=0;i<12;i++)box([.014,.005,.95],[-.48+i*.087,.882,-1.08],M.rim);
  const crate=round([.42,.28,.34],[0,1.024,-1.48],M.canvas,root,.013);
  for(const x of [-.16,.16])box([.025,.285,.35],[x,1.022,-1.48],M.strap);
  round([.10,.03,.04],[0,1.15,-1.302],M.black,root,.005);
  round([.035,.45,.27],[-.70,1.1,-1.77],M.interior);
  round([1.03,.37,.016],[-.58,.23,.035],M.interior,parts.rear,.009);
  box([.17,.03,.037],[-.88,.34,.058],M.black,parts.rear);
  for(const [x,z] of [[.71,.37],[-.71,.37]])box([.04,.025,.18],[x,1.84,z],M.black);
  round([.30,.020,.16],[.43,1.83,.31],M.interior,root,.01);
  round([.30,.020,.16],[-.43,1.83,.31],M.interior,root,.01);
  round([.18,.063,.03],[0,1.78,.44],M.black,root,.012);
  box([.155,.045,.006],[0,1.78,.421],M.aluminum);
  const engineStart=new Set(root.children);
  // Self-contained engine bay: inline block, head, manifolds, accessories and hoses.
  box([1.39,.047,1.26],[0,.846,1.32],M.steel);
  for(const side of [-1,1]) {
    box([.17,.19,1.06],[side*.63,.981,1.32],M.paint);
    rod([side*.61,1.18,.76],[side*.62,1.18,1.90],.016,M.steel);
  }
  round([.42,.30,.56],[0,1.013,1.30],M.steel,root,.04);
  round([.42,.12,.62],[0,1.209,1.28],M.aluminum,root,.02);
  round([.29,.060,.57],[0,1.293,1.28],M.paint,root,.018);
  cyl(.033,.018,[0,1.332,1.07],M.black);
  for(let i=0;i<7;i++)box([.40,.016,.014],[0,1.258,1.025+i*.075],M.aluminum);
  for(const x of [-.17,.17])for(const z of [1.07,1.28,1.49])cyl(.008,.01,[x,1.28,z],M.steel,root,'y',6);
  for(let i=0;i<4;i++) {
    const z=1.05+i*.13;
    tube([[.20,1.22,z],[.29,1.16,z],[.32,1.05,z+.03],[.29,.96,z+.08]],.026,M.rust,root,12);
    tube([[-.19,1.23,z],[-.30,1.24,z],[-.36,1.17,z]],.024,M.aluminum,root,12);
    tube([[.0,1.329,z],[.15,1.335,z],[.25,1.29,z], [.37,1.25,1.01]],.004,M.black,root,14);
  }
  cyl(.075,.38,[-.43,1.207,1.28],M.black,root,'z');
  for(const z of [1.1,1.45])mesh(new THREE.TorusGeometry(.076,.007,6,20),M.rim,[-.43,1.207,z]);
  tube([[-.43,1.20,1.46],[-.37,1.22,1.62],[-.14,1.25,1.56]],.035,M.black,root,20);
  round([.89,.37,.067],[0,1.089,1.90],M.black,root,.016);
  for(let i=0;i<24;i++)box([.83,.007,.004],[0,.925+i*.014,1.862],M.aluminum);
  cyl(.026,.023,[.29,1.285,1.90],M.rim);
  tube([[-.10,1.29,1.56],[-.11,1.26,1.70],[-.34,1.27,1.80],[-.34,1.24,1.86]],.025,M.black,root,18);
  tube([[.36,.95,1.86],[.27,.92,1.78],[.16,.98,1.59]],.024,M.black,root,18);
  const fan=new THREE.Group();fan.position.set(0,1.10,1.774);root.add(fan);cyl(.036,.053,[0,0,0],M.steel,fan,'z');
  mesh(new THREE.TorusGeometry(.154,.010,7,36),M.black,[0,0,0],fan);
  for(let i=0;i<6;i++){const a=i*Math.PI/3;const blade=round([.055,.112,.010],[.095*Math.sin(a),.095*Math.cos(a),0],M.black,fan,.008);blade.rotation.z=-a+.27;}
  for(const [x,y,r] of [[0,1.10,.072],[.26,1.02,.055],[-.22,1.12,.045]]){cyl(r,.028,[x,y,1.60],M.steel,root,'z');mesh(new THREE.TorusGeometry(r,.007,6,24),M.rubber,[x,y,1.62]);}
  tube([[-.22,1.16,1.621],[0,1.17,1.621],[.31,1.03,1.621],[.26,.969,1.621],[0,1.03,1.621],[-.26,1.10,1.621],[-.22,1.16,1.621]],.005,M.black,root,36);
  const battery=round([.25,.20,.27],[.51,1.084,.96],M.black,root,.012);
  box([.25,.018,.27],[.51,1.193,.96],M.interior);
  for(const x of [.42,.60]){cyl(.013,.025,[x,1.22,.97],M.rim);tube([[x,1.24,.97],[x,1.25,.79],[.14,1.14,.755]],.008,x>.5?M.red:M.black,root,16);}
  box([.021,.035,.27],[.51,1.223,.96],M.steel);
  const reservoirMat=new THREE.MeshStandardMaterial({color:'#b5b094',roughness:.8,transparent:true,opacity:.87});materials.add(reservoirMat);
  round([.13,.18,.16],[-.52,1.10,.97],reservoirMat,root,.025);cyl(.033,.025,[-.52,1.208,.97],M.black);
  cyl(.059,.16,[-.51,1.135,1.67],reservoirMat);cyl(.04,.024,[-.51,1.227,1.67],M.black);
  tube([[-.52,1.11,.97],[-.57,1.0,1.20],[-.55,1.02,1.64]],.008,M.black,root,20);
  cyl(.052,.15,[.31,1.048,.95],M.aluminum,root,'z');
  rod([.20,.97,.90],[.53,.97,.90],.015,M.steel);
  tube([[.26,1.07,1.0],[.42,1.20,1.11],[.61,1.20,1.57]],.010,M.black,root,24);
  for(const x of [-.60,.60]){rod([x,1.12,.74],[x,1.12,1.85],.010,M.rim);for(const z of [.83,1.15,1.52])cyl(.008,.017,[x,1.136,z],M.steel,root,'y',6);}
  const engineBay=new THREE.Group();engineBay.name='Engine bay';const engineObjects=root.children.filter(o=>!engineStart.has(o));root.add(engineBay);engineObjects.forEach(o=>engineBay.add(o));engineBay.position.y=-.08;
  // Underside bracing and visible hinge pins remain attached to the hood.
  for(const x of [-.48,.48])box([.045,.033,1.16],[x,-.071,.65],M.steel,parts.hood);
  for(const z of [.15,.99])box([1.30,.027,.033],[0,-.069,z],M.steel,parts.hood);
  for(const x of [-.53,.53]){box([.08,.034,.14],[x,-.047,.055],M.steel,parts.hood);cyl(.014,.11,[x,1.336,.725],M.rim,root,'x');}
}
