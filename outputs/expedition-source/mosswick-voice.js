// Mosswick's voice (recorded with ElevenLabs, see make-voice.mjs): he taunts you when you are close, yelps when he is
// hit, screams when the Jeep launches him, and gloats when he comes back. Every line also appears as a caption above
// his head, so the jokes work with the sound off. Volume and stereo position follow where he is.
const VOICE=__VOICE__; // [{id,cat,text,data}] data = base64 mp3, embedded by build.py from voice/
const voiceByCat={};for(const clip of VOICE)(voiceByCat[clip.cat] ||= []).push(clip);
const MOSSWICK={tauntRange:11,closeRange:5,firstTaunt:1.8};
const voice={buffers:{},decoding:false,decoded:0,recent:[],spoken:0,last:null,speakingUntil:0,nextTaunt:MOSSWICK.firstTaunt,away:99,carCooldown:0};

const bubble=document.createElement('div');
bubble.style='position:fixed;pointer-events:none;z-index:7;display:none;max-width:280px;padding:8px 13px;border-radius:14px;background:#f1ecd2ee;color:#2a2b1c;font:600 14px/1.25 sans-serif;text-align:center;box-shadow:0 2px 8px #0006';
document.body.append(bubble);
let bubbleUntil=0;
function showCaption(text,seconds){bubble.dataset.text=text;bubbleUntil=Fa+seconds;}
const bubbleAnchor=new L();
function updateCaption(){
 if(Fa>=bubbleUntil){bubble.style.display='none';return;}
 bubbleAnchor.copy(poisonDwarf.root.position);bubbleAnchor.y+=poisonDwarf.state().airborne?1.2:1.9;
 const ahead=bubbleAnchor.clone().project(Ze),onScreen=ahead.z<1&&Math.abs(ahead.x)<1.02&&Math.abs(ahead.y)<1.02;
 bubble.style.display='block';
 if(onScreen){ // a speech bubble over his head
  bubble.style.left=(ahead.x*.5+.5)*innerWidth+'px';bubble.style.top=(-ahead.y*.5+.5)*innerHeight+'px';bubble.style.bottom='auto';
  bubble.style.transform='translate(-50%,-100%)';bubble.textContent=bubble.dataset.text;
 }else{ // off screen: a subtitle instead
  bubble.style.left='50%';bubble.style.top='auto';bubble.style.bottom='170px';
  bubble.style.transform='translateX(-50%)';bubble.textContent='Mosswick: '+bubble.dataset.text;
 }
}

// ---- saying things ----------------------------------------------------------------------------------------------------
const gesturing=new Set(['taunt','car','miss','back']);
function mosswickSay(cat,force=false){
 const pool=voiceByCat[cat];if(!pool||!pool.length)return false;
 if(!force&&Fa<voice.speakingUntil)return false;
 const fresh=pool.filter(c=>!voice.recent.includes(c.id)),pick=fresh.length?fresh:pool;
 const clip=pick[Math.floor(Math.random()*pick.length)];
 voice.recent.push(clip.id);while(voice.recent.length>Math.max(1,Math.min(7,pool.length-1)))voice.recent.shift();
 // louder and more central the closer he is
 const at=poisonDwarf.root.position,local=Ze.worldToLocal(at.clone()),distance=Ze.position.distanceTo(at);
 const gain=Mn(1.3-distance/32,.35,1),pan=Mn(local.x/Math.max(1,Math.hypot(local.x,local.z)),-1,1)*.8;
 const length=valleyAudio.playClip(voice.buffers[clip.id],{gain,pan,channel:'mosswick'})||Math.max(1.2,clip.text.length*.06+.8);
 voice.speakingUntil=Fa+length+.25;voice.spoken++;voice.last={id:clip.id,cat,text:clip.text};
 showCaption(clip.text,length+.7);
 if(gesturing.has(cat))poisonDwarf.talk(length);
 return true;
}
poisonDwarf.onEvent=(type,source)=>{
 if(type==='hurt')mosswickSay(source==='rifle'?'shot':'hurt',true);
 else if(type==='ko'&&source==='headshot'){valleyAudio.stopChannel('mosswick');voice.speakingUntil=0;bubbleUntil=0;} // no head, no last words
 else if(type==='ko')mosswickSay('ko',true);
 else if(type==='respawn')mosswickSay('back',true);
 else if(type==='near-miss')mosswickSay('miss');
 else if(type==='launched')mosswickSay('scream',true);
};

// ---- when to talk -----------------------------------------------------------------------------------------------------
const voiceStep=Fu;
Fu=function(dt){
 voiceStep(dt);
 // decode the recordings once the browser has allowed audio (after the first key press or click)
 if(!voice.decoding&&valleyAudio.clipReady()){
  voice.decoding=true;
  (async()=>{for(const clip of VOICE){voice.buffers[clip.id]=await valleyAudio.decode(clip.data);voice.decoded++;}})();
 }
 const dwarf=poisonDwarf.state(),who=Te==='walking'?Xt.root.position:zt.root.position,p=poisonDwarf.root.position;
 const distance=Math.hypot(p.x-who.x,p.z-who.z),awake=!dwarf.defeated&&!dwarf.airborne;
 if(awake&&distance<MOSSWICK.tauntRange){
  // he greets you quickly when you first come close, then keeps at it; faster when you are right on top of him
  if(voice.away>6)voice.nextTaunt=Math.min(voice.nextTaunt,MOSSWICK.firstTaunt);
  voice.away=0;voice.nextTaunt-=dt;
  if(voice.nextTaunt<=0&&mosswickSay('taunt'))voice.nextTaunt=distance<MOSSWICK.closeRange?4.5+Math.random()*3.5:7+Math.random()*5;
  // a Jeep roaring past him
  if(Te==='driving'&&Math.abs(le)>4&&distance<4.5&&Fa>voice.carCooldown&&mosswickSay('car'))voice.carCooldown=Fa+8;
 }else voice.away+=dt;
 updateCaption();
};
const voiceReset=Oa;
Oa=function(){voiceReset();voice.speakingUntil=0;voice.nextTaunt=MOSSWICK.firstTaunt;voice.away=99;voice.carCooldown=0;bubbleUntil=0;bubble.style.display='none';};
window.expedition.reset=Oa;
const voiceState=window.expedition.getState;
window.expedition.getState=()=>({...voiceState(),voice:{clips:VOICE.length,decoded:voice.decoded,spoken:voice.spoken,last:voice.last,speaking:Fa<voice.speakingUntil}});
window.expedition.say=mosswickSay;
