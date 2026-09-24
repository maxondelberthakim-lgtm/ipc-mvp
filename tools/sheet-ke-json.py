#!/usr/bin/env python3
"""Ubah ekspor .xlsx dari Google Sheet database IPC menjadi JSON {sheet: rows} untuk
POST /admin/impor di Worker Cloudflare. Waktu di Sheet dianggap WIB (Asia/Jakarta) → UTC.
Pakai: python3 tools/sheet-ke-json.py ipc-live.xlsx ipc-live.json"""
import sys, json, datetime, openpyxl
src, dst = sys.argv[1], sys.argv[2]
WIB = datetime.timedelta(hours=7)
TEKS = ('PIN', 'No_Surat_Jalan', 'No_PO', 'No_SO', 'No_Invoice', 'Kode_Item', 'Kode_Supplier', 'Kode_Customer', 'Kode_Produk')
def conv(v, kolom):
    if v is None: return ''
    if isinstance(v, datetime.datetime): return (v - WIB).isoformat(timespec='milliseconds') + 'Z'
    if isinstance(v, datetime.date): return (datetime.datetime(v.year, v.month, v.day) - WIB).isoformat(timespec='milliseconds') + 'Z'
    if kolom in TEKS and isinstance(v, (int, float)): return str(int(v)) if float(v).is_integer() else str(v)
    return v
out = {}
for ws in openpyxl.load_workbook(src).worksheets:
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    if not rows: continue
    head = [('' if h is None else str(h)) for h in rows[0]]
    body = [[conv(v, head[i]) for i, v in enumerate(r)] for r in rows[1:]]
    out[ws.title] = [head] + [r for r in body if any(v != '' for v in r)]
    print(ws.title, len(out[ws.title]) - 1)
json.dump(out, open(dst, 'w'), ensure_ascii=False)
print('ditulis', dst)
