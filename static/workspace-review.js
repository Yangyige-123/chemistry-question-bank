/* Local feedback, selected-paper review and chapter-organised tricky questions. */
(() => {
 const REPORT_KEY='chem-question-reports-v1',TRICKY_KEY='chem-tricky-questions-v1';
 let reportId=null,reportQ=null,selectedQuery='',trickyTopic='',previousOrder=null;
 const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
 const reports=()=>{const r=read(REPORT_KEY,[]);return Array.isArray(r)?r:[]};
 let tricky=new Set(read(TRICKY_KEY,[]));
 function reportCount(){const n=reports().filter(r=>r.status==='open').length;$('reportedIssuesBtn').textContent=`Reported issues · ${reports().length}${n?' ('+n+' open)':''}`;}
 function allTopicOptions(query='',selected=''){
  const needle=query.toLowerCase().trim();return (reportQ?topicChaptersFor(papers[reportQ.paper]):bank.chapters).map(c=>{const items=c.subtopics.filter(s=>!needle||[s.id,s.title,c.title].join(' ').toLowerCase().includes(needle)||s.id===selected);return items.length?`<optgroup label="${esc(c.level+' · '+c.id+' '+c.title)}">${items.map(s=>`<option value="${s.id}">${esc((s.parent?s.parent+' · ':s.id+' ')+s.title)}</option>`).join('')}</optgroup>`:''}).join('');
 }
 function syncReportTopic(){const a=parts[$('reportPart').value]?.a;if(!a)return;$('reportTopicSearch').value='';$('reportTopic').innerHTML='<option value="">Leave classification unchanged</option>'+allTopicOptions();$('reportTopic').value='';$('reportAdditional').innerHTML=(reportQ?topicChaptersFor(papers[reportQ.paper]):bank.chapters).map(c=>`<optgroup label="${esc(c.level+' · '+c.title)}">${c.subtopics.filter(s=>!s.parent).map(s=>`<option value="${s.id}" ${(a.assessedTopics||[]).includes(s.id)?'selected':''}>${esc((s.code??s.id)+' '+s.title)}</option>`).join('')}</optgroup>`).join('');}
 function openReport(qid,partId,existingId=null){
  reportQ=questions[qid];if(!reportQ)return;reportId=existingId;const r=reports().find(r=>r.id===existingId);
  $('reportSource').textContent=qid+' · Q'+reportQ.n;$('reportPart').innerHTML=reportQ.parts.map(a=>`<option value="${a.id}">${esc(a.label+' · '+topicLabel(a.topic))}</option>`).join('');$('reportPart').value=r?.partId||partId||reportQ.parts[0].id;
  $('reportType').value=r?.type||'classification';$('reportNote').value=r?.note||'';$('reportStatus').textContent='';syncReportTopic();$('reportClassification').hidden=$('reportType').value!=='classification';$('reportDialog').showModal();
 }
 function renderReports(){
  const needle=$('issueSearch').value.toLowerCase().trim(),scope=$('issueScope').value,rows=reports().filter(r=>(scope==='all'||r.status===scope)&&[r.qid,r.partId,r.type,r.note,r.correctedTopic&&topicLabel(r.correctedTopic)].join(' ').toLowerCase().includes(needle)).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
  $('issueCount').textContent=rows.length+' reports';$('reportedIssuesList').innerHTML=rows.map(r=>`<article class="issue-record"><div><strong>${esc(r.qid)} · ${esc(parts[r.partId]?.a.label||r.partId)}</strong><p>${esc({classification:'Incorrect classification',crop:'Image / whitespace',content:'Question content',answer:'Answer problem',other:'Other'}[r.type]||r.type)} · ${esc(r.status)} · ${esc(new Date(r.updatedAt).toLocaleString())}</p>${r.correctedTopic?`<p><b>Corrected topic:</b> ${esc(topicLabel(r.correctedTopic))}</p>`:''}<p>${esc(r.note||'No notes')}</p></div><div class="issue-actions"><button data-edit-issue="${r.id}">Edit / classify</button><button data-issue-question="${r.qid}">View question</button>${r.status!=='resolved'?`<button data-resolve-issue="${r.id}">Mark resolved</button>`:''}</div></article>`).join('')||'<div class="empty">No reports in this view.</div>';reportCount();
 }
 $('exportSettingsBtn').onclick=()=>$('exportOptionsDialog').showModal();
 $('reportPart').onchange=syncReportTopic;
 $('reportTopic').onchange=()=>{const chosen=$('reportTopic').value,target=topics[chosen]?.parent||chosen;if(target&&target!==parts[$('reportPart').value]?.a.topic)for(const o of $('reportAdditional').options)o.selected=false};
 $('reportType').onchange=()=>{$('reportClassification').hidden=$('reportType').value!=='classification'};
 $('reportTopicSearch').oninput=()=>{const value=$('reportTopic').value;$('reportTopic').innerHTML='<option value="">Leave classification unchanged</option>'+allTopicOptions($('reportTopicSearch').value,value);$('reportTopic').value=value};
 $('reportForm').onsubmit=e=>{
  e.preventDefault();try{
   const id=$('reportPart').value,entry=parts[id];if(!entry)throw Error('Choose a question part.');
   const type=$('reportType').value,chosen=$('reportTopic').value,topicId=topics[chosen]?.parent||chosen;
   const correction=type==='classification'&&!!topicId,old=reports(),previous=old.find(r=>r.id===reportId);
   const record={id:reportId||'issue-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),qid:entry.q.id,partId:id,type,note:$('reportNote').value.trim(),oldTopic:previous?.oldTopic||entry.a.topic,correctedTopic:correction?topicId:null,status:correction?'corrected':'open',createdAt:previous?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
   if(correction){
    const update={topic:topicId,assessedTopics:[...$('reportAdditional').selectedOptions].map(o=>o.value).filter(t=>t!==topicId),focusTopics:topics[chosen]?.parent?[chosen]:entry.a.topic===topicId?(entry.a.focusTopics||[]):[],aux:[],evidence:[],status:'reviewed',reviewer:'teacher',reviewMethod:'manual',reason:'Teacher correction from issue report'};
    const changes=read('chem-review-v1',{});changes[id]=update;
    // Persist before touching the live bank. Both display and export use the same correction.
    localStorage.setItem('chem-review-v1',JSON.stringify(changes));applyLocalReview(entry.a,update);if(offlineParts[id])applyLocalReview(offlineParts[id].a,update);
   }
   const next=old.filter(r=>r.id!==record.id);next.push(record);localStorage.setItem(REPORT_KEY,JSON.stringify(next));$('reportDialog').close();reportCount();if($('reportedIssuesDialog').open)renderReports();buildTree();render();renderBasket();refreshSelected();if($('trickyDialog').open)renderTricky();toast(correction?'Classification corrected and report saved.':'Issue report saved.');
  }catch(err){$('reportStatus').textContent=err.message}
 };
 $('reportedIssuesBtn').onclick=()=>{renderReports();$('reportedIssuesDialog').showModal()};$('issueSearch').oninput=renderReports;$('issueScope').onchange=renderReports;
 const baseCard=card;
 card=function(q,options={}){
  let html=baseCard(q,options);const shown=options.selectedIds?q.parts.filter(a=>options.selectedIds.includes(a.id)):topic?q.parts.filter(a=>matching(a,q)):q.parts;
  const tools=`<button class="tricky-toggle" data-tricky="${q.id}" aria-pressed="${tricky.has(q.id)}" title="Save this question in the chapter-organised Tricky questions library">${tricky.has(q.id)?'★ Tricky':'☆ Mark as tricky'}</button><button class="report-issue" data-report-question="${q.id}" data-report-part="${shown[0]?.id||''}" title="Report a problem or correct its topic">⚑ Report issue</button>`;
  html=html.replace('</div></article>',tools+'</div></article>');
  if(options.selectedIds)html=html.replace(/data-match="[^"]+"/,`data-add-parts="${esc(shown.map(a=>a.id).join('|'))}"`);
  return html;
 };
 function refreshSelected(){
  $('browseSelected').disabled=!selectedIds.length;if(!$('selectedBrowserDialog').open)return;
  const ordered=[...new Set(selectedIds.map(id=>parts[id]?.q.id).filter(Boolean))],needle=selectedQuery.toLowerCase().trim();
  $('selectedBrowserCount').textContent=ChemSelectionStats.text(ChemSelectionStats.fromIds(selectedIds,parts));
  $('selectedBrowserList').innerHTML=ordered.filter(qid=>{const q=questions[qid];return !needle||[qid,q.text,q.title,...q.parts.filter(a=>selectedIds.includes(a.id)).map(a=>topicLabel(a.topic))].join(' ').toLowerCase().includes(needle)}).map(qid=>{const i=ordered.indexOf(qid),orderTools=`<div class="selected-order-tools"><span>Question ${i+1} of ${ordered.length}</span><button data-selected-up="${qid}" ${i===0?'disabled':''} title="Move this question up">↑</button><button data-selected-down="${qid}" ${i===ordered.length-1?'disabled':''} title="Move this question down">↓</button><label>Position <select data-selected-position="${qid}" aria-label="Position of question ${questions[qid].n}">${ordered.map((_,j)=>`<option value="${j}" ${i===j?'selected':''}>${j+1}</option>`).join('')}</select></label></div>`;return orderTools+card(questions[qid],{selectedIds}).replace(/<button data-add-parts="[^"]+"[^>]*>.*?<\/button>/,`<button data-remove="${qid}" class="danger-text">Remove from paper</button>`)}).join('')||'<div class="empty">No selected questions in this view.</div>';
 }
 function browseSelected(qid){$('selectedBrowserDialog').showModal();selectedQuery='';$('selectedBrowserSearch').value='';refreshSelected();if(qid)$('selectedBrowserList').querySelector('[id="selected-'+qid+'"]')?.scrollIntoView({block:'start'});}
 window.ChemSelectedBrowser={open:browseSelected};$('browseSelected').onclick=()=>browseSelected();$('selectedBrowserSearch').oninput=()=>{selectedQuery=$('selectedBrowserSearch').value;refreshSelected()};
 const oldBasket=renderBasket;renderBasket=function(){oldBasket();refreshSelected();if($('trickyDialog').open)renderTricky()};
 const selectedGroups=()=>[...new Set(selectedIds.map(id=>parts[id]?.q.id).filter(Boolean))];
 function setQuestionOrder(order){previousOrder=selectedIds.slice();selectedIds=order.flatMap(qid=>selectedIds.filter(id=>parts[id].q.id===qid));save();renderBasket();$('undoSelectedOrder').disabled=false;toast('Question order updated.');}
 function moveSelectedTo(qid,index){const order=selectedGroups();order.splice(order.indexOf(qid),1);order.splice(Math.max(0,Math.min(order.length,index)),0,qid);setQuestionOrder(order);$('selectedBrowserList').querySelector('[id="selected-'+qid+'"]')?.scrollIntoView({block:'nearest'});}
 $('sortSelectedChapter').onclick=()=>{const order=selectedGroups(),chapter=qid=>Math.min(...questions[qid].parts.filter(a=>selectedIds.includes(a.id)).map(a=>{const i=bank.chapters.findIndex(c=>c.subtopics.some(s=>s.id===a.topic));return i<0?999:i}));order.sort((a,b)=>chapter(a)-chapter(b));setQuestionOrder(order)};
 $('sortSelectedType').onclick=()=>{const order=selectedGroups(),rank=qid=>questions[qid].questionType==='mcq'||papers[questions[qid].paper].component==='P1'?0:1;order.sort((a,b)=>rank(a)-rank(b));setQuestionOrder(order)};
 $('undoSelectedOrder').onclick=()=>{if(!previousOrder)return;const now=selectedIds.slice(),prior=previousOrder.filter(id=>selectedIds.includes(id));selectedIds=[...prior,...selectedIds.filter(id=>!prior.includes(id))];previousOrder=now;save();renderBasket();toast('Previous question order restored.');};
 document.addEventListener('change',e=>{if(e.target.dataset.selectedPosition)moveSelectedTo(e.target.dataset.selectedPosition,Number(e.target.value))});
 function renderTricky(){
  const qs=bank.questions.filter(q=>tricky.has(q.id)),counts={};for(const q of qs)for(const a of q.parts)for(const t of new Set([a.topic,...(a.assessedTopics||[]),...(a.focusTopics||[])]))if(t)counts[t]=(counts[t]||0)+1;
  const needle=$('trickySearch').value.toLowerCase().trim();$('trickyCount').textContent=qs.length+' questions';
  $('trickyTopics').innerHTML=`<button data-tricky-topic="" class="subtopic ${trickyTopic?'':'active'}">All tricky questions · ${qs.length}</button>`+bank.chapters.filter(c=>c.subtopics.some(s=>counts[s.id])).map(c=>`<details class="chapter" ${c.subtopics.some(s=>s.id===trickyTopic)?'open':''}><summary><span>${esc(c.level+' · '+c.id+' '+c.title)}</span></summary>${c.subtopics.filter(s=>counts[s.id]).map(s=>`<button class="subtopic ${trickyTopic===s.id?'active':''}" data-tricky-topic="${s.id}">${esc(s.parent?s.title:(s.code??s.id)+' '+s.title)} <span class="count">${counts[s.id]}</span></button>`).join('')}</details>`).join('');
  const shown=qs.map(q=>({q,ids:q.parts.filter(a=>a.status!=='excluded'&&(!trickyTopic||a.topic===trickyTopic||(a.assessedTopics||[]).includes(trickyTopic)||(a.focusTopics||[]).includes(trickyTopic))).map(a=>a.id)})).filter(({q,ids})=>ids.length&&(!needle||[q.id,q.text,q.title,...q.parts.map(a=>topicLabel(a.topic))].join(' ').toLowerCase().includes(needle)));
  $('trickyList').innerHTML=shown.map(({q,ids})=>card(q,{selectedIds:ids,instance:'tricky-'}).replace('Add displayed parts','Add to paper')).join('')||'<div class="empty">Mark questions as tricky using ☆ beside a question.</div>';
  $('trickyLibraryBtn').textContent='☆ Tricky questions · '+tricky.size;
 }
 $('trickyLibraryBtn').onclick=()=>{trickyTopic='';$('trickySearch').value='';renderTricky();$('trickyDialog').showModal()};$('trickySearch').oninput=renderTricky;
 document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.closeDialog)$(b.dataset.closeDialog).close();
  if(b.dataset.browseSelected)browseSelected(b.dataset.browseSelected);
  if(b.dataset.selectedUp||b.dataset.selectedDown){const qid=b.dataset.selectedUp||b.dataset.selectedDown;moveSelectedTo(qid,selectedGroups().indexOf(qid)+(b.dataset.selectedUp?-1:1))}
  if(b.dataset.reportQuestion)openReport(b.dataset.reportQuestion,b.dataset.reportPart);
  if(b.dataset.editIssue){const r=reports().find(r=>r.id===b.dataset.editIssue);if(r)openReport(r.qid,r.partId,r.id)}
  if(b.dataset.issueQuestion)openQuestionContent(b.dataset.issueQuestion);
  if(b.dataset.resolveIssue){localStorage.setItem(REPORT_KEY,JSON.stringify(reports().map(r=>r.id===b.dataset.resolveIssue?{...r,status:'resolved',updatedAt:new Date().toISOString()}:r)));renderReports()}
  if(b.dataset.addParts)add(b.dataset.addParts.split('|'));
  if(b.dataset.tricky){const qid=b.dataset.tricky;if(tricky.has(qid))tricky.delete(qid);else tricky.add(qid);localStorage.setItem(TRICKY_KEY,JSON.stringify([...tricky]));document.querySelectorAll('[data-tricky="'+qid+'"]').forEach(x=>{x.setAttribute('aria-pressed',String(tricky.has(qid)));x.textContent=tricky.has(qid)?'★ Tricky':'☆ Mark as tricky'});$('trickyLibraryBtn').textContent='☆ Tricky questions · '+tricky.size;if($('trickyDialog').open)renderTricky();toast(tricky.has(qid)?'Added to Tricky questions.':'Removed from Tricky questions.');}
  if('trickyTopic' in b.dataset){trickyTopic=b.dataset.trickyTopic;renderTricky()}
 });
 // Titles provide native tooltips; focus rings and hover feedback cover mouse and keyboard use.
 const hints={studentExport:'Download the student paper as a PDF',teacherExport:'Download answers as a separate PDF',combinedExport:'One click: download the paper and answers as two separate PDFs',savePaper:'Save this paper, question order and export settings',previewBtn:'Preview the paper before downloading',browseSelected:'Browse all selected questions; untick parts to remove them',allTopics:'Clear the current knowledge point',topicHelpBtn:'Learn which parts match the selected topic',settingsBtn:'Appearance, panels and reported issues'};
 Object.entries(hints).forEach(([id,title])=>$(id).title=title);
 reportCount();$('trickyLibraryBtn').textContent='☆ Tricky questions · '+tricky.size;
 function ready(){if(!bank)return setTimeout(ready,100);render();refreshSelected()}ready();
})();
