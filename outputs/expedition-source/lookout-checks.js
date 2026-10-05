
const results=[];const check=(name,pass)=>results.push({name,pass});
function place(x,z,y,yaw){Oa();Xt.root.position.set(x,y,z);Wn=yaw;Xt.root.rotation.y=yaw;Ni.set(0,0,0);fc(1,true);}
let recentBodyStep=0;let recentCameraTurn=0;function walk(t){recentCameraTurn=0;recentBodyStep=0;let bodyY=Xt.root.position.y+Xt.getElevationOffset();let q=Ze.quaternion.clone();Ue.add('KeyW');for(let i=0;i<Math.ceil(t*60);i++){expedition.advance(1/60);recentBodyStep=Math.max(recentBodyStep,Math.abs(Xt.root.position.y+Xt.getElevationOffset()-bodyY));bodyY=Xt.root.position.y+Xt.getElevationOffset();recentCameraTurn=Math.max(recentCameraTurn,q.angleTo(Ze.quaternion));q.copy(Ze.quaternion);}Ue.delete('KeyW');}
place(tx,stairStart-.45,world.height(tx,stairStart-.45),0);
fc(1,true);let previousRotation=Ze.quaternion.clone(),maxCameraTurn=0;let maxBodyStep=0,previousBodyY=Xt.root.position.y+Xt.getElevationOffset();let maxRise=0,previousY=Xt.root.position.y;Ue.add('KeyW');for(let i=0;i<170;i++){expedition.advance(1/60);maxCameraTurn=Math.max(maxCameraTurn,previousRotation.angleTo(Ze.quaternion));previousRotation.copy(Ze.quaternion);maxBodyStep=Math.max(maxBodyStep,Math.abs(Xt.root.position.y+Xt.getElevationOffset()-previousBodyY));previousBodyY=Xt.root.position.y+Xt.getElevationOffset();maxRise=Math.max(maxRise,Xt.root.position.y-previousY);previousY=Xt.root.position.y;}Ue.clear();
check('Climb stairs onto deck',Math.abs(Xt.root.position.y-lookoutTop)<.02&&Xt.root.position.z>tz-1.5);check('Stairs rise one step at a time',maxRise<.26);check('Character ascends smoothly',maxBodyStep<.07);check('Stair camera has no per-step pitch jolts',maxCameraTurn<.025);
const top=Xt.root.position.toArray();Wn=Math.PI;fc(1,true);walk(3.2);check('Character descends smoothly',recentBodyStep<.07);check('Descent camera remains steady',recentCameraTurn<.025);check('Walk back down to terrain',Math.abs(Xt.root.position.y-world.height(Xt.root.position.x,Xt.root.position.z))<.02&&Xt.root.position.z<stairStart);
place(tx-3,tz,world.height(tx-3,tz),Math.PI/2);walk(2.4);check('Walk underneath deck without teleporting up',Xt.root.position.x>tx+2&&Xt.root.position.y<lookoutTop-2);
place(tx,tz,lookoutTop,Math.PI/2);walk(1);check('Deck guardrail blocks walking off side',Xt.root.position.x<tx+1.5&&Math.abs(Xt.root.position.y-lookoutTop)<.01);
check('Under-deck ceiling detected',Math.abs(world.walkCeiling(tx,tz,ty)-(lookoutTop-.2))<.01);
place(tx,stairStart-.45,world.height(tx,stairStart-.45),0);Ue.add('ShiftLeft');walk(1.7);Ue.clear();check('Character runs up stairs smoothly',recentBodyStep<.09);check('Running stair camera remains steady',recentCameraTurn<.025);check('Run up stairs onto platform',Math.abs(Xt.root.position.y-lookoutTop)<.02);
place(tx,tz,lookoutTop,0);dispatchEvent(new KeyboardEvent('keydown',{code:'Space'}));dispatchEvent(new KeyboardEvent('keyup',{code:'Space'}));expedition.advance(1.3);check('Jump lands back on deck',Math.abs(Xt.root.position.y-lookoutTop)<.02&&jumpPhase==='grounded');
place(tx,tz,lookoutTop,0);Wn=.8;Da=7;bs=.3;fc(1,true);Fu=()=>{};
let roadClearance=Infinity;
for(let x=tx-2;x<=tx+2;x+=.2)for(let z=stairStart-1;z<=tz+2;z+=.2)roadClearance=Math.min(roadClearance,world.roadDistance(x,z));
check('Entire lookout and stair approach clear the road shoulder',roadClearance>5);
const landmark=places.find(p=>p.name==='Ranger lookout');check('Discovery marker follows relocated lookout',landmark.x===tx&&landmark.z===tz);
check('Rifle loaded and resting on its bipod at the deck centre',!!lookoutRifle&&Math.abs(rifleMount.position.x-tx)<.001&&Math.abs(rifleMount.position.z-tz)<.001&&Math.abs(rifleMount.position.y-(lookoutTop+.015+RIFLE.butt))<.001);
check('Rifle butt is inside the rails and its muzzle points out over the valley',Math.hypot(rifleMount.position.x-tx,rifleMount.position.z-tz)<.5&&Math.abs(Math.atan2(expedition.rifle.muzzle()[0]-tx,expedition.rifle.muzzle()[2]-tz)-RIFLE.restYaw)<.05);
{const M=expedition.lookoutMeadow,trees=Je.colliders.filter(c=>!c.solid&&c.r>=.25&&c.r<.45&&c.height>2.5&&Math.hypot(c.x-tx,c.z-tz)<M.r);
check('The lookout stands in the open: trees and bushes within 16 m were cleared, its posts are still there',M.cleared.colliders>=10&&M.cleared.instances>=20&&trees.length===0&&Je.colliders.filter(c=>Math.abs(c.r-.16)<.001&&Math.hypot(c.x-tx,c.z-tz)<3).length>=4);}
const pre=document.createElement('pre');pre.id='lookout-results';pre.hidden=true;pre.textContent=JSON.stringify({results,rifle:lookoutRifle.userData,roadClearance,top,maxRise,maxBodyStep,maxCameraTurn,stairRise});document.body.append(pre);
