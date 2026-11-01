-- Run once in the Supabase SQL editor. All private rows require authenticated access.
create table if not exists public.carely_cabinets(user_id uuid primary key references auth.users on delete cascade, medicines jsonb not null default '[]', updated_at timestamptz not null default now());
create table if not exists public.carely_family(id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade, recipient_email text not null check(recipient_email=lower(trim(recipient_email))), enabled boolean not null default true, unique(owner_id,recipient_email));
create table if not exists public.carely_notifications(id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users on delete cascade, body text not null check(length(body)<=2000), created_at timestamptz not null default now());
alter table public.carely_cabinets enable row level security;
alter table public.carely_family enable row level security;
alter table public.carely_notifications enable row level security;
drop policy if exists cabinet_owner on public.carely_cabinets;
create policy cabinet_owner on public.carely_cabinets for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists family_owner on public.carely_family;
create policy family_owner on public.carely_family for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists notification_owner on public.carely_notifications;
create policy notification_owner on public.carely_notifications for all to authenticated using(owner_id=auth.uid()) with check(owner_id=auth.uid());
drop policy if exists notification_recipient on public.carely_notifications;
create policy notification_recipient on public.carely_notifications for select to authenticated using(exists(select 1 from public.carely_family f where f.owner_id=carely_notifications.owner_id and f.enabled and f.recipient_email=lower(auth.jwt()->>'email')));
-- Recipient sees only their own grant. No access to the owner's cabinet.
drop policy if exists family_recipient on public.carely_family;
create policy family_recipient on public.carely_family for select to authenticated using(recipient_email=lower(auth.jwt()->>'email'));
grant select,insert,update,delete on public.carely_cabinets,public.carely_family,public.carely_notifications to authenticated;

-- Non-destructive cloud sync with optimistic revision checks.
alter table public.carely_cabinets add column if not exists revision bigint not null default 0;
create or replace function public.carely_save_cabinet(p_medicines jsonb,p_expected_revision bigint)
returns bigint language plpgsql security invoker set search_path=public as $$
declare next_revision bigint;
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if jsonb_typeof(p_medicines)<>'array' or octet_length(p_medicines::text)>5000000 then raise exception 'Invalid cabinet'; end if;
 insert into public.carely_cabinets(user_id,medicines,revision) values(auth.uid(),'[]',0) on conflict(user_id) do nothing;
 update public.carely_cabinets set medicines=p_medicines,revision=revision+1,updated_at=now() where user_id=auth.uid() and revision=p_expected_revision returning revision into next_revision;
 if next_revision is null then raise exception 'Cloud cabinet changed. Load and review again.' using errcode='40001'; end if;
 return next_revision;
end $$;
revoke all on function public.carely_save_cabinet(jsonb,bigint) from public,anon;
grant execute on function public.carely_save_cabinet(jsonb,bigint) to authenticated;

-- Durable account-level limits shared by every server instance. Failed provider calls still consume a reservation.
create table if not exists public.carely_ai_usage(user_id uuid not null references auth.users on delete cascade,usage_date date not null,chat_count integer not null default 0,speech_count integer not null default 0,minute_start timestamptz not null default now(),minute_count integer not null default 0,primary key(user_id,usage_date));
alter table public.carely_ai_usage enable row level security;
revoke all on public.carely_ai_usage from anon,authenticated;
create or replace function public.carely_consume_ai_quota(p_kind text)
returns boolean language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid(); d date:=(now() at time zone 'UTC')::date; r public.carely_ai_usage%rowtype;
begin
 if u is null or p_kind not in ('chat','speech') then return false; end if;
 insert into public.carely_ai_usage(user_id,usage_date) values(u,d) on conflict do nothing;
 select * into r from public.carely_ai_usage where user_id=u and usage_date=d for update;
 if r.minute_start<=now()-interval '1 minute' then r.minute_start:=now();r.minute_count:=0;end if;
 if r.minute_count>=6 or (p_kind='chat' and r.chat_count>=20) or (p_kind='speech' and r.speech_count>=10) then return false;end if;
 update public.carely_ai_usage set chat_count=chat_count+case when p_kind='chat' then 1 else 0 end,speech_count=speech_count+case when p_kind='speech' then 1 else 0 end,minute_start=r.minute_start,minute_count=r.minute_count+1 where user_id=u and usage_date=d;
 return true;
end $$;
revoke all on function public.carely_consume_ai_quota(text) from public,anon;
grant execute on function public.carely_consume_ai_quota(text) to authenticated;

-- Validate writes even when clients call PostgREST directly, bypassing the web gateway.
create or replace function public.carely_validate_cabinet()
returns trigger language plpgsql set search_path=public as $$
declare item jsonb; field text;
begin
 if jsonb_typeof(new.medicines) is distinct from 'array' or octet_length(new.medicines::text)>5000000 then raise exception 'Invalid cabinet'; end if;
 if jsonb_array_length(new.medicines)>2000 then raise exception 'Too many medicines'; end if;
 for item in select value from jsonb_array_elements(new.medicines) loop
  if jsonb_typeof(item) is distinct from 'object' or item->>'origin' is distinct from 'manual' or item ? 'demo' and item->'demo'<>'false'::jsonb then raise exception 'Invalid medicine origin'; end if;
  foreach field in array array['product','manufacturer','strength','form','release','batch'] loop
   if jsonb_typeof(item->field) is distinct from 'string' or length(item->>field)>150 then raise exception 'Invalid medicine field'; end if;
  end loop;
  if length(trim(item->>'product'))=0 then raise exception 'Medicine name is required'; end if;
  if item ? 'owner' and (jsonb_typeof(item->'owner') is distinct from 'string' or length(item->>'owner')>80) then raise exception 'Invalid owner'; end if;
  if item ? 'notes' and (jsonb_typeof(item->'notes') is distinct from 'string' or length(item->>'notes')>500) then raise exception 'Invalid notes'; end if;
  if item ? 'expiry' and (jsonb_typeof(item->'expiry') is distinct from 'string' or (item->>'expiry'<>'' and item->>'expiry'!~'^\d{4}-(0[1-9]|1[0-2])$')) then raise exception 'Invalid expiry'; end if;
 end loop;
 return new;
end $$;
drop trigger if exists carely_validate_cabinet on public.carely_cabinets;
create trigger carely_validate_cabinet before insert or update on public.carely_cabinets for each row execute function public.carely_validate_cabinet();
-- Blank messages and malformed sharing addresses are rejected at the data boundary.
do $$ begin
 if not exists(select 1 from pg_constraint where conname='carely_message_not_blank') then
  alter table public.carely_notifications add constraint carely_message_not_blank check(length(trim(body))>0) not valid;
 end if;
 if not exists(select 1 from pg_constraint where conname='carely_recipient_valid') then
  alter table public.carely_family add constraint carely_recipient_valid check(length(recipient_email)<=254 and recipient_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') not valid;
 end if;
end $$;
