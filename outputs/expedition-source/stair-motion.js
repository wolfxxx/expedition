// Keep physical feet on discrete treads while the rendered body follows a
// continuous stair profile. This prevents every riser jolting the whole mesh.
const stairWalkingOriginal=t_;
t_=function(dt){
 const beforeY=Xt.root.position.y,visibleY=beforeY+Xt.getElevationOffset();
 Xt.setElevationOffset(0);stairWalkingOriginal(dt);
 if(Te!=='walking'||jumpPhase!=='grounded')return;
 const p=Xt.root.position;let target=p.y,onStairs=false;
 if(Math.abs(p.x-tx)<.72&&p.z>=stairStart&&p.z<=stairEnd){
  const ramp=stairBase+(p.z-stairStart)/(stairEnd-stairStart)*(lookoutTop-stairBase);
  if(Math.abs(p.y-ramp)<stairRise+.03){target=Math.min(lookoutTop,ramp+stairRise*.5);onStairs=true;}
 }
 if(Math.abs(p.y-beforeY)>.5)return;
 if(onStairs||Math.abs(visibleY-p.y)>.001){
  const nextY=visibleY+(target-visibleY)*(1-Math.exp(-18*dt));
  Xt.setElevationOffset(nextY-p.y);
 }
};
const stairInteractionOriginal=Uu;
oe('action').removeEventListener('click',stairInteractionOriginal);
Uu=function(){stairInteractionOriginal();if(Le)Xt.setElevationOffset(0);};
oe('action').addEventListener('click',Uu);
const stairStateOriginal=window.expedition.getState;
window.expedition.getState=()=>({...stairStateOriginal(),renderedFootHeight:Xt.root.position.y+Xt.getElevationOffset()});
