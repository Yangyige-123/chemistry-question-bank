(() => {
 const KEY='chem-composer-active-v1';let active=null,pendingDownload=null;
 try{active=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
 const checked=selector=>[...document.querySelectorAll(selector+':checked')].map(e=>e.value);
 const courses=()=>checked('#composerCourses input');
 function persist(){if(active)localStorage.setItem(KEY,JSON.stringify(active));else localStorage.removeItem(KEY)}
 function updateBar(){
  $('composerDraftBar').hidden=!active;if(!active)return;
  const distribution=new Map();for(const id of selectedIds){const p=papers[parts[id].q.paper],course=p.courseId||p.level;if(!distribution.has(course))distribution.set(course,[]);distribution.get(course).push(id)}
  $('composerDraftBar').innerHTML=`<div><strong>Generated paper</strong><span>${esc(ChemSelectionStats.text(ChemSelectionStats.fromIds(selectedIds,parts)))}</span><small>${esc([...distribution].map(([course,ids])=>{const s=ChemSelectionStats.fromIds(ids,parts);return course+': '+(s.scored?s.marks:'—')+(s.unknown?' known marks':' marks')}).join(' · '))}</small></div><div class="composer-draft-actions"><button data-compose-review>Review selection</button><button data-compose-name class="primary">Name &amp; save</button><button data-compose-cancel>Restore previous draft</button></div>`;
 }
 function fillChapters(){
  const ids=courses(),ps=bank.papers.filter(p=>ids.includes(p.courseId||p.level)),stages=new Set(ps.map(p=>p.level)),hasP4=ps.some(p=>p.component==='P4'&&p.level==='A2'),hasP5=ps.some(p=>p.component==='P5'),old=checked('#composerChapters input');
  $('composerChapters').innerHTML=bank.chapters.filter(c=>ps.some(p=>topicChaptersFor(p).includes(c))).map(c=>`<label data-knowledge-label><input type="checkbox" value="${esc(c.id)}" ${old.includes(String(c.id))?'checked':''}>${c.level} · CH${esc(c.code??c.id)} ${esc(c.title)}</label>`).join('');
  filterChapters();
 }
 function fillCourses(selected){
  const board=$('composerBoard').value,ps=bank.papers.filter(p=>!p.basicPractice&&(p.curriculum||'CAIE')===board),unique=[...new Set(ps.map(p=>p.courseId||p.level))];
  $('composerCourses').innerHTML=unique.sort().map(id=>{const p=ps.find(p=>(p.courseId||p.level)===id);return `<label><input type="checkbox" value="${esc(id)}" ${(selected||[unique[0]]).includes(id)?'checked':''}>${esc(p.level+' · '+p.component)}</label>`}).join('');
  $('composerYears').innerHTML=[...new Set(ps.map(p=>p.year))].sort((a,b)=>b-a).map(y=>`<label><input type="checkbox" value="${y}">${y}</label>`).join('');fillChapters();
 }
 function preset(){const id=$('composerPreset').value;if(id==='custom')return;if([...$('composerBoard').options].some(o=>o.value==='CAIE'))$('composerBoard').value='CAIE';fillCourses(id.split('+'));$('composerMarks').value=({'IGCSE-P2':40,'IGCSE-P4':80,'AS-P1':40,'AS-P2':60,'AS-P1+AS-P2':80,'A2-P4':100,'A2-P5':30})[id];$('composerAllChapters').checked=true;$('composerChapterFields').hidden=true;$('composerLimitYears').checked=false;$('composerYears').hidden=true;$('composerStatus').textContent='';}
 function filterChapters(){const needle=$('composerChapterSearch').value.toLowerCase().trim();document.querySelectorAll('#composerChapters label').forEach(el=>el.hidden=needle&&!el.textContent.toLowerCase().includes(needle))}
 function review(){if(!active)return;ChemMainLibrary.previewDraft({name:$('pdfName').value||'Generated paper',ids:selectedIds.slice(),options:getExportOptions(),dependencies:$('dependencies').checked});}
 function name(){if(!selectedIds.length)return toast('Select questions before saving.');$('composerName').value=$('pdfName').value.trim()||ChemPaperTitle.format(selectedIds,bank,parts,'Practice {date} · {unit}');$('composerNameStatus').textContent='';$('composerSaveStats').textContent=ChemSelectionStats.text(ChemSelectionStats.fromIds(selectedIds,parts));$('composerNameDialog').showModal();$('composerName').focus();$('composerName').select();}
 $('composerBtn').onclick=()=>{if(!bank)return;const board=$('composerBoard').value||'CAIE';$('composerBoard').innerHTML=[...new Set(bank.papers.filter(p=>!p.basicPractice).map(p=>p.curriculum||'CAIE'))].map(v=>`<option>${esc(v)}</option>`).join('');$('composerBoard').value=board;if(!$('composerCourses').children.length){const preferred=level.startsWith('IGCSE')?'IGCSE-P2':level.startsWith('A2')?'A2-P4':'AS-P1';$('composerPreset').value=[...$('composerPreset').options].some(o=>o.value===level)?level:preferred;preset();}$('composerDialog').showModal()};
 $('composerPreset').onchange=preset;$('composerBoard').onchange=()=>{$('composerPreset').value='custom';fillCourses()};$('composerCourses').onchange=()=>{$('composerPreset').value='custom';fillChapters()};$('composerChapterSearch').oninput=filterChapters;
 $('composerAllChapters').onchange=()=>{$('composerChapterFields').hidden=$('composerAllChapters').checked};$('composerLimitYears').onchange=()=>{$('composerYears').hidden=!$('composerLimitYears').checked};
 $('composerForm').onsubmit=async e=>{
  e.preventDefault();$('composerGenerate').disabled=true;$('composerStatus').textContent='Composing…';
  try{
   await new Promise(resolve=>setTimeout(resolve,0));const config={board:$('composerBoard').value,courses:courses(),marks:Number($('composerMarks').value),chapters:$('composerAllChapters').checked?[]:checked('#composerChapters input'),years:$('composerLimitYears').checked?checked('#composerYears input').map(Number):[]};
   if(!$('composerAllChapters').checked&&!config.chapters.length)throw Error('Choose at least one chapter.');if($('composerLimitYears').checked&&!config.years.length)throw Error('Choose at least one year, or turn off the year limit.');
   const result=ChemComposer.compose(bank,config),previous=active?.previous||{ids:selectedIds.slice(),name:$('pdfName').value,options:getExportOptions(),dependencies:$('dependencies').checked};
   active={previous,config,result};selectedIds=result.ids.slice();$('dependencies').checked=true;renderBasket();$('pdfName').value=ChemPaperTitle.format(selectedIds,bank,parts,'Practice {date} · {unit}');save();persist();$('composerDialog').close();updateBar();review();
  }catch(err){$('composerStatus').textContent=err.message}finally{$('composerGenerate').disabled=false}
 };
 const oldBasket=renderBasket;renderBasket=function(){oldBasket();updateBar()};
 const manualSave=$('savePaper').onclick;$('savePaper').onclick=e=>active?name():manualSave(e);
 const oldExport=exportPaper;exportPaper=function(mode,preview=false){if(active&&!preview){pendingDownload={mode,preview};name();return}return oldExport(mode,preview)};
 $('composerNameForm').onsubmit=async e=>{
  e.preventDefault();const title=$('composerName').value.trim();if(!title){$('composerNameStatus').textContent='Enter a paper name.';return}
  try{if(!selectedIds.length)throw Error('Select questions before saving.');window.setManualTitle?.();$('pdfName').value=title;save();const r=ChemHistory.save({name:title,ids:selectedIds.slice(),options:getExportOptions(),target:$('exportTarget').value,dependencies:$('dependencies').checked});active=null;persist();updateBar();$('composerNameDialog').close();ChemMainLibrary.openSaved(r.id);toast('Random paper saved.');if(pendingDownload){const next=pendingDownload;pendingDownload=null;await oldExport(next.mode,next.preview)}}catch(err){$('composerNameStatus').textContent=err.message}
 };
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-compose-review]'))review();if(e.target.closest('[data-compose-name]'))name();
  if(e.target.closest('[data-compose-cancel]')&&active){const p=active.previous;selectedIds=p.ids.filter(id=>parts[id]&&parts[id].a.status!=='excluded');$('dependencies').checked=p.dependencies;for(const [id,key]of [['optYear','year'],['optSource','source'],['optMarks','marks'],['optTopics','topics'],['optName','nameField'],['optAnswer','answerLines']])if(key in p.options)$(id).checked=p.options[key];active=null;pendingDownload=null;persist();renderBasket();$('pdfName').value=p.name;save();$('allTopics').click();updateBar();toast('Previous draft restored.')}
 });
 $('composerNameDialog').addEventListener('close',()=>{pendingDownload=null});
 function ready(){if(!bank)return setTimeout(ready,100);updateBar()}ready();
})();
