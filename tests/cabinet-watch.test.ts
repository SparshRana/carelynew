import test from 'node:test';
import assert from 'node:assert/strict';
import {watchMatches,checkCloudCabinet} from '../lib/cabinet-watch';
import type {QualityAlert} from '../lib/quality-alerts';
import type {Medicine} from '../lib/carely';
const m:Medicine={product:'Test tablet',manufacturer:'Test Labs',batch:'A-1',strength:'10mg',form:'tablet',release:'Unknown',origin:'manual',owner:'Dad'};
const r:QualityAlert={id:'fixture',kind:'NSQ',product:'Test tablet',brand:'',manufacturer:'Test Labs',batch:'A-1',manufacturedBy:'',manufactured:'',expiry:'',issue:'Test finding',remarks:'',firmReply:'',reportingSource:'fixture',laboratory:'fixture',period:'JAN-2026',reportedDate:'',sourceUrl:'https://cdscoonline.gov.in/CDSCO/viewPublicNSQDrug',retrievedAt:'2026-11-01'};
test('watch matches only the exact pack, skips missing details and creates stable account-scoped messages',()=>{
 const result=watchMatches([m,{...m,batch:'A-2'},{...m,manufacturer:''}],[r],'owner-a');
 assert.equal(result.checked,2);assert.equal(result.needsDetails,1);assert.equal(result.matchingMedicines,1);assert.equal(result.events.length,1);
 assert.equal(result.events[0].id,watchMatches([m],[{...r,id:'changed-row-index'}],'owner-a').events[0].id);
 assert.notEqual(result.events[0].id,watchMatches([m],[r],'owner-b').events[0].id);
 assert.match(result.events[0].body,/NSQ/);assert.match(result.events[0].body,/Do not change treatment/);
 assert.equal(watchMatches([m],[r,r],'owner-a').events.length,1);
});
test('authenticated watch reads only the server cabinet and inserts idempotent inbox records',async()=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.invalid';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='public';
 const data={records:[r],coverage:[],snapshotAt:'2026-10-29',checkedAt:'2026-11-01',liveAvailable:true,failures:[]};
 let stored=false;
 const fake:typeof fetch=async(url,init)=>{
  assert.equal(new Headers(init?.headers).get('authorization'),'Bearer visitor');
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'owner-a'});
  if(String(url).includes('carely_cabinets'))return Response.json([{medicines:[m,{...m,demo:true}]}]);
  assert.equal(new Headers(init?.headers).get('Prefer'),'resolution=ignore-duplicates,return=representation');
  const rows=JSON.parse(String(init?.body));assert.equal(rows[0].owner_id,'owner-a');const result=stored?[]:rows;stored=true;return Response.json(result);
 };
 const request=()=>new Request('https://carely.invalid/api/watch',{method:'POST',headers:{authorization:'Bearer visitor'}});
 try{
  assert.equal((await checkCloudCabinet(new Request('https://carely.invalid/api/watch'),async()=>data,fake)).status,401);
  const first=await (await checkCloudCabinet(request(),async()=>data,fake)).json() as {newNotifications:number;checked:number};assert.equal(first.newNotifications,1);assert.equal(first.checked,1);
  const again=await (await checkCloudCabinet(request(),async()=>data,fake)).json() as {newNotifications:number};assert.equal(again.newNotifications,0);
  assert.equal((await checkCloudCabinet(request(),async()=>data,async()=>Response.json({}, {status:401}))).status,401);
 }finally{
  if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;
  if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=oldKey;
 }
});
