import history from '../data/cdsco-alerts.json';
import {CDSCO_BASE,officialJson,parseTable,tablePath,type AlertSnapshot,type Coverage,type QualityAlert} from './quality-alerts';
const stored=history as AlertSnapshot;
type Latest={records:QualityAlert[];coverage:Coverage[];failures:string[];checkedAt:string};
let cache:{expires:number;value:Latest}|undefined;let pending:Promise<Latest>|undefined;
async function refresh():Promise<Latest>{
 const checkedAt=new Date().toISOString();const records:QualityAlert[]=[];const coverage:Coverage[]=[];const failures:string[]=[];
 const results=await Promise.allSettled((['NSQ','SPURIOUS'] as const).map(async kind=>{const route=tablePath(kind);const sourceUrl=CDSCO_BASE+route;const rows=parseTable(await officialJson(route),kind,sourceUrl,checkedAt);const periods=[...new Set(rows.map(r=>r.period))];records.push(...rows);for(const period of periods)coverage.push({kind,period,count:rows.filter(r=>r.period===period).length,retrievedAt:checkedAt,sourceUrl});if(!rows.length)coverage.push({kind,period:'CURRENT DEFAULT TABLE (EMPTY)',count:0,retrievedAt:checkedAt,sourceUrl});}));
 results.forEach((r,i)=>{if(r.status==='rejected')failures.push(`${i===0?'NSQ':'SPURIOUS'} live check unavailable: ${String(r.reason)}`);});
 return {records,coverage,failures,checkedAt};
}
export async function loadAlerts(){
 if(!cache||cache.expires<Date.now()){
  if(!pending)pending=refresh().then(value=>{cache={value,expires:Date.now()+(value.failures.length?60_000:900_000)};return value;}).finally(()=>{pending=undefined;});
  await pending;
 }
 const live=cache!.value;
 // A complete live monthly table supersedes the corresponding historical table.
 const replaced=new Set(live.coverage.map(c=>`${c.kind}:${c.period}`));
 const records=stored.records.filter(r=>!replaced.has(`${r.kind}:${r.period}`)).concat(live.records);
 const coverage=stored.coverage.filter(c=>!replaced.has(`${c.kind}:${c.period}`)).concat(live.coverage);
 return {records,coverage,snapshotAt:stored.generatedAt,checkedAt:live.checkedAt,liveAvailable:live.failures.length===0,failures:[...stored.failures,...live.failures],liveFailures:live.failures};
}
