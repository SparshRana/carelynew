'use client';
import {useEffect,useState} from 'react';
import {ArrowUpRight,Heart,Shield,Plus} from 'lucide-react';
import {SkyHero,SceneStory,CompanionSection} from './sky-experience';
import {useI18n} from './language';
const clamp=(n:number)=>Math.min(1,Math.max(0,n));
type Props={onCabinet:()=>void;onScan:()=>void;onAlerts:()=>void;onFamily:()=>void;onSample:()=>void;recordCount:number};
export default function EditorialHome({onCabinet,onScan,onAlerts,onFamily,onSample,recordCount}:Props){
 const {hindi}=useI18n();const t=(en:string,hi:string)=>hindi?hi:en;
 const [faq,setFaq]=useState<number|null>(null);
 useEffect(()=>{const root=document.querySelector('.editorial-home');if(!root)return;const nodes=root.querySelectorAll('[data-reveal]');const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-revealed');observer.unobserve(e.target);}}),{threshold:.12});nodes.forEach(n=>observer.observe(n));return()=>observer.disconnect();},[]);
 useEffect(()=>{
  const heading=document.querySelector<HTMLElement>('[data-reading]');if(!heading)return;const words=heading.querySelectorAll<HTMLElement>('.e-reading-word');const reduced=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
  const update=()=>{frame=0;const progress=reduced.matches?1:clamp((innerHeight*.85-heading.getBoundingClientRect().top)/(innerHeight*.5));words.forEach((word,i)=>word.classList.toggle('is-read',i/Math.max(1,words.length-1)<=progress));};
  const queue=()=>{if(!frame)frame=requestAnimationFrame(update);};update();addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});reduced.addEventListener('change',queue);return()=>{cancelAnimationFrame(frame);removeEventListener('scroll',queue);removeEventListener('resize',queue);reduced.removeEventListener('change',queue);};
 },[hindi]);
 const readingWords=(text:string)=>text.split(' ').map((word,i)=><span className="e-reading-word" key={i}>{word}{' '}</span>);
 const questions=[
  [t('What does Carely actually check?','Carely क्या जाँचता है?'),t('Carely compares medicine name, manufacturer and exact batch with the bundled CDSCO quality-alert records. No match is not proof of safety or authenticity.','Carely दवा के नाम, निर्माता और सटीक बैच का मिलान सहेजे गए CDSCO क्वालिटी अलर्ट से करता है। कोई मिलान न मिलना सुरक्षा या असली होने का प्रमाण नहीं है।')],
  [t('Can I use it without an account?','क्या बिना खाते के उपयोग कर सकते हैं?'),t('Yes. Your cabinet, barcode-image decoding and the offline demo work without a login. Optional cloud sharing and AI features need their existing configuration.','हाँ। दवा कैबिनेट, बारकोड फोटो पढ़ना और ऑफलाइन डेमो बिना लॉगिन चलते हैं। क्लाउड शेयरिंग और AI के लिए अलग सेटअप चाहिए।')],
  [t('Can a barcode tell me everything?','क्या बारकोड सारी जानकारी बताता है?'),t('A code can only reveal what is encoded in it. Some contain a batch and expiry; a retail barcode usually identifies a product code. Carely does not invent missing history.','कोड में जो जानकारी है, वही पढ़ी जा सकती है। कुछ में बैच और समाप्ति तिथि होती है; सामान्य बारकोड प्रोडक्ट कोड बताता है। Carely गायब इतिहास नहीं बनाता।')],
  [t('Should I change my medicine after an alert?','अलर्ट मिलने पर क्या दवा बदलनी चाहिए?'),t('Show the exact report and your pack to your doctor or pharmacist. Do not stop or change treatment on your own.','सटीक रिपोर्ट और अपना पैक डॉक्टर या फार्मासिस्ट को दिखाएँ। अपनी मर्ज़ी से इलाज बंद या बदलें नहीं।')]
 ];
 return <div className="editorial-home">
 <SkyHero onCabinet={onCabinet} onSample={onSample}/>
 <section className="e-statement e-wrap" data-reveal><p className="e-kicker">{t('LESS TO REMEMBER. MORE ROOM TO CARE.','याद रखने की चिंता कम। देखभाल के लिए समय ज़्यादा।')}</p><h2 data-reading aria-label={t('Life is full enough. Your medicine details should feel simple.','ज़िंदगी में पहले ही बहुत कुछ है। दवा की जानकारी होनी चाहिए आसान।')}><span aria-hidden="true">{readingWords(t('Life is full enough.','ज़िंदगी में पहले ही बहुत कुछ है।'))}<br/>{readingWords(t('Your medicine details','दवा की जानकारी'))}<br/>{readingWords(t('should feel','होनी चाहिए'))} <em>{readingWords(t('simple.','आसान।'))}</em></span></h2><p>{t('One thoughtful space for the label, the batch, the evidence—and the people behind every pack.','दवा के लेबल, बैच, प्रमाण और हर पैक के पीछे के अपने के लिए एक आसान जगह।')}</p></section>
 <SceneStory onCabinet={onCabinet} onAlerts={onAlerts} onSample={onSample}/>
 <CompanionSection onCabinet={onCabinet}/>
 <section className="e-honesty e-wrap" data-reveal><span className="e-honesty-icon"><Shield size={35} strokeWidth={1.4}/></span><div><p className="e-kicker">{t('CARE WITHOUT OVERCLAIMING','बड़े दावों के बिना देखभाल')}</p><h2>{t('A clearer picture.','एक स्पष्ट तस्वीर।')}<br/><em>{t('Never a false promise.','झूठा भरोसा कभी नहीं।')}</em></h2><p>{t('An alert check is one piece of the picture. Carely does not certify a medicine as safe or genuine. Treatment decisions belong with your doctor or pharmacist.','अलर्ट की जाँच पूरी तस्वीर का एक हिस्सा है। Carely दवा की सुरक्षा या असली होने का प्रमाण नहीं देता। इलाज का निर्णय डॉक्टर या फार्मासिस्ट के साथ करें।')}</p></div><button className="e-text-button" onClick={onAlerts}>{t('See the evidence','प्रमाण देखें')}<ArrowUpRight size={22}/></button></section>
 <section className="e-faq e-wrap" data-reveal><div><p className="e-kicker">{t('GOOD TO KNOW','जानना ज़रूरी है')}</p><h2>{t('A few questions,','कुछ सवाल,')}<br/><em>{t('answered simply.','आसान जवाब।')}</em></h2></div><div>{questions.map(([q,a],i)=><div className="e-faq-row" key={q}><h3><button onClick={()=>setFaq(faq===i?null:i)} aria-expanded={faq===i} aria-controls={'e-faq-'+i}>{q}<Plus size={23} style={{rotate:faq===i?'45deg':'0deg'}}/></button></h3><div id={'e-faq-'+i} hidden={faq!==i}><p>{a}</p></div></div>)}</div></section>
 <section className="e-final"><div className="e-wrap"><Heart size={34} strokeWidth={1.5}/><p className="e-kicker">{t('START WITH ONE SMALL THING','एक छोटी शुरुआत करें')}</p><h2>{t('Make a little room','थोड़ी जगह बनाएँ')}<br/>{t('for','')} <em>{t('better care.','अपनों की देखभाल के लिए।')}</em></h2><button className="e-primary" onClick={onCabinet}>{t('Open my cabinet','मेरी दवाएँ खोलें')}<ArrowUpRight size={22}/></button><p>{t('No account needed to get started.','शुरुआत के लिए खाते की ज़रूरत नहीं।')}</p></div></section>
 </div>;
}
