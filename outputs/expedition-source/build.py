"""Rebuild the self-contained offline game. Requires Python 3; no packages."""
from pathlib import Path
import base64
root=Path(__file__).resolve().parent
html=(root/'base.html').read_text(encoding='utf-8')
engine=(root/'engine-audio.js').read_text(encoding='utf-8').replace('class ExpeditionEngineAudio','var Ca=class')
start=html.index('var Ca=class{')
end=html.index(';function Mu(',start)
html=html[:start]+engine+html[end:]
old='return s+r}function Tu()'
new='let lakeD=lakeDistance(i,t),natural=s+r;if(lakeD<12)return -1.65+1.95*Ia(6.5,12,lakeD);return natural+(.3-natural)*(1-Ia(12,15,lakeD))}function Tu()'
assert old in html, 'Expected original terrain function'
html=html.replace(old,new)
html=html.replace('function We(i,t){','function lookoutClearing(x,z){return Math.abs(x-18)<5&&z>26&&z<40}function lakeDistance(x,z){let dx=x+22,dz=(z-5)/.8,a=Math.atan2(dz,dx);return Math.hypot(dx,dz)/(1+.09*Math.sin(3*a)+.055*Math.cos(5*a))}function We(i,t){',1)
html=html.replace('new Ge(280,280,150,150)','new Ge(280,280,240,240)',1)
html=html.replace('if(A(it,vt)<4.7||Math.hypot(it-10,vt+8)<7)','if(lookoutClearing(it,vt)||lakeDistance(it,vt)<13||A(it,vt)<4.7||Math.hypot(it-10,vt+8)<7)',1)
html=html.replace('if(Math.hypot(V,q)<12||A(V,q)<4)','if(lookoutClearing(V,q)||lakeDistance(V,q)<12.6||(Math.abs(V+8.8)<1.8&&q>0&&q<10)||Math.hypot(V,q)<12||A(V,q)<4)',1)
html=html.replace('Math.hypot(V,q)<10||A(V,q)<3.1||B.push','lookoutClearing(V,q)||lakeDistance(V,q)<12.6||Math.hypot(V,q)<10||A(V,q)<3.1||B.push',1)
html=html.replace('Xt.root.position.y=Je.height(Xt.root.position.x,Xt.root.position.z);let c=', 'Xt.root.position.y=Je.walkHeight(Xt.root.position.x,Xt.root.position.z,l.y);let c=',1)
runtime=(root/'human-runtime.bundle.js').read_text(encoding='utf-8')
encoded=base64.b64encode((root/'ranger.glb').read_bytes()).decode('ascii')
html=html.replace('<script>(()=>{','<script>'+runtime+'</script><script>(()=>{',1)
assert 'Xt=Eu();' in html
html=html.replace('Xt=Eu();','Xt=HumanRuntime.create("'+encoded+'");',1)
html=html.replace('</style>','\n'+(root/'polish.css').read_text(encoding='utf-8')+'\n</style>',1)
marker='Oa();Na();oe("loading").hidden=!0;requestAnimationFrame(Ou);})();'
assert marker in html, 'Expected original initialization marker'
startup='window.expedition.ready=Promise.all([Xt.ready,rifleReady]);window.expedition.ready.then(()=>{Oa();Na();oe("loading").hidden=!0;requestAnimationFrame(Ou);}).catch(error=>{oe("loading").textContent="Character could not load. Please reopen this file in Chrome or Edge.";console.error(error);});})();'
html=html.replace(marker,'\n'+(root/'valley.js').read_text(encoding='utf-8')+'\n'+(root/'lookout.js').read_text(encoding='utf-8')+'\n'+(root/'motion.js').read_text(encoding='utf-8')+'\n'+(root/'world-audio.js').read_text(encoding='utf-8-sig')+'\n'+(root/'stair-motion.js').read_text(encoding='utf-8-sig')+'\n'+(root/'camera.js').read_text(encoding='utf-8-sig')+'\n'+(root/'driving.js').read_text(encoding='utf-8')+'\n'+(root/'poison-dwarf.js').read_text(encoding='utf-8-sig')+'\n'+(root/'combat.js').read_text(encoding='utf-8-sig')+'\n'+(root/'lookout-rifle.js').read_text(encoding='utf-8-sig').replace('__RIFLE_GLB__',base64.b64encode((root/'heavy_sniper_rifle.glb').read_bytes()).decode('ascii'))+'\n'+(root/'roadkill.js').read_text(encoding='utf-8-sig')+'\n'+(root/'mouselook.js').read_text(encoding='utf-8-sig')+'\n'+startup)
out=root/'Expedition-Wildhaven.html'
out.write_text(html,encoding='utf-8')
tests=(root/'checks.js').read_text(encoding='utf-8')
(root/'checks.html').write_text(html.replace('</body>','<script>expedition.ready.then(()=>{'+tests+'});</script></body>'),encoding='utf-8')
print('Built',out)

(root/'audio-checks.html').write_text(html.replace('</body>',(root/'audio-checks.fragment.html').read_text(encoding='utf-8')+'</body>'),encoding='utf-8')

(root/'lookout-checks.html').write_text(html.replace('window.expedition.ready.then(()=>{Oa();Na();','window.expedition.ready.then(()=>{Oa();'+(root/'lookout-checks.js').read_text(encoding='utf-8')+'Na();',1),encoding='utf-8')

(root/'spring-checks.html').write_text(html.replace('window.expedition.ready.then(()=>{Oa();Na();','window.expedition.ready.then(()=>{Oa();'+(root/'spring-checks.js').read_text(encoding='utf-8-sig')+'Na();',1),encoding='utf-8')

(root/'driving-checks.html').write_text(html.replace('window.expedition.ready.then(()=>{Oa();Na();','window.expedition.ready.then(()=>{Oa();'+(root/'driving-checks.js').read_text(encoding='utf-8-sig')+'Na();',1),encoding='utf-8')

(root/'dwarf-checks.html').write_text(html.replace('window.expedition.ready.then(()=>{Oa();Na();','window.expedition.ready.then(()=>{Oa();'+(root/'dwarf-checks.js').read_text(encoding='utf-8-sig')+'Na();',1),encoding='utf-8')

(root/'combat-checks.html').write_text(html.replace('window.expedition.ready.then(()=>{Oa();Na();','window.expedition.ready.then(()=>{Oa();'+(root/'combat-checks.js').read_text(encoding='utf-8-sig')+'Na();',1),encoding='utf-8')

(root/'rifle-checks.html').write_text(html.replace('window.expedition.ready.then(()=>{Oa();Na();','window.expedition.ready.then(()=>{Oa();'+(root/'rifle-checks.js').read_text(encoding='utf-8-sig')+'Na();',1),encoding='utf-8')

(root/'roadkill-checks.html').write_text(html.replace('window.expedition.ready.then(()=>{Oa();Na();','window.expedition.ready.then(()=>{Oa();'+(root/'roadkill-checks.js').read_text(encoding='utf-8-sig')+'Na();',1),encoding='utf-8')

(root/'mouselook-checks.html').write_text(html.replace('window.expedition.ready.then(()=>{Oa();Na();','window.expedition.ready.then(()=>{Oa();'+(root/'mouselook-checks.js').read_text(encoding='utf-8-sig')+'Na();',1),encoding='utf-8')
