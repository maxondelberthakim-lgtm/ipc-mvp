/* App shell cache — data (API Apps Script) TIDAK di-cache, selalu online. */
var CACHE = 'ipc-shell-v1';
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
  // App shell: cache-first, update di belakang layar.
  e.respondWith(caches.match(e.request).then(function(hit){
    var net = fetch(e.request).then(function(r){
      if (r && r.status===200 && r.type==='basic'){ var cl=r.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, cl); }); }
      return r;
    }).catch(function(){ return hit; });
    return hit || net;
  }));
});
