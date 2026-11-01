'use client';
import {useI18n} from '@/components/language';

import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,CheckCircle2,Info,LockKeyhole,Mail,ShieldCheck,TriangleAlert,UserRound,Volume2} from 'lucide-react';
import type {Medicine} from '@/lib/carely';
import {restore,mergeCabinets} from '@/lib/carely';
import MedicineHistory from '@/components/medicine-history';
import {cloudRequest} from '@/lib/cloud-client';

type ServiceMode='cabinet'|'family'|'alerts'|'assistant';
type Session={access_token:string;refresh_token:string;expires_at:number;user:{id:string;email:string}};
type AuthResponse=Session & {expires_in:number;msg?:string;error_description?:string;message?:string};
type Grant={id:string;owner_id:string;recipient_email:string;enabled:boolean};
type Note={id:string;body:string;created_at:string};
type Status={supabase:boolean;ai:boolean;barcodeLookup:boolean;indiaAlerts:string};
const base=process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const NSQ_URL='https://cdscoonline.gov.in/CDSCO/viewPublicNSQDrug';
const NOTICES_URL='https://cdsco.gov.in/opencms/opencms/en/Alerts/';

export default function Services({mode,items,onRestore}:{mode:ServiceMode;items:Medicine[];onRestore:(m:Medicine[])=>void}){
 const {t}=useI18n();
 const [session,setSession]=useState<Session|null>(null);
 const [status,setStatus]=useState<Status|null>(null);
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [recipient,setRecipient]=useState('');
 const [grants,setGrants]=useState<Grant[]>([]);
 const [notes,setNotes]=useState<Note[]>([]);
 const [noteText,setNoteText]=useState('');
 const [question,setQuestion]=useState('');
 const [answer,setAnswer]=useState('');
 const [audioBusy,setAudioBusy]=useState(false);
 const [selected,setSelected]=useState('');
 const [cloudReview,setCloudReview]=useState<{items:Medicine[];revision:number;conflicts:number;device:string}|null>(null);
 const refreshToken=useRef<Promise<string>|null>(null);
 const latestItems=useRef(items);latestItems.current=items;
 const active=items.find((m,i)=>String(i)===selected);
 const configured=Boolean(base&&anon)&&(status?.supabase!==false);

 useEffect(()=>{
  try{const saved=sessionStorage.getItem('carely-account');if(saved){const s=JSON.parse(saved) as Session;if(s?.user?.id&&s.refresh_token)setSession(s);}}
  catch{/* A broken session is safely ignored. */}
  fetch('/api/status',{cache:'no-store'}).then(r=>r.json()).then(v=>setStatus(v as Status)).catch(()=>setStatus(null));
 },[]);

 async function token(){
  if(!session||!base||!anon)throw Error('Sign in to use this service.');
  if(session.expires_at>Date.now()+30000)return session.access_token;
  if(refreshToken.current)return refreshToken.current;
  refreshToken.current=(async()=>{const response=await fetch(`${base}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:anon,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token}),signal:AbortSignal.timeout(15000)});
  const data=await response.json() as AuthResponse;
  if(!response.ok||!data.access_token){sessionStorage.removeItem('carely-account');setSession(null);throw Error('Your session expired. Please sign in again.');}
  const updated={...data,expires_at:Date.now()+data.expires_in*1000};
  sessionStorage.setItem('carely-account',JSON.stringify(updated));setSession(updated);return updated.access_token;})();
  try{return await refreshToken.current;}finally{refreshToken.current=null;}
 }
 async function db<T>(table:string,method='GET',body?:unknown){
  const access=await token();
  return cloudRequest<T>({url:base!,key:anon!,token:access},table,method,body);
 }
 async function run(action:()=>Promise<void>){setMessage('');setBusy(true);try{await action()}catch(e){setMessage(e instanceof Error?e.message:'Something went wrong. Please retry.');}finally{setBusy(false);}}
 async function auth(signup=false){await run(async()=>{
  if(!configured)throw Error('Cloud account setup is pending. See SETUP.md. The local cabinet still works.');
  const response=await fetch(`${base}/auth/v1/${signup?'signup':'token?grant_type=password'}`,{method:'POST',headers:{apikey:anon!,'Content-Type':'application/json'},body:JSON.stringify({email:email.trim(),password})});
  const data=await response.json() as AuthResponse;
  if(!response.ok)throw Error(data.msg||data.error_description||data.message||'Authentication failed.');
  setPassword('');
  if(!data.access_token){setMessage('Check your email to confirm your account, then sign in.');return;}
  const s={...data,expires_at:Date.now()+data.expires_in*1000};setSession(s);sessionStorage.setItem('carely-account',JSON.stringify(s));setMessage('Signed in successfully.');
 });}
 async function refreshFamily(){
  const [g,n]=await Promise.all([db<Grant[]>('carely_family?select=*&order=id.asc'),db<Note[]>('carely_notifications?select=*&order=created_at.desc&limit=30')]);
  setGrants(g);setNotes(n);
 }
 async function signOut(){await run(async()=>{
  try{await fetch(`${base}/auth/v1/logout`,{method:'POST',headers:{apikey:anon!,Authorization:`Bearer ${await token()}`}});}finally{
   sessionStorage.removeItem('carely-account');setSession(null);setGrants([]);setNotes([]);setAnswer('');setCloudReview(null);setMessage('Signed out. Medicines saved on this device have been kept.');
  }
 });}

 useEffect(()=>{
  if(mode!=='family'||!session)return;let active=true;let running=false;
  const poll=async()=>{if(running||document.hidden)return;running=true;try{const [g,n]=await Promise.all([db<Grant[]>('carely_family?select=*&order=id.asc'),db<Note[]>('carely_notifications?select=*&order=created_at.desc&limit=30')]);if(active){setGrants(g);setNotes(n);}}catch(e){if(active)setMessage(e instanceof Error?e.message:'Could not refresh the shared inbox.');}finally{running=false;}};
  void poll();const timer=setInterval(()=>void poll(),30000);const focus=()=>void poll();window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);};
 },[mode,session?.user.id]);

 const account=<div className="service-account">
  <div className="service-inline-heading"><UserRound size={18}/><strong>{t("Your account")}</strong><span className={'service-status '+(configured?'ready':'setup')}>{t(configured?'Keys provided':'Setup needed')}</span></div>
  {!configured?<p>{t("Cloud accounts and family sharing need your Supabase URL and public anon key. You can still scan, search, and save medicines locally without either key.")}</p>:
   !session?<form className="service-form" onSubmit={e=>{e.preventDefault();void auth()}}>
    <label>{t("Email address")}<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder={t("you@example.com")}/></label>
    <label>{t("Password")}<input type="password" minLength={8} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <div className="service-actions"><button type="submit" disabled={busy}>{t("Sign in")}</button><button type="button" className="secondary" disabled={busy||password.length<8||!email.includes('@')} onClick={()=>void auth(true)}>{t("Create account")}</button></div>
   </form>:<div className="service-signed"><p><CheckCircle2 size={16}/>{' '}{t("Signed in as")}{' '}<strong>{session.user.email}</strong></p><button className="secondary" disabled={busy} onClick={()=>void signOut()}>{t("Sign out")}</button></div>}
 </div>;

 if(mode==='alerts')return <section className="real-services services-single" aria-label={t("Official Indian medicine alerts")}>
  <div className="services-heading"><span className="eyebrow">{t("OFFICIAL INDIA SOURCES")}</span><h2>{t("Check the label. Check the source.")}</h2><p>{t("Carely is India-first. CDSCO publishes official Not of Standard Quality (NSQ) and spurious-drug alerts. Review the actual entry and the batch number on your pack.")}</p></div>
  <article className="service-panel">
   <div className="service-inline-heading"><ShieldCheck size={21}/><h3>{t("CDSCO official alert lookup")}</h3><span className="service-status ready">{t("India")}</span></div>
   {items.length>0&&<label className="service-picker">{t("Select a saved medicine to reference")}{' '}<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">{t("Choose a medicine (optional)")}</option>{items.map((m,i)=><option key={i} value={i}>{m.product} · {m.batch}</option>)}</select></label>}
   {active&&<div className="medicine-reference"><span>{t("Product")}{' '}<strong>{active.product}</strong></span><span>{t("Batch")}{' '}<strong>{active.batch}</strong></span><span>{t("Manufacturer")}{' '}<strong>{active.manufacturer}</strong></span><button className="secondary" onClick={()=>navigator.clipboard?void navigator.clipboard.writeText(`${active.product} | Batch: ${active.batch} | Manufacturer: ${active.manufacturer}`).then(()=>setMessage('Medicine label details copied.')).catch(()=>setMessage('Copy is unavailable in this browser.')):setMessage('Copy is unavailable in this browser.')}>{t("Copy label details")}</button></div>}
   <MedicineHistory product={active?.product} manufacturer={active?.manufacturer} batch={active?.batch}/>
   <div className="service-actions"><a className="service-action-link" href={NSQ_URL} target="_blank" rel="noopener noreferrer">{t("Open CDSCO NSQ / Spurious search")}{' '}<ArrowUpRight size={16}/></a><a className="service-action-link secondary" href={NOTICES_URL} target="_blank" rel="noopener noreferrer">{t("Official alerts and notices")}{' '}<ArrowUpRight size={16}/></a></div>
   <div className="service-explainer"><Info size={20}/><p>{t("On the CDSCO website, use the product or batch search and its filters. Compare the")}{' '}<strong>{t("exact name, batch and manufacturer")}</strong>{' '}{t("on your packaging with the official record. If you are unsure what a result means, ask a pharmacist.")}</p></div>
   <div className="service-warning"><TriangleAlert size={20}/><p><strong>{t("Only the listed official report tables are checked.")}</strong>{' '}{t("No Carely search result means “safe.” NSQ alerts are not identical to product recalls; always inspect the original official report.")}</p></div>
  </article>
  <p className="service-message" role="status" aria-live="polite">{t(message)}</p>
 </section>;

 return <section className="real-services services-single" aria-label={t(mode==='family'?'Family sharing':mode==='assistant'?'Carely AI':'Cloud cabinet')}>
  <div className="services-heading"><span className="eyebrow">{t(mode==='cabinet'?'YOUR PRIVATE SPACE':mode==='family'?'SHARING WITH CONSENT':'YOUR CARELY ASSISTANT')}</span><h2>{t(mode==='cabinet'?'Save across devices.':mode==='family'?'Your circle, your permission.':'Ask a real question.')}</h2><p>{t(mode==='cabinet'?'Your cabinet works locally without an account. Cloud syncing is optional.':mode==='family'?'Family permissions and shared messages use authenticated accounts, not pretend phone notifications.':'Ask general medicine-information questions in English or Hindi. No preset four-question bot.')}</p></div>
  <div className="service-panels">
   <article className="service-panel">{account}</article>
   {mode==='cabinet'&&<article className="service-panel">
    <h3>{t("Cloud cabinet")}</h3><p>{t("Save or retrieve personal medicine entries when signed in. Cloud entries are merged with this device. Review conflicts before confirming a save.")}</p>
    <div className="service-actions"><button disabled={!session||busy} onClick={()=>void run(async()=>{const rows=await db<Array<{medicines:Medicine[];revision:number}>>('carely_cabinets?select=medicines,revision');if(!rows.length){setMessage('No cloud cabinet saved yet.');return;}const remote=restore(JSON.stringify({items:rows[0].medicines})).items;const merged=mergeCabinets(latestItems.current,remote);onRestore(merged.items);setCloudReview(null);setMessage(`Cloud entries merged. ${merged.conflicts} conflicting entries kept the device details; the cloud copy is unchanged.`);})}>{t("Load cloud cabinet")}</button>
    <button className="secondary" disabled={!session||busy} onClick={()=>void run(async()=>{const rows=await db<Array<{medicines:Medicine[];revision:number}>>('carely_cabinets?select=medicines,revision');const remote=restore(JSON.stringify({items:rows[0]?.medicines||[]})).items;const merged=mergeCabinets(latestItems.current,remote);setCloudReview({...merged,device:JSON.stringify(latestItems.current),revision:rows[0]?.revision||0});})}>{t("Save to cloud")}</button></div>
    {cloudReview&&<div className="service-warning"><div><p>{t("Review cloud save:")}{cloudReview.items.length}{t("merged entries.")}{cloudReview.conflicts}{t("conflicting entries will use the device details. Existing cloud-only medicines are retained. A simultaneous cloud edit will stop this save.")}</p><div className="service-actions"><button disabled={busy} onClick={()=>void run(async()=>{if(cloudReview.device!==JSON.stringify(latestItems.current))throw Error('Device medicines changed. Cancel this review and choose Save to cloud again.');const revision=await db<number>('rpc/carely_save_cabinet','POST',{p_medicines:cloudReview.items,p_expected_revision:cloudReview.revision});if(typeof revision!=='number')throw Error('The cloud save returned an invalid revision.');onRestore(mergeCabinets(latestItems.current,cloudReview.items).items);setCloudReview(null);setMessage('Merged cabinet saved to your cloud account.');})}>{t("Confirm cloud save")}</button><button className="secondary" onClick={()=>setCloudReview(null)}>{t("Cancel")}</button></div></div></div>}
    <p className="service-muted"><LockKeyhole size={16}/>{' '}{t("Only your account can access your cabinet. Family grants do not share cabinet records.")}</p>
   </article>}
   {mode==='family'&&<article className="service-panel">
    <h3>{t("Family permissions")}</h3><p>{t("Grant access to a signed-up family member by email, revoke it anytime, and write messages to the in-app inbox. This does not send SMS, WhatsApp, push or automatic drug alerts.")}</p>
    <form className="service-form" onSubmit={e=>{e.preventDefault();void run(async()=>{await db('carely_family?on_conflict=owner_id,recipient_email','POST',{owner_id:session!.user.id,recipient_email:recipient.trim().toLowerCase(),enabled:true});setRecipient('');await refreshFamily();setMessage('Permission saved. Ask your family member to open their shared inbox.');})}}>
     <label>{t("Family member’s email")}<input type="email" required value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder={t("family@example.com")}/></label><button disabled={!session||busy}>{t("Grant access")}</button>
    </form>
    <button className="secondary" disabled={!session||busy} onClick={()=>void run(refreshFamily)}>{t("Refresh permissions & inbox")}</button>
    {session&&grants.filter(g=>g.owner_id===session.user.id).map(g=><div className="service-grant" key={g.id}><span><Mail size={15}/> {g.recipient_email} · {t(g.enabled?'Enabled':'Revoked')}</span><button className="secondary" disabled={busy} onClick={()=>void run(async()=>{await db(`carely_family?id=eq.${g.id}`,'PATCH',{enabled:!g.enabled});await refreshFamily();})}>{t(g.enabled?'Revoke':'Re-enable')}</button></div>)}
    <form className="service-form" onSubmit={e=>{e.preventDefault();void run(async()=>{await db('carely_notifications','POST',{owner_id:session!.user.id,body:noteText.trim()});setNoteText('');await refreshFamily();setMessage('Message added to your family’s in-app inbox.');})}}>
     <label>{t("Message for people with permission")}<textarea rows={3} required maxLength={2000} value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder={t("Write a short update…")}/></label><button disabled={!session||busy||!noteText.trim()}>{t("Share in inbox")}</button>
    </form>
    <h3>{t("Shared inbox")}</h3>{notes.length===0?<p className="service-muted">{t("No messages loaded yet. Sign in and refresh to check your inbox.")}</p>:notes.map(n=><blockquote className="service-note" key={n.id}>{n.body}<small>{new Date(n.created_at).toLocaleString('en-IN')}</small></blockquote>)}
   </article>}
   {mode==='assistant'&&<article className="service-panel">
    <div className="service-inline-heading"><h3>{t("Ask Carely AI")}</h3><span className={'service-status '+(status?.ai?'ready':'setup')}>{t(status===null?'Checking…':status.ai?'Key detected':'AI setup needed')}</span></div>
    <p>{t("Your question is sent to the configured OpenAI API. Your cabinet data is not included. AI answers can be wrong and are not medical advice or verified recall searches.")}</p>
    {!status?.ai&&<p className="service-warning"><Info size={17}/>{' '}{t("The site works without AI. To enable this panel, the site owner must privately set OPENAI_API_KEY on the server. A ChatGPT subscription does not provide API credit.")}</p>}
    <form className="service-form" onSubmit={e=>{e.preventDefault();void run(async()=>{setAnswer('');const response=await fetch('/api/assistant',{method:'POST',headers:{Authorization:`Bearer ${await token()}`,'Content-Type':'application/json'},body:JSON.stringify({question})});const body=await response.json() as {answer?:string;error?:string};if(!response.ok)throw Error(body.error||'The AI request failed.');setAnswer(body.answer||'No answer received.');})}}>
     <label>{t("Ask in English or हिन्दी")}<textarea rows={4} maxLength={1500} required value={question} onChange={e=>setQuestion(e.target.value)} placeholder={t("Ask a general question about medicine labels…")}/></label><button disabled={busy||!session||!status?.ai}>{t("Ask Carely AI")}</button>
    </form>
    {answer&&<div className="service-answer" role="status"><p>{answer}</p><button className="secondary" disabled={audioBusy} onClick={()=>void run(async()=>{setAudioBusy(true);try{const response=await fetch('/api/speech',{method:'POST',headers:{Authorization:`Bearer ${await token()}`,'Content-Type':'application/json'},body:JSON.stringify({text:answer.slice(0,1900)})});if(!response.ok)throw Error('Audio unavailable. You can read the answer above.');const blob=await response.blob();const audioURL=URL.createObjectURL(blob);const audio=new Audio(audioURL);audio.onended=()=>{URL.revokeObjectURL(audioURL);setAudioBusy(false);};audio.onerror=()=>{URL.revokeObjectURL(audioURL);setAudioBusy(false);};await audio.play();}catch(e){setAudioBusy(false);throw e;}})}><Volume2 size={16}/> {t(audioBusy?'Playing…':'Read aloud')}</button></div>}
   </article>}
  </div>
  <p role="status" aria-live="polite" className="service-message">{t(busy?'Working…':message)}</p>
  <p className="service-disclaimer">{t("Accounts, AI and barcode-to-product lookup need owner-provided credentials. The camera, manual entries and available medicine-name searches can work without them. This is not a medicine-authentication or treatment service.")}</p>
 </section>;
}
