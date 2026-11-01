import type {Medicine} from './carely';
import {searchAlerts,type AlertSnapshot,type QualityAlert} from './quality-alerts';
export type CuratedMedicine={salt:string;strength:string;form:string;release:string;generic:string;purpose:[string,string];administration:[string,string];warning:[string,string];source:string;brandPrice:number;genericPrice:number;pack:number};
const nhs='https://www.nhs.uk/medicines/';
export const PMBJP_SOURCE='https://www.pib.gov.in/PressReleasePage.aspx?PRID=2224371&lang=1&reg=1';
/** Price figures are deliberately illustrative, NOT current or verified government MRPs. */
export const formulations:CuratedMedicine[]=[
 {salt:'Pantoprazole',strength:'40 mg',form:'tablet',release:'Delayed release',generic:'Pantoprazole Gastro-Resistant Tablets IP 40 mg',purpose:['Commonly prescribed for heartburn and stomach acid control.','आमतौर पर सीने में जलन और पेट का एसिड कम करने के लिए दी जाती है।'],administration:['Before a meal, according to your prescription. NHS guidance says one hour before a meal.','पर्चे के अनुसार भोजन से पहले लें। NHS मार्गदर्शन भोजन से एक घंटा पहले लेने को कहता है।'],warning:['Swallow gastro-resistant tablets whole. Do not crush or chew.','गैस्ट्रो-रेज़िस्टेंट गोली पूरी निगलें। तोड़ें या चबाएँ नहीं।'],source:nhs+'pantoprazole/how-and-when-to-take-pantoprazole/',brandPrice:48.50,genericPrice:9.20,pack:10},
 {salt:'Paracetamol',strength:'500 mg',form:'tablet',release:'Immediate release',generic:'Paracetamol Tablets IP 500 mg',purpose:['Used for pain and fever.','दर्द और बुखार के लिए उपयोग की जाती है।'],administration:['May be taken with or without food; follow your pack and prescription.','भोजन के साथ या बिना लिया जा सकता है; पर्चे और पैक के निर्देश मानें।'],warning:['Avoid taking other products containing paracetamol at the same time. Too much can damage the liver.','साथ में पैरासिटामोल वाली अन्य दवाएँ न लें। अधिक मात्रा लिवर को नुकसान पहुँचा सकती है।'],source:nhs+'paracetamol-for-adults/',brandPrice:20,genericPrice:5,pack:10},
 {salt:'Metformin',strength:'500 mg',form:'tablet',release:'Immediate release',generic:'Metformin Hydrochloride Tablets IP 500 mg',purpose:['Commonly prescribed to help control blood sugar in type 2 diabetes.','टाइप 2 मधुमेह में रक्त शर्करा नियंत्रित करने के लिए दी जाती है।'],administration:['Usually taken with meals, as prescribed.','आमतौर पर पर्चे के अनुसार भोजन के साथ ली जाती है।'],warning:['Avoid excessive alcohol. Tell your clinician about kidney problems or dehydration.','अधिक शराब से बचें। किडनी की समस्या या शरीर में पानी की कमी के बारे में डॉक्टर को बताएँ।'],source:nhs+'metformin/',brandPrice:30,genericPrice:8,pack:10},
 {salt:'Telmisartan',strength:'40 mg',form:'tablet',release:'Immediate release',generic:'Telmisartan Tablets IP 40 mg',purpose:['Commonly prescribed for high blood pressure.','उच्च रक्तचाप नियंत्रित करने के लिए दी जाती है।'],administration:['May be taken with or without food, as prescribed.','पर्चे के अनुसार भोजन के साथ या बिना ली जा सकती है।'],warning:['Pregnant or planning pregnancy? Contact your doctor promptly. Ask before using potassium supplements or salt substitutes.','गर्भवती हैं या गर्भधारण की योजना है? तुरंत डॉक्टर से संपर्क करें। पोटैशियम या नमक के विकल्प लेने से पहले सलाह लें।'],source:'https://medlineplus.gov/druginfo/meds/a601249.html',brandPrice:80,genericPrice:15,pack:10},
 {salt:'Amoxicillin',strength:'500 mg',form:'capsule',release:'Immediate release',generic:'Amoxycillin Capsules IP 500 mg',purpose:['An antibiotic prescribed for certain bacterial infections. It does not treat colds or other viral infections.','कुछ बैक्टीरियल संक्रमणों के लिए एंटीबायोटिक है। सर्दी या वायरल संक्रमण का इलाज नहीं है।'],administration:['With or without food. Follow the course your prescriber gives you.','भोजन के साथ या बिना लें। डॉक्टर द्वारा बताया गया कोर्स मानें।'],warning:['Tell your pharmacist about penicillin allergy. Do not start antibiotics without a prescription.','पेनिसिलिन से एलर्जी हो तो फार्मासिस्ट को बताएँ। बिना पर्चे एंटीबायोटिक शुरू न करें।'],source:nhs+'amoxicillin/how-and-when-to-take-amoxicillin/',brandPrice:100,genericPrice:35,pack:10}
];
const clean=(v:string)=>v.toLowerCase().replace(/[^a-z0-9]/g,'');
/** No fuzzy brand inference, combination substitution or modified-release substitution. */
export function formulationFor(m:Medicine){return formulations.find(f=>{
 const names=[f.salt,`${f.salt} ${f.strength}`,f.generic];
 if(m.demo&&f.salt==='Pantoprazole')names.push('Pantofix 40');
 return names.some(n=>clean(n)===clean(m.product))&&clean(m.strength)===clean(f.strength)&&clean(m.form)===clean(f.form)&&clean(m.release)===clean(f.release);
 });}
