/* Only the app shell and same-origin static files are cached. Never cache API or account data. */
const CACHE='carely-sky-v3';
const staticPath=p=>p.startsWith('/_next/static/')||p.startsWith('/assets/')||p.startsWith('/images/')||/\.(?:js|css|woff2?|webp|png|svg|ico)$/.test(p);
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{
 if(event.data?.type!=='WARM_DEMO')return;
 event.waitUntil((async()=>{
  try{const cache=await caches.open(CACHE);const urls=[...new Set(['/',...(event.data.urls||[])])].filter(value=>{try{const u=new URL(value,self.location.origin);return u.origin===self.location.origin&&(u.pathname==='/'||staticPath(u.pathname))&&!u.pathname.startsWith('/api/');}catch{return false;}});
   await Promise.all(urls.map(async value=>{const response=await fetch(value,{cache:'reload',credentials:'omit'});if(!response.ok)throw Error('Cache warm failed');await cache.put(value,response);}));
   await cache.put('/__carely_demo_ready__',new Response('ready'));
   event.ports[0]?.postMessage({ready:true});
  }catch{event.ports[0]?.postMessage({ready:false});}
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(async()=>{const cache=await caches.open(CACHE);const cached=await cache.match('/');return cached||Response.error();}));return;
 }
 if(staticPath(url.pathname))event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok)await cache.put(request,response.clone());return response;})());
});
