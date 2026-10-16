/* ============================================================
   IPC API di Cloudflare Workers.
   - Worker: terima POST {fn,args,idKlien} (kontrak sama dengan Apps Script /exec),
     teruskan ke satu Durable Object "ipc" yang memegang seluruh database.
   - GET /foto/<id>.jpg : foto bukti (disimpan di SQLite Durable Object).
   - Durable Object: logika .gs asli + SQLite; cron harian → backup JSON ke Workers KV (35 hari).
   Semua di paket gratis tanpa kartu kredit (R2 tidak dipakai karena butuh langganan).
   ============================================================ */
import { DurableObject } from 'cloudflare:workers';
import { Mesin } from './mesin.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key',
  'Access-Control-Max-Age': '86400'
};
function json(teks, status) {
  return new Response(teks, { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...CORS } });
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    if (req.method === 'GET' && url.pathname.startsWith('/foto/')) {
      const m = /^\/foto\/([a-z0-9]+)\.jpg$/.exec(url.pathname);
      if (!m) return new Response('Tidak ada', { status: 404 });
      const stub = env.IPC_DB.get(env.IPC_DB.idFromName('ipc'), { locationHint: env.LOKASI || 'apac' });
      const f = await stub.ambilFoto(m[1]);
      if (!f) return new Response('Tidak ada', { status: 404 });
      const h = new Headers(CORS);
      h.set('Content-Type', f.mime || 'image/jpeg');
      h.set('Cache-Control', 'public, max-age=31536000, immutable');
      return new Response(f.data, { headers: h });
    }

    /* v12: dokumen (invoice / PO) — halaman cetak publik dengan token rahasia; link ini yang dikirim ke WA */
    if (req.method === 'GET' && url.pathname.startsWith('/dok/')) {
      const m = /^\/dok\/([a-z0-9]{16,40})$/.exec(url.pathname);
      if (!m) return new Response('Tidak ada', { status: 404 });
      const stub = env.IPC_DB.get(env.IPC_DB.idFromName('ipc'), { locationHint: env.LOKASI || 'apac' });
      const d = await stub.ambilDokumen(m[1]);
      const h = new Headers({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
      if (!d) return new Response(halamanDokumen(null), { status: 404, headers: h });
      return new Response(halamanDokumen(d), { headers: h });
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/ping')) {
      return json(JSON.stringify({ ok: true, data: { layanan: 'IPC API', waktu: new Date().toISOString(), colo: req.cf?.colo || '' } }));
    }

    if (req.method !== 'POST') return json(JSON.stringify({ ok: false, error: 'Metode tidak didukung' }), 405);

    /* Rute admin (impor/ekspor/backup) hanya dengan kunci rahasia dari `wrangler secret put ADMIN_KEY` */
    if (url.pathname.startsWith('/admin/')) {
      if (!env.ADMIN_KEY || req.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json(JSON.stringify({ ok: false, error: 'Tidak diizinkan' }), 403);
    } else if (url.pathname !== '/' && url.pathname !== '/exec') {
      return json(JSON.stringify({ ok: false, error: 'Tidak ada' }), 404);
    }

    const id = env.IPC_DB.idFromName('ipc');
    const stub = env.IPC_DB.get(id, { locationHint: env.LOKASI || 'apac' });
    const body = await req.text();
    const teks = await stub.tangani(url.pathname, body, url.origin);
    return json(teks);
  },

  /* Cron (wrangler.jsonc: 02:00 WIB = 19:00 UTC): backup harian */
  async scheduled(ev, env, ctx) {
    const stub = env.IPC_DB.get(env.IPC_DB.idFromName('ipc'), { locationHint: env.LOKASI || 'apac' });
    ctx.waitUntil(stub.backup());
  }
};

export class IpcDb extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
    this.mesin = null;
    this.hangat = null;
  }

  siapkan(asal) {
    if (!this.mesin) {
      const t0 = Date.now();
      this.mesin = new Mesin({ sql: this.ctx.storage.sql, asalFoto: asal, log: (a, b) => console.log('[ipc]', a, JSON.stringify(b)) });
      console.log('[ipc] mesin siap', Date.now() - t0, 'ms');
    }
    this.mesin.asalFoto = asal;
    /* tetap di memori selama jam kerja: timer 30 dtk mencegah hibernasi; batas gratis 13.000 GB-s/hari > 24 jam × 128 MB, jadi aman berapa pun lamanya */
    if (this.hangat) clearTimeout(this.hangat);
    this.hangat = setTimeout(() => { this.hangat = null; }, 30000);
    return this.mesin;
  }

  async ambilFoto(id) { return this.siapkan(this.mesin ? this.mesin.asalFoto : '').ambilFoto(id); }
  async ambilDokumen(token) { const m = this.siapkan(this.mesin ? this.mesin.asalFoto : ''); return m.fns.ambilDokumenPublik_(token) || null; }

  /** RPC dari Worker. Mengembalikan teks JSON persis format Apps Script. */
  async tangani(path, body, asal) {
    const m = this.siapkan(asal);
    if (path.startsWith('/admin/')) return this.admin(path, body, m);
    let b;
    try { b = JSON.parse(body || '{}'); } catch (e) { return JSON.stringify({ ok: false, error: 'Badan permintaan bukan JSON' }); }
    const t0 = Date.now();
    const teks = m.panggil(b.fn, b.args || [], b.idKlien);
    console.log('[ipc]', b.fn, Date.now() - t0, 'ms', teks.length, 'B');
    return teks;
  }

  async admin(path, body, m) {
    try {
      if (path === '/admin/ekspor') return JSON.stringify({ ok: true, data: m.eksporSemua() });
      if (path === '/admin/impor') {
        const data = JSON.parse(body);
        if (!data || typeof data !== 'object' || !data.Master_Item) throw new Error('Data impor tidak valid (butuh objek {sheet: rows}).');
        return JSON.stringify({ ok: true, data: m.imporSemua(data) });
      }
      if (path === '/admin/backup') return JSON.stringify({ ok: true, data: await this.backup() });
      if (path === '/admin/info') {
        const sheets = {};
        Object.keys(m.SS.sheets).forEach((n) => { sheets[n] = m.SS.sheets[n].rows.length - 1; });
        const chunk = m.sql.exec('SELECT COUNT(*) AS n FROM chunk').toArray()[0].n;
        return JSON.stringify({ ok: true, data: { versi: m.vars.APP.versi, sheets, chunk, foto: m.statistikFoto(), skema: m.props.get('SKEMA_VERSI'), backupTerakhir: m.props.get('BACKUP_TERAKHIR') || '' } });
      }
      if (path === '/admin/daftarBackup') {
        const l = await this.env.BACKUP.list({ prefix: 'backup/' });
        return JSON.stringify({ ok: true, data: l.keys.map((k) => k.name).sort().reverse() });
      }
      if (path === '/admin/ambilBackup') {
        const b = JSON.parse(body || '{}');
        const teks = await this.env.BACKUP.get(String(b.key || ''));
        if (teks === null) throw new Error('Backup tidak ada: ' + b.key);
        return teks;
      }
      if (path === '/admin/jalankan') {           // fungsi pemeliharaan yang di Apps Script dijalankan dari editor (resetUntukGoLive, seedUlangMaster, migrasiSkema)
        const b = JSON.parse(body || '{}');
        const boleh = { resetUntukGoLive: 1, seedUlangMaster: 1, migrasiSkema: 1, setupSistem: 1, hitungUlangHpp: 1, hapusTransaksiSebelum: 1 };
        if (!boleh[b.fn]) throw new Error('Fungsi tidak diizinkan: ' + b.fn);
        let hasil = m.fns[b.fn].apply(null, b.args || []);
        if (b.fn === 'hapusTransaksiSebelum' || b.fn === 'resetUntukGoLive') hasil = Object.assign({}, hasil || {}, { foto: m.bersihkanFotoYatim() });
        m.simpan();
        return JSON.stringify({ ok: true, data: hasil === undefined ? null : hasil });
      }
      throw new Error('Rute admin tidak dikenal');
    } catch (e) {
      m.simpan();
      return JSON.stringify({ ok: false, error: (e && e.message) || String(e) });
    }
  }

  /** Backup seluruh database (JSON) ke Workers KV: backup/IPC Backup YYYY-MM-DD HH.mm.json, kedaluwarsa otomatis 35 hari. */
  async backup() {
    const m = this.siapkan(this.mesin ? this.mesin.asalFoto : '');
    if (!this.env.BACKUP) throw new Error('KV backup belum dipasang.');
    const nama = 'IPC Backup ' + m.stempel();
    const key = 'backup/' + nama + '.json';
    await this.env.BACKUP.put(key, JSON.stringify({ versi: m.vars.APP.versi, waktu: new Date().toISOString(), data: m.eksporSemua() }), { expirationTtl: 35 * 86400 });
    const daftar = await this.env.BACKUP.list({ prefix: 'backup/' });
    m.props.set('BACKUP_TERAKHIR', nama);
    m.props.set('BACKUP_JUMLAH', String(daftar.keys.length));
    m.props.set('BACKUP_TERPASANG', 'YA');
    try { m.fns.catatLog_('BACKUP', nama, daftar.keys.length + ' salinan'); m.simpan(); } catch (e) {}
    m.bersihkanIdem();
    return nama;
  }
}


