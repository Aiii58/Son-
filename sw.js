/* Kan Kardeşim — çevrimdışı önbellek */
const CACHE = 'kankardesim-v1';
const CEKIRDEK = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CEKIRDEK)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* sayfa: önce ağ (güncellemeler hemen gelsin), internet yoksa önbellek */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(cevap => {
        const kopya = cevap.clone();
        caches.open(CACHE).then(c => c.put('./index.html', kopya));
        return cevap;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  /* diğer kaynaklar (fontlar dahil): önbellekten hemen, arka planda tazele */
  e.respondWith(
    caches.match(e.request).then(onbellek => {
      const ag = fetch(e.request).then(cevap => {
        if (cevap && (cevap.status === 200 || cevap.type === 'opaque')) {
          const kopya = cevap.clone();
          caches.open(CACHE).then(c => c.put(e.request, kopya));
        }
        return cevap;
      }).catch(() => onbellek);
      return onbellek || ag;
    })
  );
});
