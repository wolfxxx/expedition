// Mouse-look for walking and driving: the first key press (or click) captures the mouse, then moving it turns the camera
// with no button held. A click punches at once. Esc frees the cursor (a click takes it back), and dragging still looks around when it is free.
// (Aiming the rifle has its own handler in lookout-rifle.js and shares the same capture.)
const look={ignoreUpUntil:0,released:false}; // released: the player freed the cursor on purpose, so only a click takes it back
const lookCanvas=Ae.domElement;
function lookLocked(){return document.pointerLockElement===lookCanvas;}
function lookCapture(){try{lookCanvas.requestPointerLock?.()?.catch?.(()=>{});}catch{}}
// The click that captures the mouse is not also a punch: swallow its release if the capture was granted.
document.addEventListener('pointerlockchange',()=>{
 if(lookLocked()){look.ignoreUpUntil=performance.now()+600;look.released=false;}
 else look.released=true;
});
// Browsers only allow capture after a user action, and a key press counts: the first W/A/S/D (or any key) takes the mouse,
// so there is no need to click first. After Esc it waits for a click instead.
addEventListener('keydown',e=>{
 if(e.code==='Escape'||e.repeat||lookLocked()||look.released||e.ctrlKey||e.metaKey||e.altKey)return;
 lookCapture();
});
lookCanvas.addEventListener('pointerdown',e=>{
 if(e.button!==0||e.pointerType==='touch')return;
 if(lookLocked())look.ignoreUpUntil=0;else lookCapture();
});
// Runs before the game's own drag handler. While captured, moving the mouse is enough; the drag handler never sees it.
lookCanvas.addEventListener('pointermove',e=>{
 if(!lookLocked()||rifle.mode!=='idle')return;
 e.stopImmediatePropagation();
 if(Te==='walking')Wn-=e.movementX*.0032;else Er-=e.movementX*.0032;
 bs=Mn(bs+e.movementY*.0024,.04,.85);
},{capture:true});
const lookHud=pc;
pc=function(){
 lookHud();
 if(rifle.mode!=='idle')return;
 const text=oe('controlText');
 text.innerHTML=text.innerHTML.replace('<kbd>Drag</kbd> Look',lookLocked()?'<kbd>Mouse</kbd> Look':look.released?'<kbd>Click</kbd> Capture mouse':'<kbd>Any key</kbd> Capture mouse');
};
