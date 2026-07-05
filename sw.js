// Simple, fault-tolerant service worker.
// Strategy: always try the network first (so updates show immediately).
// Only fall back to a previously cached response when there's genuinely no internet.
// Deliberately avoids cache.addAll() at install time — if even one asset fails
// to fetch, addAll() rejects the whole install, which can leave the service
// worker stuck. This version can't fail in that way.

const CACHE_NAME = "calc-arz-v5";

self.addEventListener("install", () => {
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
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.ok) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
