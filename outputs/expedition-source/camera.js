// Stabilize the look-at target as well as the camera position. Looking directly
// at discrete stair heights caused a pitch jolt even while position was lerping.
const cameraBeforeStairs=fc;
let cameraFootY=null,cameraMode=null;
fc=function(dt,snap=false){
 if(Te!=='walking'){
  cameraFootY=null;cameraMode=Te;cameraBeforeStairs(dt,snap);return;
 }
 Xt.setFirstPerson(false);if(Ze.fov!==55){Ze.fov=55;Ze.updateProjectionMatrix();}Ze.up.copy(Au);
 const p=Xt.root.position;let supportY=p.y;
 if(jumpPhase==='grounded'&&Math.abs(p.x-tx)<.72&&p.z>=stairStart&&p.z<=stairEnd){
  const ramp=stairBase+(p.z-stairStart)/(stairEnd-stairStart)*(lookoutTop-stairBase);
  // Only smooth the stair layer, never pull somebody underneath up toward it.
  if(Math.abs(p.y-ramp)<stairRise+.03)supportY=Math.min(lookoutTop,ramp+stairRise*.5);
 }
 if(snap||cameraFootY===null||cameraMode!=='walking'||Math.abs(supportY-cameraFootY)>2.5)cameraFootY=supportY;
 else cameraFootY+=(supportY-cameraFootY)*(1-Math.exp(-10*dt));
 cameraMode=Te;
 const target=new L(p.x,cameraFootY+1.18,p.z),desired=new L(target.x-Math.sin(Wn)*Da*Math.cos(bs),target.y+Math.sin(bs)*Da+.45,target.z-Math.cos(Wn)*Da*Math.cos(bs));
 r_(target,desired);
 if(snap)Ze.position.copy(desired);else Ze.position.lerp(desired,1-Math.exp(-7*dt));
 Ze.lookAt(target);
};
