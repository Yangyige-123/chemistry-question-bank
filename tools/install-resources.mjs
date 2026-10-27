import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),cache=path.join(root,'resources');
const version='resources-2026-10-27',base='https://github.com/Yangyige-123/chemistry-question-bank/releases/download/'+version+'/';
async function sha(file){const h=createHash('sha256');for await(const chunk of fs.createReadStream(file))h.update(chunk);return h.digest('hex');}
async function size(file){try{return (await fsp.stat(file)).size}catch{return 0}}
function run(command,args){return new Promise((ok,no)=>{const child=spawn(command,args,{cwd:root,stdio:'inherit',windowsHide:true});child.on('error',no);child.on('exit',code=>code===0?ok():no(Error(command+' failed ('+code+')')));});}
export async function download(pack,cacheDir=cache,baseURL=base){
 const file=path.join(cacheDir,pack.name),temp=file+'.tmp';
 if(await size(file)===pack.bytes&&await sha(file)===pack.sha256){console.log('Ready: '+pack.name);return file;}
 let offset=await size(temp);if(offset>=pack.bytes)offset=0;
 console.log('Downloading '+pack.name+(offset?' (resuming at '+Math.round(offset/1048576)+' MB)':''));
 const response=await fetch(baseURL+pack.name,{headers:offset?{Range:'bytes='+offset+'-'}:{}});
 if(!response.ok)throw Error('Download failed: '+pack.name+' HTTP '+response.status);
 if(response.status===206){const m=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('content-range')||'');if(!m||Number(m[1])!==offset||Number(m[3])!==pack.bytes)throw Error('Unexpected partial download range');}
 else offset=0;
 await pipeline(Readable.fromWeb(response.body),fs.createWriteStream(temp,{flags:offset?'a':'w'}));
 if(await size(temp)!==pack.bytes||await sha(temp)!==pack.sha256)throw Error('Checksum mismatch: '+pack.name+'. Remove its .tmp file and retry.');
 await fsp.rename(temp,file);return file;
}
async function main(){
 if(!['win32','darwin'].includes(process.platform))throw Error('Use Windows or macOS for the automatic ZIP installer.');
 await fsp.mkdir(cache,{recursive:true});const manifestFile=path.join(cache,'resource-packs.json');let manifest;
 try{manifest=JSON.parse(await fsp.readFile(manifestFile,'utf8'));}catch{
  const r=await fetch(base+'resource-packs.json');if(!r.ok)throw Error('Resource release unavailable: HTTP '+r.status);manifest=await r.json();
 }
 if(manifest.version!==version||!Array.isArray(manifest.packs)||manifest.packs.length!==9)throw Error('Unexpected resource manifest');
 const names=new Set();for(const p of manifest.packs){if(!/^resources-[0-9]{2}\.zip$/.test(p.name)||names.has(p.name)||!Number.isSafeInteger(p.bytes)||p.bytes<=0||p.bytes>2**31||!/^[0-9a-f]{64}$/.test(p.sha256))throw Error('Invalid resource manifest');names.add(p.name);}
 await fsp.writeFile(manifestFile,JSON.stringify(manifest,null,2));
 for(const pack of manifest.packs)await download(pack);
 for(const pack of manifest.packs){const file=path.join(cache,pack.name);console.log('Installing '+pack.name);
  if(process.platform==='darwin')await run('/usr/bin/ditto',['-x','-k',file,root]);
  else {const quote=s=>"'"+s.replaceAll("'","''")+"'";await run('powershell.exe',['-NoProfile','-Command','Expand-Archive -LiteralPath '+quote(file)+' -DestinationPath '+quote(root)+' -Force']);}
 }
 await run(process.execPath,[path.join(root,'tools/check-resources.mjs')]);console.log('Installed. Windows: Start.cmd; macOS: Start.command');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);console.error('You may also download all nine ZIPs and resource-packs.json into resources/, then run this installer again.');process.exitCode=1;});
