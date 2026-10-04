const results=[];const check=(name,pass,detail)=>results.push({name,pass:!!pass,detail});
try{
const D=poisonDwarf,E=expedition;
const said=()=>voice.spoken;
// Put Mosswick `d` metres from the player in direction `a`, on the ground.
function placeDwarf(d,a=0){const p=Xt.root.position,x=p.x+Math.sin(a)*d,z=p.z+Math.cos(a)*d;D.root.position.set(x,world.height(x,z),z);}
function fresh(){Oa();Te='walking';Xt.root.position.set(0,world.height(0,-12),-12);Wn=0;Xt.root.rotation.y=0;fc(1,true);E.advance(.2);}
// Run for `seconds`, re-placing him each frame so wandering cannot change the distance.
function stay(seconds,d,a=0){const seen=[],base=voice.spoken;for(let i=0;i<seconds*10;i++){placeDwarf(d,a);E.advance(.1);if(voice.spoken>base+seen.length)seen.push({t:i/10,id:voice.last.id,cat:voice.last.cat});}return seen;}

// ---- the recordings are part of the game ----
check('All 38 recordings are embedded',VOICE.length===38&&Object.keys(voiceByCat).sort().join()==='back,car,hurt,ko,miss,scream,shot,taunt');
check('Every recording is real audio data',VOICE.every(c=>c.data.length>5000&&atob(c.data.slice(0,8)).charCodeAt(0)===73)); // "ID3" tag

// ---- taunting depends on distance ----
fresh();{const n=said();stay(25,30);check('Far away he stays quiet',said()===n&&bubble.style.display==='none');}
fresh();{const n=said();let first=-1;for(let i=0;i<60&&first<0;i++){placeDwarf(6,0);E.advance(.1);if(said()>n)first=i/10;}
 check('Close to you, he starts taunting within a few seconds',first>=0&&first<4&&voice.last.cat==='taunt',first>=0?'first line at '+first.toFixed(1)+' s':'none');
 check('The line is shown in a caption',bubble.style.display==='block'&&VOICE.some(c=>c.text===bubble.dataset.text));
 check('He stops to talk and gesture',D.state().talking);}
{fresh();const n=said();let first=-1;for(let i=0;i<60&&first<0;i++){placeDwarf(6,1.2);E.advance(.1);if(said()>n)first=i;}
 for(let i=0;i<8;i++){placeDwarf(6,1.2);E.advance(.1);}
 const to=Math.atan2(Xt.root.position.x-D.root.position.x,Xt.root.position.z-D.root.position.z),diff=Math.abs(Math.atan2(Math.sin(D.root.rotation.y-to),Math.cos(D.root.rotation.y-to)));
 check('He turns to face you while he talks',D.state().talking&&diff<.6,'facing error '+diff.toFixed(2)+' rad');}

// ---- he keeps at it, without repeating himself ----
fresh();{const seen=stay(75,4);
 check('Standing next to him, he taunts at least 8 times in 75 s',seen.length>=8,seen.length+' lines');
 const gaps=seen.slice(1).map((s,i)=>s.t-seen[i].t);
 check('Never faster than every 3 seconds',gaps.every(g=>g>=3),'shortest gap '+Math.min(...gaps).toFixed(1)+' s; '+seen.map(x=>x.t+':'+x.cat).join(' '));
 check('Never the same line twice in a row',seen.every((s,i)=>i===0||s.id!==seen[i-1].id));
 check('Taunts use many different lines',new Set(seen.map(s=>s.id)).size>=6,new Set(seen.map(s=>s.id)).size+' different');}
fresh();{placeDwarf(6,0);D.damage(100);const afterKo=said();stay(15,6);
 check('A knocked-out Mosswick does not taunt',said()===afterKo&&D.state().defeated);D.resetHealth();}

// ---- reactions ----
fresh();{placeDwarf(1.2,0);E.advance(.1);D.root.position.copy(new L(Xt.root.position.x,world.height(Xt.root.position.x,Xt.root.position.z+1.2),Xt.root.position.z+1.2));
 voice.speakingUntil=0;startPunch();E.advance(.4);
 check('A punch makes him yelp',voice.last.cat==='hurt'&&D.state().health===75,voice.last.text);}
fresh();{placeDwarf(3,0);voice.speakingUntil=0;const talkId=mosswickSay('taunt');
 D.damage(25,{x:0,z:1},'punch');check('A hit cuts off whatever he was saying',voice.last.cat==='hurt'&&!D.state().talking);}
fresh();{placeDwarf(3,0);D.damage(75);voice.speakingUntil=0;D.damage(25,{x:0,z:1},'punch');check('The blow that knocks him out gets a dying line',voice.last.cat==='ko'&&D.state().defeated);}
fresh();{D.resetHealth();placeDwarf(3,0);D.damage(10,null,'rifle');check('A rifle hit gets its own lines',voice.last.cat==='shot');}
// rifle: a near miss and a hit
{fresh();Xt.root.position.set(tx+.3,lookoutTop,tz-1.5);Xt.root.rotation.y=0;Wn=0;fc(1,true);E.rifle.mount();E.advance(1.8);D.resetHealth();
 const R=E.rifle;
 function aimAt(dx){for(let i=0;i<3;i++){const e=R.eye(),p=D.root.position,yaw=Math.atan2(p.x-e[0],p.z-e[2])+dx,pitch=Math.atan2(p.y+.7-e[1],Math.hypot(p.x-e[0],p.z-e[2]));R.aim(yaw,pitch);E.advance(1/60);}}
 let found=false;
 search:for(const dist of [30,40,25,35,45])for(let a=-2.3;a<-1;a+=.05){const x=tx+Math.sin(a)*dist,z=tz+Math.cos(a)*dist;D.root.position.set(x,world.height(x,z),z);aimAt(0);
  const s=E.getState().rifle,dir=new L(Math.sin(s.yaw)*Math.cos(s.pitch),Math.sin(s.pitch),Math.cos(s.yaw)*Math.cos(s.pitch));
  if(R.cast(new L(...R.eye()),dir).kind==='dwarf'){
   // also needs a clear flight past him: the shot a metre to the side must travel beyond him, not hit a tree first
   aimAt(.035);const t=E.getState().rifle,d2=new L(Math.sin(t.yaw)*Math.cos(t.pitch),Math.sin(t.pitch),Math.cos(t.yaw)*Math.cos(t.pitch)),e=R.eye(),p=D.root.position;
   if(R.cast(new L(...e),d2).distance>Math.hypot(p.x-e[0],p.z-e[2])+2){found=true;break search;}
  }}
 check('A clear shot at Mosswick exists',found);
 if(found){const keep=D.root.position.clone();
  voice.speakingUntil=0;aimAt(.035);D.root.position.copy(keep);const before=said();R.fire();
  check('Missing him by a metre makes him gloat',R.cast&&said()>before&&voice.last.cat==='miss'&&D.state().health===100,voice.last&&voice.last.text);
  E.advance(1.8);D.root.position.copy(keep);voice.speakingUntil=0;aimAt(0);R.fire();
  check('Hitting him with the rifle makes him shout about it',voice.last.cat==='shot'&&D.state().health===50);}}

// ---- the Jeep ----
fresh();Te='driving';zt.root.position.set(0,world.height(0,0),0);Xe=0;zt.root.rotation.y=0;D.resetHealth();voice.carCooldown=0;voice.speakingUntil=0;
{D.root.position.set(3.6,world.height(3.6,2),2);le=9;const before=said();for(let i=0;i<20&&said()===before;i++){le=9;D.root.position.set(3.6,world.height(3.6,zt.root.position.z+1),zt.root.position.z+1);E.advance(1/60);}
 check('A Jeep roaring past makes him complain',said()>before&&voice.last.cat==='car',voice.last&&voice.last.text);}
fresh();Te='driving';zt.root.position.set(0,world.height(0,0),0);Xe=0;zt.root.rotation.y=0;D.resetHealth();le=14;D.root.position.set(0,world.height(0,7),7);voice.speakingUntil=0;
{let heard=null;for(let i=0;i<150&&!heard;i++){le=14;E.advance(1/30);if(voice.last&&voice.last.cat==='scream')heard=voice.last;}
 check('Being hit by the Jeep makes him scream',heard&&heard.text==='AAAAAAAAH!'&&D.state().killed);
 check('The scream shows in a caption',bubble.style.display==='block'&&bubble.dataset.text==='AAAAAAAAH!');}
{const n=said();E.advance(8);check('He is silent while flying and lying there',said()===n);}
{let back=null;for(let i=0;i<40*5&&!back;i++){E.advance(.2);if(voice.last&&voice.last.cat==='back')back=voice.last;}
 check('When he gets back up he gloats',back&&!D.state().defeated,back&&back.text);}

// ---- he is solid ----
{const gap=()=>Math.hypot(Xt.root.position.x-D.root.position.x,Xt.root.position.z-D.root.position.z);
 const walkInto=(seconds,run=false,jump=false)=>{let closest=99;Ue.clear();Ue.add('KeyW');if(run)Ue.add('ShiftLeft');
  placeDwarf(3,0);const spot=D.root.position.clone(); // pinned where he stands: the player walks up to him
  for(let i=0;i<seconds*10;i++){D.root.position.copy(spot);if(jump&&i%6===0){dispatchEvent(new KeyboardEvent('keydown',{code:'Space'}));dispatchEvent(new KeyboardEvent('keyup',{code:'Space'}));}
   E.advance(.1);closest=Math.min(closest,gap());}
  Ue.clear();return closest;};
 fresh();D.resetHealth();{const c=walkInto(3);check('Walking straight into him stops you at his edge',c>=.66&&c<.8,'closest '+c.toFixed(2)+' m');
  check('...and you are still on the near side of him',Xt.root.position.z<D.root.position.z);}
 fresh();D.resetHealth();{const c=walkInto(3,true);check('Running into him does not get you through either',c>=.66&&Xt.root.position.z<D.root.position.z,'closest '+c.toFixed(2)+' m');}
 fresh();D.resetHealth();{const c=walkInto(3,true,true);check('Jumping at him does not carry you through (he is taller than a jump)',c>=.66,'closest '+c.toFixed(2)+' m');}
 fresh();D.resetHealth();{placeDwarf(3,0);Xt.root.position.set(D.root.position.x,D.root.position.y,D.root.position.z);Je.resolveCircle(Xt.root.position,.28);
  check('Spawning exactly on top of him pushes you out',gap()>=.66,'pushed to '+gap().toFixed(2)+' m');}
 fresh();D.resetHealth();{Xt.root.position.set(tx,lookoutTop,tz);D.root.position.set(tx,world.height(tx,tz),tz);const before=Xt.root.position.clone();Je.resolveCircle(Xt.root.position,.28);
  check('Standing on the deck above him you are not blocked by him',Math.abs(Xt.root.position.x-before.x)<1e-6&&Math.abs(Xt.root.position.z-before.z)<1e-6||Math.hypot(Xt.root.position.x-tx,Xt.root.position.z-tz)<1.8);}
 fresh();D.resetHealth();D.damage(100);{const c=walkInto(3);check('A knocked-out Mosswick can be stepped over',c<.5&&Xt.root.position.z>D.root.position.z,'closest '+c.toFixed(2)+' m');}
 D.resetHealth();}

// ---- housekeeping ----
fresh();stay(3,5);Oa();check('Reset clears the caption',bubble.style.display==='none');
check('The audio engine refuses to play nothing',valleyAudio.playClip(null)===0);
check('The state report includes the voice',E.getState().voice&&E.getState().voice.clips===38);

}catch(error){results.push({name:'Script error: '+error.message,pass:false,detail:String(error.stack||'').slice(0,300)});}
const pre=document.createElement('pre');pre.id='mosswick-results';pre.hidden=true;pre.textContent=JSON.stringify({results});document.body.append(pre);
