const results=[];const check=(name,pass,detail)=>results.push({name,pass:!!pass,detail});
const canvas=Ae.domElement;
const move=(dx,dy,buttons=0)=>canvas.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,pointerType:'mouse',movementX:dx,movementY:dy,clientX:400+dx,clientY:300+dy,buttons,bubbles:true,cancelable:true}));
const press=(type,button=0)=>canvas.dispatchEvent(new PointerEvent(type,{button,pointerId:1,pointerType:'mouse',clientX:400,clientY:300,bubbles:true}));
const lockOn=()=>Object.defineProperty(document,'pointerLockElement',{get:()=>canvas,configurable:true});
const lockOff=()=>{delete document.pointerLockElement;};
function fresh(){Oa();lockOff();look.released=false;expedition.advance(.7);}

// ---- not captured: behaves as before ----
fresh();{const w=Wn;move(80,0,0);check('Free cursor: moving the mouse with no button does nothing',Wn===w);}
{const w=Wn;press('pointerdown');move(60,0,1);press('pointerup');check('Free cursor: dragging still turns the camera',Wn<w-.1);}

// ---- captured, on foot ----
fresh();lockOn();
{const w=Wn,b=bs;move(100,40,0);
 check('Captured: moving the mouse right turns the camera right, no button held',Wn<w-.2&&Math.abs(Wn-(w-100*.0032))<1e-9);
 check('Captured: moving the mouse down tilts the view down',bs>b+.05);
 move(0,-9999);check('Captured: pitch is limited',bs>=.04-1e-9);move(0,9999);check('Captured: pitch is limited at the top',bs<=.85+1e-9);}
{const w=Wn;press('pointerdown');move(50,0,1);check('Captured: the game\'s drag handler is not applied on top (no double turn)',Math.abs(Wn-(w-50*.0032))<1e-9);press('pointerup');}
// punching
fresh();lockOn();combat.time=-1;
press('pointerdown');check('Captured: a press punches immediately',combat.time>=0);press('pointerup');
expedition.advance(.6);
// the click that captures is not a punch
fresh();lockOff();combat.time=-1;
press('pointerdown');lockOn();document.dispatchEvent(new Event('pointerlockchange'));press('pointerup');
check('The click that captures the mouse does not also punch',combat.time<0);
lockOff();combat.time=-1;
press('pointerdown');press('pointerup');check('Capture refused: a plain click still punches',combat.time>=0);
expedition.advance(.6);

// ---- captured, driving ----
fresh();lockOn();Te='driving';
{const e=Er;move(70,0,0);check('Captured while driving: moving the mouse orbits the chase camera',Er<e-.15);}
Te='walking';

// ---- capturing without a click ----
{let asked=0;canvas.requestPointerLock=()=>{asked++;};
 const key=(code,init={})=>dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true,...init}));
 fresh();key('KeyW');check('The first key press asks to capture the mouse, no click needed',asked===1);
 asked=0;lockOn();key('KeyW');check('Already captured: no further request',asked===0);lockOff();
 asked=0;fresh();key('Escape');check('Esc never asks for capture',asked===0);
 asked=0;fresh();key('KeyC',{ctrlKey:true});check('Ctrl/Alt/Cmd shortcuts do not ask for capture',asked===0);
 // the player presses Esc: the browser frees the mouse
 fresh();lockOn();document.dispatchEvent(new Event('pointerlockchange'));lockOff();document.dispatchEvent(new Event('pointerlockchange'));
 asked=0;key('KeyW');check('After freeing the cursor, keys do not grab it back',asked===0&&look.released);
 press('pointerdown');check('A click takes it back',asked===1);
 lockOn();document.dispatchEvent(new Event('pointerlockchange'));check('Once recaptured, keys work again afterwards',look.released===false);
 lockOff();delete canvas.requestPointerLock;fresh();}

// ---- interface text ----
fresh();lockOff();pc();check('Hint offers to capture the mouse when it is free',oe('controlText').innerHTML.includes('Any key</kbd> Capture mouse'));
look.released=true;pc();check('After Esc the hint says to click',oe('controlText').innerHTML.includes('Click</kbd> Capture mouse'));look.released=false;
lockOn();pc();check('Hint says Mouse Look once captured',oe('controlText').innerHTML.includes('<kbd>Mouse</kbd> Look'));

// ---- the rifle shares the capture ----
fresh();lockOn();Xt.root.position.set(tx+.3,lookoutTop,tz-1.5);Xt.root.rotation.y=0;Wn=0;fc(1,true);
{expedition.rifle.mount();expedition.advance(1.8);const y=expedition.getState().rifle.yaw,w=Wn;move(100,0,0);
 check('Aiming the rifle with the captured mouse still works, and does not turn the walking camera',expedition.getState().rifle.yaw<y-.1&&Wn===w);
 key=code=>dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));key('KeyE');expedition.advance(1.2);
 const w2=Wn;move(100,0,0);check('After getting up the mouse stays captured and looks around',expedition.getState().rifle.mode==='idle'&&Wn<w2-.2);}
lockOff();Oa();
const pre=document.createElement('pre');pre.id='mouselook-results';pre.hidden=true;pre.textContent=JSON.stringify({results});document.body.append(pre);
