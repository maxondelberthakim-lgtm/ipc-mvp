/* ============================================================
   Mesin IPC — menjalankan logika backend (.gs, tidak diubah) di atas
   penyimpanan SQLite (Durable Object) atau node:sqlite (tes).

   Model data: setiap "sheet" = array baris di memori (cepat, semua
   perhitungan stok/FIFO berjalan seperti di Apps Script). Baris disimpan
   ke SQLite dalam potongan (chunk) 64 baris — satu baris SQLite per
   potongan, supaya memuat 1 tahun data hanya ratusan baris SQLite
   (kuota gratis: 5 juta baris dibaca / hari), dan tiap simpan hanya
   menulis 1 potongan.
   ============================================================ */
import { pasangBackend } from './backend.js';
import { buatLayanan, formatDate } from './shim.js';

export const CHUNK = 64;
const TTL_IDEM_DETIK = 600;

function keJson(rows) {
  return JSON.stringify(rows, function (k, v) {
    const asli = this[k];
    if (asli instanceof Date) return isNaN(asli.getTime()) ? '' : { $d: asli.getTime() };
    if (v === undefined) return '';
    return v;
  });
}
function dariJson(teks) {
  return JSON.parse(teks, (k, v) => (v && typeof v === 'object' && v.$d !== undefined) ? new Date(v.$d) : v);
}

export class Mesin {
  /**
   * @param {object} o
   * @param {{exec:Function}} o.sql   SqlStorage (DO) atau pembungkus node:sqlite dengan exec(q, ...p) -> {toArray()}
   * @param {string} [o.asalFoto]  asal URL Worker untuk tautan foto (https://…workers.dev)
   */
  constructor(o) {
    this.sql = o.sql;
    this.log = o.log || (() => {});
    this.kotor = new Map();            // sheet -> Set(chunk) | 'SEMUA'
    this.asalFoto = o.asalFoto || '';
    this.sql.exec('CREATE TABLE IF NOT EXISTS chunk (sheet TEXT NOT NULL, i INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY (sheet, i))');
    this.sql.exec('CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS idem (id TEXT PRIMARY KEY, teks TEXT NOT NULL, exp INTEGER NOT NULL)');
    /* foto bukti disimpan di SQLite DO juga (5 GB gratis, tanpa kartu kredit) — bukan R2 */
    this.sql.exec('CREATE TABLE IF NOT EXISTS foto (id TEXT PRIMARY KEY, mime TEXT NOT NULL, data BLOB NOT NULL, ukuran INTEGER NOT NULL, waktu INTEGER NOT NULL)');

    const props = {
      get: (k) => { const r = this.sql.exec('SELECT v FROM meta WHERE k = ?', 'prop:' + k).toArray(); return r.length ? r[0].v : undefined; },
      set: (k, v) => { this.sql.exec('INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?)', 'prop:' + k, String(v)); },
      delete: (k) => { this.sql.exec('DELETE FROM meta WHERE k = ?', 'prop:' + k); }
    };
    const cache = {
      get: (k) => { const r = this.sql.exec('SELECT teks FROM idem WHERE id = ? AND exp > ?', k, Date.now()).toArray(); return r.length ? r[0].teks : null; },
      put: (k, teks, ttl) => { this.sql.exec('INSERT OR REPLACE INTO idem (id, teks, exp) VALUES (?, ?, ?)', k, teks, Date.now() + (ttl || TTL_IDEM_DETIK) * 1000); }
    };
    const jadwal = {
      ada: () => props.get('BACKUP_TERPASANG') === 'YA',
      pasang: () => props.set('BACKUP_TERPASANG', 'YA'),
      hapus: () => props.delete('BACKUP_TERPASANG')
    };
    const foto = {
      simpan: (bytes, mime) => {
        const id = (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : 'f' + Date.now() + Math.random().toString(36).slice(2)).replace(/-/g, '');
        if (!(bytes instanceof Uint8Array)) bytes = new Uint8Array(bytes || []);
        if (bytes.length > 1900000) throw new Error('Foto terlalu besar (maks 1,9 MB).');
        this.sql.exec('INSERT INTO foto (id, mime, data, ukuran, waktu) VALUES (?, ?, ?, ?, ?)', id, mime || 'image/jpeg', bytes, bytes.length, Date.now());
        return { url: this.asalFoto + '/foto/' + id + '.jpg', id };
      }
    };
    const hooks = {
      tulis: (n, a, b) => this.tandai(n, a, b),
      struktur: (n) => { this.kotor.set(n, 'SEMUA'); if (this.be) this.be.fns.lupakanMemo_(n); }
    };
    const { G, SS } = buatLayanan({ hooks, props, cache, foto, jadwal, email: o.email || '' });
    Object.assign(G, o.layananTambahan || {});   // mis. tiruan Sheets API di tes
    this.SS = SS;
    this.G = G;
    this.props = props;
    this.muat();
    this.be = pasangBackend(G);
    if (o.sebelumSetup) o.sebelumSetup(this.be, G);
    this.fns = this.be.fns;
    this.vars = this.be.vars();
    this.kotor.clear();
    /* pastikan skema (sheet + header + setting bawaan); migrasi versi berjalan otomatis */
    if (!Object.keys(SS.sheets).length) this.fns.setupSistem();
    else this.fns.pastikanSkema_();
    this.simpan();
  }

