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
        const boleh = { resetUntukGoLive: 1, seedUlangMaster: 1, migrasiSkema: 1, setupSistem: 1, hitungUlangHpp: 1 };
        if (!boleh[b.fn]) throw new Error('Fungsi tidak diizinkan: ' + b.fn);
        const hasil = m.fns[b.fn].apply(null, b.args || []);
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
