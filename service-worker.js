const CACHE_NAME = "static-v2";
const ASSETS = [
  "/", 
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// 1) Install → cache file tĩnh
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 2) Activate → xóa cache cũ
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    )
  );
  clients.claim();
});

// 3) Fetch → chỉ cache GET request, KHÔNG cache Supabase
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Không cache API Supabase (tránh lỗi import)
  if (req.url.includes("supabase.co")) {
    return event.respondWith(fetch(req));
  }

  // Chỉ cache GET
  if (req.method !== "GET") {
    return event.respondWith(fetch(req));
  }

  event.respondWith(
    caches.match(req).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(req)
          .then((networkRes) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, networkRes.clone());
              return networkRes;
            });
          })
          .catch(() => cacheRes)
      );
    })
  );
});
