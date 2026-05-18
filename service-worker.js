const CACHE_NAME = "golf-passport-v18";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=18",
  "./app.js?v=18",
  "./app-config.js?v=18",
  "./manifest.json",
  "./assets/europe-map.svg",
  "./assets/icon.svg",
  "./assets/europe-countries.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
