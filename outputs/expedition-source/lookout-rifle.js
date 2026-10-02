// Supplied rifle rests on its bipod at the rear of the lookout deck.
let lookoutRifle=null;
const rifleReady=HumanRuntime.loadProp('__RIFLE_GLB__',1.55).then(model=>{
 lookoutRifle=model;model.name='Heavy sniper rifle · lookout';model.position.set(tx,lookoutTop+.015,tz+1.02);bn.add(model);
 return model;
});
const rifleState=window.expedition.getState;
window.expedition.getState=()=>({...rifleState(),lookoutRifle:lookoutRifle?{loaded:true,position:lookoutRifle.position.toArray(),...lookoutRifle.userData}:{loaded:false}});
