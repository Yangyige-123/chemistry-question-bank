/* Compact cards expand in place. Explicit original-question viewing remains separate. */
(() => {
 let frame=0;const seen=new WeakSet(),expanded=new Set();
 function update(){frame=0;document.querySelectorAll('.question-card').forEach(card=>{
  const image=card.querySelector('.question-images'),parts=card.querySelector('.question-parts');if(!image||!parts)return;
  if(!seen.has(card)){seen.add(card);resize.observe(parts);image.querySelectorAll('img').forEach(i=>resize.observe(i));}
  const isExpanded=expanded.has(card.id);card.classList.toggle('question-inline-expanded',isExpanded);
  const compact=document.body.dataset.questionPreview!=='full'&&!isExpanded,side=document.body.dataset.labels!=='below'&&getComputedStyle(card.querySelector('.question-body')).gridTemplateColumns.split(' ').length>1;
  const cap=side?Math.max(220,Math.min(640,parts.scrollHeight)):360;
  const value=compact?cap+'px':'none';if(image.style.maxHeight!==value||image.style.getPropertyPriority('max-height')!=='important')image.style.setProperty('max-height',value,'important');
  const truncated=compact&&image.scrollHeight>image.clientHeight+8;card.classList.toggle('question-truncated',truncated);
  let more=image.querySelector('.question-preview-more');
  if(truncated&&!more){more=document.createElement('button');more.type='button';more.className='question-preview-more';more.textContent='Preview remaining content';more.title='Preview remaining content';more.setAttribute('aria-expanded','false');image.appendChild(more)}
  if(more)more.hidden=!truncated;
  let rail=card.querySelector('.question-preview-rail');if(isExpanded&&!rail){rail=document.createElement('div');rail.className='question-preview-rail';const close=document.createElement('button');close.type='button';close.className='question-inline-close';close.textContent='Close inline preview';close.title='Close inline preview';close.setAttribute('aria-expanded','true');rail.appendChild(close);card.querySelector('.question-body').appendChild(rail)}if(rail)rail.hidden=!isExpanded;
 });}
 function refresh(){if(!frame)frame=requestAnimationFrame(update)}
 const resize=new ResizeObserver(refresh);new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
 document.addEventListener('click',e=>{const open=e.target.closest('.question-preview-more'),close=e.target.closest('.question-inline-close');if(!open&&!close)return;const card=(open||close).closest('.question-card');if(!card)return;e.preventDefault();e.stopPropagation();if(open)expanded.add(card.id);else expanded.delete(card.id);update();if(close){const rect=card.getBoundingClientRect();if(rect.bottom<110||rect.top<0)card.scrollIntoView({block:'start',behavior:'instant'});card.querySelector('.question-preview-more')?.focus({preventScroll:true});}},true);
 document.addEventListener('load',refresh,true);document.addEventListener('toggle',refresh,true);window.addEventListener('resize',refresh);
 window.ChemQuestionPreview={refresh};refresh();
})();
