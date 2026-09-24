#!/usr/bin/env python3
"""Rakit cloudflare/src/backend.js dari apps-script/*.gs.

Logika backend TIDAK diubah: semua file .gs digabung apa adanya ke dalam satu fungsi
`pasangBackend(G)` yang menerima layanan pengganti (SpreadsheetApp, Utilities, ...) dan
mengembalikan peta semua fungsi + variabel global, supaya Worker/Durable Object bisa
memanggil fungsi RPC yang sama persis dengan yang dipakai di Apps Script."""
import os, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(root, 'apps-script')
FILES = ['Config.gs', 'Server.gs', 'Media.gs', 'Pembelian.gs', 'Penjualan.gs', 'DaurUlang.gs']
SERVICES = ['SpreadsheetApp', 'LockService', 'Utilities', 'Session', 'DriveApp', 'PropertiesService',
            'CacheService', 'ScriptApp', 'HtmlService', 'ContentService', 'DocumentApp', 'Logger', 'Sheets']

src, fns, vars_ = [], [], []
for f in FILES:
    teks = open(os.path.join(A, f), encoding='utf-8').read()
    src.append('/* ==== ' + f + ' ==== */\n' + teks)
    fns += re.findall(r'^function\s+([A-Za-z_$][\w$]*)\s*\(', teks, re.M)
    vars_ += re.findall(r'^var\s+([A-Za-z_$][\w$]*)\s*=', teks, re.M)

body = '\n'.join(src)
out = (
    '/* DIBUAT OTOMATIS oleh tools/build-cf.py — jangan diedit; ubah apps-script/*.gs lalu jalankan ulang. */\n'
    '/* eslint-disable */\n'
    'export function pasangBackend(G) {\n'
    '  var ' + ', '.join(s + ' = G.' + s for s in SERVICES) + ';\n'
    '  var console = G.console;\n'
    '  /* doPost() memakai globalThis[fn]; di sini "globalThis" = peta fungsi backend (bukan global Worker) */\n'
    '  var globalThis = { ' + ', '.join(n + ': ' + n for n in fns) + ' };\n'
    + body + '\n'
    '  return {\n'
    '    fns: globalThis,\n'
    '    atur: function (o) { ' + ' '.join("if ('%s' in o) %s = o.%s;" % (v, v, v) for v in vars_) + ' },\n'
    '    vars: function () { return { ' + ', '.join(v + ': ' + v for v in vars_) + ' }; }\n'
    '  };\n'
    '}\n'
)
dst = os.path.join(root, 'cloudflare', 'src', 'backend.js')
os.makedirs(os.path.dirname(dst), exist_ok=True)
open(dst, 'w', encoding='utf-8').write(out)
print('ditulis:', dst, len(out), 'bytes;', len(fns), 'fungsi,', len(vars_), 'variabel')
