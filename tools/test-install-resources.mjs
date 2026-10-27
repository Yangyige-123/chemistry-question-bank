import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import os from 'node:os';
import {download} from './install-resources.mjs';
const folder=await fs.mkdtemp(path.join(os.tmpdir(),'chem-download-test-'));
const bytes=Buffer.from('resource-fixture'),sha256=createHash('sha256').update(bytes).digest('hex');
const originalFetch=globalThis.fetch;
try{
 let calls=0;
 const pack={name:'resources-01.zip',bytes:bytes.length,sha256};
 globalThis.fetch=async()=>{calls++;return new Response(bytes)};
 await download(pack,folder,'https://example.test/');assert.equal(calls,1);
 globalThis.fetch=()=>{throw Error('Existing verified package must not download')};await download(pack,folder);
 const resumed={...pack,name:'resources-02.zip'};await fs.writeFile(path.join(folder,resumed.name+'.tmp'),bytes.subarray(0,4));
 globalThis.fetch=async(url,opts)=>{assert.equal(opts.headers.Range,'bytes=4-');return new Response(bytes.subarray(4),{status:206,headers:{'Content-Range':`bytes 4-${bytes.length-1}/${bytes.length}`}})};
 await download(resumed,folder);assert.deepEqual(await fs.readFile(path.join(folder,resumed.name)),bytes);
 const fallback={...pack,name:'resources-03.zip'};await fs.writeFile(path.join(folder,fallback.name+'.tmp'),bytes.subarray(0,4));globalThis.fetch=async()=>new Response(bytes);
 await download(fallback,folder);assert.deepEqual(await fs.readFile(path.join(folder,fallback.name)),bytes);
 globalThis.fetch=async()=>new Response('corrupted');await assert.rejects(download({...pack,name:'resources-04.zip'},folder),/Checksum mismatch/);
 const badRange={...pack,name:'resources-05.zip'};await fs.writeFile(path.join(folder,badRange.name+'.tmp'),bytes.subarray(0,4));globalThis.fetch=async()=>new Response(bytes.subarray(4),{status:206,headers:{'Content-Range':`bytes 0-${bytes.length-1}/${bytes.length}`}});
 await assert.rejects(download(badRange,folder),/partial download range/);
 console.log('PASS: full download, cache reuse, resumed download, server fallback, corrupt data and invalid range.');
}finally{globalThis.fetch=originalFetch;await fs.rm(folder,{recursive:true,force:true});}