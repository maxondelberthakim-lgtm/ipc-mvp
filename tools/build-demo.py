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
shim   = rd(os.path.join(root, 'tools', 'shim.js'))
seed   = rd(os.path.join(root, 'tools', 'seed.js'))

html = idx.replace("<?!= include('Styles'); ?>", styles).replace("<?!= include('Script'); ?>", "__S__")
html = html.replace("<script>var BAHASA_AWAL = '<?= bahasaAwal ?>';</script>", "<script>var BAHASA_AWAL = 'id';</script>")
backend = ("<script>\n" + shim + "\n</script>\n<script>\n" + cfg + "\n" + srv + "\n" + med +
           "\n</script>\n<script>\n" + seed + "\n</script>\n")
html = html.replace("__S__", backend + script)

banner = '''
<div id="demoBanner" style="background:#0b3b38;color:#cfe6e2;font:12.5px/1.45 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:9px 14px;display:flex;gap:10px;align-items:center">
  <span style="flex:1">Demo — data contoh, tersimpan di browser ini saja. Lihat sebagai:</span>
  <select id="demoPeran" onchange="window.__peranDemo=this.value;S.ctx=null;tampil('home')" style="flex:0 0 auto;max-width:55%;background:rgba(255,255,255,.14);color:#fff;border:0;border-radius:7px;padding:5px 8px;font-size:11.5px;font-weight:700">
    <option value="ADMIN" style="color:#111">Admin (semua + pengguna)</option>
    <option value="SUPERVISOR" style="color:#111">Supervisor (review, HPP, opname)</option>
    <option value="STAF" style="color:#111">Anak gudang (input saja)</option>
  </select>
</div>
'''
html = html.replace('<body>\n', '<body>\n' + banner, 1)
html = html.replace('<title>', '<title>IPC Gudang &amp; Produksi</title>\n<title>', 1) if '<title>' in html else \
       html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <title>IPC Gudang &amp; Produksi</title>', 1)

out = os.path.join(root, 'docs', 'index.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w', encoding='utf-8').write(html)
print('ditulis:', out, len(html), 'bytes')
