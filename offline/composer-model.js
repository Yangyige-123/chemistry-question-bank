/* Random, exact-mark composition; related-background tags never qualify a question. */
(() => {
 const shuffle=(array,random)=>{for(let i=array.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[array[i],array[j]]=[array[j],array[i]]}return array};
 function candidates(bank,config,random=Math.random){
  const papers=Object.fromEntries(bank.papers.map(p=>[p.id,p])),chapters=new Map(),wanted=new Set(config.chapters||[]),years=new Set((config.years||[]).map(Number));
  for(const c of bank.chapters)for(const s of c.subtopics)chapters.set(s.id,String(c.id));
  const legacyChapters=new Set(bank.chapters.filter(c=>c.currentSyllabus===false).map(c=>String(c.id)));
  const out=[],seen=new Set();
  for(const q of bank.questions){
   const p=papers[q.paper];if(q.duplicateOf||q.basicPractice||p.basicPractice||(p.curriculum||'CAIE')!==config.board||!config.courses.includes(p.courseId||p.level)||(years.size&&!years.has(+p.year)))continue;
   const allowed=q.parts.filter(a=>a.status!=='excluded'&&!a.excludeFromAutomaticComposition&&(!legacyChapters.has(chapters.get(a.topic))||wanted.has(chapters.get(a.topic)))&&a.marksVerified!==false&&Number.isInteger(a.marks)&&a.marks>=0&&(!wanted.size||[a.topic,...(a.assessedTopics||[])].some(t=>wanted.has(chapters.get(t))))),eligible=new Set(allowed.map(a=>a.id)),byId=Object.fromEntries(q.parts.map(a=>[a.id,a]));
   function safe(id,stack=new Set()){if(!eligible.has(id)||stack.has(id))return false;const next=new Set(stack);next.add(id);return (byId[id].deps||[]).every(dep=>safe(dep,next))}
   const aa=allowed.filter(a=>safe(a.id)),marks=aa.reduce((sum,a)=>sum+a.marks,0);if(!aa.length||!marks||marks>config.marks)continue;
   const signature=q.duplicateOf||q.id;if(seen.has(signature))continue;seen.add(signature);
   out.push({qid:q.id,course:p.courseId||p.level,ids:aa.map(a=>a.id),marks,chapters:[...new Set(aa.map(a=>chapters.get(a.topic)).filter(Boolean))]});
  }
  // Interleave chapters after shuffling to avoid filling a small paper from a single unit by chance.
  const buckets=new Map();for(const c of shuffle(out,random)){const key=c.course+'|'+c.chapters[0];if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(c)}
  const groups=shuffle([...buckets.values()],random),mixed=[];while(groups.some(g=>g.length))for(const g of groups)if(g.length)mixed.push(g.pop());return mixed;
 }
 function subset(pool,target,courses){
  const full=(1<<courses.length)-1,index=new Map(courses.map((v,i)=>[v,1<<i])),states=Array.from({length:target+1},()=>new Map());states[0].set(0,null);
  for(const item of pool){for(let total=target-item.marks;total>=0;total--)for(const [mask,previous]of states[total]){const nextMask=mask|index.get(item.course),next=total+item.marks;if(!states[next].has(nextMask))states[next].set(nextMask,{item,previous});}if(states[target].has(full))break;}
  let node=states[target].get(full);if(!states[target].has(full)){let closest=target;while(closest>0&&!states[closest].has(full))closest--;return {items:null,closest};}
  const items=[];while(node){items.push(node.item);node=node.previous}return {items:items.reverse(),closest:target};
 }
 function compose(bank,config,random=Math.random){
  if(!config.courses?.length)throw Error('Select at least one paper component.');if(config.courses.length>6)throw Error('Choose up to six paper components.');
  if(!Number.isInteger(config.marks)||config.marks<1||config.marks>400)throw Error('Target marks must be a whole number from 1 to 400.');
  const pool=candidates(bank,config,random);for(const course of config.courses)if(!pool.some(c=>c.course===course))throw Error('No eligible questions for '+course+'. Expand the chapter or year range.');
  let chosen=[],balanced=true;
  for(let i=0;i<config.courses.length;i++){const budget=Math.floor(config.marks/config.courses.length)+(i<config.marks%config.courses.length?1:0),result=subset(pool.filter(c=>c.course===config.courses[i]),budget,[config.courses[i]]);if(!result.items){balanced=false;break}chosen.push(...result.items)}
  if(!balanced){const result=subset(pool,config.marks,config.courses);if(!result.items)throw Error('Cannot reach '+config.marks+' marks with these filters. Closest available total: '+result.closest+'. Try another total or expand the filters.');chosen=result.items;}
  chosen.sort((a,b)=>config.courses.indexOf(a.course)-config.courses.indexOf(b.course));
  const ids=chosen.flatMap(q=>q.ids),marks=chosen.reduce((n,q)=>n+q.marks,0);if(marks!==config.marks||new Set(ids).size!==ids.length)throw Error('Composition check failed. Please generate again.');
  return {ids,marks,questions:chosen.length,parts:ids.length,chapters:[...new Set(chosen.flatMap(q=>q.chapters))],breakdown:config.courses.map(course=>({course,marks:chosen.filter(c=>c.course===course).reduce((n,c)=>n+c.marks,0),questions:chosen.filter(c=>c.course===course).length})),balanced};
 }
 window.ChemComposer={compose,candidates};
})();
