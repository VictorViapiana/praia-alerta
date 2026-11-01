const CACHE = "praia-alerta-v55";
const PRECACHE = [
  "/",
  "/logo.png",
  "/logo-splash.png",
  "/favicon.ico?v=2",
  "/icons/icon-192.png?v=2",
  "/icons/icon-512.png?v=2",
  "/icons/apple-touch-icon.png?v=2",
  "/guara.png",
  "/guara-inteiro.png",
  "/guara/busca.webp",
  "/guara/emergencia.webp",
  "/guara/clima.webp",
  "/guara/avisos.webp",
  "/vendor/leaflet/leaflet.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function resolveTarget(data) {
  if (data && typeof data.url === "string" && data.url.startsWith("/")) return data.url;
  if (data && typeof data.spot === "string" && data.spot) {
    return `/?spot=${encodeURIComponent(data.spot)}&map=1`;
  }
  return "/?map=1";
}

/**
 * Toque na notificação → abre o app já no ícone (Marlin, Golfinho, quiosque, rampa).
 * Cobre iOS PWA (16.4+), Chrome/Samsung/Firefox Android e tablets.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const path = resolveTarget(data);
  const absolute = new URL(path, self.location.origin).href;

  event.waitUntil(
    (async () => {
      const payload = {
        type: "ORLA_OPEN_SPOT",
        url: path,
        spot: data.spot || null,
        kind: data.kind || null,
      };

      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        try {
          if (!client.url || !client.url.startsWith(self.location.origin)) continue;
        } catch {
          continue;
        }
        if ("focus" in client) {
          try {
            await client.focus();
          } catch {
            /* alguns WebViews bloqueiam focus */
          }
          // postMessage primeiro: SPA aplica o ícone sem depender do navigate
          try {
            client.postMessage(payload);
          } catch {
            /* ignore */
          }
          if ("navigate" in client) {
            try {
              await client.navigate(path);
            } catch {
              /* navigate falha em parte dos iPhones / WebAPK — postMessage já cobriu */
            }
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(absolute);
      }
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // O manifesto muda conforme o Android do aparelho. Não pode ir para o cache.
  if (url.pathname === "/manifest.webmanifest") return;

  // Network-first for navigations so demos always get the latest build.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/"))),
    );
    return;
  }

  // Cache-first for static assets; refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
