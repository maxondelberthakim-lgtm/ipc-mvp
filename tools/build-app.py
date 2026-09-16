#!/usr/bin/env python3
"""Rakit PWA GitHub Pages (docs/app/) dari apps-script/ (Index+Styles+Script).
Frontend ini statis, buka instan, bisa di-install ke HP, memanggil Apps Script API (POST JSON).
API_URL diambil dari tools/api-url.txt (URL /exec deployment Apps Script)."""
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(root, 'apps-script')
rd = lambda p: open(p, encoding='utf-8').read()

idx    = rd(os.path.join(A, 'Index.html'))
styles = rd(os.path.join(A, 'Styles.html'))
script = rd(os.path.join(A, 'Script.html'))
api    = rd(os.path.join(root, 'tools', 'api-url.txt')).strip()

# --- head: inline Styles, tambah PWA meta ---
pwa_head = (
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">\n'
  '  <meta name="theme-color" content="#0f3b38">\n'
  '  <meta name="mobile-web-app-capable" content="yes">\n'
  '  <meta name="apple-mobile-web-app-capable" content="yes">\n'
  '  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
  '  <meta name="apple-mobile-web-app-title" content="IPC">\n'
  '  <link rel="manifest" href="manifest.webmanifest">\n'
  '  <link rel="apple-touch-icon" href="icon-192.png">\n'
  '  <title>IPC Gudang &amp; Produksi</title>\n  '
)
html = idx.replace("<?!= include('Styles'); ?>", pwa_head + styles)

# --- API_URL + bahasa awal + registrasi service worker ---
boot = (
  "<script>\n"
  "window.API_URL = " + repr(api) + ";\n"
  "var BAHASA_AWAL = 'id';\n"
  "if ('serviceWorker' in navigator) { window.addEventListener('load', function(){ "
  "navigator.serviceWorker.register('sw.js').catch(function(){}); }); }\n"
  "</script>\n"
)
html = html.replace("<script>var BAHASA_AWAL = '<?= bahasaAwal ?>';</script>", boot)
html = html.replace("<?!= include('Script'); ?>", script)

out_dir = os.path.join(root, 'docs', 'app')
os.makedirs(out_dir, exist_ok=True)
open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(html)

# --- manifest ---
manifest = '''{
  "name": "IPC — Gudang & Produksi",
  "short_name": "IPC",
  "description": "Kontrol inventory & produksi — supplier, gudang, produksi, customer.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f3b38",
  "theme_color": "#0f3b38",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
'''
open(os.path.join(out_dir, 'manifest.webmanifest'), 'w', encoding='utf-8').write(manifest)

# --- service worker: cache HANYA app shell (index.html); data selalu online ---
sw = '''/* App shell cache — data (API Apps Script) TIDAK di-cache, selalu online. */
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
'''
open(os.path.join(out_dir, 'sw.js'), 'w', encoding='utf-8').write(sw)

print('ditulis:', os.path.join(out_dir, 'index.html'), len(html), 'bytes; API_URL=', api)
