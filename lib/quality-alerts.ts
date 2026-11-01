/** Official CDSCO reports are evidence of published findings, never a safety verdict. */
export const CDSCO_PORTAL='https://cdscoonline.gov.in/CDSCO/viewPublicNSQDrug';
export const CDSCO_BASE='https://cdscoonline.gov.in/CDSCO/';
export type AlertKind='NSQ'|'SPURIOUS';
export type QualityAlert={id:string;kind:AlertKind;product:string;brand:string;batch:string;manufacturer:string;manufacturedBy:string;manufactured:string;expiry:string;issue:string;remarks:string;firmReply:string;reportingSource:string;laboratory:string;period:string;reportedDate:string;sourceUrl:string;retrievedAt:string};
export type Coverage={kind:AlertKind;period:string;count:number;retrievedAt:string;sourceUrl:string};
export type AlertSnapshot={schemaVersion:1;generatedAt:string;records:QualityAlert[];coverage:Coverage[];failures:string[]};
export type AlertQuery={product?:string;manufacturer?:string;batch?:string};
export const normalize=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim().replace(/\s+/g,' ');
// Keep batch punctuation: AB-12 and AB12 can be different identifiers.
export const batchKey=(s:string)=>s.normalize('NFKC').trim().toUpperCase().replace(/\s+/g,' ');
export function manufacturerKey(s:string){return normalize(s).replace(/^(m s|ms) /,'').replace(/\b(pvt|private)\b/g,'private').replace(/\b(ltd|limited)\b/g,'limited').replace(/\s+/g,' ').trim();}
export function evaluateAlert(r:QualityAlert,q:AlertQuery){
 const p=normalize(q.product||'');const m=manufacturerKey(q.manufacturer||'');const b=batchKey(q.batch||'');
 const nameExact=!!p&&[r.product,r.brand].some(n=>normalize(n)===p);
 const nameCandidate=!!p&&[r.product,r.brand].some(n=>normalize(n).includes(p)||p.includes(normalize(n))&&!!normalize(n));
 const company=(n:string)=>manufacturerKey(n.split(/[,;\n]/)[0]);
 const manufacturerExact=!!m&&[r.manufacturer,r.manufacturedBy].some(n=>(manufacturerKey(n)===m||(company(n)===m&&/\b(limited|llp|inc|corporation)$/.test(m)))&&!/^(under investigation|not available|unknown|na|n a)$/.test(manufacturerKey(n)));
 const batchExact=!!b&&batchKey(r.batch)===b;
 // A supplied batch always narrows the results. Never fuzzy-match batch IDs.
 const relevant=b?batchExact:(p?nameCandidate:(m?[r.manufacturer,r.manufacturedBy].some(n=>manufacturerKey(n).includes(m)):false));
 return {relevant,match:batchExact&&nameExact&&manufacturerExact?'exact' as const:'candidate' as const,nameExact,manufacturerExact,batchExact};
}
const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
export const periodOrder=(period:string)=>Number(period.slice(-4))*12+months.indexOf(period.slice(0,3));
export function searchAlerts(records:QualityAlert[],q:AlertQuery){return records.map(record=>({record,...evaluateAlert(record,q)})).filter(r=>r.relevant).sort((a,b)=>Number(b.match==='exact')-Number(a.match==='exact')||periodOrder(b.record.period)-periodOrder(a.record.period)||a.record.id.localeCompare(b.record.id));}
export function parseTable(payload:unknown,kind:AlertKind,sourceUrl:string,retrievedAt:string,requestedPeriod?:string):QualityAlert[]{
 const p=typeof payload==='string'?JSON.parse(payload):payload;
 if(!p||typeof p!=='object'||!Array.isArray(p.aaData))throw Error('Official portal returned an unexpected table format.');
 if(typeof p.iTotalRecords==='number'&&p.iTotalRecords!==p.aaData.length)throw Error('Official table is incomplete; refusing to treat it as full coverage.');
 const get=(r:Record<string,unknown>,k:string)=>typeof r[k]==='string'?r[k].replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').trim():'';
 return p.aaData.map((value:unknown,index:number)=>{
  if(!value||typeof value!=='object')throw Error('Invalid official record.');const r=value as Record<string,unknown>;
  const product=get(r,kind==='NSQ'?'str_product_name':'product_name_from_dtl');const batch=get(r,'str_batch_no');
  const period=get(r,'dt_reporting_month_year').toUpperCase();
  if(!product||!batch||!/^([A-Z]{3})-\d{4}$/.test(period)||requestedPeriod&&period!==requestedPeriod.toUpperCase())throw Error('Official record has missing identity or mismatched reporting period.');
  return {id:`${kind}:${period}:${index}:${batch}`,kind,product,brand:get(r,'str_brand_name'),batch,manufacturer:get(r,kind==='NSQ'?'str_manufactured_by':'str_spurious_manufacturer_name'),manufacturedBy:get(r,kind==='NSQ'?'str_manufactured_by':'str_spurious_manufactured_by'),manufactured:get(r,'dt_manufacturing_date'),expiry:get(r,'dt_expiry_date'),issue:get(r,'str_nsq_result'),remarks:get(r,'str_nsq_remarks'),firmReply:get(r,'str_firm_reply'),reportingSource:get(r,'str_reporting_source'),laboratory:get(r,'str_reported_by_lab_or_state'),period,reportedDate:get(r,'dt_spurious_date'),sourceUrl,retrievedAt};
 });
}
export async function officialJson(path:string,fetcher:typeof fetch=fetch):Promise<unknown>{
 const response=await fetcher(CDSCO_BASE+path,{headers:{accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error(`Official portal returned HTTP ${response.status}.`);
 const bytes=await response.arrayBuffer();if(bytes.byteLength>12_000_000)throw Error('Official response is too large.');
 let body:string;try{body=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{body=new TextDecoder('windows-1252').decode(bytes);}
 return JSON.parse(body);
}
export function tablePath(kind:AlertKind,period?:string){return period?`${kind==='NSQ'?'filteredNsqDrugTable':'filteredSpuriousDrugTable'}?${new URLSearchParams({month:period,source:'All',tab:kind==='NSQ'?'nsq':'spurious'})}`:kind==='NSQ'?'publicNsqDrugTable':'viewPublicSpuriousDrugData';}
