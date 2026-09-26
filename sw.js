const CACHE = "sade-pos-v3";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Never cache GitHub API calls — the database read/writes must always hit the network.
  if (e.request.url.includes("api.github.com")) return;
  // Network-first: always try to fetch the latest version of the file when
  // online, so an app update takes effect the moment it's uploaded — only
  // falling back to the cached copy when there's no connection at all. That
  // fallback is what keeps the PWA usable offline; it should never be the
  // reason a fix looks like it "didn't apply."
  e.respondWith(
    fetch(e.request).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return resp;
    }).catch(() => caches.match(e.request))
  );
});
