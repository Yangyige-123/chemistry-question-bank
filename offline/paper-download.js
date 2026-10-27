/* Downloads a frozen recipe without changing the current question selection. */
(() => {
 let busy=false;
 const filename=payload=>{const title=String(payload.name||'Practice').replace(/\.pdf$/i,'').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').replace(/[. ]+$/g,'').slice(0,180)||'Practice';return title+(payload.mode==='teacher'?' - Answers':payload.mode==='combined'?' - Answers included':'')+'.pdf'};
 async function download(recipe,onStatus=()=>{}){
  if(busy)throw Error('A PDF is already being generated. Please wait.');
  const payload={...recipe,ids:recipe.ids.slice(),options:{...recipe.options}};
  const unavailable=payload.ids.filter(id=>!offlineParts[id]||offlineParts[id].a.status==='excluded');
  if(unavailable.length)throw Error(unavailable.length+' selected parts are unavailable. Restore the paper to review the selection first.');
  busy=true;
  try{
   const modes=payload.mode==='both'?['student','teacher']:[payload.mode],files=[];
   for(const mode of modes){onStatus('Preparing '+(mode==='teacher'?'answers':'paper')+'…');const item={...payload,mode};files.push({filename:filename(item),blob:await ChemExport.buildPDF({...item,onProgress:(done,total)=>onStatus('Preparing '+(mode==='teacher'?'answers':'paper')+'… '+done+' / '+total)})});}
   // Finish both documents before starting either download, so a rendering failure cannot leave half a pair.
   for(let i=0;i<files.length;i++){
    // The in-app browser handles downloads serially; two clicks in one turn can discard the second.
    if(i)await new Promise(resolve=>setTimeout(resolve,1200));
    const file=files[i],url=URL.createObjectURL(file.blob),a=document.createElement('a');a.href=url;a.download=file.filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
   }
   onStatus(files.length===2?'Download started: separate paper and answer PDFs.':'Download started: '+files[0].filename);
   return files.length===2?{files:files.map(f=>({filename:f.filename,bytes:f.blob.size}))}:{filename:files[0].filename,bytes:files[0].blob.size};
  }finally{busy=false}
 }
 window.ChemPaperDownload={download,filename,get busy(){return busy}};
})();
