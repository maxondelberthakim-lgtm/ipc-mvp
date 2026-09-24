/* ============================================================
   Pengganti layanan Apps Script untuk Cloudflare Workers / Node.
   Spreadsheet = array baris di memori; setiap perubahan dilaporkan
   lewat hooks supaya lapisan penyimpanan (SQLite Durable Object)
   bisa menyimpannya. Logika bisnis (.gs) tidak tahu bedanya.
   ============================================================ */

/* ---- tanggal dalam zona waktu tertentu (Intl) ---- */
const FMT_CACHE = {};
function bagianTanggal(d, tz) {
  let f = FMT_CACHE[tz];
  if (!f) {
    f = FMT_CACHE[tz] = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'longOffset'
    });
  }
  const o = {};
  for (const p of f.formatToParts(d)) o[p.type] = p.value;
  if (o.hour === '24') o.hour = '00';
  let off = '+0000';
  const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(o.timeZoneName || '');
  if (m) off = m[1] + String(m[2]).padStart(2, '0') + (m[3] || '00');
  return { y: o.year, M: o.month, d: o.day, H: o.hour, m: o.minute, s: o.second, S: String(d.getMilliseconds()).padStart(3, '0'), Z: off };
}
const BLN_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function formatDate(d, tz, fmt) {
  d = d instanceof Date ? d : new Date(d);
  if (isNaN(d.getTime())) throw new Error('Tanggal tidak valid');
  const p = bagianTanggal(d, tz || 'UTC');
  return String(fmt).replace(/yyyy|yy|MMM|MM|dd|HH|mm|ss|SSS|Z/g, (t) => ({
    yyyy: p.y, yy: p.y.slice(2), MMM: BLN_EN[parseInt(p.M, 10) - 1], MM: p.M, dd: p.d,
    HH: p.H, mm: p.m, ss: p.s, SSS: p.S, Z: p.Z
  })[t]);
}

/* ---- spreadsheet di memori ---- */
export function buatSpreadsheet(hooks) {
  hooks = hooks || {};
  const tulis = (n, a, b) => { if (hooks.tulis) hooks.tulis(n, a, b); };
  const struktur = (n) => { if (hooks.struktur) hooks.struktur(n); };

  function makeSheet(name, rows) {
    const sh = {
      name, rows: rows || [],
      getName() { return this.name; },
      getLastRow() { return this.rows.length; },
      getMaxColumns() { return this.rows[0] ? this.rows[0].length : 26; },
      deleteColumns() {}, insertColumnsAfter() {}, setFrozenRows() {}, autoResizeColumns() {},
      deleteColumn(c) { this.rows.forEach((r) => { if (r.length >= c) r.splice(c - 1, 1); }); struktur(this.name); },
      setName(n) { const lama = this.name; delete SS.sheets[lama]; this.name = n; SS.sheets[n] = this; struktur(lama); struktur(n); },
      appendRow(r) { this.rows.push(r.slice()); tulis(this.name, this.rows.length, this.rows.length); },
      deleteRow(n) { this.rows.splice(n - 1, 1); struktur(this.name); },
      deleteRows(n, k) { this.rows.splice(n - 1, k || 1); struktur(this.name); },
      getRange(r, c, nr, nc) {
        const s = this; nr = nr || 1; nc = nc || 1;
        return {
          setValues(vals) {
            for (let i = 0; i < vals.length; i++) {
              const ri = r - 1 + i;
              while (s.rows.length <= ri) s.rows.push([]);
              for (let j = 0; j < vals[i].length; j++) s.rows[ri][c - 1 + j] = vals[i][j];
            }
            tulis(s.name, r, r + vals.length - 1);
            return this;
          },
          getValues() {
            const out = [];
            for (let i = 0; i < nr; i++) {
              const row = s.rows[r - 1 + i] || [];
              const o = []; for (let j = 0; j < nc; j++) { const v = row[c - 1 + j]; o.push(v === undefined || v === null ? '' : v); }
              out.push(o);
            }
            return out;
          },
          getValue() { const row = s.rows[r - 1] || []; const v = row[c - 1]; return v === undefined || v === null ? '' : v; },
          setValue(v) {
            const ri = r - 1; while (s.rows.length <= ri) s.rows.push([]);
            s.rows[ri][c - 1] = v; tulis(s.name, r, r); return this;
          },
          setFontWeight() { return this; }, setBackground() { return this; }, setFontColor() { return this; }
        };
      }
    };
    return sh;
  }

  const SS = {
    sheets: {},
    getId() { return 'IPC-DB'; },
    getSheets() { return Object.keys(this.sheets).map((n) => this.sheets[n]); },
    getSheetByName(n) { return this.sheets[n] || null; },
    insertSheet(n) { this.sheets[n] = makeSheet(n); struktur(n); return this.sheets[n]; },
    setSpreadsheetTimeZone() {},
    /* dipakai lapisan penyimpanan untuk memuat ulang tanpa memicu hooks */
    muat(n, rows) { this.sheets[n] = makeSheet(n, rows); return this.sheets[n]; }
  };
  return SS;
}

