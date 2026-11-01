'use client';
import {useEffect,useState} from 'react';
export default function OfflineCache({recordsReady}:{recordsReady:boolean}){
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  if(!recordsReady||!('serviceWorker' in navigator)||!window.isSecureContext)return;
  let alive=true;let channel:MessageChannel|undefined;
  void (async()=>{
   try{const cache=await caches.open('carely-sky-v3');const cached=await cache.match('/__carely_demo_ready__');if(alive&&cached)setReady(true);const registration=await navigator.serviceWorker.register('/carely-offline-sw.js');await navigator.serviceWorker.ready;
    const installing=registration.installing;if(installing)await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Worker activation timed out')),8000);const check=()=>{if(installing.state==='activated'){clearTimeout(timer);installing.removeEventListener('statechange',check);resolve();}else if(installing.state==='redundant'){clearTimeout(timer);installing.removeEventListener('statechange',check);reject(Error('Worker unavailable'));}};installing.addEventListener('statechange',check);check();});
    const worker=registration.active;if(!worker)return;
    channel=new MessageChannel();channel.port1.onmessage=e=>{if(alive&&e.data?.ready===true)setReady(true);channel?.port1.close();};
    const urls=['/images/sky/grandmother.webp','/images/sky/daughter.webp','/images/sky/otter.webp',...Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]')).map(n=>n.src),...Array.from(document.querySelectorAll<HTMLLinkElement>('link[href]')).map(n=>n.href),...performance.getEntriesByType('resource').map(r=>r.name)];
    worker.postMessage({type:'WARM_DEMO',urls},[channel.port2]);
   }catch{/* Local server demo remains available; no false cache-ready claim. */}
  })();return()=>{alive=false;channel?.port1.close();};
 },[recordsReady]);
 return <p className="offline-cache-status" role="status">{ready?'✓ App cached for offline demo reload on this device.':'For offline demo: open once from localhost or HTTPS and wait for app caching. Keep the local server running if caching is unavailable.'}</p>;
}
