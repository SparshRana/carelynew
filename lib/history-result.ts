import {searchAlerts,type AlertQuery,type Coverage,type QualityAlert} from './quality-alerts';
export type HistoryData={records:QualityAlert[];coverage:Coverage[];snapshotAt:string;checkedAt:string;liveAvailable:boolean;failures:string[]};
export function historyResult(data:HistoryData,query:AlertQuery,offset=0){
 const matches=searchAlerts(data.records,query);const exactCount=matches.filter(m=>m.match==='exact').length;
 const related=query.batch&&query.product?searchAlerts(data.records,{product:query.product}).filter(m=>!matches.some(exact=>exact.record.id===m.record.id)):[];
 const state=exactCount?'matching-alert':matches.length?'confirmation-needed':data.liveAvailable?'no-match':'unavailable';
 return {relatedRecords:related.slice(0,10),relatedTotal:related.length,state,label:state==='matching-alert'?'Matching quality alert found':state==='confirmation-needed'?'Details need confirmation':state==='no-match'?'No matching alert found in the checked records':'Alert check unavailable',records:matches.slice(offset,offset+50),total:matches.length,exactCount,offset,nextOffset:offset+50<matches.length?offset+50:null,coverage:{periods:data.coverage,recordCount:data.records.length,snapshotAt:data.snapshotAt,checkedAt:data.checkedAt,liveAvailable:data.liveAvailable,gaps:data.failures}};
}