/* ================= v12: halaman dokumen (invoice / PO) ================= */
function esc(v) { return String(v === undefined || v === null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function rp(n) { n = Math.round(Number(n) || 0); return 'Rp ' + n.toLocaleString('id-ID'); }
function kg(n) { n = Number(n) || 0; return n.toLocaleString('id-ID', { maximumFractionDigits: 3 }); }
function tglId(s) {
  if (!s) return '';
  const d = new Date(String(s).slice(0, 10) + 'T00:00:00');
  if (isNaN(d)) return String(s);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function halamanDokumen(d) {
  const css = `*{box-sizing:border-box}body{margin:0;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#111;background:#f3f4f6}
  .bar{position:sticky;top:0;background:#0f766e;color:#fff;padding:10px 14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .bar b{flex:1}.bar button{background:#fff;color:#0f766e;border:0;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer;font-size:14px}
  .sheet{background:#fff;max-width:800px;margin:16px auto;padding:28px 32px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
  h1{font-size:24px;margin:0 0 2px;letter-spacing:.5px}.kop{display:flex;justify-content:space-between;gap:16px;border-bottom:3px solid #0f766e;padding-bottom:12px;margin-bottom:16px}
  .kop .p{font-size:12.5px;color:#374151;white-space:pre-line}.meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;font-size:13px}
  .meta .k{color:#6b7280;font-size:11.5px;text-transform:uppercase;letter-spacing:.4px}.meta .v{font-weight:600;white-space:pre-line}
  table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:8px 6px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}
  th{background:#f9fafb;font-size:11.5px;text-transform:uppercase;letter-spacing:.4px;color:#374151}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  tfoot td{font-weight:700;border-top:2px solid #111;border-bottom:0}.small{font-size:11.5px;color:#6b7280}.catatan{margin-top:18px;font-size:12.5px;white-space:pre-line;color:#374151}
  .ttd{display:flex;justify-content:space-between;margin-top:40px;font-size:12.5px}.ttd div{width:40%;text-align:center}.ttd .garis{border-top:1px solid #111;margin-top:56px;padding-top:4px}
  .batal{max-width:600px;margin:60px auto;background:#fff;padding:32px;text-align:center;border-radius:12px}
  @media print{body{background:#fff}.bar{display:none}.sheet{box-shadow:none;margin:0;max-width:none;padding:0}@page{margin:14mm}}`;
  if (!d) return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dokumen tidak ditemukan</title><style>${css}</style></head><body><div class="batal"><h2>Dokumen tidak ditemukan</h2><p>Link salah atau dokumen sudah dihapus.</p></div></body></html>`;
  if (d.dibatalkan) return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dokumen dibatalkan</title><style>${css}</style></head><body><div class="batal"><h2>${esc(d.nomor)} sudah dibatalkan</h2><p>Minta dokumen yang baru ke pengirim.</p></div></body></html>`;
  const inv = d.jenis === 'INVOICE', judul = inv ? 'INVOICE' : 'PURCHASE ORDER', per = d.perusahaan || {}, pihak = d.pihak || {};
  const adaBal = (d.baris || []).some((b) => b.bal > 0), adaUkuran = (d.baris || []).some((b) => b.ukuran);
  const baris = (d.baris || []).map((b, i) => `<tr><td>${i + 1}</td><td>${esc(b.nama)}${b.ukuran ? `<div class="small">Ukuran ${esc(b.ukuran)}</div>` : ''}${b.spesifikasi ? `<div class="small">${esc(b.spesifikasi)}</div>` : ''}</td>` +
    (adaBal ? `<td class="n">${kg(b.bal)}</td>` : '') + `<td class="n">${kg(b.qty)}</td><td class="n">${rp(b.harga)}</td><td class="n">${rp(b.nilai)}</td></tr>`).join('');
  const meta = inv
    ? [['Nomor invoice', d.nomor], ['Tanggal', tglId(d.tanggal)], ['Referensi SO', d.ref], ['Tanggal kirim', tglId(d.tanggalKirim)], ['Termin (TOP)', d.topHari ? d.topHari + ' hari' : 'Tunai'], ['Jatuh tempo', tglId(d.jatuhTempo)]]
    : [['Nomor PO', d.nomor], ['Tanggal', tglId(d.tanggal)], ['Perkiraan datang', tglId(d.perkiraanDatang)], ['Termin (TOP)', d.topHari ? d.topHari + ' hari' : 'Tunai'], ['Jatuh tempo', tglId(d.jatuhTempo)]];
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(judul)} ${esc(d.nomor)} — ${esc(per.nama || '')}</title><style>${css}</style></head><body>
<div class="bar"><b>${esc(judul)} ${esc(d.nomor)}</b><button onclick="window.print()">⬇ Simpan PDF / Cetak</button></div>
<div class="sheet">
  <div class="kop"><div><h1>${esc(per.nama || 'H-Plast')}</h1><div class="p">${esc([per.alamat, per.telp, per.email].filter(Boolean).join('\n'))}</div></div>
    <div style="text-align:right"><div style="font-size:20px;font-weight:800;color:#0f766e">${esc(judul)}</div><div class="small">${esc(d.nomor)}</div></div></div>
  <div class="meta"><div><div class="k">${esc(pihak.label || (inv ? 'Customer' : 'Supplier'))}</div><div class="v">${esc(pihak.nama || '')}</div></div>
    <div>${meta.filter((m) => m[1]).map((m) => `<div class="k">${esc(m[0])}</div><div class="v">${esc(m[1])}</div>`).join('')}</div></div>
  <table><thead><tr><th>#</th><th>Item</th>${adaBal ? '<th class="n">Bal</th>' : ''}<th class="n">Kg</th><th class="n">Harga / kg</th><th class="n">Jumlah</th></tr></thead>
  <tbody>${baris}</tbody>
  <tfoot><tr><td colspan="2">Total${adaBal ? ` <span class="small">(1 bal = ${kg(d.kgPerBal)} kg)</span>` : ''}</td>${adaBal ? `<td class="n">${kg(d.totalBal)}</td>` : ''}<td class="n">${kg(d.totalKg)}</td><td></td><td class="n">${rp(d.total)}</td></tr></tfoot></table>
  ${inv && per.bank ? `<div class="catatan"><b>Pembayaran</b>\n${esc(per.bank)}</div>` : ''}
  ${d.catatan ? `<div class="catatan">${esc(d.catatan)}</div>` : ''}
  ${d.catatanBawah ? `<div class="catatan small">${esc(d.catatanBawah)}</div>` : ''}
  <div class="ttd"><div><div class="garis">${esc(per.nama || '')}<br><span class="small">${esc(d.dibuatOleh || '')}</span></div></div><div><div class="garis">${esc(pihak.nama || '')}</div></div></div>
  <div class="small" style="margin-top:24px">Dibuat ${esc(d.waktu || '')} · ${esc(judul.toLowerCase())} tanpa PPN</div>
</div></body></html>`;
}
