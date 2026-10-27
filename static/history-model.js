/* Portable paper recipes: no question images or PDFs are stored in localStorage. */
(() => {
  const key='chem-saved-papers-v1';
  const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  function validate(r){
    if(!r||typeof r!=='object'||typeof r.name!=='string'||!r.name.trim()||r.name.length>300||!Array.isArray(r.ids)||!r.ids.length||r.ids.length>20000||r.ids.some(id=>typeof id!=='string'||id.length>160))throw Error('Invalid saved paper. No records were changed.');
    if(!Number.isFinite(Date.parse(r.createdAt)))throw Error('Invalid paper date. No records were changed.');
    const opts={};for(const k of ['year','source','marks','topics','nameField','answerLines','dataTable','periodicTable'])if(typeof r.options?.[k]==='boolean')opts[k]=r.options[k];
    return {id:typeof r.id==='string'&&r.id.length<160?r.id:uid(),name:r.name.trim(),ids:[...new Set(r.ids)],createdAt:r.createdAt,options:opts,target:['student','teacher','combined'].includes(r.target)?r.target:'student',dependencies:r.dependencies!==false,archived:!!r.archived,deletedAt:r.deletedAt&&Number.isFinite(Date.parse(r.deletedAt))?r.deletedAt:null};
  }
  function load(){const raw=localStorage.getItem(key);if(!raw)return [];let parsed;try{parsed=JSON.parse(raw)}catch{throw Error('Saved paper data cannot be read. Existing data has been kept.')}if(!Array.isArray(parsed))throw Error('Saved paper data has an invalid format.');return parsed.map(validate)}
  function write(records){try{localStorage.setItem(key,JSON.stringify(records))}catch{throw Error('Cannot save to this browser. Export a backup before closing.')}}
  const fingerprint=r=>JSON.stringify([r.name,r.ids,['year','source','marks','topics','nameField','answerLines','dataTable','periodicTable'].map(k=>r.options[k]),r.target,r.dependencies]);
  function save(recipe){const records=load(),record=validate({...recipe,id:uid(),createdAt:new Date().toISOString(),deletedAt:null});const same=records.find(r=>!r.deletedAt&&fingerprint(r)===fingerprint(record));if(same)return same;records.unshift(record);write(records);return record}
  function rename(id,name){const records=load(),r=records.find(x=>x.id===id);if(!r)throw Error('Saved paper not found.');r.name=validate({...r,name}).name;write(records);return r}
  function archive(id,archived){const records=load(),r=records.find(x=>x.id===id);if(!r)throw Error('Saved paper not found.');r.archived=archived;write(records)}
  function remove(id){const records=load(),r=records.find(x=>x.id===id);if(!r)throw Error('Saved paper not found.');r.deletedAt=new Date().toISOString();write(records)}
  function restoreDeleted(id){const records=load(),r=records.find(x=>x.id===id);if(!r)throw Error('Deleted paper not found.');r.deletedAt=null;write(records);return r}
  function backup(){return JSON.stringify({format:'chemistry-paper-history',version:1,exportedAt:new Date().toISOString(),papers:load()},null,2)}
  function importBackup(raw){let data;try{data=JSON.parse(raw)}catch{throw Error('Choose a valid saved-paper JSON backup.')}if(data.format!=='chemistry-paper-history'||data.version!==1||!Array.isArray(data.papers)||data.papers.length>1000)throw Error('Unsupported saved-paper backup.');const incoming=data.papers.map(validate),records=load();let count=0;for(const r of incoming){if(records.some(x=>fingerprint(x)===fingerprint(r)))continue;if(records.some(x=>x.id===r.id))r.id=uid();records.push(r);count++}write(records);return count}
  window.ChemHistory={load,save,rename,archive,remove,restoreDeleted,backup,importBackup};
})();
