import test from 'node:test';
import assert from 'node:assert/strict';
import {POST as chat} from '../app/api/assistant/route';
import {POST as speech} from '../app/api/speech/route';
test('paid AI routes enforce auth, input checks and durable quota before contacting the provider',async()=>{
 const originalFetch=globalThis.fetch;const names=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','OPENAI_API_KEY'] as const;const saved=names.map(n=>process.env[n]);
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://supabase.test.invalid';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test-anon';process.env.OPENAI_API_KEY='test-api-key';
 let allowed:unknown=true;let quotaStatus=200;let providerCalls=0;
 globalThis.fetch=async(input)=>{const url=String(input);if(url.includes('/auth/v1/user'))return Response.json({id:'test-account'});if(url.includes('carely_consume_ai_quota'))return Response.json(allowed,{status:quotaStatus});if(url.includes('/chat/completions')){providerCalls++;return Response.json({choices:[{message:{content:'Test response'}}]});}if(url.includes('/audio/speech')){providerCalls++;return new Response(new Uint8Array([1,2,3]),{headers:{'Content-Type':'audio/mpeg'}});}throw Error('Unexpected network request');};
 const request=(body:unknown,auth=true)=>new Request('https://carely.invalid/api/test',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{authorization:'Bearer test-session'}:{})},body:JSON.stringify(body)});
 try{
  assert.equal((await chat(request({question:'hello'},false))).status,401);assert.equal(providerCalls,0);
  assert.equal((await chat(request({question:' '}))).status,400);
  assert.equal((await speech(request({text:''}))).status,400);
  allowed=false;assert.equal((await chat(request({question:'General label question'}))).status,429);assert.equal(providerCalls,0);
  quotaStatus=404;assert.equal((await speech(request({text:'Test transcript'}))).status,503);assert.equal(providerCalls,0);
  quotaStatus=200;allowed=true;const response=await chat(request({question:'General label question'}));assert.equal(response.status,200);assert.equal((await response.json() as {answer:string}).answer,'Test response');
  const audio=await speech(request({text:'Test transcript'}));assert.equal(audio.status,200);assert.equal(audio.headers.get('Content-Type'),'audio/mpeg');assert.equal(providerCalls,2);
 }finally{globalThis.fetch=originalFetch;names.forEach((n,i)=>{if(saved[i]===undefined)delete process.env[n];else process.env[n]=saved[i];});}
});
