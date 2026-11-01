import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {type Medicine,fields,key,add,initial,restore,restoreLegacy,resetStorage,STORAGE_KEY,LEGACY_STORAGE_KEY,validateMedicine,updateMedicine,removeMedicine} from '../lib/carely';

const m:Medicine={product:'Example label name',manufacturer:'Example manufacturer',strength:'Strength from pack',form:'tablet',release:'Unknown',batch:'AB-1234',origin:'manual'};

test('fresh cabinets are empty, with no fictional medicine or batch alerts',()=>{
 assert.deepEqual(initial,[]);
 const page=fs.readFileSync('app/page.tsx','utf8');
 assert.doesNotMatch(page,/DMA-2048|sample-1\.png|PREWRITTEN DEMO GUIDE|Fictional sandbox below/);
 assert.doesNotMatch(fs.readFileSync('components/cloud/services.tsx','utf8'),/api\.fda\.gov|Official US recall/);
});
test('medicine fields and duplicate identity are stable',()=>{
 assert.equal(fields.length,6);
 assert.equal(key(m),key({...m,product:'  Example   label name  '}));
 assert.equal(add(add([],m),m).length,1);
 assert.equal(add([m],{...m,batch:'AB-1235'}).length,2);
});
test('empty or invalid personal entries cannot be saved',()=>{
 assert.equal(validateMedicine(m),'');
 assert.equal(validateMedicine({...m,batch:' '}),'');
 assert.match(validateMedicine({...m,product:' '}),/medicine name/);
 assert.match(validateMedicine({...m,expiry:'2028-20'}),/expiry/);
 assert.match(validateMedicine({...m,notes:'x'.repeat(501)}),/under 500/);
});
test('restored entries are only manually saved and de-duplicated',()=>{
 assert.deepEqual(restore(null),{items:[]});
 assert.deepEqual(restore('not json'),{items:[]});
 assert.deepEqual(restore(JSON.stringify({items:[{...m,origin:undefined}]})),{items:[]});
 assert.deepEqual(restore(JSON.stringify({items:[m,m]})),{items:[m]});
});
test('legacy migration discards fictional samples while keeping manual entries',()=>{
 const old={items:[{...m,origin:undefined},m]};
 assert.deepEqual(restoreLegacy(JSON.stringify(old)),{items:[m]});
});
test('reset clears only Carely storage and not unrelated localStorage keys',()=>{
 const map=new Map([[STORAGE_KEY,'x'],[LEGACY_STORAGE_KEY,'y'],['other','keep']]);
 assert.deepEqual(resetStorage({removeItem:k=>map.delete(k)}),{items:[]});
 assert.equal(map.get('other'),'keep');
 assert.equal(map.has(STORAGE_KEY),false);
 assert.equal(map.has(LEGACY_STORAGE_KEY),false);
});
test('updating and deleting changes the target medicine only',()=>{
 const second={...m,batch:'CD-5678'};
 const edited={...m,product:'Edited label name'};
 const next=updateMedicine([m,second],key(m),edited);
 assert.equal(next.length,2);
 assert.ok(next.some(i=>i.product==='Edited label name'));
 assert.deepEqual(removeMedicine(next,key(edited)),[second]);
});
test('India recall endpoint does not misrepresent US FDA results as Indian coverage',()=>{
 const recalls=fs.readFileSync('app/api/recalls/route.ts','utf8');
 assert.match(recalls,/CDSCO/);
 assert.doesNotMatch(recalls,/api\.fda\.gov/);
 assert.match(recalls,/historyResult/);
 assert.match(recalls,/loadAlerts/);
});
