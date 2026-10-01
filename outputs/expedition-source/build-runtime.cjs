globalThis.self=globalThis;
const esbuild=require('./node_modules/esbuild-wasm/lib/browser.js');
const path=require('path');
const fs=require('fs');
(async()=>{
 await esbuild.initialize({wasmModule:await WebAssembly.compile(fs.readFileSync('node_modules/esbuild-wasm/esbuild.wasm')),worker:false});
 const result=await esbuild.build({entryPoints:[path.resolve('human-runtime.js')],bundle:true,format:'iife',globalName:'HumanRuntime',minify:true,write:false,legalComments:'eof',plugins:[{name:'local-files',setup(build){
 build.onResolve({filter:/.*/},args=>{let p=args.path;if(p==='three')p=path.resolve('node_modules/three/build/three.module.js');else if(p.startsWith('three/addons/'))p=path.resolve('node_modules/three/examples/jsm',p.slice(13));else p=path.resolve(args.importer?path.dirname(args.importer):'.',p);return {path:p,namespace:'local'};});
 build.onLoad({filter:/.*/,namespace:'local'},args=>({contents:fs.readFileSync(args.path,'utf8'),resolveDir:path.dirname(args.path),loader:'js'}));
 }}]});
 fs.writeFileSync('human-runtime.bundle.js',result.outputFiles[0].contents);process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});

