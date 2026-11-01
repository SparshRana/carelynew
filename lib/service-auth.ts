export async function requireAccount(request:Request,fetcher:typeof fetch=fetch){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)return false;const authorization=request.headers.get('authorization');if(!authorization?.startsWith('Bearer '))return false;
 try{const r=await fetcher(`${url}/auth/v1/user`,{headers:{apikey:key,authorization},signal:AbortSignal.timeout(8000)});if(!r.ok)return false;const data=await r.json() as {id?:string};return typeof data.id==='string'&&!!data.id;}catch{return false;}
}
export async function reserveAiUsage(request:Request,kind:'chat'|'speech',fetcher:typeof fetch=fetch):Promise<'allowed'|'limited'|'unavailable'>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,authorization=request.headers.get('authorization');
 if(!url||!key||!authorization)return 'unavailable';
 try{const r=await fetcher(`${url}/rest/v1/rpc/carely_consume_ai_quota`,{method:'POST',headers:{apikey:key,authorization,'Content-Type':'application/json'},body:JSON.stringify({p_kind:kind}),signal:AbortSignal.timeout(8000)});if(!r.ok)return 'unavailable';const allowed=await r.json();return allowed===true?'allowed':allowed===false?'limited':'unavailable';}catch{return 'unavailable';}
}
