// Ramp circuit east of the ring road: the layout, shared by the clearing, the grass, the Jeep's physics and the scenery
// (circuit.js). build.py injects this ahead of the terrain function, so it holds only function declarations (they are
// hoisted and safe to call before anything else in the bundle has run).
function circuitLayout(){
 return circuitLayout.v||(circuitLayout.v={
  // a stadium-shaped loop: straights at x=cx-R (driven north) and x=cx+R (driven south) from z0 to z1, joined by half circles
  cx:56,z0:-34,z1:30,R:9,half:4.5,clear:19,
  link:{x0:37,x1:48,z:16,half:3},                       // a dirt link from the ring road to the inner straight
  start:-32,                                            // start/finish line across the inner straight
  // lip: where the ramp ends (the take-off edge), dir: driving direction along z, up: run-up length, top: flat top length,
  // back: length of the slope down behind it, H: height, k: run-up curve (1 straight, >1 steepening into the lip),
  // w: half-width of the full-height part (the sides then slope away). Each jump has a flat run-out to land on.
  ramps:[
   {name:'Roller',x:47,lip:-26,dir:1,up:1.8,top:0,back:1.8,H:.5,k:1,w:3},
   {name:'Roller',x:47,lip:-22,dir:1,up:1.8,top:0,back:1.8,H:.5,k:1,w:3},
   {name:'Roller',x:47,lip:-18,dir:1,up:1.8,top:0,back:1.8,H:.5,k:1,w:3},
   {name:'Kicker',x:47,lip:-2,dir:1,up:6,top:0,back:10,H:1.5,k:1.8,w:2.6,wood:true},
   {name:'Tabletop',x:65,lip:16,dir:-1,up:4,top:6,back:4,H:1.2,k:1,w:2.6},
   {name:'Big kicker',x:65,lip:-2,dir:-1,up:7,top:0,back:12,H:2.2,k:1.8,w:2.6,wood:true}
  ]
 });
}
// distance from the loop's centreline
function circuitCentreDistance(x,z){const c=circuitLayout(),cz=Math.max(c.z0,Math.min(c.z1,z));return Math.abs(Math.hypot(x-c.cx,z-cz)-c.R);}
// on the dirt surface (loop or link)
function circuitTrack(x,z){const c=circuitLayout(),l=c.link;return circuitCentreDistance(x,z)<c.half||Math.abs(z-l.z)<l.half&&x>l.x0&&x<l.x1;}
// inside the cleared ground: no trees, stones or bushes
function circuitClearing(x,z){
 const c=circuitLayout(),l=c.link,cz=Math.max(c.z0,Math.min(c.z1,z));
 return Math.hypot(x-c.cx,z-cz)<c.clear||Math.abs(z-l.z)<l.half+2&&x>l.x0&&x<l.x1;
}
// height of one ramp above the ground at a point
function circuitRampProfile(r,x,z){
 const t=(z-r.lip)*r.dir,u=Math.abs(x-r.x),bevel=Math.max(1,r.H*.9);
 if(t<-(r.up+r.top)||t>r.back||u>r.w+bevel)return 0;
 const along=t<-r.top?Math.pow((t+r.top+r.up)/r.up,r.k):t<=0?1:1-t/r.back;
 const s=u<r.w?0:(u-r.w)/bevel,side=1-s*s*(3-2*s);              // the sides roll smoothly down to the ground
 return r.H*along*side;
}
// height of the ramps above the ground (0 away from them)
function circuitRampHeight(x,z){
 if(x<40||x>72||z<-50||z>46)return 0;
 let top=0;for(const r of circuitLayout().ramps){const h=circuitRampProfile(r,x,z);if(h>top)top=h;}
 return top;
}
