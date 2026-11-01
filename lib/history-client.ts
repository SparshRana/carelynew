import type {AlertQuery,Coverage,QualityAlert} from './quality-alerts';
export type HistoryResult={state:string;label:string;records:Array<{record:QualityAlert;match:'exact'|'candidate';nameExact:boolean;manufacturerExact:boolean;batchExact:boolean}>;total:number;nextOffset:number|null;relatedRecords?:HistoryResult['records'];relatedTotal?:number;coverage?:{periods:Coverage[];recordCount:number;snapshotAt:string;checkedAt:string;liveAvailable:boolean;gaps:string[]};warning?:string;error?:string};
/** Bound the whole request, including JSON decoding; never silently swallow timeout failures. */
export async function fetchQualityHistory(query:AlertQuery,offset:number,signal:AbortSignal,fetcher:typeof fetch=fetch,timeoutMs=20000):Promise<HistoryResult>{
 const timeout=AbortSignal.timeout(timeoutMs);
 try{
  const response=await fetcher('/api/recalls?'+new URLSearchParams({product:query.product||'',manufacturer:query.manufacturer||'',batch:query.batch||'',offset:String(offset)}),{signal:AbortSignal.any([signal,timeout]),cache:'no-store'});
  let data:unknown;try{data=await response.json();}catch{throw Error('The search service returned an unreadable response. Please retry or reload Carely.');}
  if(!response.ok)throw Error(data&&typeof data==='object'&&'error' in data&&typeof data.error==='string'?data.error:'The alert search could not be completed. Please retry.');
  const result=data as HistoryResult;
  if(!result||!['matching-alert','confirmation-needed','no-match','unavailable'].includes(result.state)||typeof result.label!=='string'||!Array.isArray(result.records)||!Number.isInteger(result.total)||!(result.nextOffset===null||Number.isInteger(result.nextOffset)))throw Error('The search service returned incomplete results. Please retry or reload Carely.');
  return result;
 }catch(e){
  if(timeout.aborted&&!signal.aborted)throw Error('The check took too long. Please try again. You can also open the official CDSCO portal below.');
  throw e;
 }
}
