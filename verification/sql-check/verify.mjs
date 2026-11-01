import {PGlite} from '@electric-sql/pglite';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite();const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${a}'),('${b}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;grant usage on schema auth to authenticated;`);
await db.exec(await fs.readFile(new URL('../../supabase/schema.sql',import.meta.url),'utf8'));
async function user(id,email){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({email})]);await db.exec('set role authenticated');}
async function scalar(sql,args=[]){return Object.values((await db.query(sql,args)).rows[0])[0];}
await user(a,'owner@example.invalid');assert.equal(Number(await scalar("select public.carely_save_cabinet('[]'::jsonb,0)")),1);
await assert.rejects(()=>db.query("select public.carely_save_cabinet('[]'::jsonb,0)"),/Cloud cabinet changed/);
assert.equal(Number(await scalar('select revision from public.carely_cabinets')),1);
await user(b,'recipient@example.invalid');assert.equal((await db.query('select * from public.carely_cabinets')).rows.length,0);
await user(a,'owner@example.invalid');await db.query('insert into public.carely_family(owner_id,recipient_email) values($1,$2)',[a,'recipient@example.invalid']);await db.query('insert into public.carely_notifications(owner_id,body) values($1,$2)',[a,'Private test message']);
await user(b,'recipient@example.invalid');assert.equal((await db.query('select * from public.carely_notifications')).rows.length,1);assert.equal((await db.query('select * from public.carely_family')).rows.length,1);
await user(a,'owner@example.invalid');await db.query('update public.carely_family set enabled=false where owner_id=$1',[a]);await user(b,'recipient@example.invalid');assert.equal((await db.query('select * from public.carely_notifications')).rows.length,0);
await user(a,'owner@example.invalid');for(let i=0;i<6;i++)assert.equal(await scalar("select public.carely_consume_ai_quota('chat')"),true);assert.equal(await scalar("select public.carely_consume_ai_quota('chat')"),false);
for(let i=6;i<20;i++){await db.exec('reset role');await db.query("update public.carely_ai_usage set minute_start=now()-interval '2 minutes' where user_id=$1",[a]);await db.exec('set role authenticated');assert.equal(await scalar("select public.carely_consume_ai_quota('chat')"),true);}
await db.exec('reset role');await db.query("update public.carely_ai_usage set minute_start=now()-interval '2 minutes' where user_id=$1",[a]);await db.exec('set role authenticated');assert.equal(await scalar("select public.carely_consume_ai_quota('chat')"),false);
for(let i=0;i<10;i++){await db.exec('reset role');await db.query("update public.carely_ai_usage set minute_start=now()-interval '2 minutes' where user_id=$1",[a]);await db.exec('set role authenticated');assert.equal(await scalar("select public.carely_consume_ai_quota('speech')"),true);}
assert.equal(await scalar("select public.carely_consume_ai_quota('speech')"),false);await assert.rejects(()=>db.query('update public.carely_ai_usage set chat_count=0'),/permission denied/);
await user(b,'recipient@example.invalid');assert.equal(await scalar("select public.carely_consume_ai_quota('chat')"),true);

await user(a,'owner@example.invalid');
await assert.rejects(()=>db.query("update public.carely_cabinets set medicines='[{}]'::jsonb"),/Invalid medicine/);
await assert.rejects(()=>db.query('insert into public.carely_notifications(owner_id,body) values($1,$2)',[a,'   ']),/carely_message_not_blank/);
await assert.rejects(()=>db.query('insert into public.carely_family(owner_id,recipient_email) values($1,$2)',[a,'invalid']),/carely_recipient_valid/);
await user(b,'recipient@example.invalid');
assert.equal((await db.query('update public.carely_family set enabled=true returning id')).rows.length,0);
await assert.rejects(()=>db.query('insert into public.carely_notifications(owner_id,body) values($1,$2)',[a,'impersonation']),/row-level security/);
await db.exec('reset role');await db.exec('set role anon');
await assert.rejects(()=>db.query('select * from public.carely_cabinets'),/permission denied/);
await db.close();console.log('PASS: SQL migration, revision conflicts, cabinet isolation, family grant/read/revoke, account isolation, 6/minute, 20 chat/day, 10 speech/day, and direct-counter-write denial. Auth schema uses isolated test identities; no live Supabase service was contacted.');
