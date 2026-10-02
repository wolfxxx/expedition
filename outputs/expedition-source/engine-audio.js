/** Layered Web Audio engine. No AudioContext or sound is created until start(). */
class ExpeditionEngineAudio {
  constructor(){this.context=null;this.nodes=[];this.state='off';this.throttle=0;this.disposed=false;this.token=0;this.timer=null;this.retired=new Map();}
  async start(){
    if(this.disposed)return false;if(this.state==='idle'||this.state==='starting')return true;
    const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return false;
    if(!this.context&&globalThis.navigator?.userActivation&&!navigator.userActivation.isActive)return false;
    const token=++this.token;
    try{this.context ||= new Audio();if(this.context.state!=='running')await this.context.resume();}catch{this.state='unavailable';return false;}
    if(this.disposed||token!==this.token)return false;
    const ctx=this.context,t=ctx.currentTime;this.state='starting';
    let seed=2143;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296*2-1};
    const buffer=(seconds,fn)=>{const b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*seconds),ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=fn(i/ctx.sampleRate,i);return b;};
    const master=ctx.createGain();master.gain.setValueAtTime(.0001,t);master.gain.exponentialRampToValueAtTime(.32,t+.15);
    const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-14;limiter.knee.value=15;limiter.ratio.value=4;limiter.attack.value=.005;limiter.release.value=.12;
    master.connect(limiter);limiter.connect(ctx.destination);this.master=master;
    const nodes=[master,limiter],sources=[];
    const crank=ctx.createBufferSource();crank.buffer=buffer(1.16,(s)=>{const e=Math.exp(-((s*8)%1)*6);return e*(Math.sin(2*Math.PI*71*s)*.30+rnd()*.28)*(Math.min(s*15,1))});
    const crankFilter=ctx.createBiquadFilter();crankFilter.type='bandpass';crankFilter.frequency.value=430;crankFilter.Q.value=.65;
    crank.connect(crankFilter);crankFilter.connect(master);crank.start(t);sources.push(crank);nodes.push(crank,crankFilter);
    // Uneven four-cylinder combustion pulses with resonant exhaust and noisy ignition.
    const sample=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),data=sample.getChannelData(0);
    for(let firing=0;firing<75;firing++){
      const start=Math.floor((firing*(2/75)+(firing?rnd()*.0009:0))*ctx.sampleRate);const amp=.70+(firing%6)*.045;
      for(let j=0;j<ctx.sampleRate*.075;j++){
        const s=j/ctx.sampleRate,i=(start+j+data.length)%data.length;
        const pop=(Math.sin(2*Math.PI*62*s)*.45+Math.sin(2*Math.PI*124*s)*.22+Math.sin(2*Math.PI*215*s)*.10)*Math.exp(-s*48);
        data[i]+=(pop+rnd()*.18*Math.exp(-s*150))*amp;
      }
    }
    const mean=data.reduce((a,b)=>a+b,0)/data.length;for(let i=0;i<data.length;i++)data[i]-=mean;
    const fire=ctx.createBufferSource();fire.buffer=sample;fire.loop=true;
    const exhaust=ctx.createBiquadFilter();exhaust.type='lowpass';exhaust.frequency.value=460;exhaust.Q.value=.72;
    const firingGain=ctx.createGain();firingGain.gain.value=.72;fire.connect(exhaust);exhaust.connect(firingGain);firingGain.connect(master);fire.start(t+.99);sources.push(fire);nodes.push(fire,exhaust,firingGain);
    const air=ctx.createBufferSource();air.buffer=buffer(2,()=>rnd());air.loop=true;
    const airFilter=ctx.createBiquadFilter();airFilter.type='bandpass';airFilter.frequency.value=820;airFilter.Q.value=.5;
    const airGain=ctx.createGain();airGain.gain.value=.035;air.connect(airFilter);airFilter.connect(airGain);airGain.connect(master);air.start(t+1.0);sources.push(air);nodes.push(air,airFilter,airGain);
    const sub=ctx.createOscillator();sub.type='sine';sub.frequency.value=25;
    const subGain=ctx.createGain();subGain.gain.value=.10;sub.connect(subGain);subGain.connect(master);sub.start(t+1.0);sources.push(sub);nodes.push(sub,subGain);
    const wobble=ctx.createOscillator();wobble.frequency.value=5.1;const wobbleGain=ctx.createGain();wobbleGain.gain.value=.009;wobble.connect(wobbleGain);wobbleGain.connect(firingGain.gain);wobble.start(t+1.0);sources.push(wobble);nodes.push(wobble,wobbleGain);
    this.nodes=nodes;this.sources=sources;this.fire=fire;this.airGain=airGain;this.exhaust=exhaust;this.sub=sub;this.firingGain=firingGain;this.airFilter=airFilter;this.setThrottle(this.throttle);
    this.timer=setTimeout(()=>{if(token===this.token&&!this.disposed)this.state='idle'},1200);return true;
  }
  setThrottle(value){
    const state=typeof value==='object'?value:{rpm:850+(Number(value)||0)*4200,load:Number(value)||0};
    this.rpm=Math.max(750,Math.min(5800,state.rpm||850));this.throttle=Math.max(0,Math.min(1,state.load||0));
    if(!this.fire||!this.context||this.state==='off')return;
    const t=this.context.currentTime,r=this.rpm/1125,load=this.throttle;
    // Pitch follows crank speed; exhaust colour and intake growl follow engine load.
    this.fire.playbackRate.setTargetAtTime(r,t,.055);
    this.sub.frequency.setTargetAtTime(this.rpm/60,t,.06);
    this.firingGain.gain.setTargetAtTime(.42+load*.65,t,.045);
    this.exhaust.frequency.setTargetAtTime(330+this.rpm*.16+load*1600,t,.06);
    this.airFilter.frequency.setTargetAtTime(450+this.rpm*.24,t,.08);
    this.airGain.gain.setTargetAtTime(.012+load*.14,t,.05);
  }
  stop({immediate=false}={}){
    ++this.token;clearTimeout(this.timer);this.state='off';const ctx=this.context;if(!ctx||!this.nodes.length)return;
    const nodes=this.nodes.splice(0),sources=this.sources||[],master=this.master;this.fire=null;this.sub=null;
    master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(.00001,ctx.currentTime,.025);
    const clean=()=>{sources.forEach(n=>{try{n.stop()}catch{}});nodes.forEach(n=>{try{n.disconnect()}catch{}})};
    if(immediate)clean();else{const timer=setTimeout(()=>{clean();this.retired.delete(timer)},160);this.retired.set(timer,clean);}
  }
  async dispose(){if(this.disposed)return;this.stop({immediate:true});this.disposed=true;for(const [timer,clean] of this.retired){clearTimeout(timer);clean();}this.retired.clear();if(this.context&&this.context.state!=='closed')await this.context.close();}
  getState(){return this.state;}
  diagnostics(){return {state:this.state,context:this.context?.state||'not-created',activeNodes:this.nodes.length,rpm:this.rpm||850,throttle:this.throttle,playbackRate:this.fire?.playbackRate.value||0,disposed:this.disposed};}
}
