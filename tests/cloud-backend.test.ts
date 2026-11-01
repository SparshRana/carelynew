import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudGateway} from '../lib/cloud-server';
test('cloud gateway verifies identity, scopes writes and rejects invalid or arbitrary operations',async()=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,oldKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://supabase.invalid';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='public-test-key';
 const request=(resource:string,body?:unknown,method=body?'POST':'GET')=>new Request(`https://carely.invalid/api/cloud?resource=${encodeURIComponent(resource)}`,{method,headers:{authorization:'Bearer visitor-token','content-type':'application/json'},body:body?JSON.stringify(body):undefined});
 let writes=0;
 const fetcher:typeof fetch=async(url,init)=>{
  assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer visitor-token');
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'owner-id'});
  writes++;const body=JSON.parse(String(init?.body));assert.equal(body.owner_id,'owner-id');assert.equal(body.body,'hello');return Response.json([{id:'note-id'}]);
 };
 try{
  assert.equal((await cloudGateway(new Request('https://carely.invalid/api/cloud'),fetcher)).status,401);
  assert.equal((await cloudGateway(request('auth.users'),fetcher)).status,400);
  assert.equal((await cloudGateway(request('rpc/carely_save_cabinet',{p_medicines:[{product:'demo',demo:true}],p_expected_revision:0}),fetcher)).status,400);
  assert.equal((await cloudGateway(request('carely_notifications',{body:'  '}),fetcher)).status,400);
  const result=await cloudGateway(request('carely_notifications',{owner_id:'someone-else',body:' hello '}),fetcher);
  assert.equal(result.status,200);assert.equal(writes,1);assert.equal(result.headers.get('cache-control'),'no-store');
  assert.equal((await cloudGateway(request('carely_cabinets?select=medicines,revision'),async()=>Response.json({}, {status:401}))).status,401);
  assert.equal((await cloudGateway(request('carely_cabinets?select=medicines,revision'),async()=>{throw Error('timeout')})).status,503);
 }finally{
  if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;
  if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=oldKey;
 }
});
