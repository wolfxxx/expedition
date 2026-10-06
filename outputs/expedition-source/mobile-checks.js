const results=[];const check=(name,pass,detail)=>results.push({name,pass:!!pass,detail});
try{
const M=expedition.mobile,tap=id=>oe(id).dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'}));
const shown=id=>{const e=oe(id);return !!e&&!e.hidden&&getComputedStyle(e).display!=='none';};
const step=n=>{for(let i=0;i<n;i++)Fu(1/60);pc();};
check('Phone mode is on (flagged for this page) and marks the page',M.enabled&&document.documentElement.classList.contains('mobile'));
check('Lighter rendering: no antialiasing, 1024 shadows, lighter grass and water mirror',!Ae.getContext().getContextAttributes().antialias&&Sn.shadow.mapSize.x===1024&&LAND.quality<=.35&&SPRING.reflectScale<=.25);
check('Clutter is hidden: title, field notes, keyboard help, Run button and the old action button',['.title','.journal','.controls'].every(q=>getComputedStyle(document.querySelector(q)).display==='none')&&!shown('boost')&&!shown('action'));
// ---- no pointer capture on a phone (it swallows touches and freezes the controls) ----
{let asked=0;const c=Ae.domElement,real=c.requestPointerLock;c.requestPointerLock=()=>{asked++;};
 Oa();step(5);tap('mJump');step(100);tap('mPunch');step(40);
 dispatchEvent(new KeyboardEvent('keydown',{code:'KeyW',bubbles:true}));dispatchEvent(new KeyboardEvent('keyup',{code:'KeyW',bubbles:true}));
 for(const t of ['pointerdown','pointerup'])c.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerType:'touch',pointerId:3,button:0,clientX:600,clientY:300}));
 Xt.root.position.set(tx+.3,lookoutTop,tz-1.5);step(20);tap('mAction');step(110);
 for(const t of ['pointerdown','pointerup'])c.dispatchEvent(new PointerEvent(t,{bubbles:true,pointerType:'touch',pointerId:4,button:0,clientX:600,clientY:300}));
 c.requestPointerLock=real;
 check('Nothing ever asks to capture the pointer: jump, punch, keys, screen taps or the rifle',asked===0,asked+' capture request(s)');
 Oa();step(5);}
// ---- on foot ----
Oa();step(10);
check('On foot: joystick, Jump and Punch show; Brake does not',shown('joystick')&&shown('mJump')&&shown('mPunch')&&!shown('brake'));
{Oa();step(5);pe.x=0;pe.y=.5;step(30);const walk=pe.run;pe.y=1;step(40);const run=pe.run,speed=Pa;pe.y=0;step(30);
 check('Pushing the stick all the way runs; part way walks',!walk&&run&&speed>4,'speed '+speed.toFixed(2));}
{Oa();step(5);Wn=0;Xt.root.rotation.y=0;pe.x=1;pe.y=0;step(30);const early=Math.abs(uc(Wn,Xt.root.rotation.y));step(60);const later=Math.abs(uc(Wn,Xt.root.rotation.y));const turned=Math.abs(uc(0,Wn));pe.x=0;
 check('Walking, the camera swings round behind the way you are going',turned>.8&&later<1.6,'turned '+turned.toFixed(2)+', lag '+later.toFixed(2)+' (was '+early.toFixed(2)+')');}
{Oa();step(5);M.state.lookedAt=Fa;const w=Wn;pe.y=1;pe.x=1;step(30);pe.x=pe.y=0;
 check('Right after a look drag the camera is left where you put it',Math.abs(uc(w,Wn))<.05);M.state.lookedAt=-9;}
{Oa();step(10);tap('mJump');step(15);check('The Jump button jumps',jumpPhase==='airborne'||jumpPhase==='anticipation');step(90);}
{Oa();step(10);tap('mPunch');step(2);check('The Punch button throws a punch',combat.time>=0);step(40);}
// ---- the Jeep ----
{Oa();const d=Es(new L(1.72,0,.04));Xt.root.position.set(d.x+.6,world.height(d.x+.6,d.z),d.z);step(20);
 check('By the driver door one context button offers "Get in"',shown('mAction')&&oe('mAction').textContent==='Get in');
 tap('mAction');step(5);check('Tapping it gets you in',Te==='entering');
 step(6*60);check('Driving: Brake and Get out show; Jump and Punch do not',Te==='driving'&&shown('brake')&&shown('mAction')&&oe('mAction').textContent==='Get out'&&!shown('mJump')&&!shown('mPunch'));
 oe('brake').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch',pointerId:7}));check('Brake is held while pressed',pe.brake===true);
 oe('brake').dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'touch',pointerId:7}));
 Er=1;M.state.lookedAt=-9;step(120);check('Driving, the camera eases back behind the car',Math.abs(Er)<.1,'offset '+Er.toFixed(2));}
// ---- the lookout rifle ----
{Oa();Xt.root.position.set(tx+.3,lookoutTop,tz-1.5);step(20);
 check('On the lookout deck the context button offers "Use rifle"',shown('mAction')&&oe('mAction').textContent==='Use rifle');
 tap('mAction');step(110);check('Tapping it lies down at the rifle; the joystick and jump/punch give way to Scope / Fire / Get up',rifle.mode==='aiming'&&!shown('joystick')&&!shown('mJump')&&getComputedStyle(oe('rifleButtons')).display!=='none');
 check('The rifle help speaks touch',/Drag to aim/.test(oe('rifleHud').textContent));
 Oa();step(5);}
// ---- upright ----
{const w=innerWidth,h=innerHeight;M.state.portrait=true;oe('rotateCard').style.display='flex';let drew=0;const r=Ae.render.bind(Ae);Ae.render=(...a)=>{drew++;return r(...a);};Na();Ae.render=r;
 check('Upright: the "turn your phone sideways" card covers the game and drawing pauses',getComputedStyle(oe('rotateCard')).display==='flex'&&drew===0);
 M.state.portrait=h>w;oe('rotateCard').style.display=M.state.portrait?'flex':'none';}
Oa();check('Reset clears the auto-run',pe.run===false);
}catch(error){results.push({name:'Script error: '+error.message,pass:false,detail:String(error.stack||'').slice(0,300)});}
const pre=document.createElement('pre');pre.id='mobile-results';pre.hidden=true;pre.textContent=JSON.stringify({results});document.body.append(pre);
