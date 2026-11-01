import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {CDSCO_BASE,parseTable,officialJson,tablePath,searchAlerts,evaluateAlert,type AlertSnapshot,type QualityAlert} from '../lib/quality-alerts';
import {historyResult,type HistoryData} from '../lib/history-result';
import {parseMedicineBarcode} from '../lib/barcode';
// Isolated synthetic records used only in tests, never shipped to the UI dataset.
const row:QualityAlert={id:'test',kind:'NSQ',product:'Example Tablets 10 mg',brand:'Example 10',batch:'AB-123',manufacturer:'M/s. Example Pharma Pvt. Ltd.',manufacturedBy:'M/s. Example Pharma Pvt. Ltd.',manufactured:'Jan-2025',expiry:'Dec-2026',issue:'Dissolution',remarks:'',firmReply:'',reportingSource:'Test fixture',laboratory:'Test fixture',period:'JAN-2026',reportedDate:'',sourceUrl:CDSCO_BASE+tablePath('NSQ','Jan-2026'),retrievedAt:'2026-10-29T00:00:00Z'};
const query={product:'example 10',manufacturer:'Example Pharma Private Limited',batch:'ab-123'};
const history:HistoryData={records:[row],coverage:[],snapshotAt:row.retrievedAt,checkedAt:row.retrievedAt,liveAvailable:true,failures:[]};
test('only product, manufacturer AND exact batch agreement yields a confirmed alert',()=>{
 assert.equal(evaluateAlert(row,query).match,'exact');
 for(const key of ['product','manufacturer','batch'] as const){assert.equal(evaluateAlert(row,{...query,[key]:''}).match,'candidate');assert.equal(evaluateAlert(row,{...query,[key]:'Different'}).match,'candidate');}
 assert.equal(evaluateAlert(row,{batch:row.batch}).match,'candidate');
 assert.equal(evaluateAlert(row,{product:row.brand}).match,'candidate');
});
test('batch punctuation and leading zeros never silently collapse',()=>{
 assert.equal(searchAlerts([row],{batch:'AB123'}).length,0);
 assert.equal(searchAlerts([{...row,batch:'00123'}],{batch:'123'}).length,0);
 assert.equal(searchAlerts([row],{batch:'AB-1234'}).length,0);
});
test('generic substring and shared manufacturer produce candidates, not exact pack verdicts',()=>{
 assert.equal(searchAlerts([row],{product:'Example'}).length,1);
 assert.equal(evaluateAlert(row,{...query,manufacturer:'Example Pharma'}).match,'candidate');
 assert.equal(evaluateAlert(row,{...query,product:'Example Tablets 20 mg'}).match,'candidate');
 assert.equal(searchAlerts([row],{}).length,0);
});
test('spurious reports under investigation cannot confirm manufacturer identity',()=>{
 const r={...row,kind:'SPURIOUS' as const,manufacturer:'Under Investigation',manufacturedBy:'Under Investigation',remarks:'Subject to investigation',firmReply:'Manufacturer disputes the batch'};
 assert.equal(evaluateAlert(r,{...query,manufacturer:'Under Investigation'}).match,'candidate');
 assert.equal(historyResult({...history,records:[r]},{batch:row.batch}).records[0].record.firmReply,r.firmReply);
});
test('history orders reporting periods chronologically across years',()=>{
 const sorted=searchAlerts([{...row,id:'a',period:'SEP-2025'},{...row,id:'b',period:'JAN-2026'},{...row,id:'c',period:'DEC-2025'}],{batch:row.batch});
 assert.deepEqual(sorted.map(r=>r.record.id),['b','c','a']);
});
test('unavailable live data never creates a reassuring empty result',()=>{
 const offline={...history,liveAvailable:false,failures:['Live source unavailable']};
 assert.equal(historyResult(offline,{product:'No such medicine'}).state,'unavailable');
 assert.equal(historyResult(history,{product:'No such medicine'}).label,'No matching alert found in the checked records');
 assert.equal(historyResult(offline,query).state,'matching-alert');
 assert.equal(historyResult(history,{batch:row.batch}).state,'confirmation-needed');
});
test('pagination exposes total and continuation without losing matches',()=>{
 const data={...history,records:Array.from({length:65},(_,i)=>({...row,id:String(i)}))};
 const first=historyResult(data,{batch:row.batch});assert.equal(first.total,65);assert.equal(first.records.length,50);assert.equal(first.nextOffset,50);
 const second=historyResult(data,{batch:row.batch},50);assert.equal(second.records.length,15);assert.equal(second.nextOffset,null);
});
test('upstream schema changes, truncated tables and wrong months fail closed',()=>{
 assert.throws(()=>parseTable('<html>error</html>','NSQ',row.sourceUrl,row.retrievedAt));
 assert.throws(()=>parseTable({aaData:[],iTotalRecords:4},'NSQ',row.sourceUrl,row.retrievedAt));
 assert.throws(()=>parseTable({aaData:[{}]},'NSQ',row.sourceUrl,row.retrievedAt));
 const raw={str_product_name:'Example',str_batch_no:'AB',dt_reporting_month_year:'JAN-2026'};
 assert.throws(()=>parseTable({aaData:[raw]},'NSQ',row.sourceUrl,row.retrievedAt,'Feb-2026'));
 assert.equal(parseTable({aaData:[raw],iTotalRecords:1},'NSQ',row.sourceUrl,row.retrievedAt)[0].product,'Example');
});
test('upstream errors and non-JSON responses propagate instead of becoming no matches',async()=>{
 await assert.rejects(()=>officialJson('publicNsqDrugTable',async()=>new Response('Unavailable',{status:503})),/503/);
 await assert.rejects(()=>officialJson('publicNsqDrugTable',async()=>new Response('<html>Error</html>')));
});
test('ordinary retail code never fabricates batch or expiry; GS1 photo payloads preserve evidence',()=>{
 const retail=parseMedicineBarcode('8901234567890','EAN_13');assert.equal(retail.batch,null);assert.equal(retail.expiry,null);
 const gs=parseMedicineBarcode('(01)08901234567890(11)250101(17)261231(10)AB-123(21)SERIAL','QR_CODE');
 assert.equal(gs.batch,'AB-123');assert.equal(gs.manufactured,'2025-01-01');assert.equal(gs.expiry,'2026-12-31');assert.equal(gs.serial,'SERIAL');
 const link=parseMedicineBarcode('https://id.gs1.org/01/08901234567890/10/AB-123?17=261231&11=250101','QR_CODE');assert.equal(link.batch,'AB-123');assert.equal(link.expiry,'2026-12-31');
 const element=parseMedicineBarcode('0108901234567890112501011726123110AB-123\u001d21SERIAL');assert.equal(element.manufactured,'2025-01-01');assert.equal(element.batch,'AB-123');
 assert.equal(parseMedicineBarcode('(17)260231').expiry,null);
 assert.equal(parseMedicineBarcode('(01)08901234567891').gtin,null);
 assert.equal(parseMedicineBarcode(']Q301089012345678901060098').batch,'60098');
 assert.equal(parseMedicineBarcode('https://unknown.example/product').batch,null);
});
test('bundled official snapshot is non-empty, traceable and contains no simulated rows',()=>{
 const data=JSON.parse(fs.readFileSync('data/cdsco-alerts.json','utf8')) as AlertSnapshot;
 assert.equal(data.schemaVersion,1);assert.ok(data.records.length>1000);assert.ok(data.coverage.length>50);
 for(const r of data.records){assert.ok(r.product&&r.batch&&r.period);assert.ok(r.sourceUrl.startsWith(CDSCO_BASE));assert.ok(r.retrievedAt);assert.ok(r.kind==='NSQ'||r.kind==='SPURIOUS');}
 assert.equal(new Set(data.records.map(r=>r.id)).size,data.records.length);
});
