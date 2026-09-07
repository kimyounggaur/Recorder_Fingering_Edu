/* global self, caches, URL, Response, fetch */

const CACHE_PREFIX = "recorder-fingering-";
const CACHE_NAME = `${CACHE_PREFIX}cda72aa-1788777482292`;
const PRECACHE_URLS = [
  "/",
  "/assets/BasicsApp-CPC-vrki.js",
  "/assets/CompareApp-GKh4HiVI.js",
  "/assets/LessonPageShell-BG3qnuKD.js",
  "/assets/QuizApp-wxmW5xtn.js",
  "/assets/RecorderErrorBoundary-BU5L_ffO.js",
  "/assets/RecorderLearningApp-D_8BVJ6J.js",
  "/assets/RecorderScene-ttRGP5E3.js",
  "/assets/ServiceWorkerRegistration-CWz0ZbYe.js",
  "/assets/buildInstruction-CM0DAuuu.js",
  "/assets/createLucideIcon-hgQxfVm2.js",
  "/assets/framework-C-kvl5Nm.js",
  "/assets/index-CP0GW27-.js",
  "/assets/index-D4A7r_2L.css",
  "/assets/layout-segment-context-BaokGFF-.js",
  "/assets/pause-9hokipVR.js",
  "/assets/rolldown-runtime-hePW80VL.js",
  "/assets/router-3mWHKuEe.js",
  "/assets/useCompletionCue-tjAB9AU_.js",
  "/assets/useRecorderAudio-D3_LOhII.js",
  "/assets/useReducedMotion-twxOurvw.js",
  "/assets/useShortTone-B4m6SdJE.js",
  "/basics",
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
  "/manifest.webmanifest",
  "/quiz"
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
