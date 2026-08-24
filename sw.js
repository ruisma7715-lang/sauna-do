/* 圏外でもアプリが開くようにファイルを控えておく */

/* 名前に必ずこの接頭辞を付ける。
   キャッシュはフォルダ単位ではなくサイト単位で共有されるため、
   接頭辞で絞らずに「自分以外を消す」と、同じサイトにある旧版（sauna-tabi-*）の
   控えまで巻き添えで消してしまう。ここは必ず前方一致で判定すること。 */
const PREFIX = "saunado-";
const CACHE = PREFIX + "v11";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* まず新しいものを取りに行き、つながらなければ控えを使う */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(m => m || caches.match("./index.html")))
  );
});
