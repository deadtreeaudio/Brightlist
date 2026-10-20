// BriteList offline support. Prefer fresh files when online, fall back to cache offline.
const CACHE='brightlist-v9';
const ASSETS=['./','./index.html','./styles.css','./app.js','./shared.js','./cloud-config.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('brightlist-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(request,{cache:'no-cache'});
   if(response.ok)await cache.put(request,response.clone());
   return response;
  }catch(error){const saved=await caches.match(request);if(saved)return saved;throw error}
 })());
});
