const results=[];const check=(name,pass,detail)=>results.push({name,pass:!!pass,detail});
const D=poisonDwarf;
// Park the Jeep on flat ground at the base camp pointing along +z, driving at `speed`, with Mosswick `ahead` metres in front and `across` to one side.
function scene(speed,ahead=7,across=0,heading=0,mode='driving'){
 Oa();zt.root.position.set(0,world.height(0,0),0);Xe=heading;zt.root.rotation.y=heading;
 Te=mode;le=speed;
 const x=Math.sin(heading)*ahead+Math.cos(heading)*across,z=Math.cos(heading)*ahead-Math.sin(heading)*across;
 D.root.position.set(x,world.height(x,z),z);D.root.rotation.set(0,0,0);
}
// Drive for up to `seconds`, holding the speed up, tracking how high and how far Mosswick travels.
function drive(speed,seconds=2.5){
 const start=D.root.position.clone();let peak=0,far=0,frames=0;
 for(let i=0;i<seconds*60;i++){
  if(roadkill.hits===hitsBefore)le=speed;
  expedition.advance(1/60);frames++;
  peak=Math.max(peak,D.root.position.y-world.height(D.root.position.x,D.root.position.z));
  far=Math.max(far,Math.hypot(D.root.position.x-start.x,D.root.position.z-start.z));
 }
 return {peak,far,frames};
}
let hitsBefore=0;
const run=(speed,ahead,across,heading,mode)=>{scene(speed,ahead,across,heading,mode);hitsBefore=roadkill.hits;return drive(speed);};

// ---- things that must NOT kill him ----
run(0,3,0);check('A parked Jeep does not hurt him',!D.state().defeated&&roadkill.hits===hitsBefore);
run(1,3,0);check('Creeping into him at 1 m/s does not kill him',!D.state().defeated);
run(14,7,4);check('Driving past 4 m to the side misses',!D.state().defeated);
run(14,7,0,0,'walking');check('Running on foot while the Jeep speed variable is high does not count',!D.state().defeated);

// ---- the hit ----
const before=roadkill.hits;
const hit=run(14,7,0);
check('Hitting him at 50 km/h kills him',D.state().killed&&D.state().defeated&&roadkill.hits===before+1);
check('He is launched high into the air',hit.peak>2.5,hit.peak.toFixed(1)+' m');
check('He is carried well down the road',hit.far>6,hit.far.toFixed(1)+' m');
check('The Jeep slows from the impact',le<14*.8);
// settle
expedition.advance(5);
{const p=D.root.position,g=world.height(p.x,p.z);
 check('He comes to rest on the ground',!D.state().airborne&&Math.abs(p.y-g)<.01);
 check('He ends up lying down',Math.abs(Math.abs(D.root.children[0].rotation.z)-1.45)<.15);}
check('All the flying debris has cleared away',fxList.length===0,fxList.length+' left');
check('A dead dwarf cannot be punched again',D.damage(25)===false);
check('The camera shake dies away',roadkill.shake<.02);
check('Slow motion has ended',roadkill.slow===0);

// ---- slow motion beat ----
scene(14,5,0);hitsBefore=roadkill.hits;
{let hitFrame=-1;for(let i=0;i<120&&hitFrame<0;i++){le=14;expedition.advance(1/60);if(roadkill.hits>hitsBefore)hitFrame=i;}
 const t0=Fa;expedition.advance(.1);const elapsed=Fa-t0;
 check('Time slows right after the impact',hitFrame>=0&&elapsed<.06,'0.1 s of real time advanced '+elapsed.toFixed(3)+' s of game time');
 expedition.advance(2);const t1=Fa;for(let i=0;i<6;i++)expedition.advance(1/60);
 check('Time returns to normal speed',Math.abs((Fa-t1)-.1)<.005,'0.1 s advanced '+(Fa-t1).toFixed(4)+' s, slow='+roadkill.slow.toFixed(3));}

// ---- reverse and off-centre hits ----
run(-5,-6,0);check('Reversing into him at speed kills him too',D.state().killed);
{scene(14,6,.9);hitsBefore=roadkill.hits;drive(14,1.5);
 const l=roadkill.last,side=l.launch[0]*Math.cos(Xe)-l.launch[2]*Math.sin(Xe);
 check('A glancing hit to one side sends him off to that side',D.state().killed&&Math.abs(side)>1.5,'lateral launch '+side.toFixed(1));}

