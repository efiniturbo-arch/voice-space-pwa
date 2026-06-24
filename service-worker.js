const CACHE = "voice-events-pwa-v20-0";
const CORE = [
  "./",
  "./index.html",
  "./style.css?v=20.0.0",
  "./v13-ui.css?v=20.0.0",
  "./v14-direct.css?v=20.0.0",
  "./v15-water-glass.css?v=20.0.0",
  "./v16-filter.css?v=20.0.0",
  "./v17-water-layout.css?v=20.0.0",
  "./v18-fixes.css?v=20.0.0",
  "./v19-orb-actions.css?v=20.0.0",
  "./v20-mic-layout.css?v=20.0.0",
  "./app.js?v=20.0.0",
  "./v13-ui.js?v=20.0.0",
  "./v14-direct.js?v=20.0.0",
  "./v15-sound.js?v=20.0.0",
  "./v16-filter.js?v=20.0.0",
  "./v18-fixes.js?v=20.0.0",
  "./v19-orb-actions.js?v=20.0.0",
  "./v20-mic-layout.js?v=20.0.0",
  "./manifest.json"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; })).catch(() => caches.match("./index.html")));
});