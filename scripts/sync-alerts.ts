import fs from 'node:fs/promises';
import {mergeAlertSnapshots} from '../lib/alert-snapshot';
import {CDSCO_BASE,officialJson,parseTable,tablePath,type AlertSnapshot,type AlertKind} from '../lib/quality-alerts';
const snapshot:AlertSnapshot={schemaVersion:1,generatedAt:new Date().toISOString(),records:[],coverage:[],failures:[]};
const tasks:Array<{kind:AlertKind;period:string}>=[];
for(const kind of ['NSQ','SPURIOUS'] as const){
 const tab=kind==='NSQ'?'nsq':'spurious';
 try{
  const years=await officialJson(`reportingYears?tab=${tab}`);
  if(!Array.isArray(years)||!years.every(y=>/^20\d{2}$/.test(String(y))))throw Error('Invalid year list');
  for(const year of years){
   try{const months=await officialJson(`publicReportingMonths?year=${year}&tab=${tab}`);if(!Array.isArray(months)||!months.every(m=>/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)$/.test(String(m))))throw Error('Invalid month list');
    for(const month of months)tasks.push({kind,period:`${month}-${year}`});
   }catch(e){snapshot.failures.push(`${kind} ${year}: ${String(e)}`);}
  }
 }catch(e){snapshot.failures.push(`${kind} discovery: ${String(e)}`);}
}
// Two concurrent reads keep pressure on the government portal modest.
async function worker(){while(tasks.length){const task=tasks.shift()!;const path=tablePath(task.kind,task.period);try{const retrievedAt=new Date().toISOString();const records=parseTable(await officialJson(path),task.kind,CDSCO_BASE+path,retrievedAt,task.period);snapshot.records.push(...records);snapshot.coverage.push({kind:task.kind,period:task.period.toUpperCase(),count:records.length,retrievedAt,sourceUrl:CDSCO_BASE+path});console.log(task.kind,task.period,records.length);}catch(e){snapshot.failures.push(`${task.kind} ${task.period}: ${String(e)}`);}}}
await Promise.all([worker(),worker()]);
if(!snapshot.records.length)throw Error('No official records downloaded; existing snapshot was not replaced.');
snapshot.records.sort((a,b)=>a.id.localeCompare(b.id));snapshot.coverage.sort((a,b)=>a.period.localeCompare(b.period)||a.kind.localeCompare(b.kind));
let previous:AlertSnapshot={schemaVersion:1,generatedAt:snapshot.generatedAt,records:[],coverage:[],failures:[]};
try{previous=JSON.parse(await fs.readFile('data/cdsco-alerts.json','utf8')) as AlertSnapshot;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw Error('Existing snapshot could not be read; no file was replaced.');}
const merged=mergeAlertSnapshots(previous,snapshot);
await fs.mkdir('data',{recursive:true});await fs.writeFile('data/cdsco-alerts.json.tmp',JSON.stringify(merged));await fs.rename('data/cdsco-alerts.json.tmp','data/cdsco-alerts.json');
console.log(JSON.stringify({records:merged.records.length,periods:merged.coverage.length,failures:snapshot.failures},null,2));
