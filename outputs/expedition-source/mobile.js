// Phones and tablets: a landscape-only, decluttered layout with thumb controls (joystick left; jump, punch and one
// context button right), a camera that swings round behind you as you move, and lighter rendering that adapts itself.
// On automatically for touch screens without a mouse; force it with ?mobile (or turn it off with ?desktop).
const MOBILE=(()=>{const q=new URLSearchParams(location.search);if(q.has('desktop'))return false;if(q.has('mobile')||window.EXPEDITION_MOBILE)return true;
 return matchMedia('(pointer:coarse)').matches&&!matchMedia('(hover:hover)').matches;})();
const MOBILE_TUNE={runAt:.88,follow:1.5,followDelay:1.2,carReturn:1.4,pixelLevels:[1,.85,.72,.6],slowMs:30,fastMs:19};
const mobileState={pixel:0,ema:16,slowFor:0,fastFor:0,lookedAt:-9,portrait:false,fullscreenTried:false};
if(MOBILE){
 document.documentElement.classList.add('mobile');
 // ---- lighter rendering --------------------------------------------------------------------------------------------------
 const pixelRatio=()=>Math.min(devicePixelRatio||1,1.5)*MOBILE_TUNE.pixelLevels[mobileState.pixel];
 Ae.setPixelRatio(pixelRatio());Ae.setSize(innerWidth,innerHeight);
 Sn.shadow.mapSize.set(1024,1024);if(Sn.shadow.map){Sn.shadow.map.dispose();Sn.shadow.map=null;}
 landQuality.level=2;LAND.quality=landQuality.levels[2];                       // start with lighter grass; it adapts from there
 springQuality.level=2;SPRING.reflectScale=springQuality.levels[2];              // a smaller water mirror
 // the render resolution steps down when frames are slow and back up when they recover
 const mobileFrame=now=>{const ms=now-(mobileFrame.last||now);mobileFrame.last=now;
  if(ms>0&&ms<250){mobileState.ema+=(ms-mobileState.ema)*.08;
   if(mobileState.ema>MOBILE_TUNE.slowMs){mobileState.slowFor+=ms;mobileState.fastFor=0;}else if(mobileState.ema<MOBILE_TUNE.fastMs){mobileState.fastFor+=ms;mobileState.slowFor=0;}else mobileState.slowFor=mobileState.fastFor=0;
   const levels=MOBILE_TUNE.pixelLevels.length;
   if(mobileState.slowFor>2500&&mobileState.pixel<levels-1){mobileState.pixel++;mobileState.slowFor=0;mobileState.ema=22;Ae.setPixelRatio(pixelRatio());Ae.setSize(innerWidth,innerHeight);}
   else if(mobileState.fastFor>9000&&mobileState.pixel>0){mobileState.pixel--;mobileState.fastFor=0;Ae.setPixelRatio(pixelRatio());Ae.setSize(innerWidth,innerHeight);}}
  requestAnimationFrame(mobileFrame);};
 requestAnimationFrame(mobileFrame);

 // ---- landscape only: upright, a "turn sideways" card covers the game and drawing pauses ---------------------------------
 const rotateCard=document.createElement('div');rotateCard.id='rotateCard';
 rotateCard.innerHTML='<div class="phone"></div><b>Turn your phone sideways</b><span>Expedition plays in landscape</span>';
 document.body.append(rotateCard);
 const checkOrientation=()=>{mobileState.portrait=innerHeight>innerWidth;rotateCard.style.display=mobileState.portrait?'flex':'none';};
 addEventListener('resize',checkOrientation);addEventListener('orientationchange',()=>setTimeout(checkOrientation,200));checkOrientation();
 const mobileRender=Na;Na=function(){if(!mobileState.portrait)mobileRender();};
 // the first touch asks for fullscreen and a landscape lock (Android allows it; iPhones keep the card instead)
 addEventListener('pointerdown',()=>{
  if(mobileState.fullscreenTried)return;mobileState.fullscreenTried=true;
  const el=document.documentElement,go=el.requestFullscreen?.bind(el)||el.webkitRequestFullscreen?.bind(el);
  try{const p=go?.({navigationUI:'hide'});Promise.resolve(p).then(()=>screen.orientation?.lock?.('landscape')).catch(()=>{});}catch{}
 },{capture:true});

 // ---- thumb controls -------------------------------------------------------------------------------------------------------
 const pad=document.createElement('div');pad.id='thumbPad';
 const button=(id,label,cls='')=>{const b=document.createElement('button');b.id=id;b.className='thumb '+cls;b.innerHTML=label;b.style.touchAction='none';pad.append(b);return b;};
 const jumpBtn=button('mJump','<i>⤒</i>Jump','big'),punchBtn=button('mPunch','<i>✊</i>Punch'),actionBtn=button('mAction','<span>Get in</span>','wide');
 document.body.append(pad);
 const press=(b,fn)=>b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();b.classList.add('down');fn();});
 for(const b of [jumpBtn,punchBtn,actionBtn])for(const t of ['pointerup','pointercancel','pointerleave'])b.addEventListener(t,()=>b.classList.remove('down'));
 const key=(code,type)=>dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));
 press(jumpBtn,()=>{key('Space','keydown');setTimeout(()=>key('Space','keyup'),60);});
 press(punchBtn,()=>startPunch());
 press(actionBtn,()=>{if(!oe('action').hidden&&!oe('action').disabled)Uu();else if(rifleHint.style.display!=='none')mountRifle();});
 rifleButtons.id='rifleButtons';rifleHud.id='rifleHud';healthHUD.id='dwarfHealth';
 // toolbar: short labels, no keyboard hints
 const shortLabels=()=>{lightButton.textContent=golden?'Daylight':'Golden hour';};shortLabels();lightButton.addEventListener('click',shortLabels);addEventListener('keydown',e=>{if(e.code==='KeyL')setTimeout(shortLabels);});
 // the existing Brake button moves to the right thumb; Run goes (push the stick all the way to run)
 pad.append(oe('brake'));oe('brake').classList.add('thumb','big');oe('brake').innerHTML='<i>■</i>Brake';

 // ---- what shows when, and auto-run from the stick ------------------------------------------------------------------------
 const mobileHud=pc;pc=function(){
  mobileHud();
  const walking=Te==='walking'&&!Le&&rifle.mode==='idle',car=!oe('action').hidden,riflePrompt=rifleHint.style.display!=='none';
  jumpBtn.hidden=punchBtn.hidden=!walking;
  actionBtn.hidden=!(car||riflePrompt);actionBtn.disabled=car&&oe('action').disabled;
  actionBtn.querySelector('span').textContent=car?(Le?(Te==='entering'?'Getting in…':'Getting out…'):Te==='driving'?'Get out':'Get in'):'Use rifle';
  oe('joystick').hidden=rifle.mode!=='idle';
 };

 // ---- the camera follows you: walking, it swings round behind the way you are going; driving, it eases back behind the car --
 let lookFinger=null;
 Ae.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')lookFinger=e.pointerId;});
 Ae.domElement.addEventListener('pointermove',e=>{if(e.pointerId===lookFinger)mobileState.lookedAt=Fa;});
 for(const t of ['pointerup','pointercancel'])Ae.domElement.addEventListener(t,e=>{if(e.pointerId===lookFinger){lookFinger=null;mobileState.lookedAt=Fa;}});
 Ae.domElement.style.touchAction='none';
 const mobileStep=Fu;Fu=function(dt){
  if(Te==='walking'&&rifle.mode==='idle')pe.run=Math.hypot(pe.x,pe.y)>MOBILE_TUNE.runAt;
  mobileStep(dt);
  const idle=lookFinger===null&&Fa-mobileState.lookedAt>MOBILE_TUNE.followDelay;
  if(!idle||rifle.mode!=='idle')return;
  if(Te==='walking'&&!Le&&Pa>.4&&Math.hypot(pe.x,pe.y)>.1)Wn+=uc(Wn,Xt.root.rotation.y)*(1-Math.exp(-dt*MOBILE_TUNE.follow*Math.min(1,Pa/2.6)));
  else if(Te==='driving')Er*=Math.exp(-dt*MOBILE_TUNE.carReturn);
 };
 const mobileReset=Oa;Oa=function(){mobileReset();pe.run=false;mobileState.lookedAt=-9;};window.expedition.reset=Oa;

 // ---- styles ----------------------------------------------------------------------------------------------------------------
 const css=document.createElement('style');css.textContent=`
html.mobile .title,html.mobile .journal,html.mobile .controls,html.mobile #boost,html.mobile #action,html.mobile .map span{display:none!important}
html.mobile .map{top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));width:auto;padding:5px;border-radius:50%}
html.mobile .map canvas{width:92px;height:92px}
html.mobile .toolbar{top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));right:auto;flex-direction:row;gap:5px}
html.mobile .toolbar button{font-size:10px;padding:7px 9px;border-radius:9px}
html.mobile .toolbar kbd{display:none}
html.mobile #notice{top:max(10px,env(safe-area-inset-top));max-width:46vw;font-size:11px}
html.mobile .speed{right:auto;left:50%;transform:translateX(-50%);bottom:max(10px,env(safe-area-inset-bottom));padding:7px 14px;min-width:0}
html.mobile .speed b{font-size:26px}html.mobile #driveHint{display:none}
html.mobile #touchControls{display:block!important;position:absolute;left:max(18px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));right:auto;width:150px;height:150px;pointer-events:none;z-index:6}
html.mobile #joystick{position:absolute;left:0;bottom:0;width:132px;height:132px;border-radius:50%;border:1px solid #efecd655;background:#243c3266;pointer-events:auto;touch-action:none}
html.mobile #stick{position:absolute;left:41px;top:41px;width:50px;height:50px;border-radius:50%;background:#d2bc79bb;border:1px solid #f0dfaf}
html.mobile #thumbPad{position:absolute;right:max(18px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));width:210px;height:190px;pointer-events:none;z-index:6}
html.mobile .thumb{position:absolute;pointer-events:auto;touch-action:none;border-radius:50%;border:1px solid #efecd655;background:#1b271fcc;color:#f1efdf;font-size:10px;letter-spacing:.5px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;-webkit-user-select:none;user-select:none}
html.mobile .thumb i{font-style:normal;font-size:20px;line-height:1}
html.mobile .thumb.down{background:#d3b96acc;color:#27332a}
html.mobile #mJump,html.mobile #brake{right:0;bottom:0;width:84px;height:84px;left:auto;font-size:11px}
html.mobile #mPunch{right:96px;bottom:8px;width:66px;height:66px}
html.mobile #mAction{right:8px;bottom:98px;width:auto;height:46px;border-radius:23px;padding:0 18px;font-size:13px;flex-direction:row;border-color:#d3b96a99}
html.mobile #mAction:disabled{opacity:.55}
html.mobile #rifleButtons{left:auto!important;right:max(18px,env(safe-area-inset-right))!important;bottom:max(18px,env(safe-area-inset-bottom))!important;transform:none!important;flex-direction:column;gap:10px!important}
html.mobile #rifleButtons button{padding:14px 22px!important;font-size:14px!important;border-radius:14px!important}
html.mobile #dwarfHealth{bottom:auto!important;top:calc(max(8px,env(safe-area-inset-top)) + 46px);left:max(8px,env(safe-area-inset-left))!important;transform:none!important;width:170px!important;padding:7px 12px!important;font-size:11px!important}
html.mobile #rifleHud{bottom:max(10px,env(safe-area-inset-bottom))!important;font-size:11px!important;padding:6px 12px!important}
#rotateCard{position:fixed;inset:0;z-index:50;display:none;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#26332b;color:#f1efdf;font:15px sans-serif;text-align:center}
#rotateCard span{font-size:12px;color:#c9c3a8}
#rotateCard .phone{width:44px;height:74px;border:3px solid #d3b96a;border-radius:9px;margin-bottom:14px;animation:turnPhone 2.4s ease-in-out infinite}
@keyframes turnPhone{0%,25%{transform:rotate(0)}55%,100%{transform:rotate(-90deg)}}
`;document.head.append(css);
}
window.expedition.mobile={enabled:MOBILE,settings:MOBILE_TUNE,state:mobileState,checkOrientation:MOBILE?()=>dispatchEvent(new Event('resize')):()=>{}};
