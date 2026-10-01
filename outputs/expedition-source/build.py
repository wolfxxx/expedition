"""Rebuild the self-contained offline game. Requires Python 3; no packages."""
from pathlib import Path
import base64
root=Path(__file__).resolve().parent
html=(root/'base.html').read_text(encoding='utf-8')
old='return s+r}function Tu()'
new='let lakeD=lakeDistance(i,t),natural=s+r;if(lakeD<12)return -1.65+1.95*Ia(6.5,12,lakeD);return natural+(.3-natural)*(1-Ia(12,15,lakeD))}function Tu()'
assert old in html, 'Expected original terrain function'
html=html.replace(old,new)
html=html.replace('function We(i,t){','function lakeDistance(x,z){let dx=x+22,dz=(z-5)/.8,a=Math.atan2(dz,dx);return Math.hypot(dx,dz)/(1+.09*Math.sin(3*a)+.055*Math.cos(5*a))}function We(i,t){',1)
html=html.replace('new Ge(280,280,150,150)','new Ge(280,280,240,240)',1)
html=html.replace('if(A(it,vt)<4.7||Math.hypot(it-10,vt+8)<7)','if(lakeDistance(it,vt)<13||A(it,vt)<4.7||Math.hypot(it-10,vt+8)<7)',1)
html=html.replace('if(Math.hypot(V,q)<12||A(V,q)<4)','if(lakeDistance(V,q)<12.6||(Math.abs(V+8.8)<1.8&&q>0&&q<10)||Math.hypot(V,q)<12||A(V,q)<4)',1)
html=html.replace('Math.hypot(V,q)<10||A(V,q)<3.1||B.push','lakeDistance(V,q)<12.6||Math.hypot(V,q)<10||A(V,q)<3.1||B.push',1)
html=html.replace('if(n.y=Je.height(n.x,n.z),!Je.colliders.some','if(n.y=Je.height(n.x,n.z),lakeDistance(n.x,n.z)>11.1&&!Je.colliders.some',1)
runtime=(root/'human-runtime.bundle.js').read_text(encoding='utf-8')
encoded=base64.b64encode((root/'ranger.glb').read_bytes()).decode('ascii')
html=html.replace('<script>(()=>{','<script>'+runtime+'</script><script>(()=>{',1)
assert 'Xt=Eu();' in html
html=html.replace('Xt=Eu();','Xt=HumanRuntime.create("'+encoded+'");',1)
html=html.replace('</style>','\n'+(root/'polish.css').read_text(encoding='utf-8')+'\n</style>',1)
marker='Oa();Na();oe("loading").hidden=!0;requestAnimationFrame(Ou);})();'
assert marker in html, 'Expected original initialization marker'
startup='window.expedition.ready=Xt.ready;Xt.ready.then(()=>{Oa();Na();oe("loading").hidden=!0;requestAnimationFrame(Ou);}).catch(error=>{oe("loading").textContent="Character could not load. Please reopen this file in Chrome or Edge.";console.error(error);});})();'
html=html.replace(marker,'\n'+(root/'valley.js').read_text(encoding='utf-8')+'\n'+(root/'motion.js').read_text(encoding='utf-8')+'\n'+startup)
out=root/'Expedition-Wildhaven.html'
out.write_text(html,encoding='utf-8')
tests=(root/'checks.js').read_text(encoding='utf-8')
(root/'checks.html').write_text(html.replace('</body>','<script>expedition.ready.then(()=>{'+tests+'});</script></body>'),encoding='utf-8')
print('Built',out)
