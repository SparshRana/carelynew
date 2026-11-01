import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fetchQualityHistory} from '../lib/history-client';
import {searchAlerts,type AlertSnapshot} from '../lib/quality-alerts';
const query={product:'ACNEMOIST',manufacturer:'Pritam International pvt. ltd',batch:'AM2430'};
const noMatch={state:'no-match',label:'No matching alert found in the checked records',records:[],total:0,nextOffset:null};
test('the reported ACNEMOIST query is submitted with all three identifiers',async()=>{
 let requested='';const fetcher:typeof fetch=async(url,init)=>{requested=String(url);assert.equal(init?.cache,'no-store');assert.ok(init?.signal);return Response.json(noMatch);};
 const result=await fetchQualityHistory(query,0,new AbortController().signal,fetcher);
 const url=new URL(requested,'http://localhost');for(const [key,value] of Object.entries(query))assert.equal(url.searchParams.get(key),value);
 assert.equal(result.state,'no-match');
 const snapshot=JSON.parse(fs.readFileSync('data/cdsco-alerts.json','utf8')) as AlertSnapshot;
 assert.equal(searchAlerts(snapshot.records,query).length,0);
});
test('network failures, HTTP errors and invalid responses produce explicit errors',async()=>{
 const signal=new AbortController().signal;
 await assert.rejects(()=>fetchQualityHistory(query,0,signal,async()=>{throw Error('Network unavailable');}),/Network unavailable/);
 await assert.rejects(()=>fetchQualityHistory(query,0,signal,async()=>Response.json({error:'Official history unavailable'},{status:503})),/Official history unavailable/);
 await assert.rejects(()=>fetchQualityHistory(query,0,signal,async()=>new Response('<html>Proxy error</html>')),/unreadable response/);
 await assert.rejects(()=>fetchQualityHistory(query,0,signal,async()=>Response.json({})),/incomplete results/);
});
test('a stalled check is bounded and reports a timeout instead of leaving a silent button',async()=>{
 const keepAlive=setTimeout(()=>{},200);
 try{await assert.rejects(()=>fetchQualityHistory(query,0,new AbortController().signal,async(_url,init)=>await new Promise((_resolve,reject)=>{init!.signal!.addEventListener('abort',()=>reject(init!.signal!.reason),{once:true});}),10),/check took too long/);}finally{clearTimeout(keepAlive);}
});
test('caller cancellation is distinguishable from a timeout',async()=>{
 const controller=new AbortController();controller.abort();
 await assert.rejects(()=>fetchQualityHistory(query,0,controller.signal,async(_url,init)=>{throw init!.signal!.reason;}),e=>e instanceof Error&&e.name==='AbortError');
});
