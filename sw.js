/* Offline cache. Bump CACHE whenever any shell file changes, or the phone
   keeps serving the old copy. */
const CACHE = "softail-service-v6";
const SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./data-jobs.js",
  "./data-ref.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180.png",
  "./icon-512.png"
];
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  /* Fonts: use the cached copy if we have one, otherwise fetch and keep it,
     so the app looks the same offline after one online load. */
  if (FONTS.test(req.url)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => hit))
    );
    return;
  }

  /* Anything off-origin (store links) goes straight to the network. */
  if (url.origin !== location.origin) return;

  /* App shell: network first, cache as the fallback.
     Cache-first would be faster, but it also serves yesterday's app after an
     edit until the tab is closed, and it can mix new HTML with old JS. The
     network round trip on a phone is nothing next to that; offline still works
     because every shell file is precached. */
  /* `cache: "no-cache"` forces a conditional request rather than letting the
     browser's own HTTP cache answer. It costs a 304 and guarantees an edit
     actually reaches the phone. */
  let live = req;
  try { live = new Request(req, { cache: "no-cache" }); } catch (err) { }
  e.respondWith(
    fetch(live).then(res => {
      if (res && res.status === 200 && res.type === "basic") {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
  );
});
