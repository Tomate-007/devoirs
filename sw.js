var CACHE = "mes-devoirs-v2";
var ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

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

  if (req.method !== "GET" || url.hostname.indexOf("generativelanguage.googleapis.com") !== -1) {
    return;
  }

  if (url.origin === self.location.origin) {
    var isPage = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");

    if (isPage) {
      ev.respondWith(
        fetch(req).then(function (res) {
          if (res && res.status === 200) {
            var copy = res.clone();
            caches.open(CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () {
          return caches.match(req).then(function (c) { return c || caches.match("./index.html"); });
        })
      );
      return;
    }

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
