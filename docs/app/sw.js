/* App shell cache — data (API Apps Script) TIDAK di-cache, selalu online.
   Halaman (index.html): NETWORK-FIRST supaya versi baru langsung terpakai; cache hanya cadangan offline.
   Ikon/manifest: cache-first. Nama cache = hash build -> cache lama otomatis dibuang. */
var CACHE = 'ipc-shell-ffea4f09e6';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var url = e.request.url;
  // Panggilan API Apps Script: selalu network, jangan pernah cache.
  if (url.indexOf('script.google.com') > -1 || url.indexOf('googleusercontent.com') > -1 || e.request.method !== 'GET') return;
  var halaman = e.request.mode === 'navigate' || /\/(index\.html)?(\?.*)?$/.test(url);
  if (halaman){
    // network-first: selalu coba ambil versi terbaru; kalau offline pakai cache.
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(function(r){
      if (r && r.status===200){ var cl=r.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, cl); }); }
      return r;
    }).catch(function(){ return caches.match(e.request).then(function(hit){ return hit || caches.match('./index.html'); }); }));
    return;
  }
  // Ikon & manifest: cache-first, update di belakang layar.
  e.respondWith(caches.match(e.request).then(function(hit){
    var net = fetch(e.request).then(function(r){
      if (r && r.status===200 && r.type==='basic'){ var cl=r.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, cl); }); }
      return r;
    }).catch(function(){ return hit; });
    return hit || net;
  }));
});
