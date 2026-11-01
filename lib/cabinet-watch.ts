import {createHash} from 'node:crypto';
import {restore} from './carely';
import {batchKey,evaluateAlert,type QualityAlert} from './quality-alerts';
import type {HistoryData} from './history-result';

export function watchMatches(medicines:ReturnType<typeof restore>['items'],records:QualityAlert[],owner:string){
 const byBatch=new Map<string,QualityAlert[]>();
 for(const r of records){const k=batchKey(r.batch);byBatch.set(k,[...(byBatch.get(k)||[]),r]);}
 const events=new Map<string,{id:string;owner_id:string;body:string}>();let checked=0,needsDetails=0,matchingMedicines=0;
 for(const m of medicines){
  if(!m.product.trim()||!m.manufacturer.trim()||!m.batch.trim()){needsDetails++;continue;}checked++;let matched=false;
  for(const r of byBatch.get(batchKey(m.batch))||[]){
   if(evaluateAlert(r,{product:m.product,manufacturer:m.manufacturer,batch:m.batch}).match!=='exact')continue;
   matched=true;
   const digest=createHash('sha256').update(JSON.stringify([owner,m.owner||'Me',m.product,m.manufacturer,batchKey(m.batch),r.kind,r.period,r.issue,r.sourceUrl])).digest('hex');
   const id=`${digest.slice(0,8)}-${digest.slice(8,12)}-4${digest.slice(13,16)}-a${digest.slice(17,20)}-${digest.slice(20,32)}`;
   events.set(id,{id,owner_id:owner,body:`Matching quality alert found. ${m.owner||'Me'}: ${m.product}. Batch: ${m.batch}. Manufacturer: ${m.manufacturer}. Report type: ${r.kind}. Reporting period: ${r.period}. Finding: ${r.issue.slice(0,400)}. Source: ${r.sourceUrl.slice(0,300)}. Review the original report with your pharmacist or doctor. Do not change treatment on your own.`.slice(0,2000)});
  }
  if(matched)matchingMedicines++;
 }
 return {events:[...events.values()],checked,needsDetails,matchingMedicines};
}
export async function checkCloudCabinet(request:Request,load:()=>Promise<HistoryData>,fetcher:typeof fetch=fetch){
 const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!key)return reply({error:'Cloud setup is pending.'},503);
 const authorization=request.headers.get('authorization')||'';
 if(!/^Bearer \S+$/.test(authorization))return reply({error:'Sign in to check your cloud cabinet.'},401);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return reply({error:'Cross-origin request rejected.'},403);
 try{
  const headers={apikey:key,authorization,'Content-Type':'application/json'};
  const call=(path:string,init:RequestInit={})=>fetcher(base+path,{...init,headers:{...headers,...init.headers},cache:'no-store',signal:AbortSignal.timeout(15000)});
  const auth=await call('/auth/v1/user');if(!auth.ok)return reply({error:'Please sign in again.'},401);
  const user=await auth.json() as {id?:string};if(!user.id)return reply({error:'Please sign in again.'},401);
  const cabinet=await call('/rest/v1/carely_cabinets?select=medicines');if(!cabinet.ok)throw Error('Cabinet unavailable');
  const rows=await cabinet.json() as {medicines:unknown}[];
  if(!Array.isArray(rows))throw Error('Invalid cabinet');
  const medicines=restore(JSON.stringify({items:rows[0]?.medicines||[]})).items;
  const data=await load();const result=watchMatches(medicines,data.records,user.id);
  let newNotifications=0;
  // Stable UUIDs and the database primary key make repeat and concurrent checks idempotent.
  for(let i=0;i<result.events.length;i+=50){
   const saved=await call('/rest/v1/carely_notifications?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify(result.events.slice(i,i+50))});
   if(!saved.ok)throw Error('Could not save alert notifications');
   const inserted=await saved.json() as unknown[];if(!Array.isArray(inserted))throw Error('Invalid notification response');newNotifications+=inserted.length;
  }
  return reply({checked:result.checked,needsDetails:result.needsDetails,matchingMedicines:result.matchingMedicines,newNotifications,recordCount:data.records.length,checkedAt:data.checkedAt,snapshotAt:data.snapshotAt,liveAvailable:data.liveAvailable,gaps:data.failures,label:result.matchingMedicines?'Matching quality alert found':result.needsDetails?'Details need confirmation':!data.liveAvailable?'Alert check unavailable':'No matching alert found in the checked records'});
 }catch{return reply({error:'Cabinet check could not complete. Retry; already saved alerts will not be duplicated.'},503);}
}