/* ---- kumpulan layanan ---- */
export function buatLayanan(opt) {
  opt = opt || {};
  const SS = opt.SS || buatSpreadsheet(opt.hooks);
  const props = opt.props || new Map();            // PropertiesService (disimpan di meta oleh DO)
  const cache = opt.cache || {                     // CacheService (idempotensi) — default di memori
    get(k) { return null; }, put() {}
  };
  const foto = opt.foto || null;                   // { simpan(bytes, mime, nama) -> {url,id} }
  const jadwal = opt.jadwal || { ada() { return false; }, pasang() {}, hapus() {} };

  const Utilities = {
    formatDate,
    getUuid() { return (globalThis.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'u' + Math.random().toString(36).slice(2); },
    base64Decode(s) { const bin = atob(String(s)); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; },
    newBlob(bytes, mime, nama) { return { bytes, mime, nama, getBytes() { return bytes; }, getContentType() { return mime; }, getName() { return nama; } }; }
  };
  const folder = {
    getId() { return 'R2'; }, getUrl() { return ''; },
    createFile(blob) {
      if (!foto) throw new Error('Penyimpanan foto belum dipasang.');
      const r = foto.simpan(blob.bytes, blob.mime, blob.nama);
      return { getUrl() { return r.url; }, getId() { return r.id; }, setSharing() {} };
    },
    getFiles() { return { hasNext() { return false; } }; }
  };
  const DriveApp = {
    Access: { ANYONE_WITH_LINK: 'a' }, Permission: { VIEW: 'v' },
    getFoldersByName() { return { hasNext() { return true; }, next() { return folder; } }; },
    createFolder() { return folder; },
    getFolderById() { return folder; },
    getFileById() { throw new Error('Tidak didukung.'); }
  };
  const ScriptApp = {
    getProjectTriggers() { return jadwal.ada() ? [{ getHandlerFunction() { return 'backupHarian'; } }] : []; },
    deleteTrigger() { jadwal.hapus(); },
    newTrigger(nama) { return { timeBased() { return { everyDays() { return { atHour() { return { create() { jadwal.pasang(nama); } }; } }; } }; } }; }
  };
  const G = {
    console: opt.console || console,
    SpreadsheetApp: { getActiveSpreadsheet() { return SS; } },
    Session: { getActiveUser() { return { getEmail() { return opt.email || ''; } }; } },
    LockService: { getScriptLock() { return { waitLock() {}, tryLock() { return true; }, releaseLock() {} }; } },
    PropertiesService: { getScriptProperties() { return { getProperty(k) { const v = props.get(k); return v === undefined ? null : v; }, setProperty(k, v) { props.set(k, String(v)); }, deleteProperty(k) { props.delete(k); } }; } },
    CacheService: { getScriptCache() { return cache; } },
    Utilities, DriveApp, ScriptApp,
    HtmlService: {}, ContentService: {}, DocumentApp: {},
    Logger: { log() {} }
  };
  return { G, SS };
}
