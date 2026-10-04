// Local synthesized ambience and Foley; no media downloads or network requests.
const valleyAudio=(()=>{
 let ctx,master,wind,water,noise,analyser,birdAt=0,started=false;
 const counts={steps:0,takeoffs:0,landings:0,birds:0,swings:0,impacts:0,shots:0,rifleImpacts:0,crashes:0,voices:0,rockHits:0};
 function noiseLayer(frequency,type,volume){
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=noise;source.loop=true;filter.type=type;filter.frequency.value=frequency;filter.Q.value=.45;gain.gain.value=volume;
  source.connect(filter).connect(gain).connect(master);source.start();return gain;
 }
 function sync(){if(master)master.gain.setTargetAtTime(ui||document.hidden?0:.65,ctx.currentTime,.06);}
 async function unlock(event){
  if(!event.isTrusted||ui)return;
  try{
   if(!ctx){
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
    ctx=new Audio();master=ctx.createGain();master.gain.value=0;
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-16;limiter.ratio.value=4;
    analyser=ctx.createAnalyser();analyser.fftSize=512;master.connect(limiter).connect(analyser).connect(ctx.destination);
    noise=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate);const samples=noise.getChannelData(0);let soft=0;
    for(let i=0;i<samples.length;i++){soft=.94*soft+.06*(Math.random()*2-1);samples[i]=soft*2.4;}
    wind=noiseLayer(520,'lowpass',.18);water=noiseLayer(1600,'highpass',0);
   }
   if(ctx.state==='suspended')await ctx.resume();started=ctx.state==='running';sync();
  }catch{started=false;}
 }
 function burst(kind,speed=0){
  if(!started||ui||document.hidden||ctx.state!=='running')return;
  const now=ctx.currentTime;
  counts[kind]++;
  const duration=kind==='landings'?.24:kind==='takeoffs'?.13:.12;
  const gain=ctx.createGain(),filter=ctx.createBiquadFilter(),source=ctx.createBufferSource();
  source.buffer=noise;filter.type='lowpass';filter.frequency.value=kind==='landings'?850:1100+Math.random()*500;
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(kind==='landings'?.60:kind==='takeoffs'?.24:.26+Math.min(speed,5)*.035,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  source.connect(filter).connect(gain).connect(master);source.start(now,Math.random()*3);source.stop(now+duration);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  const thud=ctx.createOscillator(),low=ctx.createGain();thud.type='sine';thud.frequency.setValueAtTime(kind==='landings'?95:140,now);thud.frequency.exponentialRampToValueAtTime(55,now+.10);
  low.gain.setValueAtTime(kind==='landings'?.17:.065,now);low.gain.exponentialRampToValueAtTime(.0001,now+.13);thud.connect(low).connect(master);thud.start(now);thud.stop(now+.14);thud.onended=()=>{thud.disconnect();low.disconnect();};
 }
 function punch(kind){
  if(!started||ui||document.hidden||ctx.state!=='running')return;
  const hit=kind==='impact',now=ctx.currentTime,duration=hit?.20:.16;
  counts[hit?'impacts':'swings']++;
  const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=noise;filter.type=hit?'lowpass':'bandpass';filter.Q.value=hit?.7:.9;
  filter.frequency.setValueAtTime(hit?2300:700,now);filter.frequency.exponentialRampToValueAtTime(hit?280:2800,now+duration);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(hit?1.6:.8,now+(hit?.006:.055));gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
  source.connect(filter).connect(gain).connect(master);source.start(now,Math.random()*3);source.stop(now+duration);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  if(hit){const osc=ctx.createOscillator(),thump=ctx.createGain();osc.frequency.setValueAtTime(160,now);osc.frequency.exponentialRampToValueAtTime(48,now+.13);thump.gain.setValueAtTime(.48,now);thump.gain.exponentialRampToValueAtTime(.0001,now+.18);osc.connect(thump).connect(master);osc.start(now);osc.stop(now+.19);osc.onended=()=>{osc.disconnect();thump.disconnect();};}
 }

 // Heavy rifle: sharp crack, chest-thumping blast, two valley echoes and the bolt being worked.
 function noiseHit(type,from,to,duration,peak,delay=0,Q=.7){
  const t=ctx.currentTime+delay,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
  source.buffer=noise;filter.type=type;filter.Q.value=Q;
  filter.frequency.setValueAtTime(from,t);filter.frequency.exponentialRampToValueAtTime(to,t+duration);
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(peak,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  source.connect(filter).connect(gain).connect(master);source.start(t,Math.random()*3);source.stop(t+duration+.02);
  source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 }
 function tone(from,to,duration,peak,delay=0,type='sine'){
  const t=ctx.currentTime+delay,osc=ctx.createOscillator(),gain=ctx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(from,t);osc.frequency.exponentialRampToValueAtTime(to,t+duration);
  gain.gain.setValueAtTime(peak,t);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(gain).connect(master);osc.start(t);osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();};
 }
 function shot(){
  if(!started||ui||document.hidden||ctx.state!=='running')return;
  counts.shots++;
  noiseHit('highpass',2600,1100,.09,1.5);noiseHit('lowpass',2600,150,.6,2.1);tone(120,30,.45,1.1);
  noiseHit('lowpass',800,140,.9,.6,.34);noiseHit('lowpass',520,110,1.2,.36,.72);
  // bolt up-and-back, then forward-and-down
  for(const d of [.62,1.08]){noiseHit('bandpass',2400,1500,.05,.5,d,3);tone(1900,1100,.04,.12,d,'square');}
 }
 function rifleImpact(){
  if(!started||ui||document.hidden||ctx.state!=='running')return;
  counts.rifleImpacts++;noiseHit('lowpass',900,180,.18,.8);tone(90,45,.16,.4);
 }
 // A car meeting a dwarf: heavy thump, a wet burst, a rising whoosh as he flies, glass tinkling down.
 function crash(){
  if(!started||ui||document.hidden||ctx.state!=='running')return;
  counts.crashes++;
  noiseHit('lowpass',1800,90,.5,2.2);tone(95,26,.6,1.5);noiseHit('bandpass',900,300,.35,.9,.05,1.2);
  noiseHit('bandpass',300,2400,.9,.45,.12,.8);
  for(let i=0;i<14;i++)tone(2400+Math.random()*3800,1500+Math.random()*1500,.05+Math.random()*.05,.10+Math.random()*.08,.10+Math.random()*.9);
 }
 // Recorded clips (Mosswick's voice). decode() needs the audio context, which exists once the player has pressed a key or clicked.
 const clipReady=()=>started&&!!ctx&&ctx.state==='running';
 async function decode(base64){
  if(!ctx)return null;
  const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
  try{return await ctx.decodeAudioData(bytes.buffer);}catch{return null;}
 }
 // Plays a decoded clip; returns its length in seconds (0 if muted or not ready). pan is -1..1.
 const channels={};
 function playClip(buffer,{gain=1,pan=0,rate=1,channel=null}={}){
  if(!buffer||!clipReady()||ui||document.hidden)return 0;
  if(channel&&channels[channel])try{channels[channel].stop();}catch{} // one voice per channel: a new line cuts off the old
  const source=ctx.createBufferSource(),volume=ctx.createGain(),panner=ctx.createStereoPanner();
  source.buffer=buffer;source.playbackRate.value=rate;volume.gain.value=gain;panner.pan.value=pan;
  source.connect(volume).connect(panner).connect(master);source.start();counts.voices++;if(channel)channels[channel]=source;
  source.onended=()=>{source.disconnect();volume.disconnect();panner.disconnect();};
  return buffer.duration/rate;
 }
 // The Jeep's tyres and underside meeting a stone (level 0..1.2), or landing after being thrown into the air.
 function rockHit(level=1){
  if(!started||ui||document.hidden||ctx.state!=='running')return;
  counts.rockHits++;
  noiseHit('lowpass',900,150,.22,.55*level);tone(88,36,.2,.55*level);noiseHit('bandpass',1500,600,.10,.30*level,.0,1.5);
 }
 function bird(){
  const now=ctx.currentTime;counts.birds++;
  for(let i=0;i<3;i++){
   const osc=ctx.createOscillator(),gain=ctx.createGain(),pan=ctx.createStereoPanner(),t=now+i*.17;
   pan.pan.value=Math.sin(Fa*.1);osc.frequency.setValueAtTime(2200+i*150,t);osc.frequency.exponentialRampToValueAtTime(3400+i*100,t+.045);osc.frequency.exponentialRampToValueAtTime(2500,t+.11);
   gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(.022,t+.018);gain.gain.exponentialRampToValueAtTime(.0001,t+.12);
   osc.connect(gain).connect(pan).connect(master);osc.start(t);osc.stop(t+.13);osc.onended=()=>{osc.disconnect();gain.disconnect();pan.disconnect();};
  }
 }
 // Detect the low point of each animated ankle after its downward swing.
 // Hysteresis requires a fresh lift before another contact can fire.
 const feet={Left:null,Right:null},contacts={Left:0,Right:0};let lastContact=null,activeTime=0;
 function footfalls(dt,before){
  const distance=Math.hypot(Xt.root.position.x-before.x,Xt.root.position.z-before.z);
  const active=Te==='walking'&&jumpPhase==='grounded'&&!rifleBusy&&distance>.001&&distance<.5;
  const heights=active?Xt.footHeights():null;
  if(!heights){feet.Left=feet.Right=null;activeTime=0;return;}
  activeTime+=dt;
  for(const side of ['Left','Right']){
   const y=heights[side],previous=feet[side];
   if(!previous){feet[side]={y,dy:0,peak:y};continue;}
   const dy=y-previous.y,peak=Math.max(previous.peak,y);
   if(activeTime>.12&&peak-y>.025&&y<heights.contactHeight&&previous.dy<-.001&&dy>=-.001){
    contacts[side]++;lastContact={side,height:y,time:Fa};
    burst('steps',distance/Math.max(dt,.001));feet[side]={y,dy,peak:y};
   }else feet[side]={y,dy,peak};
  }
 }
 function update(dt,before,phase){
  footfalls(dt,before);
  if(!started||ctx.state!=='running')return;
  sync();const position=Te==='walking'?Xt.root.position:zt.root.position;
  const proximity=1-Mn((lakeDistance(position.x,position.z)-10)/15,0,1);
  water.gain.setTargetAtTime(proximity*.50,ctx.currentTime,.5);
  wind.gain.setTargetAtTime(.15+.045*Math.sin(Fa*.31)+.025*Math.sin(Fa*.73),ctx.currentTime,.5);
  if(ui||document.hidden)return;
  if(ctx.currentTime>birdAt){bird();birdAt=ctx.currentTime+6+Math.random()*9;}
  if(phase==='anticipation'&&jumpPhase==='airborne')burst('takeoffs');
  if(phase==='airborne'&&jumpPhase==='landing')burst('landings');

 }
 function state(){
  let rms=0;if(analyser){const data=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(data);rms=Math.sqrt(data.reduce((s,v)=>s+v*v,0)/data.length);}
  return {context:ctx?.state||'not-created',muted:ui,started,waterLevel:water?.gain.value||0,outputRms:rms,contacts:{...contacts},lastContact,...counts};
 }
 addEventListener('pointerdown',unlock);addEventListener('keydown',unlock);addEventListener('click',unlock);
 document.addEventListener('visibilitychange',sync);
 addEventListener('pagehide',()=>{started=false;ctx?.close().catch(()=>{});});
 return {update,sync,state,punch,shot,rifleImpact,crash,rockHit,decode,playClip,clipReady,reset(){feet.Left=feet.Right=null;activeTime=0;lastContact=null;}};
})();
const audioToggleOriginal=Du;Du=function(){audioToggleOriginal();valleyAudio.sync();};
oe('soundBtn').title='All game sound (M)';oe('soundBtn').setAttribute('aria-label','Toggle all game sound (M)');
const worldAudioStep=Fu;Fu=function(dt){const before=Xt.root.position.clone(),phase=jumpPhase;worldAudioStep(dt);valleyAudio.update(dt,before,phase);};
const worldAudioState=window.expedition.getState;window.expedition.getState=()=>({...worldAudioState(),worldAudio:valleyAudio.state()});

const audioResetOriginal=Oa;Oa=function(){audioResetOriginal();valleyAudio.reset();};
window.expedition.reset=Oa;
