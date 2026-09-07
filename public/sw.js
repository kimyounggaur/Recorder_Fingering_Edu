/* global self, caches, URL, Response, fetch */

const CACHE_PREFIX = "recorder-fingering-";
const CACHE_NAME = `${CACHE_PREFIX}096ddcd-1788772283540`;
const PRECACHE_URLS = [
  "/",
  "/assets/CompareApp-BKYfG86d.js",
  "/assets/RecorderErrorBoundary-KGmheTGm.js",
  "/assets/RecorderLearningApp-BETp1ZUf.js",
  "/assets/ServiceWorkerRegistration-2gmLFnAD.js",
  "/assets/_vinext_fonts/geist-8ac0455e797f/geist-001175b1.woff2",
  "/assets/_vinext_fonts/geist-8ac0455e797f/geist-52306abf.woff2",
  "/assets/_vinext_fonts/geist-8ac0455e797f/geist-875ccdd4.woff2",
  "/assets/_vinext_fonts/geist-8ac0455e797f/geist-98bbbccb.woff2",
  "/assets/_vinext_fonts/geist-8ac0455e797f/geist-ff2310f5.woff2",
  "/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-013b2f2f.woff2",
  "/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-0638449e.woff2",
  "/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-44745446.woff2",
  "/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-44e03052.woff2",
  "/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-971fb274.woff2",
  "/assets/_vinext_fonts/geist-mono-00e989178794/geist-mono-f6b33328.woff2",
  "/assets/buildInstruction-CYFpvQUw.js",
  "/assets/createLucideIcon-crHV4QEh.js",
  "/assets/framework-CXnKph_e.js",
  "/assets/index-8QSAfko1.css",
  "/assets/index-skrmm4DN.js",
  "/assets/layout-segment-context-DeMsWEX6.js",
  "/assets/rolldown-runtime-S-ySWqyJ.js",
  "/assets/router-CZn5QpsL.js",
  "/compare",
  "/favicon.svg",
  "/fingering/poses/as4.png",
  "/fingering/poses/cs4.png",
  "/fingering/poses/d5.png",
  "/fingering/poses/do.png",
  "/fingering/poses/ds4.png",
  "/fingering/poses/e5.png",
  "/fingering/poses/f5-baroque.png",
  "/fingering/poses/f5-german.png",
  "/fingering/poses/fa-baroque.png",
  "/fingering/poses/fa-german.png",
  "/fingering/poses/fs4-baroque.png",
  "/fingering/poses/fs4-german.png",
  "/fingering/poses/g5.png",
  "/fingering/poses/gs4.png",
  "/fingering/poses/high-do.png",
  "/fingering/poses/la.png",
  "/fingering/poses/mi.png",
  "/fingering/poses/re.png",
  "/fingering/poses/si.png",
  "/fingering/poses/sol.png",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.webmanifest"
];
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
  } else if (RUNTIME_DESTINATIONS.has(request.destination) || url.pathname.startsWith("/fingering/poses/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(cacheFirst(request));
  }
});
