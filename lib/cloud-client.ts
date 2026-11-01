export async function cloudRequest<T>(config:{url:string;key:string;token:string},table:string,method='GET',body?:unknown,fetcher:typeof fetch=fetch):Promise<T>{
 const response=await fetcher(`/api/cloud?resource=${encodeURIComponent(table)}`,{method,headers:{Authorization:`Bearer ${config.token}`,'Content-Type':'application/json',Prefer:'return=representation,resolution=merge-duplicates'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 const data=await response.json().catch(()=>null) as T&{message?:string};if(!response.ok)throw Error(data?.message||'Could not reach the cloud database. Check the Supabase schema and permissions.');if(data===null)throw Error('The cloud service returned an unreadable response.');return data;
}