  tandai(nama, r1, r2) {
    const s = this.kotor.get(nama);
    if (s === 'SEMUA') return;
    const set = s || new Set();
    for (let i = Math.floor((r1 - 1) / CHUNK); i <= Math.floor((r2 - 1) / CHUNK); i++) set.add(i);
    this.kotor.set(nama, set);
    if (this.be) this.be.fns.lupakanMemo_(nama);     // memo baca per-sheet tidak boleh basi
  }

  muat() {
    const t0 = Date.now();
    const rows = this.sql.exec('SELECT sheet, i, data FROM chunk ORDER BY sheet, i').toArray();
    const per = {};
    let n = 0;
    for (const r of rows) {
      const arr = dariJson(r.data);
      (per[r.sheet] = per[r.sheet] || []).push(...arr);
      n += arr.length;
    }
    Object.keys(per).forEach((nama) => this.SS.muat(nama, per[nama]));
    this.log('muat', { sheet: Object.keys(per).length, chunk: rows.length, baris: n, ms: Date.now() - t0 });
  }

  /* tulis potongan yang berubah ke SQLite */
  simpan() {
    let ditulis = 0;
    for (const [nama, k] of this.kotor) {
      const sh = this.SS.sheets[nama];
      if (!sh) { this.sql.exec('DELETE FROM chunk WHERE sheet = ?', nama); continue; }
      const rows = sh.rows, jml = Math.ceil(rows.length / CHUNK);
      const idx = k === 'SEMUA' ? Array.from({ length: jml }, (_, i) => i) : Array.from(k).filter((i) => i < jml);
      for (const i of idx) {
        this.sql.exec('INSERT OR REPLACE INTO chunk (sheet, i, data) VALUES (?, ?, ?)', nama, i, keJson(rows.slice(i * CHUNK, (i + 1) * CHUNK)));
        ditulis++;
      }
      this.sql.exec('DELETE FROM chunk WHERE sheet = ? AND i >= ?', nama, jml);
    }
    this.kotor.clear();
    return ditulis;
  }

