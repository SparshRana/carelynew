import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sampleCabinet,batchStatus,formulationFor,formulations,hindiTranscript,localHindiVoice,savings,isSimulatedMatch} from '../lib/offline-medical';
import {restore,validateMedicine,type Medicine} from '../lib/carely';
import type {AlertSnapshot} from '../lib/quality-alerts';
const snapshot=JSON.parse(fs.readFileSync('data/cdsco-alerts.json','utf8')) as AlertSnapshot;
test('demo simulation targets only the fictional Dad Pantofix DEMO-892 entry',()=>{
 const samples=sampleCabinet();assert.equal(samples.length,3);
 assert.equal(batchStatus(samples[0],snapshot.records,true).state,'simulated');
 assert.equal(batchStatus(samples[1],snapshot.records,true).state,'no-match');
 assert.equal(batchStatus(samples[2],snapshot.records,true).state,'no-match');
 assert.equal(isSimulatedMatch({...samples[0],demo:false},true),false);
 assert.equal(isSimulatedMatch({...samples[0],owner:'Mom'},true),false);
 assert.equal(batchStatus(samples[0],snapshot.records,false).state,'no-match');
 assert.deepEqual(restore(JSON.stringify({items:samples})).items,[]);
 assert.deepEqual(sampleCabinet(),samples); // resetting creates a fresh neutral sample set
});
test('official sample comes from the snapshot; user-supplied ACNEMOIST example is not fabricated',()=>{
 const r=snapshot.records.find(r=>r.batch==='60098'&&r.brand==='Alzomac-0.5 Tablets');assert.ok(r);
 const m:Medicine={product:r.brand,manufacturer:r.manufacturer,batch:r.batch,strength:'',form:'other',release:'Unknown'};
 assert.equal(batchStatus(m,snapshot.records).state,'matching-alert');
 assert.equal(batchStatus({...m,manufacturer:''},snapshot.records).state,'confirmation-needed');
 assert.equal(snapshot.records.filter(r=>r.batch==='2200388'&&/acnemoist/i.test(r.product+' '+r.brand)).length,0);
});
test('generic mapping rejects unknown brands, strengths, forms, releases and combinations',()=>{
 for(const f of formulations){const m:Medicine={product:f.salt,manufacturer:'',strength:f.strength,form:f.form,release:f.release,batch:''};
 assert.equal(formulationFor(m),f);
 assert.equal(formulationFor({...m,strength:'999 mg'}),undefined);
 assert.equal(formulationFor({...m,release:'Unknown'}),undefined);
 assert.equal(formulationFor({...m,form:'cream'}),undefined);
 assert.equal(formulationFor({...m,product:f.salt+' + another salt'}),undefined);
 }
 assert.equal(formulationFor(sampleCabinet()[0])?.salt,'Pantoprazole');
 assert.equal(formulationFor({...sampleCabinet()[0],demo:false}),undefined);
 assert.equal(savings(formulations[0]),81);
});
test('name-only entries can save while batch identity remains unconfirmed',()=>{
 const m:Medicine={product:'Unknown pack',manufacturer:'',strength:'',form:'other',release:'Unknown',batch:''};
 assert.equal(validateMedicine(m),'');assert.equal(batchStatus(m,snapshot.records).state,'confirmation-needed');
 assert.equal(batchStatus({...m,demo:true},snapshot.records).state,'confirmation-needed');
 assert.notEqual(validateMedicine({...m,product:''}),'');
});
test('offline speech selects local Hindi only and simulation transcript never claims an official alert',()=>{
 assert.equal(localHindiVoice([{lang:'hi-IN',localService:false},{lang:'en-IN',localService:true}]),-1);
 assert.equal(localHindiVoice([{lang:'en-IN',localService:true},{lang:'hi-IN',localService:true}]),1);
 assert.match(hindiTranscript('simulated'),/काल्पनिक/);
 assert.match(hindiTranscript('no-match'),/जाँचे गए/);
 const panel=fs.readFileSync('components/offline/safety-panel.tsx','utf8');
 assert.doesNotMatch(panel,/fetch\(|\/api\//);assert.match(panel,/speechSynthesis.speak/);
 assert.match(panel,/ILLUSTRATIVE DEMO PRICES/);assert.match(panel,/NOT AN OFFICIAL CDSCO ALERT/);
});
test('offline shell cache excludes API routes and cross-origin data',()=>{
 const sw=fs.readFileSync('public/carely-offline-sw.js','utf8');
 assert.match(sw,/url\.pathname\.startsWith\('\/api\/'\)/);
 assert.match(sw,/url\.origin!==self\.location\.origin/);
 assert.match(sw,/credentials:'omit'/);
 const page=fs.readFileSync('app/page.tsx','utf8');
 assert.match(page,/loaded&&demoItems===null&&view/);
 assert.match(page,/sessionStorage.getItem\('carely:offline-demo'\)/);
});
