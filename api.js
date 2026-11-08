const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store',...extra}});
const bytes=s=>new TextEncoder().encode(s);
const hex=buf=>Array.from(new Uint8Array(buf),v=>v.toString(16).padStart(2,'0')).join('');
async function digest(value){return hex(await crypto.subtle.digest('SHA-256',bytes(value)));}
async function signature(value,secret){const key=await crypto.subtle.importKey('raw',bytes(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,bytes(value)));}
async function seal(payload,secret){const data=btoa(JSON.stringify(payload));return data+'.'+await signature(data,secret);}
async function unseal(token,secret){
 if(typeof token!=='string'||token.length>16000)throw new Error('Invalid checkout receipt.');
 const [data,sig]=token.split('.'),expected=await signature(data,secret);
 if(!sig||sig.length!==expected.length||[...sig].reduce((n,c,i)=>n|(c.charCodeAt(0)^expected.charCodeAt(i)),0))throw new Error('Invalid checkout receipt.');
 const value=JSON.parse(atob(data));if(value.expires<Date.now())throw new Error('Checkout expired. Rebuild the plan.');return value;
}
export function createApi({solve,orderBody,classify,fetcher=fetch}){
 async function paypal(path,env,body,idempotency){
  const auth=await fetcher('https://api-m.sandbox.paypal.com/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+btoa(env.PAYPAL_CLIENT_ID+':'+env.PAYPAL_CLIENT_SECRET),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(20000)});
  if(!auth.ok)throw new Error('PayPal sandbox authentication failed. Check the server credentials.');
  const token=await auth.json();const response=await fetcher('https://api-m.sandbox.paypal.com'+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json',...(idempotency?{'PayPal-Request-Id':idempotency}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const data=await response.json();if(!response.ok){if(data.details?.some(x=>x.issue==='ORDER_ALREADY_CAPTURED'))return paypal(path.replace('/capture',''),env);throw new Error('PayPal sandbox could not complete this step. No completed payment is being claimed.');}return data;
 }
 return async function api(request,env={}){
  const url=new URL(request.url),configured=Boolean(env.PAYPAL_CLIENT_ID&&env.PAYPAL_CLIENT_SECRET);
  if(url.pathname==='/api/config')return json({sandbox:true,configured,clientId:configured?env.PAYPAL_CLIENT_ID:null,inventory:'synthetic',model:'local-naive-bayes'});
  if(request.method!=='POST')return json({error:'Method not allowed.'},405);
  if(request.headers.get('origin')!==url.origin||!request.headers.get('content-type')?.includes('application/json'))return json({error:'Use this site to start checkout.'},403);
  const raw=await request.text();if(raw.length>18000)return json({error:'Request too large.'},413);
  try{
   const input=JSON.parse(raw);
   if(url.pathname==='/api/triage')return json(classify(input.note));
   if(url.pathname==='/api/plan')return json(solve(input));
   if(!configured)return json({error:'PayPal sandbox is not connected. Add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET on the server. The repair planner still works.'},503);
   if(url.pathname==='/api/orders'){
    if(input.confirmed!==true)throw new Error('Confirm the component requirements before checkout.');
    const plan=solve(input);if(!plan.restored)throw new Error('No eligible repairs in this plan.');
    const nonce=crypto.randomUUID(),reference=(await digest(JSON.stringify(plan))).slice(0,32);
    const order=await paypal('/v2/checkout/orders',env,orderBody(plan,reference),nonce);
    if(!order.id)throw new Error('PayPal did not return an order ID.');
    const receipt=await seal({orderId:order.id,reference,cost:plan.cost,restored:plan.restored,session:nonce,expires:Date.now()+30*60*1000},env.PAYPAL_CLIENT_SECRET);
    return json({id:order.id,receipt,cost:plan.cost},200,{'Set-Cookie':`ss_checkout=${nonce}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800${url.protocol==='https:'?'; Secure':''}`});
   }
   if(url.pathname==='/api/capture'){
    const proof=await unseal(input.receipt,env.PAYPAL_CLIENT_SECRET);
    const session=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('ss_checkout='))?.slice(12);
    if(input.orderId!==proof.orderId||session!==proof.session)throw new Error('Checkout does not belong to this browser.');
    const order=await paypal(`/v2/checkout/orders/${encodeURIComponent(proof.orderId)}/capture`,env,{},'ss-'+(await digest(proof.orderId)).slice(0,32));
    const unit=order.purchase_units?.[0],capture=unit?.payments?.captures?.find(c=>c.status==='COMPLETED');
    if(order.status!=='COMPLETED'||!capture||capture.amount?.currency_code!=='USD'||Math.round(Number(capture.amount.value)*100)!==proof.cost||unit.custom_id!==proof.reference)throw new Error('Capture could not be verified against the repair plan.');
    return json({status:'COMPLETED',id:order.id,captureId:capture.id,cost:proof.cost,plannedRepairs:proof.restored,sandbox:true});
   }
   return json({error:'Unknown API route.'},404);
  }catch(error){return json({error:error.message||'Unable to complete request.'},400);}
 };
}
