import {validateMedicine,type Medicine} from './carely';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
/** Restricted same-origin gateway. Supabase still enforces RLS using the visitor's token. */
export async function cloudGateway(request:Request,fetcher:typeof fetch=fetch){
 const base=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!base||!key)return reply({message:'Cloud setup is pending. Your device cabinet still works.'},503);
 const authorization=request.headers.get('authorization')||'';
 if(!/^Bearer [^\s]+$/.test(authorization))return reply({message:'Sign in to use cloud storage.'},401);
 const origin=request.headers.get('origin');
 if(origin&&origin!==new URL(request.url).origin)return reply({message:'Cross-origin cloud requests are not allowed.'},403);
 try{
  const headers={apikey:key,Authorization:authorization,'Content-Type':'application/json'};
  const auth=await fetcher(`${base}/auth/v1/user`,{headers,cache:'no-store',signal:AbortSignal.timeout(15000)});
  if(!auth.ok)return reply({message:'Your session expired. Please sign in again.'},401);
  const user=await auth.json() as {id?:string};
  if(!user.id)return reply({message:'Sign in again.'},401);
  const target=new URL(request.url).searchParams.get('resource')||'';
  // Only operations used by Carely are exposed; callers cannot supply arbitrary tables or filters.
  const reads=['carely_cabinets?select=medicines,revision','carely_family?select=*&order=id.asc','carely_notifications?select=*&order=created_at.desc&limit=30'];
  let body:Record<string,unknown>|undefined;
  if(request.method==='GET'){
   if(!reads.includes(target))return reply({message:'Unsupported cloud resource.'},400);
  }else{
   const text=await request.text();
   if(new TextEncoder().encode(text).length>5000000)return reply({message:'Cabinet is too large.'},413);
   try{body=JSON.parse(text);}catch{return reply({message:'Invalid JSON.'},400);}
   if(!body||typeof body!=='object'||Array.isArray(body))return reply({message:'Invalid request.'},400);
   if(request.method==='POST'&&target==='rpc/carely_save_cabinet'){
    const items=body.p_medicines;
    if(!Array.isArray(items)||items.length>2000||items.some(m=>!m||m.origin!=='manual'||m.demo||validateMedicine(m as Medicine))||!Number.isSafeInteger(body.p_expected_revision)||Number(body.p_expected_revision)<0)return reply({message:'Invalid cabinet or revision. Demo medicines cannot be uploaded.'},400);
    body={p_medicines:items,p_expected_revision:body.p_expected_revision};
   }else if(request.method==='POST'&&target==='carely_family?on_conflict=owner_id,recipient_email'){
    const email=typeof body.recipient_email==='string'?body.recipient_email.trim().toLowerCase():'';
    if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return reply({message:'Enter a valid family email.'},400);
    body={owner_id:user.id,recipient_email:email,enabled:true};
   }else if(request.method==='POST'&&target==='carely_notifications'){
    if(typeof body.body!=='string'||!body.body.trim()||body.body.length>2000)return reply({message:'Write a message of up to 2,000 characters.'},400);
    body={owner_id:user.id,body:body.body.trim()};
   }else if(request.method==='PATCH'&&target.startsWith('carely_family?id=eq.')&&uuid.test(target.slice('carely_family?id=eq.'.length))){
    if(typeof body.enabled!=='boolean')return reply({message:'Invalid permission.'},400);
    body={enabled:body.enabled};
   }else return reply({message:'Unsupported cloud operation.'},400);
  }
  const result=await fetcher(`${base}/rest/v1/${target}`,{method:request.method,headers:{...headers,Prefer:'return=representation,resolution=merge-duplicates'},body:body?JSON.stringify(body):undefined,cache:'no-store',signal:AbortSignal.timeout(15000)});
  const data=await result.json().catch(()=>null);
  if(!result.ok)return reply({message:result.status===409||(typeof data==='object'&&data!==null&&'code' in data&&data.code==='40001')?'Cloud cabinet changed. Load and review again.':'Cloud request failed. Check your permissions and database setup.'},result.status>=500?502:result.status);
  if(data===null)return reply({message:'Cloud returned an unreadable response.'},502);
  return reply(data);
 }catch{return reply({message:'Cloud unavailable. Your device cabinet is unchanged. Please retry.'},503);}
}
