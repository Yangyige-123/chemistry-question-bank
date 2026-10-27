import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'resource-manifest.json')));
const missing=manifest.files.filter(f=>{try{return fs.statSync(path.join(root,f.path)).size!==f.bytes}catch{return true}});
if(missing.length){console.error(`${missing.length} resources missing or incomplete. Run Install-resources.ps1 or extract all release resource ZIPs here.`);process.exitCode=1}else console.log(`All ${manifest.files.length} resources ready.`);
