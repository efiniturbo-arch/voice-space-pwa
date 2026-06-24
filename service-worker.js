const CACHE="voice-events-pwa-v10-4-action-panel";
const ASSETS=["./","./index.html","./style.css?v=10.4.0","./nav-liquid.css?v=10.4.0","./v9-theme.css?v=10.4.0","./spacing-polish.css?v=10.4.0","./v10-restart.css?v=10.4.0","./v10-filter-split.css?v=10.4.0","./v10-action-panel.css?v=10.4.0","./app.js?v=10.4.0","./v9-theme.js?v=10.4.0","./manifest.json","./icons/icon-192.svg","./icons/icon-512.svg"];
self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(url=>new Request(url,{cache:"reload"})))))
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))
});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)))
});