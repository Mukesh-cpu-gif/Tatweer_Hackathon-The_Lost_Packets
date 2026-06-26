const CACHE_VERSION = "aounak-offline-v5";
const RUNTIME_CACHE = "aounak-runtime-v5";

const MODEL_SHARDS = Array.from({ length: 55 }, (_, i) => `/model/group${i + 1}-shard1of1`);

const APP_SHELL = [
  "/",
  "/sos",
  "/responder",
  "/responder/map",
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon.svg",
  "/icons/maskable.svg",
  "/splash.svg",
  "/model/model.json",
  ...MODEL_SHARDS
];

const CACHEABLE_DESTINATIONS = new Set([
  "document",
  "font",
  "image",
  "script",
  "style",
  "worker",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![CACHE_VERSION, RUNTIME_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      await cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch {
    return new Response("", {
      status: 504,
      statusText: "Offline asset unavailable",
    });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    const shell = await caches.match("/");
    return cached || shell || new Response("Aounak is offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (CACHEABLE_DESTINATIONS.has(request.destination)) {
    event.respondWith(cacheFirst(request));
  }
});
