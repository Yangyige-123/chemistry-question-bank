/* One counting rule for the library, selection drawer and selected-paper browser. */
(() => {
 function fromEntries(entries){const unique=new Map();for(const e of entries)if(e?.a&&e?.q)unique.set(e.a.id,e);const items=[...unique.values()],scored=items.filter(e=>Number.isFinite(e.a.marks));return {questions:new Set(items.map(e=>e.q.id)).size,parts:items.length,marks:scored.reduce((n,e)=>n+e.a.marks,0),unknown:items.length-scored.length,scored:scored.length};}
 const fromIds=(ids,index)=>fromEntries(ids.map(id=>index[id]));
 function text(s){return `${s.questions} questions · ${s.parts} parts · ${s.unknown?(s.scored?s.marks+' known marks':'— marks')+' · '+s.unknown+' unscored parts':s.marks+' marks'}`;}
 window.ChemSelectionStats={fromEntries,fromIds,text};
})();
