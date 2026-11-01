'use client';
import {useI18n} from '@/components/language';
import {useEffect,useRef,useState} from 'react';
import {AlertTriangle,ArrowUpRight,FileText,Info,Search,XCircle} from 'lucide-react';
import type {AlertQuery} from '@/lib/quality-alerts';
import {fetchQualityHistory,type HistoryResult as Result} from '@/lib/history-client';
export default function MedicineHistory({product='',manufacturer='',batch='',onChecked}:AlertQuery&{onChecked?:(query:AlertQuery,summary:{state:string;label:string;checkedAt:string})=>void}){
 const {t,hindi}=useI18n();
 const [catalogue,setCatalogue]=useState<Array<{id:string;name:string;manufacturer:string;form:string;route:string;ingredients:Array<{name:string;strength:string;unit:string}>;source:string;sourceUrl:string}>>([]);
 const [catalogueMessage,setCatalogueMessage]=useState('');const catalogueRequest=useRef<AbortController|null>(null);
 const [fields,setFields]=useState({product,manufacturer,batch});const [result,setResult]=useState<Result|null>(null);const [busy,setBusy]=useState(false);const [searched,setSearched]=useState(fields);const request=useRef<AbortController|null>(null);const feedback=useRef<HTMLDivElement>(null);
 useEffect(()=>{request.current?.abort();catalogueRequest.current?.abort();setCatalogue([]);setCatalogueMessage('');setFields({product,manufacturer,batch});setResult(null);setBusy(false);},[product,manufacturer,batch]);
 useEffect(()=>()=>{request.current?.abort();catalogueRequest.current?.abort();},[]);
 useEffect(()=>{if(busy||result){feedback.current?.focus({preventScroll:true});feedback.current?.scrollIntoView({block:'nearest',behavior:'auto'});}},[busy,result]);
 function update(key:keyof typeof fields,value:string){request.current?.abort();catalogueRequest.current?.abort();setCatalogue([]);setCatalogueMessage('');setBusy(false);setFields(old=>({...old,[key]:value}));setResult(null);}
 async function loadCatalogue(product:string){
  catalogueRequest.current?.abort();setCatalogue([]);setCatalogueMessage('');if(product.trim().length<2)return;const controller=new AbortController();catalogueRequest.current=controller;setCatalogueMessage('Checking medicine catalogue information…');
  try{const response=await fetch('/api/medicine/search?'+new URLSearchParams({q:product}),{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});const data=await response.json() as {records?:typeof catalogue;message?:string};if(!response.ok)throw Error(data.message||'Medicine catalogue unavailable.');if(!controller.signal.aborted){setCatalogue(data.records||[]);setCatalogueMessage(data.records?.length?'Catalogue candidates only — confirm the physical pack. This is not batch history.':'No catalogue entry found for this name. This does not establish authenticity or safety.');}}
  catch(e){if(!controller.signal.aborted)setCatalogueMessage(e instanceof Error?e.message:'Medicine catalogue unavailable.');}
 }
 async function search(offset=0){
  request.current?.abort();const controller=new AbortController();request.current=controller;const query=offset?searched:fields;
  setBusy(true);if(!offset){setResult(null);setSearched(query);void loadCatalogue(query.product||'');}
  try{const data=await fetchQualityHistory(query,offset,controller.signal);if(!controller.signal.aborted){setResult(old=>offset&&old?{...data,records:[...old.records,...data.records]}:data);if(!offset)onChecked?.(query,{state:data.state,label:data.label,checkedAt:new Date().toISOString()});}}
  catch(e){if(!controller.signal.aborted)setResult({state:'unavailable',label:'Alert check unavailable',records:[],total:0,nextOffset:null,error:e instanceof Error?e.message:'Please try again or use the official portal.'});}
  finally{if(!controller.signal.aborted)setBusy(false);}
 }
 const Icon=result?.state==='matching-alert'||result?.state==='confirmation-needed'?AlertTriangle:result?.state==='unavailable'?XCircle:Info;
 return <section className="medicine-history" aria-label={t("Official medicine quality history")}>
  <div className="history-heading"><FileText size={25}/><div><h3>{t("Medicine quality history")}</h3><p>{t("Search published CDSCO NSQ and spurious reports. A name or batch alone shows candidates; confirm every field against the pack.")}</p></div></div>
  <form className="history-form" onSubmit={e=>{e.preventDefault();void search();}}>
   {(['product','manufacturer','batch'] as const).map(key=><label key={key}>{t(key==='product'?'Medicine name / brand':key==='manufacturer'?'Manufacturer (as reported, including address if present)':'Batch number')}<input maxLength={key==='batch'?150:500} value={fields[key]} onChange={e=>update(key,e.target.value)} placeholder={t(key==='batch'?'Copy exactly, including punctuation':'Enter from your packaging')}/></label>)}
   {(busy||result)&&<div ref={feedback} tabIndex={-1} className={'history-feedback '+(result?.state||'checking')} role="status" aria-live="polite" aria-atomic="true">
    <div className="history-feedback-title">{busy?<Search size={24}/>:<Icon size={24}/>}<strong>{t(busy?'Checking your medicine details…':result?.label||'')}</strong></div>
    {!busy&&result&&<><p>{t("Checked:")}{' '}<strong>{searched.product||t('Name not supplied')}</strong>{' '}{t("· Manufacturer:")}{' '}{searched.manufacturer||t('Not supplied')}{' '}{t("· Batch:")}{' '}<strong>{searched.batch||t('Not supplied')}</strong></p>
     {result.coverage&&<p>{t("Search completed across")}{' '}{result.coverage.recordCount.toLocaleString(hindi?'hi-IN':'en-IN')}{' '}{t("checked official records.")}</p>}
     {result.state==='no-match'&&<p>{t("No published alert matching this search was found in those records. CDSCO reports do not list every medicine or manufactured batch. This result does not confirm safety or authenticity.")}</p>}
     {result.error&&<p>{t(result.error)}</p>}
     {result.state==='confirmation-needed'&&<p>{t("Possible records are shown below. The supplied details do not establish an exact product, manufacturer and batch match.")}</p>}
     {result.state==='matching-alert'&&<p>{t("A published quality report matches all three supplied identifiers. Read the evidence below and ask a pharmacist or doctor about treatment.")}</p>}
    </>}
    {busy&&<p>{t("Searching the official history and checking latest-table availability. A slow or unavailable source will show an explicit error.")}</p>}
   </div>}
   <button className="btn dark" disabled={busy||!Object.values(fields).some(v=>v.trim().length>=2)} type="submit"><Search size={20}/>{t(busy?'Checking official records…':'Check quality history')}</button>
  </form>
  <p className="history-privacy">{t("Only the submitted search fields are sent to Carely’s server. CDSCO tables are fetched without your medicine query; photos stay on your device.")}{' '}{t("Medicine names are also sent to Drug Information Service for catalogue candidates.")}</p>
  {result&&<div className="history-result" aria-label={t("Search evidence and coverage")}><div className={'history-status '+result.state}><Icon size={24}/><strong>{t(result.label)}</strong></div>
   {result.error&&<p>{t(result.error)}</p>}
   {result.coverage&&<><p className="history-coverage">{t("Searched")}{' '}{result.coverage.recordCount.toLocaleString(hindi?'hi-IN':'en-IN')}{' '}{t("official records across")}{' '}{result.coverage.periods.length}{' '}{t("report tables. History snapshot:")}{' '}{new Date(result.coverage.snapshotAt).toLocaleString(hindi?'hi-IN':'en-IN')}{t(". Latest-table check:")}{' '}{new Date(result.coverage.checkedAt).toLocaleString(hindi?'hi-IN':'en-IN')}.</p>
    {!result.coverage.liveAvailable&&<p className="history-notice"><XCircle size={20}/>{' '}{t("Latest official tables are unavailable. Historical matches below remain dated records; current coverage is incomplete.")}</p>}
    <details><summary>{t("View checked periods and coverage gaps")}</summary><p>{t("Only these successfully retrieved monthly tables were searched. Missing or pending official submissions, older PDFs and future reports are not covered. The latest default tables are refreshed at most every 15 minutes; use the supplied sync command to refresh historical months.")}</p><ul className="history-periods">{result.coverage.periods.map((c,i)=><li key={i}>{c.kind} · {c.period} · {c.count}{' '}{t("records ·")}{' '}<a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">{t("Official table")}</a></li>)}</ul>{result.coverage.gaps.length>0&&<><h4>{t("Unavailable periods / checks")}</h4><ul>{result.coverage.gaps.map((g,i)=><li key={i}>{g}</li>)}</ul></>}</details></>}
   {!!result.total&&<p>{result.total}{' '}{t("relevant published records.")}{' '}{result.state==='confirmation-needed'?'These candidates do not establish a match to your pack.':''}</p>}
   {result.records.map(({record:r,match,nameExact,manufacturerExact,batchExact})=><article className="history-evidence" key={r.id}>
    <div className={'history-status '+(match==='exact'?'matching-alert':'confirmation-needed')}><AlertTriangle size={22}/><strong>{t(match==='exact'?'Matching quality alert found':'Details need confirmation')}</strong></div>
    <h4>{r.brand&&r.brand!=='NA'?`${r.brand} — `:''}{r.product}</h4><p><strong>{t(r.kind==='SPURIOUS'?'Reported spurious / investigation notice':'Not of Standard Quality (NSQ)')}</strong>{' '}{t("· Reporting period:")}{' '}{r.period}</p>
    <dl>{[['Product',r.product],['Brand',r.brand],['Batch',r.batch],['Manufacturer named in report',r.manufacturer],['Manufactured by (report)',r.manufacturedBy!==r.manufacturer?r.manufacturedBy:''],['Reported manufacturing date',r.manufactured],['Reported expiry',r.expiry],['Reported issue',r.issue],['Remarks / investigation status',r.remarks],['Firm reply',r.firmReply],['Reporting laboratory / state',r.laboratory],['Reporting source',r.reportingSource],['Notice timestamp',r.reportedDate]].filter(([,v])=>!!v).map(([label,value])=><div key={label}><dt>{t(label)}</dt><dd>{value}</dd></div>)}</dl>
    <p className="history-comparison">{t("Exact field comparison — product/brand:")}{' '}{t(nameExact?'agrees':'not confirmed')}{t("; manufacturer:")}{' '}{t(manufacturerExact?'agrees':'not confirmed')}{t("; batch:")}{' '}{t(batchExact?'agrees':'not confirmed')}.</p>
    <p>{t("Published findings relate to the reported sample/batch. Read the original record, including any investigation remarks or firm reply.")}</p>
    <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{t("Read official CDSCO source")}{' '}<ArrowUpRight size={18}/></a><small>{t("Retrieved")}{' '}{new Date(r.retrievedAt).toLocaleString(hindi?'hi-IN':'en-IN')}{t(". Reporting period is not necessarily the publication date.")}</small>
   </article>)}
   {result.nextOffset!==null&&<button type="button" className="btn outline" disabled={busy} onClick={()=>void search(result.nextOffset!)}>{t("Load more published records")}</button>}
  </div>}
  {!!result?.relatedRecords?.length&&<section aria-label={t("Other reported batches")}><h3>{t("Other reported batches for this medicine")}</h3><p>{t("These reports do not match the batch you entered.")}{result.relatedTotal}{t("related reports were found; showing up to 10.")}</p>{result.relatedRecords.map(({record:r})=><article className="history-evidence" key={'related-'+r.id}><div className="history-status confirmation-needed"><Info size={22}/><strong>{t("Different batch — not a match to your pack")}</strong></div><h4>{r.brand||r.product}</h4><p>{r.product} · {r.manufacturer}</p><p>{t("Reported batch:")}<strong>{r.batch}</strong>{' '}{t("· Reporting period:")}{' '}{r.period}</p><p>{r.issue}</p><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{t("Read official CDSCO source")}{' '}<ArrowUpRight size={18}/></a></article>)}</section>}
  {catalogueMessage&&<section aria-label={t("Medicine catalogue information")}><h3>{t("Medicine catalogue information")}</h3><p>{t(catalogueMessage)}</p>{catalogue.map((r,i)=><article className="history-evidence" key={r.id||i}><h4>{r.name}</h4><dl><div><dt>{t("Manufacturer")}</dt><dd>{r.manufacturer||'Not provided'}</dd></div><div><dt>{t("Form / route")}</dt><dd>{r.form||'Not provided'} · {r.route||'Not provided'}</dd></div>{r.ingredients.map((item,j)=><div key={j}><dt>{t("Ingredient / strength")}</dt><dd>{item.name} · {item.strength} {item.unit}</dd></div>)}</dl><p>{r.source}</p><a href={r.sourceUrl} target="_blank" rel="noopener noreferrer">{t("Read catalogue source")}<ArrowUpRight size={18}/></a></article>)}</section>}
  <div className="history-limits"><Info size={22}/><p>{t("Manufacturing and expiry dates appear only when reported in an alert. Full manufacturing, distribution and ownership history are not available from this source. A missing alert does not establish safety or authenticity. Ask a pharmacist or doctor about treatment; do not change treatment based on these results.")}</p></div>
 </section>;
}
