(()=>{
 const api=window.portableApp;if(!api)return;let last='',timer;
 try{const saved=api.load(),stamp=Number(localStorage.getItem('chem-portable-write-time')||0);if(saved?.storage&&(!localStorage.length||saved.updatedAt>=stamp)){for(const k of Object.keys(localStorage))if(k.startsWith('chem-'))localStorage.removeItem(k);for(const [k,v]of Object.entries(saved.storage))if(k.startsWith('chem-')&&typeof v==='string')localStorage.setItem(k,v);}}
 catch(error){console.error('Portable restore:',error);}
 if(!localStorage.getItem('chem-ui-settings-v1'))localStorage.setItem('chem-ui-settings-v1',JSON.stringify({language:'zh'}));
 function flush(){try{const storage={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key.startsWith('chem-')&&key!=='chem-portable-write-time')storage[key]=localStorage.getItem(key);}const snapshot=JSON.stringify(storage);if(snapshot===last)return;const result=api.save(storage);if(result?.ok){last=snapshot;localStorage.setItem('chem-portable-write-time',String(result.updatedAt));}else console.error('Portable save:',result?.error);}catch(error){console.error('Portable save:',error);}}
 function notice(text){if(typeof toast==='function')toast(text);else console.info(text);}
 api.onImport(text=>{try{if(!window.ChemHistory)throw Error('请等待题库加载完成。');const n=ChemHistory.importBackup(text);flush();document.getElementById('historyBtn')?.click();notice('已导入 '+n+' 份历史试卷。');}catch(error){notice(error.message);}});

 async function copyImageAt(point){
  try{
   const target=document.elementFromPoint(point.x,point.y),img=target?.closest('img');if(!img)throw Error('请在题目图片上点击右键');
   await img.decode();let source=img,box=null;
   // Question previews embed an original PNG inside an SVG viewport. Copy the
   // original crop at source resolution, rather than a screen-sized SVG wrapper.
   if(img.currentSrc.startsWith('data:image/svg+xml')){
    const uri=img.currentSrc,comma=uri.indexOf(','),xml=uri.slice(0,comma).includes(';base64')?atob(uri.slice(comma+1)):decodeURIComponent(uri.slice(comma+1));
    const svg=new DOMParser().parseFromString(xml,'image/svg+xml').documentElement;
    const embedded=svg.querySelector('image'),view=(svg.getAttribute('viewBox')||'').trim().split(/\s+/).map(Number);
    if(!embedded||view.length!==4||view.some(v=>!Number.isFinite(v)))throw Error('图片裁切信息无效');
    source=new Image();source.src=embedded.getAttribute('href')||embedded.getAttributeNS('http://www.w3.org/1999/xlink','href');await source.decode();
    const sx=source.naturalWidth/Number(embedded.getAttribute('width')),sy=source.naturalHeight/Number(embedded.getAttribute('height'));
    box=[view[0]*sx,view[1]*sy,view[2]*sx,view[3]*sy];
   }
   const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(box?box[2]:source.naturalWidth));canvas.height=Math.max(1,Math.round(box?box[3]:source.naturalHeight));
   if(canvas.width*canvas.height>60000000)throw Error('图片过大，请分段复制');
   const context=canvas.getContext('2d');context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);
   if(box)context.drawImage(source,...box,0,0,canvas.width,canvas.height);else context.drawImage(source,0,0);
   const result=await api.copyImage(canvas.toDataURL('image/png'));if(!result?.ok)throw Error(result?.error||'复制失败');notice('图片已复制，可直接粘贴到 Word、微信或其他应用。');
  }catch(error){notice('复制图片失败：'+error.message);}
 }
 api.onCopyImage?.(copyImageAt);
 api.onNotice(notice);window.addEventListener('beforeunload',flush);window.addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});timer=setInterval(flush,1500);flush();
})();
