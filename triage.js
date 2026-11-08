// An inspectable multinomial Naive Bayes text classifier, trained on authored synthetic notes.
// Suggestions are NOT physical diagnoses. A human must confirm a target's component and specifications.
export const training = {
 ram:[
 'memory diagnostic reports errors faulty memory module replace ram stick',
 'random blue screens memory management failure bad ram stick',
 'memtest fails repeated bit errors on memory module',
 'system unstable memory test failed replace desktop memory',
 'computer crashes with bad memory module known good ram works',
 'beeping at startup memory not detected defective ram',
 'memory diagnostic failed repeated errors blue screens tested known good stick',
 'intermittent crashes memory corruption need replacement dimm',
 'faulty ram stick causes boot loops memory test errors',
 'verified failed memory replace module in computer',
 'laptop memory test failed need sodimm replacement',
 'ram diagnostic bad memory addresses errors during memtest'
 ],
 ssd:[
 'no boot device found drive not detected bios replacement storage',
 'smart drive failure disk errors failing ssd replace storage',
 'hard disk clicking drive failed needs solid state replacement',
 'bios sees no sata drive known good disk boots correctly',
 'computer cannot find boot disk failed storage drive',
 'ssd read errors disk failing smart warning replace drive',
 'missing storage drive computer needs sata ssd',
 'operating system cannot boot corrupted disk bad sectors',
 'storage diagnostics failed ssd disconnected from bios',
 'drive not detected tested replacement disk works',
 'disk read failure boot device inaccessible storage failure',
 'solid state drive dead replace boot storage'
 ],
 psu:[
 'no power no fan movement power supply failed verified replacement works',
 'power supply tested dead needs replacement psu',
 'computer has no power known good power supply works',
 'technician confirmed power supply voltage failure',
 'desktop will not turn on no lights failed psu',
 'psu test failed no output voltage replace power supply',
 'no fans no lights technician isolated failed power supply',
 'power unit failed tester confirms dead psu',
 'replacement power supply fixes startup failed original unit',
 'verified faulty power supply computer completely unpowered',
 'computer does not start known good psu starts system',
 'power supply failure no fan rotation no indicator lights'
 ]
};
const stop=new Set('a an the is are with to of in at on and or for it this that has have was from'.split(' '));
const tokens=text=>(text.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(t=>!stop.has(t));
const vocabulary=new Set(),counts={},totals={};
for(const [label,notes] of Object.entries(training)){counts[label]={};totals[label]=0;for(const note of notes)for(const t of tokens(note)){vocabulary.add(t);counts[label][t]=(counts[label][t]||0)+1;totals[label]++;}}
export function classify(text){
 if(typeof text!=='string'||text.length>4000)throw new Error('Use a bench note of at most 4,000 characters.');
 const all=tokens(text),known=all.filter(t=>vocabulary.has(t));
 const scores=Object.keys(training).map(label=>({label,log:known.reduce((s,t)=>s+Math.log(((counts[label][t]||0)+1)/(totals[label]+vocabulary.size)),Math.log(1/3))})).sort((a,b)=>b.log-a.log);
 const z=scores.reduce((s,x)=>s+Math.exp(x.log-scores[0].log),0);
 const ranked=scores.map(x=>({label:x.label,score:Math.exp(x.log-scores[0].log)/z}));
 const coverage=all.length?known.length/all.length:0;
 const ambiguous=known.length<3||coverage<.3||ranked[0].score<.72;
 return {suggestion:ambiguous?null:ranked[0].label,ranked,coverage,matchedWords:[...new Set(known)],requiresHumanReview:true,model:'Multinomial Naive Bayes · 36 synthetic training notes',warning:ambiguous?'Insufficient evidence. Check the hardware before ordering.':'A language-based routing suggestion, not a verified diagnosis.'};
}
