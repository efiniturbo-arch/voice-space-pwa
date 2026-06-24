const CACHE = "voice-events-pwa-v18-0";
const CORE = [
  "./",
  "./index.html",
  "./style.css?v=18.0.0",
  "./v13-ui.css?v=18.0.0",
  "./v14-direct.css?v=18.0.0",
  "./v15-water-glass.css?v=18.0.0",
  "./v16-filter.css?v=18.0.0",
  "./v17-water-layout.css?v=18.0.0",
  "./v18-fixes.css?v=18.0.0",
  "./app.js?v=18.0.0",
  "./v13-ui.js?v=18.0.0",
  "./v14-direct.js?v=18.0.0",
  "./v15-sound.js?v=18.0.0",
  "./v16-filter.js?v=18.0.0",
  "./v18-fixes.js?v=18.0.0",
  "./asset-manifest.json",
  "./manifest.json",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    fetch("./asset-manifest.json", { cache: "reload" })
      .then(response => response.json())
      .then(manifest => {
        const themeAssets = manifest.themes.flatMap(theme => [
          theme.background,
          theme.home_mockup,
          theme.event_card,
          ...Object.values(theme.nav).flatMap(item => [item.normal, item.active])
        ]);
        return caches.open(CACHE).then(cache => cache.addAll([...CORE, ...themeAssets].map(url => new Request(url, { cache: "reload" }))));
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});