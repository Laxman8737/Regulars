const V = "regulars-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];
const CDN = ["www.gstatic.com", "cdnjs.cloudflare.com", "fonts.googleapis.com", "fonts.gstatic.com"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => { if (res && (res.ok || res.type === "opaque")) caches.open(V).then((c) => c.put(req, res.clone())); return res; };
self.addEventListener("fetch", (e) => {
  const req = e.request; if (req.method !== "GET") return;
  const u = new URL(req.url);
  if (req.mode === "navigate") {                      // always try the newest page first
    e.respondWith(fetch(req).then((r) => keep("index.html", r)).catch(() => caches.match("index.html")));
    return;
  }
  const own = u.origin === location.origin;
  if (!own && !(CDN.includes(u.hostname) && (u.hostname !== "www.gstatic.com" || u.pathname.startsWith("/firebasejs/")))) return; // never touch Firestore / Auth calls
  e.respondWith(caches.match(req).then((hit) => {
    const net = fetch(req).then((r) => keep(req, r)).catch(() => hit);
    return hit || net;
  }));
});
