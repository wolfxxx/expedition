const driveResults=[];const verify=(name,pass)=>driveResults.push({name,pass:!!pass});
Oa();Te='driving';zt.root.attach(Xt.root);Xt.root.position.copy(wu);
const originalCollision=e_;e_=()=>false;
Ue.add('KeyW');let shiftDrops=0,previousRPM=850,zeroToSixty=null;
for(let frame=0;frame<420;frame++){i_(1/60);if(frame===59)verify('Strong acceleration: 25 km/h within one second',le*3.6>25);if(le*3.6>=60&&zeroToSixty===null)zeroToSixty=(frame+1)/60;if(drivetrain.rpm<previousRPM-100)shiftDrops++;previousRPM=drivetrain.rpm;}
verify('Top speed reaches 97 km/h',Math.abs(le*3.6-97.2)<.1);verify('Five gears engage with audible RPM drops',drivetrain.gear===5&&shiftDrops>=4);Ue.clear();
Ue.add('Space');for(let i=0;i<90;i++)i_(1/60);Ue.clear();verify('Handbrake stops from top speed within 1.5 seconds',le===0);
Ue.add('KeyS');for(let i=0;i<100;i++)i_(1/60);Ue.clear();verify('Reverse speed is limited',le===-7);
zt.root.position.set(0,0,0);Xe=0;le=27;let sweepCalls=0;e_=(x,z)=>{sweepCalls++;return z>=.2;};i_(1/60);verify('Fast movement stops before a thin barrier',le===0&&zt.root.position.z<.2&&sweepCalls>=2);
e_=originalCollision;Oa();verify('Reset clears drivetrain',drivetrain.gear===1&&drivetrain.rpm===850);
Fu=()=>{};
const report=document.createElement('pre');report.id='driving-results';report.textContent=JSON.stringify({results:driveResults,zeroToSixty});report.style='position:absolute;top:0;left:0;background:white;color:black;z-index:999;padding:10px;max-width:700px;white-space:pre-wrap';document.body.append(report);
const button=document.createElement('button');button.textContent='Test engine sound';button.style='position:absolute;bottom:10px;left:40%;z-index:999';document.body.append(button);
button.onclick=async()=>{
 button.disabled=true;const audio=new Ca();await audio.start();
 const meter=audio.context.createAnalyser();meter.fftSize=1024;audio.master.connect(meter);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));const levels=[];
 for(const state of [{rpm:850,load:.05},{rpm:4800,load:1},{rpm:2800,load:1},{rpm:2800,load:0}]){
  audio.setThrottle(state);await wait(1400);const samples=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(samples);levels.push({rpm:state.rpm,load:state.load,rate:audio.fire.playbackRate.value,cutoff:audio.exhaust.frequency.value,rms:Math.sqrt(samples.reduce((sum,x)=>sum+x*x,0)/samples.length)});
 }
 verify('Engine generates audio at idle and under load',levels.every(s=>s.rms>.001));verify('Engine pitch rises with RPM and drops after a shift',levels[1].rate>levels[0].rate*3&&levels[2].rate<levels[1].rate*.7);verify('Lifting throttle softens exhaust at the same RPM',levels[3].cutoff<levels[2].cutoff*.6);
 await audio.dispose();verify('Engine stops and releases its audio nodes',audio.nodes.length===0&&audio.context.state==='closed');meter.disconnect();
 report.textContent=JSON.stringify({results:driveResults,zeroToSixty,levels});button.textContent='Engine tests complete';
};
