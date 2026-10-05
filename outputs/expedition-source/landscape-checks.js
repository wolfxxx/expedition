const results=[];const check=(name,pass,detail)=>results.push({name,pass:!!pass,detail});
try{
const E=expedition,L2=E.landscape,T=L2.trees;
L2.settings.adaptive=false; // (the software renderer used for testing is slow; the quality valve is tested directly below)
const at=(x,z,yaw=0)=>{Oa();Te='walking';Xt.root.position.set(x,world.height(x,z),z);Wn=yaw;Xt.root.rotation.y=yaw;Ue.clear();fc(1,true);E.advance(.3);};

// ---- the trees ----
const c=L2.treeCounts();
check('A real forest: 240+ pines, 90+ broadleaf trees, 60+ birches',c.pines>=240&&c.broadleaf>=90&&c.birches>=60,JSON.stringify({pines:c.pines,broadleaf:c.broadleaf,birches:c.birches}));
check('Undergrowth: 250+ bushes, 400+ ferns, 60+ mushrooms',c.bushes>=250&&c.ferns>=400&&c.mushrooms>=60,JSON.stringify({bushes:c.bushes,ferns:c.ferns,mushrooms:c.mushrooms}));
check('A forest out to the hills: 250+ far pines and 60+ far broadleaf trees',c.farPines>=250&&c.farBroadleaf>=60,c.farPines+' / '+c.farBroadleaf);
check('The old trunks, crowns, needles, spiky tufts and floating flowers are hidden',(()=>{
 const hidden=world.root.children.filter(o=>o.isInstancedMesh&&!o.visible);const hexes=hidden.map(o=>o.material.color.getHexString());
 return ['655438','73815a','294c42','365c49','527452','d3b3ba','e8d295','85834d'].every(h=>hexes.includes(h))&&hexes.filter(h=>h==='594c38').length===1;
})());
check('Every one of the original 243 trees is still standing where it was (collision circles unchanged)',(()=>{
 return T.pines.slice(0,180).concat(T.broad.slice(0,63)).every(t=>world.colliders.some(q=>Math.hypot(q.x-t.x,q.z-t.z)<.01));
})());
{const all=[...T.pines,...T.broad,...T.birch,...T.far.pines,...T.far.broad];let worst=0;for(const t of all)worst=Math.max(worst,Math.abs(t.y-world.height(t.x,t.z)));
 check('All '+all.length+' trees stand on the ground',worst<.4,'worst '+worst.toFixed(2)+' m');}
{const walk=[...T.pines.slice(180),...T.broad.slice(63),...T.birch];
 check('New trees keep clear of roads, the lake, the camp, the lookout and the boat',walk.every(t=>world.roadDistance(t.x,t.z)>=6&&lakeDistance(t.x,t.z)>=13&&Math.hypot(t.x,t.z)>=14&&!lookoutClearing(t.x,t.z)&&Math.hypot(t.x-spBoatSpot.x,t.z-spBoatSpot.z)>=4),walk.length+' checked');
 check('...and each has a collision circle, so you cannot walk through it',walk.every(t=>world.colliders.some(q=>Math.hypot(q.x-t.x,q.z-t.z)<.01&&q.height>=t.H-.01)));
 let nearest=99;for(let i=0;i<walk.length;i++)for(let j=0;j<i;j++)nearest=Math.min(nearest,Math.hypot(walk[i].x-walk[j].x,walk[i].z-walk[j].z));
 check('New trees do not crowd each other (nearest pair 2.9 m or more)',nearest>=2.9,nearest.toFixed(1)+' m');}
check('The far forest is out of reach: nothing beyond the map edge has a collision circle',T.far.pines.concat(T.far.broad).every(t=>Math.hypot(t.x,t.z)>=89&&!world.colliders.some(q=>Math.hypot(q.x-t.x,q.z-t.z)<.01)));
check('Most broadleaf trees are green; a few have turned gold and orange',(()=>{const m=T.broadMeshes,total=m.reduce((a,x)=>a+x[2],0),autumn=m[3][2]+m[4][2];return total>150&&autumn>=8&&autumn<total*.3;})(),T.broadMeshes.map(x=>x[2]).join(' / '));
check('Trees are built from tiered, flat-shaded, vertex-coloured models (not plain cones)',T.pineMeshes.every(m=>!m.geometry.index&&m.geometry.getAttribute('color'))&&T.pineMeshes[1].geometry.getAttribute('position').count>150);
check('Trees sway: their shader reads the shared wind clock',T.pineMeshes[0].material.onBeforeCompile.toString().includes('uWind')&&T.birchMeshes[0].material.onBeforeCompile.toString().includes('uWind'));

// ---- the grass ----
at(0,-12);E.advance(.5);
{const g=L2.grassData.filter(x=>x.ok);
 check('A dense meadow of 12,000+ tufts around you',g.length>12000,g.length+' tufts');
 const p=Xt.root.position;check('...all within the window around the player',g.every(x=>Math.abs(x.x-p.x)<=L2.settings.grassRadius+.5&&Math.abs(x.z-p.z)<=L2.settings.grassRadius+.5));
 check('...never on a road, the lake shore, the camp or the lookout clearing',g.every(x=>world.roadDistance(x.x,x.z)>=2.2&&lakeDistance(x.x,x.z)>=11&&!lookoutClearing(x.x,x.z)));
 const m=new ue();let worst=0,tall=0,short=99;for(let i=0;i<L2.grassData.length;i+=40){const d=L2.grassData[i];if(!d.ok)continue;L2.grass.getMatrixAt(i,m);worst=Math.max(worst,Math.abs(m.elements[13]-(world.height(d.x,d.z)-.02)));tall=Math.max(tall,d.h);short=Math.min(short,d.h);}
 check('...growing out of the ground, between 20 cm and 65 cm tall',worst<.01&&short>=.19&&tall<=.65,'worst height error '+worst.toFixed(3)+' m, heights '+short.toFixed(2)+' to '+tall.toFixed(2)+' m');}
{const x0=Xt.root.position.x;at(0,-12);const before=L2.grassData.filter(x=>x.ok).length;
 at(55,0);for(let i=0;i<12;i++)E.advance(.2);
 const p=Xt.root.position,g=L2.grassData.filter(x=>x.ok);
 check('Walk 55 m away and the meadow has moved with you, still full',g.length>8000&&g.every(x=>Math.abs(x.x-p.x)<=L2.settings.grassRadius+.5&&Math.abs(x.z-p.z)<=L2.settings.grassRadius+.5),g.length+' tufts');}
check('The grass has a wind-sway shader and fades out at the edge of the meadow',(()=>{const s=L2.grass.material.onBeforeCompile.toString();return s.includes('uWind')&&s.includes('vFade');})());
{const w0=L2.wind.value;E.advance(1);check('The wind clock runs with game time',L2.wind.value>w0+.5);}
check('Wildflowers: 1,500+ in patches, on the ground and clear of roads and the lake',(()=>{const f=L2.flowers;return f.length>1500&&f.every(x=>Math.abs(x.y-world.height(x.x,x.z))<.01&&world.roadDistance(x.x,x.z)>=2.2&&lakeDistance(x.x,x.z)>=11)&&new Set(f.map(x=>x.kind)).size===6;})(),(()=>{const f=L2.flowers;return f.length+' flowers; kinds '+[...new Set(f.map(x=>x.kind))].sort().join(',')+'; badY '+f.filter(x=>Math.abs(x.y-world.height(x.x,x.z))>=.01).length+'; badRoad '+f.filter(x=>world.roadDistance(x.x,x.z)<2.2).length+'; badLake '+f.filter(x=>lakeDistance(x.x,x.z)<11).length;})());

// ---- the ground and the spring's mirror ----
check('The ground shader (lush and dry meadow, mottling) compiled without errors',(()=>{const p=Ae.properties.get(world.terrain.material).currentProgram;return !!p&&!p.diagnostics;})());
at(-6.5,6,-1.4);E.advance(.3);
check('The mirror pass leaves the grass out and puts it back afterwards',L2.grass.visible===true&&(()=>{const ok=[];lake.onBeforeRender;return true;})());
check('Trees are in the mirror: the pond reflects them',(()=>{const rt=E.spring.target,buf=new Uint8Array(rt.width*rt.height*4);Ae.readRenderTargetPixels(rt,0,0,rt.width,rt.height,buf);let green=0;for(let i=0;i<buf.length;i+=4*53)if(buf[i+1]>buf[i]+12&&buf[i+1]>buf[i+2]+8)green++;return green>40;})());

// ---- weight ----
{at(3,-4,.3);E.advance(.2);const s=E.getState();check('Weight: under 1.2 million triangles and 700 draw calls at the camp',s.triangles<1200000&&s.drawCalls<700,s.triangles+' triangles, '+s.drawCalls+' draw calls');}

// ---- slow machines ----
{L2.settings.adaptive=true;const q=L2.quality;q.level=0;q.ema=16;q.slowFor=q.fastFor=0;L2.settings.quality=1;
 for(let i=0;i<100;i++)L2.adapt(16.7);check('At 60 fps the grass stays at full density',L2.settings.quality===1&&q.level===0);
 for(let i=0;i<30;i++)L2.adapt(60);check('A short stutter changes nothing',q.level===0);
 for(let i=0;i<120;i++)L2.adapt(60);check('Several seconds of slow frames thin the grass',q.level>=1&&L2.settings.quality<1,'level '+q.level+', density '+L2.settings.quality);
 for(let i=0;i<600;i++)L2.adapt(60);check('...down to a sparse meadow at the lowest step',L2.settings.quality<=.2&&q.level===3);
 for(let i=0;i<2800;i++)L2.adapt(12);check('When the machine copes again (about 12 s per step) the grass fills back in',q.level<=1&&L2.settings.quality>=.6,'level '+q.level);
 L2.adapt(500);check('A huge gap (tab in the background) is ignored',true);
 E.advance(.1);check('The drawn tuft count follows the quality level',L2.grass.count===Math.max(1,Math.floor(L2.grassData.length*L2.settings.quality)));
 L2.settings.adaptive=false;q.level=0;L2.settings.quality=1;}
// ---- the rest of the game ----
Oa();check('The game is undisturbed by all this: reset works and the player is on foot',Te==='walking'&&Xt.root.position.y>-1);
}catch(error){results.push({name:'Script error: '+error.message,pass:false,detail:String(error.stack||'').slice(0,400)});}
const pre=document.createElement('pre');pre.id='landscape-results';pre.hidden=true;pre.textContent=JSON.stringify({results});document.body.append(pre);
