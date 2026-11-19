// Network first, so a deploy shows on the next load; the cache keeps the app
// working offline. Navigations share one entry: the robot lives in the query.
const CACHE = "toybox";
const SHELL = ["./", "main.js", "manifold.wasm", "icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (
    request.method !== "GET" ||
    !request.url.startsWith(self.registration.scope)
  ) {
    return;
  }
  const key = request.mode === "navigate" ? self.registration.scope : request;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(key, response.clone());
        return response;
      } catch (err) {
        const cached = await cache.match(key);
        if (cached) return cached;
        throw err;
      }
    })(),
  );
});
