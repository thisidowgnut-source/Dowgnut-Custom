// DowgNut Service Worker — enables PWA install + offline shell caching.
// v2: network-first navigations so users ALWAYS get the latest deployed UI
// (v1 served stale cached HTML after redeploys). Offline shell still works.
const CACHE = "dowgnut-v2";
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
  const sameOrigin = url.origin === self.location.origin;

  // Cross-origin (e.g. donut CDN images): network-first (always fresh).
  if (!sameOrigin) {
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

  // API calls: network-first, cache only as offline fallback.
  if (url.pathname.startsWith("/api/")) {
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

  // Page navigations (HTML): network-first — guarantees fresh UI after
  // redeploys/theme changes; cached shell only when offline.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match("/"))
        )
    );
    return;
  }

  // Content-hashed Next.js build assets: cache-first (immutable URLs).
  if (url.pathname.startsWith("/_next/static/")) {
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
    return;
  }

  // Brand assets (logo, icons, manifest): network-first so logo updates
  // appear immediately; cached copy only as offline fallback.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || new Response("Offline", { status: 503 })))
  );
});
