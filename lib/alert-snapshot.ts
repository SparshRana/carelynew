import {periodOrder,type AlertSnapshot} from './quality-alerts';
/** Only a successfully fetched table can replace its previously stored counterpart. */
export function mergeAlertSnapshots(previous:AlertSnapshot,incoming:AlertSnapshot):AlertSnapshot{
 const replaced=new Set(incoming.coverage.map(c=>`${c.kind}:${c.period}`));
 return {schemaVersion:1,generatedAt:incoming.generatedAt,records:[...previous.records.filter(r=>!replaced.has(`${r.kind}:${r.period}`)),...incoming.records].sort((a,b)=>a.id.localeCompare(b.id)),coverage:[...previous.coverage.filter(c=>!replaced.has(`${c.kind}:${c.period}`)),...incoming.coverage].sort((a,b)=>periodOrder(a.period)-periodOrder(b.period)||a.kind.localeCompare(b.kind)),failures:incoming.failures};
}
