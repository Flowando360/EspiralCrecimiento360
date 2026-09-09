// Service worker mínimo, solo para que la app sea instalable (PWA).
// A propósito NO cachea páginas ni datos: esta es una app de datos de
// Talento Humano en vivo (contratos, SST, evaluaciones, PDI) — cachear
// eso podría mostrarle a alguien información desactualizada o incorrecta
// sin que se dé cuenta. Solo precachea los íconos y el manifest, que sí
// son seguros de servir offline.
const CACHE_NAME = 'espiral-crecimiento-shell-v1';
const ARCHIVOS_ESTATICOS = ['/icons/icon-192.png', '/icons/icon-512.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_ESTATICOS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (ARCHIVOS_ESTATICOS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});
