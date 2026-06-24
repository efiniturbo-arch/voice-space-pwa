const CACHE = "voice-events-pwa-v20-1-safe";
const CORE = [
  "./",
  "./index.html",
  "./style.css?v=20.1.0-safe",
  "./v13-ui.css?v=20.1.0-safe",
  "./v14-direct.css?v=20.1.0-safe",
  "./v15-water-glass.css?v=20.1.0-safe",
  "./v16-filter.css?v=20.1.0-safe",
  "./v17-water-layout.css?v=20.1.0-safe",
  "./v18-fixes.css?v=20.1.0-safe",
  "./v19-orb-actions.css?v=20.1.0-safe",
  "./v20-mic-layout.css?v=20.1.0-safe",
  "./app.js?v=20.1.0-safe",
  "./v13-ui.js?v=20.1.0-safe",
  "./v14-direct.js?v=20.1.0-safe",
  "./v15-sound.js?v=20.1.0-safe",
  "./v16-filter.js?v=20.1.0-safe",
  "./v18-fixes.js?v=20.1.0-safe",
  "./v19-orb-actions.js?v=20.1.0-safe",
  "./v20-mic-layout.js?v=20.1.0-safe",
  "./manifest.json"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; })).catch(() => caches.match("./index.html")));
});