  /** Sama persis dengan doPost() di Server.gs: daftar putih, idempotensi, format balasan. */
  panggil(fn, args, idKlien) {
    const out = { ok: false };
    let id = '';
    try {
      fn = String(fn || '');
      if (!this.vars.RPC_WL[fn]) throw new Error('Fungsi tidak dikenal: ' + fn);
      const f = this.fns[fn];
      if (typeof f !== 'function') throw new Error('Fungsi tidak tersedia: ' + fn);
      id = String(idKlien || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
      if (id) { const ada = this.G.CacheService.getScriptCache().get('rq:' + id); if (ada) return ada; }
      out.ok = true;
      out.data = fn === 'statusBackup' ? this.statusBackup(args[0]) : f.apply(null, args || []);
    } catch (err) {
      out.ok = false;
      out.error = (err && err.message) ? err.message : String(err);
    }
    const teks = JSON.stringify(out);
    try { this.simpan(); } catch (e) { this.log('simpan-gagal', String(e)); return JSON.stringify({ ok: false, error: 'Gagal menyimpan: ' + e }); }
    if (id && out.ok && teks.length < 90000) { try { this.G.CacheService.getScriptCache().put('rq:' + id, teks, TTL_IDEM_DETIK); } catch (x) {} }
    return teks;
  }

  /* backup harian → R2 (menggantikan salinan Sheet di Drive) */
  statusBackup(ident) {
    const u = this.fns.penggunaSaatIni_(ident);
    if (!this.fns.bolehReview_(u)) throw new Error('Hanya Supervisor / Admin.');
    return {
      terpasang: true, terakhir: this.props.get('BACKUP_TERAKHIR') || '',
      jumlah: parseInt(this.props.get('BACKUP_JUMLAH') || '0', 10), simpan: this.vars.SIMPAN_BACKUP_
    };
  }

  /** Seluruh database sebagai objek {sheet: rows} (untuk backup / ekspor / impor). */
  eksporSemua() {
    const o = {};
    Object.keys(this.SS.sheets).forEach((n) => { o[n] = this.SS.sheets[n].rows; });
    return o;
  }
  /** Ganti seluruh isi database (impor dari Google Sheet lama). rows[0] = header. */
  imporSemua(data) {
    Object.keys(this.SS.sheets).forEach((n) => { delete this.SS.sheets[n]; this.kotor.set(n, 'SEMUA'); });
    const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/;
    Object.keys(data).forEach((n) => {
      const rows = (data[n] || []).map((r) => (r || []).map((v) => (v === null || v === undefined) ? '' : v));
      const head = rows[0] || [];
      /* kolom Waktu* (dan sel apa pun berbentuk ISO 8601) kembali jadi Date; kolom Tanggal tetap teks YYYY-MM-DD */
      const kolomW = head.map((h, i) => /^Waktu/.test(String(h)) ? i : -1).filter((i) => i >= 0);
      const kolomT = head.map((h, i) => /^(Tanggal|Tanggal_Invoice|Perkiraan_Datang|Tanggal_Kirim|Tanggal_Terima)$/.test(String(h)) ? i : -1).filter((i) => i >= 0);
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        kolomW.forEach((c) => { if (typeof r[c] === 'string' && ISO.test(r[c])) r[c] = new Date(r[c]); });
        kolomT.forEach((c) => { if (typeof r[c] === 'string' && ISO.test(r[c])) r[c] = this.fns.tglStr_(new Date(r[c])); });
      }
      this.SS.muat(n, rows); this.kotor.set(n, 'SEMUA');
    });
    this.fns.lupakanMemo_();
    this.fns.pastikanSkema_();
    this.simpan();
    return Object.keys(this.SS.sheets).map((n) => n + ':' + Math.max(0, this.SS.sheets[n].rows.length - 1));
  }
  bersihkanIdem() { this.sql.exec('DELETE FROM idem WHERE exp < ?', Date.now()); }
  ambilFoto(id) {
    const r = this.sql.exec('SELECT mime, data FROM foto WHERE id = ?', String(id)).toArray();
    if (!r.length) return null;
    const d = r[0].data;
    return { mime: r[0].mime, data: d instanceof Uint8Array ? d : new Uint8Array(d) };
  }
  statistikFoto() { const r = this.sql.exec('SELECT COUNT(*) AS n, COALESCE(SUM(ukuran),0) AS b FROM foto').toArray()[0]; return { jumlah: r.n, byte: r.b }; }
  stempel() { return formatDate(new Date(), this.vars.APP.zona, 'yyyy-MM-dd HH.mm'); }
}
