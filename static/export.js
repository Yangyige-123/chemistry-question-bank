/* Export settings apply to both the layout and the original question images. */
(() => {
  const safe = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function options(payload) {
    return {year:true,source:true,marks:true,topics:payload.mode==='teacher',nameField:true,answerLines:true,dataTable:false,periodicTable:false,...payload.options};
  }
  let referencePromise;
  function referencePages(){if(window.CHEM_REFERENCE_PAGES)return Promise.resolve(window.CHEM_REFERENCE_PAGES);if(!referencePromise)referencePromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='assets/reference-appendices.js';script.onload=()=>window.CHEM_REFERENCE_PAGES?resolve(window.CHEM_REFERENCE_PAGES):reject(Error('Reference appendices are unavailable.'));script.onerror=()=>{referencePromise=null;reject(Error('Reference appendices are unavailable.'))};document.head.appendChild(script)});return referencePromise;}
  let igReferencePromise;
  async function selectedReferencePages(groups){const qualifications=[...new Set([...groups.keys()].map(id=>offlinePs[offlineQs[id].paper].qualification||'9701'))],sets=[];if(qualifications.some(q=>q!=='0620'))sets.push({code:'9701',refs:await referencePages()});if(qualifications.includes('0620')){if(!window.CHEM_IGCSE_REFERENCE_PAGES){if(!igReferencePromise)igReferencePromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='assets/igcse-reference-appendices.js';script.onload=()=>window.CHEM_IGCSE_REFERENCE_PAGES?resolve():reject(Error('IGCSE reference pages unavailable.'));script.onerror=()=>{igReferencePromise=null;reject(Error('IGCSE reference pages unavailable.'))};document.head.appendChild(script)});await igReferencePromise;}sets.push({code:'0620',refs:window.CHEM_IGCSE_REFERENCE_PAGES});}return sets;}
  function sourceLabel(q,o) {
    const p=offlinePs[q.paper];
    if(!o.source) return '';
    if(p.basicPractice)return q.title||p.title;
    return [o.year?`${p.year} ${p.season}`:'',`${p.curriculum||'CAIE'} ${p.syllabusCode||p.qualification||'9701'} ${p.level} / ${p.variant||''}`,`Q${q.n}`].filter(Boolean).join(' / ');
  }
  const topicCodes=Object.fromEntries(CHEM_BANK.chapters.flatMap(c=>c.subtopics.map(s=>[s.id,s.code??s.id])));
  const topicTitles=Object.fromEntries(CHEM_BANK.chapters.flatMap(c=>c.subtopics.map(s=>[s.id,s.title])));
  const meta=(q,aa,o)=>[sourceLabel(q,o),o.marks&&aa.some(a=>a.marks!=null)?aa.reduce((n,a)=>n+(a.marks||0),0)+' marks':''].filter(Boolean).join(' | ');
  function wipe(ctx,sg,page,rect,scale,left,top) {
    if(rect.page!==sg.page)return;
    const x=(rect.x-left-1.5)*scale,y=(rect.y-(rect.h||10)-top-1.5)*scale;
    ctx.fillRect(x,y,(rect.w+3)*scale,((rect.h||10)+4)*scale);
  }
  function compact(canvas) {
    const ctx=canvas.getContext('2d',{willReadFrequently:true}),d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    const kept=[];let blank=0;
    for(let y=0;y<canvas.height;y++) {
      let dark=0;
      for(let x=0;x<canvas.width;x++){const k=(y*canvas.width+x)*4;if(d[k]<225||d[k+1]<225||d[k+2]<225)dark++;}
      if(dark<=1){blank++;if(blank>16)continue;}else blank=0;
      kept.push(y);
    }
    const out=document.createElement('canvas');out.width=canvas.width;out.height=Math.max(1,kept.length);
    const dst=out.getContext('2d');dst.fillStyle='white';dst.fillRect(0,0,out.width,out.height);
    let start=0;
    while(start<kept.length){let end=start+1;while(end<kept.length&&kept[end]===kept[end-1]+1)end++;dst.drawImage(canvas,0,kept[start],canvas.width,end-start,0,start,canvas.width,end-start);start=end;}
    return out;
  }
  async function selectedCrop(q,aa,sg,data,o,kind='qp') {
    const page=data[kind][sg.page-1],c=await cropCanvas(page,sg,kind);
    const ctx=c.getContext('2d'),left=sg.left??(kind==='qp'?36:42),top=Math.max(0,sg.top),scale=c.width/((sg.right??page.w-36)-left);
    ctx.fillStyle='white';
    if(q.basicPractice)return c;
    if(kind==='qp') {
      if(!o.source&&q.numberBox){const rect={...q.numberBox};if(['P1','P5'].includes(offlinePs[q.paper].component))rect.y+=rect.h||0;wipe(ctx,sg,page,rect,scale,left,top);}
      if(!o.marks&&q.totalBox)wipe(ctx,sg,page,q.totalBox,scale,left,top);
      if(!o.year||!o.source){
        for(const rect of offlinePs[q.paper].footerBoxes||[])wipe(ctx,sg,page,rect,scale,left,top);
        const rects=[{x:34,y:page.h,w:32,h:52},{x:550,y:page.h,w:page.w-550,h:52},{x:66,y:page.h,w:449,h:40}];
        for(const rect of rects)wipe(ctx,sg,page,{...rect,page:sg.page},scale,left,top);
      }
      for(const a of aa){
        if(!o.marks)for(const rect of a.markBoxes||[])wipe(ctx,sg,page,rect,scale,left,top);
        if(!o.answerLines)for(const r of a.dotBoxes||[])wipe(ctx,sg,page,{...r,h:4,y:r.y+1},scale,left,top);
      }
    }
    return kind==='qp'&&!o.answerLines?compact(c):c;
  }
  function join(clips) {
    const c=document.createElement('canvas');c.width=Math.max(...clips.map(x=>x.width));c.height=clips.reduce((s,x)=>s+x.height,0)+12*(clips.length-1);
    const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);let y=0;for(const im of clips){ctx.drawImage(im,0,y);y+=im.height+12;}return c;
  }
  async function questionCanvas(q,aa,data,o) {
    let segs=q.front.slice();aa.forEach(a=>segs.push(...a.parentSegs,...a.segs));const clips=[];
    for(const sg of mergeRegions(segs))clips.push(await selectedCrop(q,aa,sg,data,o));
    return clips.length?join(clips):null;
  }
  async function buildPDF(payload) {
    if(payload.mode==='combined') {const student=await buildPDF({...payload,mode:'student'}),teacher=await buildPDF({...payload,mode:'teacher'}),result=await PDFLib.PDFDocument.create();for(const blob of [student,teacher]){const doc=await PDFLib.PDFDocument.load(await blob.arrayBuffer());for(const p of await result.copyPages(doc,doc.getPageIndices()))result.addPage(p);}result.setTitle(payload.name||'Practice');return new Blob([await result.save()],{type:'application/pdf'});}
    const {groups,added}=offlineResolve(payload.ids,payload.dependencies!==false),o=options(payload);if(!groups.size)throw Error('Select at least one question.');
    const {PDFDocument,StandardFonts,rgb}=PDFLib,pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold),teacher=payload.mode==='teacher',title=String(payload.name||'Practice');pdf.setTitle(title);pdf.setAuthor('Chemistry Question Studio');
    const ink=rgb(.10,.17,.25),muted=rgb(.37,.43,.50),accent=rgb(.15,.28,.43),rule=rgb(.83,.87,.91),wash=rgb(.94,.96,.98),left=42,right=553,width=511,bottom=50,decorated=[];
    const plain=x=>String(x??'').replace(/Δ/g,'Delta ').replace(/[–—]/g,'-').replace(/·/g,' | ').replace(/[^\x20-\x7E]/g,'?');
    function wrap(text,size=9,face=font,max=width){const words=plain(text).split(/\s+/),lines=[];let current='';for(const word of words){if(current&&face.widthOfTextAtSize(current+' '+word,size)>max){lines.push(current);current=word}else current+=(current?' ':'')+word}if(current)lines.push(current);return lines}
    const titleCanvas=document.createElement('canvas');titleCanvas.width=1536;titleCanvas.height=200;const tc=titleCanvas.getContext('2d');tc.font='700 64px "Segoe UI", "Microsoft YaHei", sans-serif';const titleWords=title.split(/\s+/),titleLines=[];let titleLine='';for(const word of titleWords){if(titleLine&&tc.measureText(titleLine+' '+word).width>1536){titleLines.push(titleLine);titleLine=word}else titleLine+=(titleLine?' ':'')+word}if(titleLine)titleLines.push(titleLine);if(titleLines.length>2){titleLines.length=2;while(tc.measureText(titleLines[1]+'…').width>1536)titleLines[1]=titleLines[1].slice(0,-1);titleLines[1]+='…'}titleCanvas.height=titleLines.length*79+8;tc.fillStyle='white';tc.fillRect(0,0,titleCanvas.width,titleCanvas.height);tc.fillStyle='#192f45';tc.font='700 64px "Segoe UI", "Microsoft YaHei", sans-serif';titleLines.forEach((t,i)=>tc.fillText(t,0,62+i*79));const titleImage=await pdf.embedPng(titleCanvas.toDataURL('image/png')),titleHeight=titleCanvas.height/3;
    const runningCanvas=document.createElement('canvas');runningCanvas.width=1668;runningCanvas.height=72;const rc=runningCanvas.getContext('2d');rc.fillStyle='white';rc.fillRect(0,0,1668,72);rc.font='51px \"Segoe UI\", \"Microsoft YaHei\", sans-serif';rc.fillStyle='#5e6e80';let runningTitle=title;while(runningTitle&&rc.measureText(runningTitle).width>1640)runningTitle=Array.from(runningTitle).slice(0,-1).join('');if(runningTitle!==title){while(runningTitle&&rc.measureText(runningTitle+'…').width>1640)runningTitle=Array.from(runningTitle).slice(0,-1).join('');runningTitle+='…'}rc.fillText(runningTitle,0,55);const runningTitleImage=await pdf.embedPng(runningCanvas.toDataURL('image/png'));
    const stages=[...new Set([...groups].map(([qid])=>offlinePs[offlineQs[qid].paper].level))].join(' + '),allIds=[...groups.values()].flat(),marks=allIds.reduce((n,id)=>n+(offlineParts[id].a.marks||0),0),unknown=allIds.some(id=>offlineParts[id].a.marks==null);
    let page,y,pageStartY,hasQuestion=false;
    function text(text,x,yy,size=9,face=font,color=ink){page.drawText(plain(text),{x,y:yy,size,font:face,color})}
    function newPage(){page=pdf.addPage([595.28,841.89]);decorated.push(page);hasQuestion=false;const first=decorated.length===1;
      if(first){text('C H E M I S T R Y',left,805,8,bold,accent);page.drawRectangle({x:431,y:795,width:122,height:21,color:wash});text(teacher?'ANSWER BOOKLET':'PRACTICE PAPER',443,802,7.5,bold,accent);page.drawImage(titleImage,{x:left,y:777-titleHeight,width:512,height:titleHeight});y=777-titleHeight-18;
        if(o.nameField){for(const [x,label,w]of [[left,'NAME',205],[268,'CLASS',115],[406,'DATE',147]]){text(label,x,y,7,bold,muted);page.drawLine({start:{x,y:y-17},end:{x:x+w,y:y-17},thickness:.55,color:rule});}y-=40;}
        text(groups.size+' QUESTIONS'+(o.marks?'     '+marks+(unknown?' KNOWN MARKS':' MARKS'):'')+'     '+stages,left,y,8,bold,muted);y-=16;page.drawLine({start:{x:left,y},end:{x:right,y},thickness:.8,color:rule});y-=23;
      }else{text('CHEMISTRY',left,806,8,bold,accent);page.drawImage(runningTitleImage,{x:132,y:801,width:278,height:12});text(teacher?'ANSWERS':stages,484,805,8,bold,muted);page.drawLine({start:{x:left,y:782},end:{x:right,y:782},thickness:.55,color:rule});y=761;}
      pageStartY=y;
    }
    function line(value,size=9,strong=false){const lines=wrap(value,size,strong?bold:font);for(const ln of lines){if(y<bottom+size+5)newPage();text(ln,left,y,size,strong?bold:font,strong?ink:muted);y-=size+5;}}
    function heading(number,q,aa){if(hasQuestion)page.drawLine({start:{x:left,y:y+6},end:{x:right,y:y+6},thickness:.4,color:rule});text('Question '+String(number).padStart(2,'0'),left,y-11,11,bold,accent);if(o.marks&&aa.some(a=>a.marks!=null)){const markCount=aa.reduce((n,a)=>n+(a.marks||0),0),m=markCount+(markCount===1?' mark':' marks');text(m,right-font.widthOfTextAtSize(m,9),y-10,9,font,muted)}y-=29;if(o.source)line(sourceLabel(q,o),8);if(o.topics){for(const code of new Set(aa.flatMap(a=>[a.topic,...(a.assessedTopics||[])]).filter(Boolean)))line((topicCodes[code]??code)+' '+(topicTitles[code]||''),8);line('Skills: '+[...new Set(aa.map(a=>a.task))].join(' / '),8);}y-=4;}
    async function drawCanvas(c,x,yy,w,h){
      if(typeof CompressionStream==='undefined'){const im=await pdf.embedPng(c.toDataURL('image/png'));page.drawImage(im,{x,y:yy,width:w,height:h});return;}
      // Lossless RGB directly into PDF: no PNG encoding, base64 copy, PNG decoding or JS recompression.
      const rgba=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data,rgbBytes=new Uint8Array(c.width*c.height*3);
      for(let i=0,j=0;i<rgba.length;i+=4){const a=rgba[i+3];if(a===255){rgbBytes[j++]=rgba[i];rgbBytes[j++]=rgba[i+1];rgbBytes[j++]=rgba[i+2];}else{const opacity=a/255;rgbBytes[j++]=Math.round(rgba[i]*opacity+255*(1-opacity));rgbBytes[j++]=Math.round(rgba[i+1]*opacity+255*(1-opacity));rgbBytes[j++]=Math.round(rgba[i+2]*opacity+255*(1-opacity));}}
      const compressed=new Uint8Array(await new Response(new Blob([rgbBytes]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
      const ref=pdf.context.register(pdf.context.stream(compressed,{Type:'XObject',Subtype:'Image',Width:c.width,Height:c.height,BitsPerComponent:8,ColorSpace:'DeviceRGB',Filter:'FlateDecode'})),name=page.node.newXObject('Image',ref);
      page.pushOperators(PDFLib.pushGraphicsState(),PDFLib.concatTransformationMatrix(w,0,0,h,x,yy),PDFLib.drawObject(name),PDFLib.popGraphicsState());
    }
    async function image(c,chunks=splitCanvas(c)){for(const part of chunks){let w=width,h=w*part.height/part.width;if(h>y-bottom){if(pageStartY-y<140){w*=(y-bottom)/h;h=y-bottom}else newPage();}if(h>y-bottom){w*=(y-bottom)/h;h=y-bottom;}await drawCanvas(part,left+(width-w)/2,y-h,w,h);y-=h+13;hasQuestion=true;}}
    newPage();if(added.length)line('Required preceding parts are included.',8);let order=0;const fullMS=new Set();
    if(teacher){const missingRows=[...groups].flatMap(([qid,ids],i)=>{const q=offlineQs[qid];return q.basicPractice?[]:q.parts.filter(a=>ids.includes(a.id)&&!a.answerRows.length&&!(a.path==='mcq'&&/^[ABCD]$/.test(a.answerText))).map(a=>({q,a,n:i+1}))});if(missingRows.length){line('Answer location notes',10,true);line(missingRows.length+' selected parts have no exact indexed answer row. Their official mark-scheme pages are included in the appendix.',8);for(const {q,a,n}of missingRows)line('Question '+n+' / Part '+a.path+(o.source?' | '+sourceLabel(q,o):''),8);y-=12;}
      const keys=[...groups].map(([qid,ids],i)=>({q:offlineQs[qid],aa:offlineQs[qid].parts.filter(a=>ids.includes(a.id)),n:i+1})).filter(x=>x.aa.every(a=>a.path==='mcq'));
      if(keys.length){line('Multiple choice answer key',11,true);y-=5;function tableHead(){page.drawRectangle({x:left,y:y-19,width,height:23,color:wash});text('QUESTION',left+8,y-11,7,bold,muted);text('ANSWER',left+92,y-11,7,bold,muted);if(o.topics||o.source)text(o.topics?'TOPIC':'SOURCE',left+170,y-11,7,bold,muted);if(o.marks)text('MARKS',right-39,y-11,7,bold,muted);y-=23}tableHead();
        for(const item of keys){const detail=o.topics?[...new Set(item.aa.map(a=>a.topic))].map(t=>(topicCodes[t]??t)+' '+(topicTitles[t]||'')).join(' / '):o.source?sourceLabel(item.q,o):'',detailLines=detail?wrap(detail,7.5,font,300):[],height=Math.max(25,detailLines.length*10+12);if(y-height<bottom){newPage();line('Multiple choice answer key - continued',10,true);tableHead()}text(String(item.n).padStart(2,'0'),left+8,y-16,9,bold,ink);text(item.aa.map(a=>a.answerText).join(', '),left+104,y-17,11,bold,accent);detailLines.forEach((ln,i)=>text(ln,left+170,y-15-i*10,7.5,font,muted));if(o.marks)text(item.aa.reduce((n,a)=>n+(a.marks||0),0),right-25,y-16,9,font,muted);y-=height;page.drawLine({start:{x:left,y},end:{x:right,y},thickness:.4,color:rule});}y-=24;hasQuestion=true;
      }
    }
    let completed=0;for(const[qid,ids]of groups){payload.onProgress?.(completed++,groups.size);await new Promise(resolve=>setTimeout(resolve,0));const q=offlineQs[qid],aa=q.parts.filter(a=>ids.includes(a.id)),data=await loadAssets(q.paper);
      if(q.preserveLayout&&data.originalPDF){const regions=teacher?aa.flatMap(a=>a.answerRows.flatMap(r=>r.segs)):q.segs;if(!regions.length){line('Question '+(++order)+' | No matched answer supplied.',9);continue;}order++;const original=await PDFLib.PDFDocument.load(data.originalPDF[teacher?'ms':'qp']);for(const originalPage of await pdf.copyPages(original,[...new Set(regions.map(s=>s.page-1))]))pdf.addPage(originalPage);y=0;hasQuestion=true;continue;}
      if(teacher&&aa.every(a=>a.path==='mcq')){order++;continue;}
      const prepared=!teacher?await questionCanvas(q,aa,data,o):null,preparedChunks=prepared?splitCanvas(prepared):null,firstChunk=preparedChunks?.[0]||null,firstAnswer=teacher&&aa[0]?.answerRows.length?mergeRegions(aa[0].answerRows.flatMap(r=>r.segs))[0]:null,ap=firstAnswer?data.ms[firstAnswer.page-1]:null,firstHeight=firstChunk?width*firstChunk.height/firstChunk.width:firstAnswer?width*(firstAnswer.bottom-firstAnswer.top)/((firstAnswer.right??ap.w-36)-(firstAnswer.left??42)):24;
      const metadataHeight=(o.source?wrap(sourceLabel(q,o),8).length*13:0)+(o.topics?aa.flatMap(a=>[a.topic,...(a.assessedTopics||[])]).filter(Boolean).length*13+25:0),needed=35+metadataHeight+Math.min(firstHeight,700)+14;if(hasQuestion&&y-needed<bottom)newPage();heading(++order,q,aa);
      if(!teacher){if(prepared)await image(prepared,preparedChunks);}else for(const a of aa){if(a.path==='mcq'&&/^[ABCD]$/.test(a.answerText)){line('Answer  '+a.answerText,12,true);y-=12;hasQuestion=true;continue;}if(a.answerRows.length){const first=mergeRegions(a.answerRows.flatMap(r=>r.segs))[0];if(first){const pg=data.ms[first.page-1],h=width*(first.bottom-first.top)/((first.right??pg.w-36)-(first.left??42));if(hasQuestion&&y-Math.min(h,700)-25<bottom)newPage();}}line('Part '+a.path+(o.marks&&a.marks!=null?'   /   '+a.marks+(a.marks===1?' mark':' marks'):''),9,true);if(a.answerRows.length){for(const sg of mergeRegions(a.answerRows.flatMap(r=>r.segs)))await image(await selectedCrop(q,aa,sg,data,o,'ms'));}else if(q.basicPractice){line(q.answerNote||'No individually matched answer was supplied. Consult the source document.',9);}else{line('Exact answer row unavailable. Official answer pages follow.',9);fullMS.add(q.paper)}hasQuestion=true;}
      y-=12;
    }
    for(const pid of fullMS){const q={paper:pid,n:'MS'},data=await loadAssets(pid),aa=CHEM_BANK.questions.filter(x=>x.paper===pid).flatMap(x=>x.parts),first=Math.min(...aa.flatMap(a=>a.answerRows.map(r=>r.page)),1e6);newPage();line('Official answer pages'+(o.source?' | '+sourceLabel(q,o):''),10,true);for(let i=first<1e6?first-1:0;i<data.ms.length;i++)await image(await cropCanvas(data.ms[i],{page:i+1,top:75,bottom:data.ms[i].h-45,left:40,right:data.ms[i].w-36},'ms'));}
    if(!teacher&&(o.dataTable||o.periodicTable)){for(const set of await selectedReferencePages(groups))for(const key of ['dataTable','periodicTable'])if(o[key]){const ref=set.refs[key],referenceDoc=await PDFLib.PDFDocument.load(ref.pdf),embeddedPages=await pdf.embedPdf(referenceDoc,Array.from({length:referenceDoc.getPageCount()},(_,i)=>i));for(const embedded of embeddedPages){const landscape=embedded.width>embedded.height;page=pdf.addPage(landscape?[841.89,595.28]:[595.28,841.89]);decorated.push(page);const pw=page.getWidth(),ph=page.getHeight(),availableW=pw-84,availableH=ph-145,scale=Math.min(availableW/embedded.width,availableH/embedded.height);text('CHEMISTRY / REFERENCE / CAIE '+set.code,left,ph-38,8,bold,accent);page.drawLine({start:{x:left,y:ph-51},end:{x:pw-42,y:ph-51},thickness:.55,color:rule});page.drawPage(embedded,{x:(pw-embedded.width*scale)/2,y:ph-72-embedded.height*scale,width:embedded.width*scale,height:embedded.height*scale});text('Reference material: Cambridge University Press & Assessment'+(o.year?' 2026':''),left,53,7,font,muted);}}}

    payload.onProgress?.(groups.size,groups.size);const allPages=pdf.getPages();for(const p of decorated){page=p;const edge=page.getWidth()-42;page.drawLine({start:{x:left,y:36},end:{x:edge,y:36},thickness:.4,color:rule});text(teacher?'CHEMISTRY  /  ANSWERS':'CHEMISTRY  /  PRACTICE',left,23,7,font,muted);const label=(allPages.indexOf(p)+1)+' / '+allPages.length;text(label,edge-font.widthOfTextAtSize(label,8),23,8,font,muted);}
    return new Blob([await pdf.save()],{type:'application/pdf'});
  }
  async function preview(payload) {
    if(payload.mode==='combined'){const one=await preview({...payload,mode:'student'}),two=await preview({...payload,mode:'teacher'});return one.replace('</body>','<header><h1>Mark scheme</h1></header>'+two.slice(two.indexOf('<main>'),two.indexOf('</main>')+7)+'</body>');}
    const{groups,added}=offlineResolve(payload.ids,payload.dependencies!==false),o=options(payload);let body='',order=0;
    for(const[qid,ids]of groups){const q=offlineQs[qid],aa=q.parts.filter(a=>ids.includes(a.id)),data=await loadAssets(q.paper);let pictures='';
      if(payload.mode==='teacher')for(const a of aa){if(a.path==='mcq'&&/^[ABCD]$/.test(a.answerText)){pictures+=`<p><strong>Answer: ${safe(a.answerText)}</strong></p>`;continue;}pictures+=`<h4>Part ${safe(a.path)}${o.marks?' · '+a.marks+(a.marks===1?' mark':' marks'):''}</h4>`;if(a.answerRows.length)for(const sg of mergeRegions(a.answerRows.flatMap(r=>r.segs))){const c=await selectedCrop(q,aa,sg,data,o,'ms');pictures+=`<img src="${c.toDataURL('image/png')}">`;}else pictures+='<p>Exact MS row unavailable. The PDF includes the corresponding official answer pages.</p>';}
      else{const c=await questionCanvas(q,aa,data,o);if(c)pictures=`<img src="${c.toDataURL('image/png')}">`;}
      body+=`<section><h3>Question ${++order}${meta(q,aa,o)?' · '+safe(meta(q,aa,o)):''}</h3>${o.topics?`<p class="topic">${safe([...new Set(aa.map(a=>a.topic))].map(c=>(topicCodes[c]??c)+' '+(topicTitles[c]||'')).join(' / '))}<br>${safe([...new Set(aa.map(a=>a.task))].join(' / '))}</p>`:''}${pictures}</section>`;
    }
    if(payload.mode!=='teacher'&&(o.dataTable||o.periodicTable)){for(const set of await selectedReferencePages(groups))for(const key of ['dataTable','periodicTable'])if(o[key])for(const src of set.refs[key].srcs||[set.refs[key].src])body+=`<section class="reference-appendix"><strong>CAIE ${set.code} · ${safe(set.refs[key].title)}</strong><img src="${src}" alt="${safe(set.refs[key].title)}"></section>`;}
    return `<!doctype html><html lang="en"><meta charset="utf-8"><style>body{margin:0;background:#edf1f6;font:14px/1.7 'Segoe UI','Microsoft YaHei';color:#192f45}header,section{max-width:820px;margin:22px auto;background:white;padding:30px 42px;box-sizing:border-box;border:1px solid #dae2eb;border-radius:4px}header{border-top:4px solid #263f59}h1{font-size:26px;font-weight:750;margin:0 0 8px}p{color:#586e4c;font-size:12px}h3{font-size:14px;font-weight:750;border-bottom:1px solid #d9e2d1;padding-bottom:12px}h4{font-size:12px;margin-bottom:6px}img{display:block;width:100%;height:auto;margin-bottom:14px}.topic{font-weight:650}</style><body><header><h1>${safe(payload.name)}</h1><strong>${payload.mode==='teacher'?'Mark scheme':'Student paper'}</strong>${o.nameField?'<p>Name: ________________________ Class: __________ Date: __________</p>':''}<p>Preview with current options · final pagination is in the downloaded PDF${added.length?' · Required earlier parts included':''}</p></header><main>${body}</main></body></html>`;
  }
  offlinePDF=buildPDF;window.chemPreview=preview;window.ChemExport={buildPDF,preview,options,questionCanvas,selectedCrop};
})();
