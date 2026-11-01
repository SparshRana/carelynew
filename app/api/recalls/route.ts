import {NextResponse} from 'next/server';
import {loadAlerts} from '@/lib/alert-store';
import {CDSCO_PORTAL,type AlertQuery} from '@/lib/quality-alerts';
import {historyResult} from '@/lib/history-result';
export const runtime='nodejs';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const query:AlertQuery={};
 for(const key of ['product','manufacturer','batch'] as const){const value=(params.get(key)||'').trim();if(value.length>(key==='batch'?150:500))return NextResponse.json({error:'Use at most 150 characters for batch and 500 for name/manufacturer.'},{status:400});query[key]=value;}
 if(!Object.values(query).some(v=>v&&v.length>=2))return NextResponse.json({error:'Enter a medicine name, manufacturer or batch (at least two characters).'}, {status:400});
 const offset=Number(params.get('offset')||'0');if(!Number.isInteger(offset)||offset<0||offset>100000)return NextResponse.json({error:'Invalid result offset.'},{status:400});
 try{
  const data=await loadAlerts();
  return NextResponse.json({supported:true,region:'IN',query,...historyResult(data,query,offset),sourceUrl:CDSCO_PORTAL,distributionHistory:{available:false,message:'Manufacturing and expiry dates appear only when reported in a quality alert. Distribution, ownership and full manufacturing history are not supplied by this source.'},warning:'These are published NSQ/spurious reports, not a complete recall register or an authenticity check. Missing results do not establish safety. Ask a pharmacist or doctor about treatment; do not change treatment based on this result.'},{headers:{'Cache-Control':'no-store'}});
 }catch{ return NextResponse.json({supported:true,state:'unavailable',label:'Alert check unavailable',records:[],error:'Official history could not be loaded. Check the CDSCO portal directly.',sourceUrl:CDSCO_PORTAL},{status:503,headers:{'Cache-Control':'no-store'}});}
}
