const CACHE = "voice-events-pwa-v21-0";
const CORE = [
  "./",
  "./index.html",
  "./style.css?v=21.0.0",
  "./v13-ui.css?v=21.0.0",
  "./v14-direct.css?v=21.0.0",
  "./v15-water-glass.css?v=21.0.0",
  "./v16-filter.css?v=21.0.0",
  "./v17-water-layout.css?v=21.0.0",
  "./v18-fixes.css?v=21.0.0",
  "./v19-orb-actions.css?v=21.0.0",
  "./v20-mic-layout.css?v=21.0.0",
  "./water-assets.css?v=21.0.0",
  "./water-layout.css?v=21.0.0",
  "./assets/water/water-bg-header.jpg",
  "./assets/water/water-bg-main.jpg",
  "./assets/water/water-btn-date.png",
  "./assets/water/water-btn-status.png",
  "./assets/water/water-card-danger.png",
  "./assets/water/water-card-done.png",
  "./assets/water/water-card-normal.png",
  "./assets/water/water-card-warning.png",
  "./assets/water/water-drop-chat-active.png",
  "./assets/water/water-drop-chat-idle.png",
  "./assets/water/water-drop-docs-active.png",
  "./assets/water/water-drop-docs-idle.png",
  "./assets/water/water-drop-events-active.png",
  "./assets/water/water-drop-events-idle.png",
  "./assets/water/water-drop-tasks-active.png",
  "./assets/water/water-drop-tasks-idle.png",
  "./assets/water/water-drop-transport-active.png",
  "./assets/water/water-drop-transport-idle.png",
  "./assets/water/water-nav-dock.png",
  "./assets/water/water-orb-camera.png",
  "./assets/water/water-orb-mic.png",
  "./app.js?v=21.0.0",
  "./v13-ui.js?v=21.0.0",
  "./v14-direct.js?v=21.0.0",
  "./v15-sound.js?v=21.0.0",
  "./v16-filter.js?v=21.0.0",
  "./v18-fixes.js?v=21.0.0",
  "./v19-orb-actions.js?v=21.0.0",
  "./v20-mic-layout.js?v=21.0.0",
  "./water-layout.js?v=21.0.0",
  "./manifest.json"
];
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; })).catch(() => caches.match("./index.html")));
});
