/* global self, caches, URL, Response, fetch */

const CACHE_PREFIX = "recorder-fingering";
const CACHE_NAME = `${CACHE_PREFIX}-v1`;
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
];
const RUNTIME_CACHE_DESTINATIONS = new Set([
  "audio",
  "font",
  "image",
  "script",
  "style",
]);

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function isDevRuntimePath(pathname) {
  return (
    pathname.includes("__nextjs") ||
    pathname.includes("webpack-hmr") ||
    pathname.includes("@vite") ||
    pathname === "/__vite_ping"
  );
}

function shouldRuntimeCache(request) {
  if (request.method !== "GET" || !isSameOrigin(request)) return false;

  const { pathname } = new URL(request.url);
  if (isDevRuntimePath(pathname)) return false;

  return (
    RUNTIME_CACHE_DESTINATIONS.has(request.destination) ||
    pathname.startsWith("/audio/") ||
    pathname.startsWith("/fingering/poses/") ||
    pathname === "/manifest.webmanifest"
  );
}

async function cacheResponse(cache, request, response) {
  if (!response || response.status !== 200) return;
  await cache.put(request, response.clone());
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    await cacheResponse(cache, request, response);
    return response;
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match("/")) ||
      Response.error()
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  await cacheResponse(cache, request, response);
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !isSameOrigin(request)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  if (shouldRuntimeCache(request)) {
    event.respondWith(cacheFirst(request));
  }
});