// ---- respawn ----
run(14,7,0);check('Dead again for the respawn test',D.state().killed);
{const t=D.state().respawnIn;check('A respawn countdown is running (about 25 s)',t>20&&t<=25,t.toFixed(1)+' s');
 expedition.advance(15);check('Still down 15 s in',D.state().defeated);
 expedition.advance(16); // the 25 s start once he has stopped tumbling
 const st=D.state(),from=Te==='walking'?Xt.root.position:zt.root.position,p=D.root.position;
 check('He gets back up after 25 s',!st.defeated&&!st.killed&&st.health===100);
 check('He returns far from the player and the Jeep',Math.hypot(p.x-from.x,p.z-from.z)>=25&&Math.hypot(p.x-zt.root.position.x,p.z-zt.root.position.z)>=10);
 check('He is upright and standing on the ground',Math.abs(p.y-world.height(p.x,p.z))<.01&&Math.abs(D.root.children[0].rotation.z)<.05&&D.root.children[0].position.length()<.05);
 check('He can be hurt again',D.damage(25)===true);}
// a knockout respawns too
scene(0,3,0,0,'walking');D.damage(100);expedition.advance(26);check('A knocked-out dwarf respawns too',!D.state().defeated);

// ---- the harder the hit, the further he flies, and the game reports it ----
function flightAt(speed,z0=0,heading=0){
 scene(speed,Math.max(6,speed*.6),0,heading);zt.root.position.set(0,world.height(0,z0),z0);
 const x=Math.sin(heading)*Math.max(6,speed*.6),z=z0+Math.cos(heading)*Math.max(6,speed*.6);D.root.position.set(x,world.height(x,z),z);
 const hits=roadkill.hits;for(let i=0;i<200&&roadkill.hits===hits;i++){le=speed;expedition.advance(1/60);}
 roadkill.report=null;for(let i=0;i<120&&!roadkill.report;i++)expedition.advance(.1);
 return {report:roadkill.report,last:roadkill.last,end:D.root.position.clone(),cam:roadkill.camTotal};
}
{const speeds=[5,9,14,20,27],runs=speeds.map(v=>flightAt(v)),m=runs.map(r=>r.report&&r.report.metres);
 check('Every hit produces a flight report',runs.every(r=>r.report&&r.report.metres>0),m.join(', ')+' m');
 check('The harder the hit, the further he flies (5, 9, 14, 20, 27 m/s)',m.every((v,i)=>i===0||v>m[i-1]+1),m.map((v,i)=>speeds[i]+' m/s: '+v+' m').join('; '));
 check('A gentle bump sends him only a few metres',m[0]<12,m[0]+' m');
 check('A 97 km/h hit sends him a long way (over 55 m)',m[4]>55,m[4]+' m');
 const r=runs[2],travelled=Math.hypot(r.end.x-r.last.at[0],r.end.z-r.last.at[2]);
 check('The reported distance is the real distance from where he was hit',Math.abs(r.report.metres-travelled)<.6,'report '+r.report.metres+' m, measured '+travelled.toFixed(1)+' m');
 check('The report shows peak height, air time and the speed of the hit',r.report.peak>1&&r.report.airTime>1&&r.report.speedKmh>30&&r.report.speedKmh<55,JSON.stringify(r.report));
 const last=runs[4].report;check('The report panel is on screen and shows the latest flight',reportPanel.style.display==='block'&&reportPanel.textContent.includes(last.metres.toFixed(1)+' m')&&reportPanel.textContent.includes('FLIGHT REPORT'),'display '+reportPanel.style.display+', text: '+reportPanel.textContent.slice(0,120));
 const best=runs[4].report.metres;check('The session best is remembered',roadkill.best>=best-.06&&reportPanel.textContent.includes('Best this session'),'best '+roadkill.best.toFixed(1)+', latest '+best);
 check('The kill-cam stays with a longer flight',runs[4].cam>runs[0].cam+1,runs[0].cam.toFixed(1)+' s vs '+runs[4].cam.toFixed(1)+' s');
 const edge=flightAt(27,70);
 check('Even straight at the edge of the map he lands inside it',Math.hypot(edge.end.x,edge.end.z)<=135,'landed '+Math.hypot(edge.end.x,edge.end.z).toFixed(0)+' m from the centre, flew '+edge.report.metres+' m');
 expedition.advance(10);check('The report panel goes away by itself',reportPanel.style.display==='none');}

// ---- reset ----
Oa();
{const st=D.state();check('Reset brings him back whole',st.health===100&&!st.killed&&!st.airborne&&D.root.children[0].position.length()<.001&&D.root.children[0].rotation.z===0);}
check('Reset clears the slow motion and shake',roadkill.slow===0&&roadkill.shake===0);

const pre=document.createElement('pre');pre.id='roadkill-results';pre.hidden=true;pre.textContent=JSON.stringify({results});document.body.append(pre);
