// DowgNut Service Worker — enables PWA install + offline shell caching.
const CACHE = "dowgnut-v1";
const SHELL = [
  "/",
  "/manifest.json",
  "/brand/app-icon-192.png",
  "/brand/app-icon-512.png",
  "/brand/dowgnut-logo-wordmark.png",
  "/brand/dowgnut-mascot.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // Only handle GET.
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Network-first for API + donut images (always fresh).
  if (url.pathname.startsWith("/api/") || url.hostname.includes("romanejaquez")) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || new Response("Offline", { status: 503 })))
    );
    return;
  }

  // Cache-first for static assets (app shell).
  e.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached)
    )
  );
});
