#!/usr/bin/env python3
"""Rakit PWA GitHub Pages (docs/app/) dari apps-script/ (Index+Styles+Script).
Frontend ini statis, buka instan, bisa di-install ke HP, memanggil Apps Script API (POST JSON).
API_URL diambil dari tools/api-url.txt (URL /exec deployment Apps Script).
Mode uji:  python3 tools/build-app.py --test  → docs/app-test/ (API dari tools/api-url-test.txt,
banner oranye "MODE TEST", judul/manifest "H-Plast TEST"); di-deploy ke cabang Pages "test"
→ https://test.h-plast.pages.dev, backend Worker terpisah "ipc-api-test" (database sendiri)."""
import os, sys
TEST = '--test' in sys.argv
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(root, 'apps-script')
rd = lambda p: open(p, encoding='utf-8').read()

idx    = rd(os.path.join(A, 'Index.html'))
styles = rd(os.path.join(A, 'Styles.html'))
script = rd(os.path.join(A, 'Script.html'))
api    = rd(os.path.join(root, 'tools', 'api-url-test.txt' if TEST else 'api-url.txt')).strip()
NAMA   = 'H-Plast TEST' if TEST else 'H-Plast'
WARNA  = '#b45309' if TEST else '#0f3b38'

# --- head: inline Styles, tambah PWA meta ---
pwa_head = (
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">\n'
  '  <meta name="theme-color" content="#0f3b38">\n'
  '  <meta name="mobile-web-app-capable" content="yes">\n'
  '  <meta name="apple-mobile-web-app-capable" content="yes">\n'
  '  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
  '  <meta name="apple-mobile-web-app-title" content="' + NAMA + '">\n'
  '  <link rel="manifest" href="manifest.webmanifest">\n'
  '  <link rel="apple-touch-icon" href="icon-192.png">\n'
  '  <title>' + NAMA + ' IPC — Gudang &amp; Produksi</title>\n  '
)
html = idx.replace("<?!= include('Styles'); ?>", pwa_head + styles)

# --- API_URL + bahasa awal + registrasi service worker ---
boot = (
  "<script>\n"
  "window.API_URL = " + repr(api) + ";\n"
  "/* v11.1: alamat resmi app = h-plast.pages.dev; salinan lama di github.io dialihkan */\n"
  "if (/github\\.io$/.test(location.hostname)) { location.replace('https://h-plast.pages.dev/' + location.search + location.hash); }\n"
  "var BAHASA_AWAL = 'id';\n"
  "if ('serviceWorker' in navigator) { window.addEventListener('load', function(){ "
  "navigator.serviceWorker.register('sw.js').catch(function(){}); }); }\n"
  "</script>\n"
)
html = html.replace("<script>var BAHASA_AWAL = '<?= bahasaAwal ?>';</script>", boot)
html = html.replace("<?!= include('Script'); ?>", script)

if TEST:
  banner = (
    '<div id="testBanner" style="background:#b45309;color:#fff7ed;font:12.5px/1.5 -apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;'
    'padding:8px 14px;border-bottom:3px solid #f59e0b;display:flex;gap:10px;align-items:center">'
    '<span style="flex:1"><b style="color:#fff;font-size:13.5px">🧪 MODE TEST — bukan data asli.</b> '
    'Database terpisah dari h-plast.pages.dev; bebas coba-coba. '
    'Login: <b>Admin</b> 1234 · <b>Direktur</b> 2468 · <b>Manager</b> 1357 · <b>Yansen</b> 2211 · <b>Deny</b> 3322 · <b>Bastari</b> 4433</span>'
    '<button onclick="document.getElementById(\'testBanner\').hidden=true" style="background:rgba(255,255,255,.18);color:#fff;border:0;'
    'border-radius:7px;padding:5px 10px;font-size:11.5px;font-weight:700;cursor:pointer;flex:0 0 auto">Tutup</button></div>\n'
  )
  assert '<body>\n' in html
  html = html.replace('<body>\n', '<body>\n' + banner, 1)

out_dir = os.path.join(root, 'docs', 'app-test' if TEST else 'app')
os.makedirs(out_dir, exist_ok=True)
open(os.path.join(out_dir, 'index.html'), 'w', encoding='utf-8').write(html)

# --- manifest ---
manifest = '''{
  "name": "__NAMA__ IPC — Gudang & Produksi",
  "short_name": "__NAMA__",
  "description": "Kontrol inventory & produksi — supplier, gudang, produksi, customer.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "__WARNA__",
  "theme_color": "__WARNA__",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
'''.replace('__NAMA__', NAMA).replace('__WARNA__', WARNA)
open(os.path.join(out_dir, 'manifest.webmanifest'), 'w', encoding='utf-8').write(manifest)

# --- service worker: cache HANYA app shell (index.html); data selalu online ---
import hashlib
build_id = hashlib.sha1(html.encode('utf-8')).hexdigest()[:10]
sw = """/* App shell cache — data (API Apps Script) TIDAK di-cache, selalu online.
   Halaman (index.html): NETWORK-FIRST supaya versi baru langsung terpakai; cache hanya cadangan offline.
   Ikon/manifest: cache-first. Nama cache = hash build -> cache lama otomatis dibuang. */
var CACHE = 'ipc-shell-__BUILD__';
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
  if (url.indexOf('script.google.com') > -1 || url.indexOf('googleusercontent.com') > -1 || url.indexOf('workers.dev') > -1 || e.request.method !== 'GET') return;
  var halaman = e.request.mode === 'navigate' || /\\/(index\\.html)?(\\?.*)?$/.test(url);
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
""".replace('__BUILD__', build_id)
open(os.path.join(out_dir, 'sw.js'), 'w', encoding='utf-8').write(sw)

import shutil
for ik in ('icon-192.png', 'icon-512.png'):
  src = os.path.join(root, 'docs', 'app', ik)
  if TEST and os.path.exists(src): shutil.copy(src, os.path.join(out_dir, ik))
print('ditulis:', os.path.join(out_dir, 'index.html'), len(html), 'bytes; API_URL=', api)
