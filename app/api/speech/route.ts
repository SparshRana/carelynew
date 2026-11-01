import {NextResponse} from 'next/server';
import {requireAccount,reserveAiUsage} from '@/lib/service-auth';
export const runtime='nodejs';
export async function POST(request:Request){
 if(!await requireAccount(request))return NextResponse.json({error:'Sign in to use generated audio.'},{status:401});
 if(!process.env.OPENAI_API_KEY)return NextResponse.json({error:'Server audio requires OPENAI_API_KEY.'},{status:503});
 try{const b=await request.json() as {text?:unknown};if(typeof b.text!=='string'||!b.text.trim()||b.text.length>2000)return NextResponse.json({error:'Invalid transcript.'},{status:400});const quota=await reserveAiUsage(request,'speech');if(quota!=='allowed')return NextResponse.json({error:quota==='limited'?'Your AI usage limit has been reached. Please try again later.':'Usage safeguards are not configured. Run the current Supabase schema.'},{status:quota==='limited'?429:503,headers:quota==='limited'?{'Retry-After':'60'}:{}});
 const r=await fetch('https://api.openai.com/v1/audio/speech',{method:'POST',headers:{Authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:'tts-1',voice:'alloy',input:b.text,response_format:'mp3'}),signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error();return new Response(await r.arrayBuffer(),{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});}catch{return NextResponse.json({error:'Audio generation failed. The transcript remains available.'},{status:502});}
}
