var CACHE = "mes-devoirs-v1";
var ASSETS = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  var url = new URL(req.url);

  // Ne jamais intercepter ou cacher les appels API Gemini ou les requêtes POST
  if (req.method !== "GET" || url.hostname.indexOf("generativelanguage.googleapis.com") !== -1) {
    return;
  }

  // Même origine uniquement : cache-first avec mise à jour réseau
  if (url.origin === self.location.origin) {
    ev.respondWith(
      caches.match(req).then(function (cached) {
        var net = fetch(req).then(function (res) {
          if (res && res.status === 200 && res.type === "basic") {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () { return cached; });
        return cached || net;
      })
    );
  }
});