export function savings(f:CuratedMedicine){return Math.round((1-f.genericPrice/f.brandPrice)*100);}
export function sampleCabinet():Medicine[]{return [
 {product:'Pantofix 40',manufacturer:'Fictional demo manufacturer',strength:'40 mg',form:'tablet',release:'Delayed release',batch:'DEMO-892',owner:'Dad',origin:'manual',demo:true},
 {product:'Pantofix 40',manufacturer:'Fictional demo manufacturer',strength:'40 mg',form:'tablet',release:'Delayed release',batch:'DEMO-893',owner:'Dad',origin:'manual',demo:true},
 {product:'Metformin',manufacturer:'Fictional demo manufacturer',strength:'500 mg',form:'tablet',release:'Immediate release',batch:'MT-104',owner:'Dad',origin:'manual',demo:true}
 ];}
export function isSimulatedMatch(m:Medicine,simulation:boolean){return simulation&&m.demo===true&&m.product==='Pantofix 40'&&m.batch==='DEMO-892'&&m.owner==='Dad';}
export function batchStatus(m:Medicine,records:QualityAlert[],simulation=false){
 if(isSimulatedMatch(m,simulation))return {state:'simulated' as const,matches:[]};
 // Fictional samples are never represented as official records.
 if(m.demo)return {state:m.product.trim()&&m.manufacturer.trim()&&m.batch.trim()?'no-match' as const:'confirmation-needed' as const,matches:[]};
 const matches=searchAlerts(records,{product:m.product,manufacturer:m.manufacturer,batch:m.batch});
 if(matches.some(r=>r.match==='exact'))return {state:'matching-alert' as const,matches:matches.filter(r=>r.match==='exact')};
 if(!m.product.trim()||!m.manufacturer.trim()||!m.batch.trim()||matches.length)return {state:'confirmation-needed' as const,matches};
 return {state:'no-match' as const,matches};
}
let snapshotPromise:Promise<AlertSnapshot>|undefined;
export function loadOfflineSnapshot(){return snapshotPromise??=(import('../data/cdsco-alerts.json').then(m=>m.default as AlertSnapshot).catch(e=>{snapshotPromise=undefined;throw e;}));}
export function hindiTranscript(state:string){
 if(state==='demo-neutral')return 'यह काल्पनिक डेमो दवा है। इसमें कोई सिम्युलेटेड अलर्ट सक्रिय नहीं है। यह असली दवा की सुरक्षा की पुष्टि नहीं है।';
 if(state==='simulated')return 'यह केवल डेमो का काल्पनिक क्वालिटी अलर्ट है। यह सरकारी रिपोर्ट नहीं है। अपनी मर्ज़ी से दवा बंद न करें। डॉक्टर या फार्मासिस्ट से सलाह लें।';
 if(state==='matching-alert')return 'सावधानी: यह बैच सरकारी क्वालिटी अलर्ट में आया है। कृपया अपने डॉक्टर या फार्मासिस्ट को यह रिपोर्ट दिखाएं। अपनी मर्ज़ी से दवा बंद न करें।';
 if(state==='no-match')return 'जाँचे गए सरकारी रिकॉर्ड में इस बैच का कोई अलर्ट नहीं मिला। इसे डॉक्टर की सलाह अनुसार ही लें।';
 return 'दवा की जानकारी की पुष्टि आवश्यक है। पैक की जानकारी डॉक्टर या फार्मासिस्ट को दिखाएँ। अपनी मर्ज़ी से इलाज न बदलें।';
}
export function localHindiVoice(voices:Pick<SpeechSynthesisVoice,'lang'|'localService'>[]){return voices.findIndex(v=>v.localService&&/^hi(?:-|$)/i.test(v.lang));}
