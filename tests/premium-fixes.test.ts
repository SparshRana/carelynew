import test from 'node:test';
import assert from 'node:assert/strict';
import {add,restore,mergeCabinets,type Medicine} from '../lib/carely';
import {mergeAlertSnapshots} from '../lib/alert-snapshot';
import {manufacturerKey,evaluateAlert,type AlertSnapshot,type QualityAlert} from '../lib/quality-alerts';
import {historyResult} from '../lib/history-result';
import {cardTilt} from '../lib/card-motion';
import {cameraConstraints,cameraError} from '../lib/scanner';
import {translate} from '../lib/hi';
import {requireAccount,reserveAiUsage} from '../lib/service-auth';
const medicine:Medicine={product:'Test pack',manufacturer:'Test manufacturer',strength:'10 mg',form:'tablet',release:'Unknown',batch:'B-1',owner:'Dad',origin:'manual'};
const record:QualityAlert={id:'unit-fixture',kind:'NSQ',product:'Test pack',brand:'Test brand',batch:'B-1',manufacturer:'M/s. Test Manufacturer Pvt. Ltd., Plot 123, India',manufacturedBy:'',manufactured:'Jan-2025',expiry:'Dec-2026',issue:'Test finding',remarks:'',firmReply:'',reportingSource:'Test fixture',laboratory:'Test fixture',period:'JAN-2026',reportedDate:'',sourceUrl:'https://cdscoonline.gov.in/CDSCO/unit-fixture',retrievedAt:'2026-10-29T00:00:00Z'};
test('large cabinets survive reload and malformed entries do not discard healthy records',()=>{
 const items=Array.from({length:125},(_,i)=>({...medicine,batch:`B-${i}`}));
 assert.equal(restore(JSON.stringify({items})).items.length,125);
 assert.equal(restore(JSON.stringify({items:[items[0],{...medicine,notes:12},items[1]]})).items.length,2);
});
test('family ownership is part of duplicate identity',()=>{
 assert.equal(add(add([],medicine),{...medicine,owner:'Mom'}).length,2);
 assert.equal(add(add([],medicine),{...medicine,owner:' dad '}).length,1);
});
test('cloud merge retains local and remote-only records and counts conflicts',()=>{
 const local={...medicine,expiry:'2027-01',notes:'Device note'};const remote={...medicine,expiry:'2026-12',notes:'Cloud note'};
 const result=mergeCabinets([local],[remote,{...medicine,owner:'Mom'},{...medicine,batch:'B-2'}]);
 assert.equal(result.items.length,3);assert.equal(result.conflicts,1);assert.equal(result.items[0].expiry,'2027-01');assert.equal(result.items[0].notes,'Device note');
 assert.equal(mergeCabinets([medicine],[{...medicine,expiry:'2026-12'}]).items[0].expiry,'2026-12');
});
test('failed history periods preserve earlier records, successful empty tables can replace old data',()=>{
 const previous:AlertSnapshot={schemaVersion:1,generatedAt:'old',records:[record,{...record,id:'b',period:'FEB-2026'}],coverage:[{kind:'NSQ',period:'JAN-2026',count:1,retrievedAt:'old',sourceUrl:record.sourceUrl},{kind:'NSQ',period:'FEB-2026',count:1,retrievedAt:'old',sourceUrl:record.sourceUrl}],failures:[]};
 const update:AlertSnapshot={schemaVersion:1,generatedAt:'new',records:[],coverage:[{kind:'NSQ',period:'JAN-2026',count:0,retrievedAt:'new',sourceUrl:record.sourceUrl}],failures:['NSQ Feb-2026 unavailable']};
 const merged=mergeAlertSnapshots(previous,update);assert.equal(merged.records.length,1);assert.equal(merged.records[0].period,'FEB-2026');assert.equal(merged.coverage.length,2);assert.equal(merged.failures.length,1);
});
test('company name agreement can omit the report address without accepting a different company',()=>{
 assert.equal(manufacturerKey('M/s. Test Manufacturer Pvt. Ltd.'),'test manufacturer private limited');
 const q={product:'Test brand',manufacturer:'Test Manufacturer Private Limited',batch:'B-1'};
 assert.equal(evaluateAlert(record,q).match,'exact');assert.equal(evaluateAlert(record,{...q,manufacturer:'Other Manufacturer Private Limited'}).match,'candidate');
});
test('missing batch returns separately labelled related reports without changing the scoped no-match',()=>{
 const result=historyResult({records:[record],coverage:[],snapshotAt:'old',checkedAt:'new',liveAvailable:true,failures:[]},{product:'Test brand',batch:'DIFFERENT'});
 assert.equal(result.state,'no-match');assert.equal(result.records.length,0);assert.equal(result.relatedTotal,1);assert.equal(result.relatedRecords[0].record.batch,'B-1');
});
test('card tilt remains bounded without affecting dimensions',()=>{
 const rect={left:0,top:0,width:300,height:200};assert.deepEqual(cardTilt(150,100,rect),{x:-0,y:0});assert.deepEqual(cardTilt(10000,-10000,rect),{x:3,y:3});
});
test('scanner explicitly prefers rear camera and reports specific permission/device failures',()=>{
 assert.deepEqual((cameraConstraints.video as MediaTrackConstraints).facingMode,{ideal:'environment'});
 assert.match(cameraError({name:'NotAllowedError'}),/blocked/);assert.match(cameraError({name:'NotFoundError'}),/No camera/);assert.match(cameraError({name:'NotReadableError'}),/in use/);
});
test('Hindi UI includes the key cabinet, scan and safety outcomes',()=>{
 for(const text of ['Medicine quality history','Scan new medicine','Check quality history','No matching alert found in the checked records','Matching quality alert found','Alert check unavailable','Confirm cloud save'])assert.notEqual(translate(text),text);
});
test('AI auth and quota fail closed, preserve server auth and never treat malformed responses as approval',async()=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.invalid';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test-public-key';
 const request=new Request('https://carely.invalid',{headers:{authorization:'Bearer test-session'}});
 try{
  assert.equal(await requireAccount(request,async()=>Response.json({id:'test-user'})),true);
  assert.equal(await requireAccount(request,async()=>new Response('',{status:401})),false);
  assert.equal(await requireAccount(request,async()=>Response.json({})),false);
  assert.equal(await reserveAiUsage(request,'chat',async(url,init)=>{assert.match(String(url),/carely_consume_ai_quota/);assert.equal(new Headers(init?.headers).get('authorization'),'Bearer test-session');return Response.json(true);}), 'allowed');
  assert.equal(await reserveAiUsage(request,'chat',async()=>Response.json(false)),'limited');
  assert.equal(await reserveAiUsage(request,'speech',async()=>new Response('',{status:404})),'unavailable');
  assert.equal(await reserveAiUsage(request,'chat',async()=>Response.json({allowed:true})),'unavailable');
 }finally{if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=oldKey;}
});

test('cloud saves send expected revision and surface a concurrent-edit rejection',async()=>{
 const {cloudRequest}=await import('../lib/cloud-client');const config={url:'https://test.invalid',key:'test-key',token:'test-token'};
 const next=await cloudRequest<number>(config,'rpc/carely_save_cabinet','POST',{p_medicines:[medicine],p_expected_revision:4},async(url,init)=>{assert.equal(new URL(String(url),'https://carely.invalid').searchParams.get('resource'),'rpc/carely_save_cabinet');assert.equal(JSON.parse(init!.body as string).p_expected_revision,4);assert.equal(new Headers(init?.headers).get('authorization'),'Bearer test-token');return Response.json(5);});assert.equal(next,5);
 await assert.rejects(()=>cloudRequest(config,'rpc/carely_save_cabinet','POST',{},async()=>Response.json({message:'Cloud cabinet changed. Load and review again.'},{status:409})),/Cloud cabinet changed/);
});
