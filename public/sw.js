const MODEL_SHARDS = Array.from({ length: 55 }, (_, i) => `/model/group${i + 1}-shard1of1`);
const CACHE_ASSETS = [
  "/",
  "/sos",
  "/manifest.json",
  "/favicon.ico",
  "/model/model.json",
  ...MODEL_SHARDS
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("aounak-v1").then((cache) => {
      return cache.addAll(CACHE_ASSETS);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
