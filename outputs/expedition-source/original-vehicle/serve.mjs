import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const directory=dirname(fileURLToPath(import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json','.txt':'text/plain'};
http.createServer(async(req,res)=>{
  try{const url=new URL(req.url,'http://localhost'),path=resolve(directory,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!path.startsWith(directory+sep)){res.writeHead(403).end();return;}const bytes=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404).end('Not found');}
}).listen(Number(process.env.PORT||8080),'127.0.0.1',()=>console.log('Viewer: http://127.0.0.1:'+(process.env.PORT||8080)));
