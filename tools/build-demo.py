#!/usr/bin/env python3
"""Rakit docs/index.html (demo offline) dari apps-script/ + tools/shim.js + tools/seed.js.
Jalankan dari root repo:  python3 tools/build-demo.py
"""
import os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(root, 'apps-script')
def rd(p): return open(p, encoding='utf-8').read()

idx    = rd(os.path.join(A, 'Index.html'))
styles = rd(os.path.join(A, 'Styles.html'))
script = rd(os.path.join(A, 'Script.html'))
cfg    = rd(os.path.join(A, 'Config.gs'))
srv    = rd(os.path.join(A, 'Server.gs'))
med    = rd(os.path.join(A, 'Media.gs'))
pem    = rd(os.path.join(A, 'Pembelian.gs'))
shim   = rd(os.path.join(root, 'tools', 'shim.js'))
seed   = rd(os.path.join(root, 'tools', 'seed.js'))
fixture= rd(os.path.join(root, 'tools', 'fixture-master.js'))  # supplier/customer contoh khusus demo

html = idx.replace("<?!= include('Styles'); ?>", styles).replace("<?!= include('Script'); ?>", "__S__")
html = html.replace("<script>var BAHASA_AWAL = '<?= bahasaAwal ?>';</script>", "<script>var BAHASA_AWAL = 'id';</script>")
backend = ("<script>\n" + shim + "\n</script>\n<script>\n" + cfg + "\n" + srv + "\n" + med + "\n" + pem +
           "\n</script>\n<script>\n" + fixture + "\n" + seed + "\n</script>\n")
html = html.replace("__S__", backend + script)

banner = '''
<div id="demoBanner" style="background:#0b3b38;color:#cfe6e2;font:12.5px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:9px 14px">
  <div style="display:flex;gap:10px;align-items:flex-start">
    <span style="flex:1"><b style="color:#fff">Demo</b> — data contoh, tersimpan di browser ini saja; refresh = reset.
      Login: <b style="color:#fff">Admin</b> 1234 · <b style="color:#fff">Direktur</b> 2468 · <b style="color:#fff">Manager</b> 1357 · <b style="color:#fff">Staff Gudang</b> 1111 · <b style="color:#fff">Yanto</b> 2222
      &nbsp;<span style="opacity:.7">(ganti akun: Beranda → Ganti nama / PIN)</span></span>
    <button onclick="document.getElementById('demoBanner').hidden=true" style="background:rgba(255,255,255,.14);color:#fff;border:0;border-radius:7px;padding:5px 10px;font-size:11.5px;font-weight:700;cursor:pointer;flex:0 0 auto">Tutup</button>
  </div>
</div>
'''
html = html.replace('<body>\n', '<body>\n' + banner, 1)
html = html.replace('<title>', '<title>IPC Gudang &amp; Produksi</title>\n<title>', 1) if '<title>' in html else \
       html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <title>IPC Gudang &amp; Produksi</title>', 1)

out = os.path.join(root, 'docs', 'index.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print('ditulis:', out, len(html), 'bytes')
