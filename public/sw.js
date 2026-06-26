self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("aounak-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/sos",
        "/manifest.json",
        "/favicon.ico"
        // add tensor flow model weights and other static assets here later
      ]);
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
