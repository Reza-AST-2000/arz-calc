const CACHE_NAME = "calc-arz-v4";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];
// Static third-party libraries worth caching for offline use (unlike live price APIs)
const CACHEABLE_CROSS_ORIGIN = [
  "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isCacheableLib = CACHEABLE_CROSS_ORIGIN.includes(event.request.url);
  const isNavigation = event.request.mode === "navigate";
  const isHtmlOrRoot = isSameOrigin && (url.pathname.endsWith(".html") || url.pathname.endsWith("/"));
  const isNetworkFirst = isNavigation || isHtmlOrRoot;

  if (!isSameOrigin && !isCacheableLib) return; // let live price API calls pass straight through, uncached

  if (isNetworkFirst) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        }).catch(() => cached)
      );
    })
  );
});
