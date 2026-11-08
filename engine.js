// Shared by the browser and server. All prices and inventory are synthetic demo data.
export const machines = [
 {id:'library',name:'Library loaner',label:'BENCH 01',need:'ram',notes:'Memory diagnostic failed. Repeated memory errors and blue screens; tested with a known-good stick.',spec:{type:'DDR4',form:'UDIMM',capacity:8},selected:true},
 {id:'student',name:'Student workstation',label:'BENCH 02',need:'ssd',notes:'No boot device found. The drive is not detected in BIOS; a known-good SATA drive works.',spec:{bus:'SATA',form:'2.5-inch',capacity:240},selected:true},
 {id:'community',name:'Community desktop',label:'BENCH 03',need:'psu',notes:'No power or fan movement. A technician verified the power supply failed with a known-good replacement.',spec:{form:'ATX',connector:'24-pin + 8-pin EPS',watts:450},selected:true},
 {id:'mini',name:'Compact study PC',label:'BENCH 04',need:'ram',notes:'Memory test reports errors. The system requires laptop-size memory modules.',spec:{type:'DDR4',form:'SODIMM',capacity:8},selected:false}
];
export const offers = [
 {id:'donor',name:'Donor tower · damaged chassis',seller:'Demo reuse depot',price:6800,kind:'donor',description:'Three individually bench-tested components. Chassis is unusable; parts are sold for local pickup.',parts:[
  {id:'d-ram',kind:'ram',name:'8 GB DDR4 desktop memory',type:'DDR4',form:'UDIMM',capacity:8,tested:true},
  {id:'d-ssd',kind:'ssd',name:'256 GB SATA SSD',bus:'SATA',form:'2.5-inch',capacity:256,tested:true},
  {id:'d-psu',kind:'psu',name:'500 W ATX power supply',form:'ATX',connector:'24-pin + 8-pin EPS',watts:500,tested:true}
 ]},
 {id:'old-donor',name:'Office tower · older generation',seller:'Demo reuse depot',price:3900,kind:'donor',description:'A lower sticker price hides two compatibility mismatches.',parts:[
  {id:'o-ram',kind:'ram',name:'8 GB DDR3 desktop memory',type:'DDR3',form:'UDIMM',capacity:8,tested:true},
  {id:'o-ssd',kind:'ssd',name:'240 GB SATA SSD',bus:'SATA',form:'2.5-inch',capacity:240,tested:true},
  {id:'o-psu',kind:'psu',name:'180 W proprietary power supply',form:'SFF proprietary',connector:'6-pin proprietary',watts:180,tested:true}
 ]},
 {id:'single-ram',name:'8 GB DDR4 UDIMM',seller:'Demo reuse depot',price:2200,kind:'part',parts:[{id:'r1',kind:'ram',name:'8 GB DDR4 desktop memory',type:'DDR4',form:'UDIMM',capacity:8,tested:true}]},
 {id:'single-ssd',name:'256 GB SATA SSD',seller:'Demo reuse depot',price:2900,kind:'part',parts:[{id:'s1',kind:'ssd',name:'256 GB SATA SSD',bus:'SATA',form:'2.5-inch',capacity:256,tested:true}]},
 {id:'single-psu',name:'500 W ATX PSU',seller:'Demo reuse depot',price:3800,kind:'part',parts:[{id:'p1',kind:'psu',name:'500 W ATX power supply',form:'ATX',connector:'24-pin + 8-pin EPS',watts:500,tested:true}]},
 {id:'small-ram',name:'8 GB DDR4 SODIMM',seller:'Demo reuse depot',price:1900,kind:'part',parts:[{id:'r2',kind:'ram',name:'8 GB DDR4 compact memory',type:'DDR4',form:'SODIMM',capacity:8,tested:true}]},
 {id:'unknown-ram',name:'Unidentified memory module',seller:'Demo reuse depot',price:700,kind:'part',description:'Missing generation and test evidence. Never eligible for checkout.',parts:[{id:'u1',kind:'ram',name:'Unidentified memory',type:null,form:'UDIMM',capacity:8,tested:false}]}
];
export const money = cents => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(cents/100);
export function compatibility(part,machine){
 const checks=[]; const add=(label,got,want,min=false)=>{const known=got!==null&&got!==undefined;checks.push({label,actual:got??'Unverified',required:want,status:!known?'unknown':(min?got>=want:got===want)?'pass':'fail'});};
 add('Component',part.kind,machine.need); if(part.kind!==machine.need)return {ok:false,checks};
 add('Bench-test evidence',part.tested,true);
 if(machine.need==='ram'){add('Memory generation',part.type,machine.spec.type);add('Module shape',part.form,machine.spec.form);add('Capacity (GB)',part.capacity,machine.spec.capacity,true);}
 if(machine.need==='ssd'){add('Interface',part.bus,machine.spec.bus);add('Drive shape',part.form,machine.spec.form);add('Capacity (GB)',part.capacity,machine.spec.capacity,true);}
 if(machine.need==='psu'){add('Form factor',part.form,machine.spec.form);add('Connectors',part.connector,machine.spec.connector);add('Rated power (W)',part.watts,machine.spec.watts,true);}
 return {ok:checks.every(c=>c.status==='pass'),checks};
}
function allocate(pool,targets){
 let best=[];
 function walk(i,used,rows){if(i===targets.length){if(rows.length>best.length)best=rows.slice();return;}
  if(rows.length+targets.length-i<=best.length)return;
  const machine=targets[i];
  for(const part of pool){if(!used.has(part.id)&&compatibility(part,machine).ok){used.add(part.id);rows.push({machineId:machine.id,partId:part.id,offerId:part.offerId});walk(i+1,used,rows);rows.pop();used.delete(part.id);}}
  walk(i+1,used,rows);
 }
 walk(0,new Set(),[]);return best;
}
export function solve({targetIds,budget=7500,excluded=[],singlesOnly=false}={}){
 if(!Array.isArray(targetIds)||new Set(targetIds).size!==targetIds.length||targetIds.length>4||targetIds.some(id=>!machines.some(m=>m.id===id)))throw new Error('Choose valid, distinct bench machines.');
 if(!Number.isInteger(budget)||budget<0||budget>100000)throw new Error('Budget must be between $0 and $1,000.');
 if(!Array.isArray(excluded)||excluded.some(id=>!offers.some(o=>o.id===id)))throw new Error('Unknown inventory selection.');
 const targets=machines.filter(m=>targetIds.includes(m.id));
 const available=offers.filter(o=>!excluded.includes(o.id)&&(!singlesOnly||o.kind==='part'));
 let best={cost:0,restored:0,selected:[],assignments:[],targets:targetIds,budget,unusedParts:0};
 for(let mask=1;mask<2**available.length;mask++){
  const selected=available.filter((_,i)=>mask&(1<<i));const cost=selected.reduce((s,o)=>s+o.price,0);if(cost>budget)continue;
  const pool=selected.flatMap(o=>o.parts.map(p=>({...p,offerId:o.id})));
  const assignments=allocate(pool,targets), restored=assignments.length;
  if(restored>best.restored||(restored===best.restored&&(cost<best.cost||(cost===best.cost&&selected.length<best.selected.length))))best={cost,restored,selected:selected.map(o=>o.id),assignments,targets:targetIds,budget,unusedParts:pool.length-restored};
 }
 return best;
}
export function orderBody(plan,reference){
 if(!plan.restored||!plan.selected.length)throw new Error('No eligible repair plan.');
 const items=plan.selected.map(id=>{const o=offers.find(x=>x.id===id);return {name:o.name,sku:o.id,quantity:'1',category:'PHYSICAL_GOODS',unit_amount:{currency_code:'USD',value:(o.price/100).toFixed(2)}};});
 return {intent:'CAPTURE',purchase_units:[{reference_id:'second-socket',custom_id:reference,description:`Second Socket: ${plan.restored} planned repairs; synthetic sandbox inventory`,items,amount:{currency_code:'USD',value:(plan.cost/100).toFixed(2),breakdown:{item_total:{currency_code:'USD',value:(plan.cost/100).toFixed(2)}}}}],payment_source:{paypal:{experience_context:{shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW'}}}};
}
