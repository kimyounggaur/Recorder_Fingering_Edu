/* global self, caches, URL, Response, fetch */

const CACHE_PREFIX = "recorder-fingering-";
const CACHE_NAME = `${CACHE_PREFIX}__CACHE_VERSION__`;
const PRECACHE_URLS = __PRECACHE_URLS__;
const RUNTIME_DESTINATIONS = new Set(["audio", "font", "image", "script", "style"]);

function isDevRuntimePath(pathname) {
  return ["__nextjs", "webpack-hmr", "@vite", "/@id/", "/@fs/", "/node_modules/", "/__vite_ping"].some((part) => pathname.includes(part));
}
async function cacheResponse(cache, request, response) {
  if (response?.status === 200) {
    try { await cache.put(request, response.clone()); } catch { /* A full cache must not block the network response. */ }
  }
}
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    await cacheResponse(cache, request, response);
    return response;
  } catch {
    const path = new URL(request.url).pathname;
    return (await cache.match(request)) || (await cache.match(path)) || (await cache.match("/")) || Response.error();
  }
}
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  // Same-origin public assets are identical with or without a module Origin header.
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  await cacheResponse(cache, request, response);
  return response;
}
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
    .map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || isDevRuntimePath(url.pathname)) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
  } else if (RUNTIME_DESTINATIONS.has(request.destination) || url.pathname.startsWith("/fingering/poses-focused/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(cacheFirst(request));
  }
});
