(() => {
 $('libraryQualityBtn').onclick=()=>{
  const components={},missing=[];let basicUnknown=0,basicAnswers=0;
  for(const p of bank.papers){const c=components[p.component]||(components[p.component]={papers:new Set(),questions:0,parts:0,teacher:0,ai:0,pending:0});c.papers.add(p.id)}
  for(const q of bank.questions){if(q.duplicateOf)continue;const p=papers[q.paper],c=components[p.component];c.papers.add(p.id);c.questions++;
   for(const a of q.parts){c.parts++;if(a.status==='reviewed'&&a.reviewer==='teacher')c.teacher++;else if(a.status==='reviewed'&&a.reviewer==='agent')c.ai++;if(['suggested','review'].includes(a.status))c.pending++;
    if(q.basicPractice){if(a.marks==null)basicUnknown++;if(!a.answerRows.length)basicAnswers++;}else if(!a.answerRows.length&&!(a.path==='mcq'&&/^[ABCD]$/.test(a.answerText)))missing.push({q,a,p});
   }
  }
  $('qualityContent').innerHTML=`<p>AI review is not teacher review. Reference mappings and suggestions still require verification.</p><div class="quality-table-wrap"><table class="quality-table"><thead><tr>${['Component','Papers','Questions','Parts','Teacher reviewed','AI reviewed','Needs review'].map(t=>`<th>${t}</th>`).join('')}</tr></thead><tbody>${Object.entries(components).map(([key,c])=>`<tr><td>${esc(key)}</td><td>${c.papers.size}</td><td>${c.questions}</td><td>${c.parts}</td><td>${c.teacher}</td><td>${c.ai}</td><td>${c.pending}</td></tr>`).join('')}</tbody></table></div><p>${basicUnknown} unscored basic-practice parts · ${basicAnswers} basic-practice parts without matched answer rows.</p><div class="quality-links"><a href="../data/extension/low-similarity-review.csv" download>Download low-similarity review list</a><a href="../data/extension/missing-ms-rows.csv" download>Download missing-answer-row list</a></div><details><summary>${missing.length} parts require official mark-scheme appendix</summary><p>Teacher PDFs list these selected parts and include official answer pages.</p>${missing.map(({q,a,p})=>`<div class="quality-missing-row"><span>${esc(p.level+' '+p.component+' · '+q.paper+' · '+a.label)}</span><button data-quality-question="${q.id}">View question</button></div>`).join('')}</details>`;
  $('libraryQualityDialog').showModal();
 };
 document.addEventListener('click',e=>{const b=e.target.closest('[data-quality-question]');if(b)openQuestionContent(b.dataset.qualityQuestion)});
})();
