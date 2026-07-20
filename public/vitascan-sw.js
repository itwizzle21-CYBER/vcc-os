const CACHE = "vitascan-v5";
const APP_SHELL = ["/vitascan", "/vitascan.webmanifest", "/vitascan-logo.png?v=2", "/icons/vitascan-apple-180.png?v=2", "/icons/vitascan-android-192.png?v=2", "/icons/vitascan-android-512.png?v=2"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith("/vitascan")) return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("/vitascan"))));
});
