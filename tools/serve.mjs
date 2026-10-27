import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.pdf':'application/pdf','.json':'application/json; charset=utf-8','.png':'image/png'};
const allowed=new Set(['offline','sources','output']);
http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
 if(name==='/')name='/offline/index.html';
 const file=path.resolve(root,'.'+name),rel=path.relative(root,file);
 if(rel.startsWith('..')||path.isAbsolute(rel)||!allowed.has(rel.split(path.sep)[0])){res.writeHead(403);res.end();return;}
 fs.stat(file,(err,stat)=>{
 if(err||!stat.isFile()){res.writeHead(404);res.end('File not found. Install the question resource packs if required.');return;}
 fs.realpath(file,(err,real)=>{
 if(err||!real.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Content-Length',stat.size);res.setHeader('Cache-Control','no-store');
 if(req.method==='HEAD'){res.end();return;}const stream=fs.createReadStream(real);stream.on('error',()=>res.destroy());stream.pipe(res);
 });});
}).listen(Number(process.env.CHEM_PORT||4889),'127.0.0.1',()=>console.log('Open http://127.0.0.1:'+(process.env.CHEM_PORT||4889)+'/offline/index.html'));
