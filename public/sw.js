/* global self, caches, URL, Response, fetch */

const CACHE_PREFIX = "recorder-fingering-";
const CACHE_NAME = `${CACHE_PREFIX}be45669-1793249557175`;
const PRECACHE_URLS = [
  "/",
  "/assets/BasicsApp-DCrHt4ed.js",
  "/assets/CompareApp-BFP6eDdI.js",
  "/assets/LessonPageShell-CeNSME5H.js",
  "/assets/QuizApp-D3zCBwat.js",
  "/assets/RecorderErrorBoundary-BU5L_ffO.js",
  "/assets/RecorderLearningApp-Bpx5xiti.js",
  "/assets/RecorderScene-DNzc_uyF.js",
  "/assets/ServiceWorkerRegistration-CWz0ZbYe.js",
  "/assets/buildInstruction-CiGw1pJC.js",
  "/assets/createLucideIcon-hgQxfVm2.js",
  "/assets/framework-C-kvl5Nm.js",
  "/assets/index-Czhpu7Gk.css",
  "/assets/index-DE6m4jRx.js",
  "/assets/layout-segment-context-CfWT6DP0.js",
  "/assets/pause-9hokipVR.js",
  "/assets/rolldown-runtime-hePW80VL.js",
  "/assets/router-4yNCD-jC.js",
  "/assets/useCompletionCue-tjAB9AU_.js",
  "/assets/useRecorderAudio-D3_LOhII.js",
  "/assets/useReducedMotion-CtOnv807.js",
  "/assets/useShortTone-D30yCvaJ.js",
  "/basics",
  "/compare",
  "/favicon.svg",
  "/fingering/poses-focused/as4.png",
  "/fingering/poses-focused/cs4.png",
  "/fingering/poses-focused/d5.png",
  "/fingering/poses-focused/do.png",
  "/fingering/poses-focused/ds4.png",
  "/fingering/poses-focused/e5.png",
  "/fingering/poses-focused/f5-baroque.png",
  "/fingering/poses-focused/f5-german.png",
  "/fingering/poses-focused/fa-baroque.png",
  "/fingering/poses-focused/fa-german.png",
  "/fingering/poses-focused/fs4-baroque.png",
  "/fingering/poses-focused/fs4-german.png",
  "/fingering/poses-focused/g5.png",
  "/fingering/poses-focused/gs4.png",
  "/fingering/poses-focused/high-do.png",
  "/fingering/poses-focused/la.png",
  "/fingering/poses-focused/mi.png",
  "/fingering/poses-focused/re.png",
  "/fingering/poses-focused/si.png",
  "/fingering/poses-focused/sol.png",
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
  } else if (RUNTIME_DESTINATIONS.has(request.destination) || url.pathname.startsWith("/fingering/poses-focused/") || url.pathname === "/manifest.webmanifest") {
    event.respondWith(cacheFirst(request));
  }
});
