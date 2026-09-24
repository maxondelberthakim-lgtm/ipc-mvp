/* Harness alternatif: menjalankan suite tes yang sama di atas mesin Cloudflare
   (cloudflare/src/mesin.js + SQLite sungguhan lewat node:sqlite).
   Dipakai bila IPC_HARNESS=cf (lihat harness.js). Mengembalikan {ctx, SS} dengan bentuk
   yang sama seperti harness vm, jadi 7 suite tes berjalan tanpa diubah. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { DatabaseSync } = require('node:sqlite');

function bungkusSql(db) {
  /* meniru SqlStorage.exec(query, ...params) -> { toArray() } milik Durable Object */
  return {
    exec(q, ...p) {
      const st = db.prepare(q);
      if (/^\s*(SELECT|PRAGMA)/i.test(q)) { const rows = st.all(...p); return { toArray: () => rows }; }
      st.run(...p); return { toArray: () => [] };
    }
  };
}

function baru(opsi) {
  opsi = opsi || {};
  const db = new DatabaseSync(':memory:');
  const sql = bungkusSql(db);
  /* mesin.js & shim.js adalah ES module; muat secara sinkron lewat transpile ringan (import -> require) */
  const M = muatEsm(path.join(__dirname, '..', 'cloudflare', 'src', 'mesin.js'));
  M.formatDate = muatEsm(path.join(__dirname, '..', 'cloudflare', 'src', 'shim.js')).formatDate;
  const ekstra = {};
  let mesin = null;
  /* Sheets API v4 tiruan (seperti harness.js) supaya jalur batchGet ikut teruji */
  const Sheets = { Spreadsheets: { Values: { batchGet(id, opt) {
    ekstra.__batchCalls = (ekstra.__batchCalls || 0) + 1;
    return { valueRanges: opt.ranges.map((rg) => {
      const n = rg.replace(/^'|'$/g, ''); const sh = mesin.SS.sheets[n]; const rows = sh ? sh.rows : [];
      const values = rows.map((r) => { const o = r.map((v) => {
        if (Object.prototype.toString.call(v) === '[object Date]') { const z = M.formatDate(v, 'Asia/Jakarta', 'Z'); const off = (z[0] === '-' ? -1 : 1) * (parseInt(z.slice(1, 3), 10) * 60 + parseInt(z.slice(3, 5), 10)) * 60000; return (v.getTime() + off) / 86400000 + 25569; }
        return v === undefined || v === null ? '' : v; });
        while (o.length && o[o.length - 1] === '') o.pop(); return o; });
      return { range: rg, values };
    }) };
  } } } };
  mesin = new M.Mesin({
    sql, asalFoto: 'https://api.test', email: opsi.email || '',
    layananTambahan: opsi.tanpaSheets ? {} : { Sheets },
    /* master contoh (kacang) seperti harness vm: fixture-master.js menimpa DUMMY_* sebelum setupSistem */
    sebelumSetup(be) {
      const v = be.vars();
      const c = { KATEGORI_ITEM: v.KATEGORI_ITEM, PERAN: v.PERAN, SHEET: v.SHEET };
      vm.createContext(c);
      vm.runInContext(fs.readFileSync(path.join(__dirname, 'fixture-master.js'), 'utf8'), c, { filename: 'fixture-master.js' });
      const o = {}; ['DUMMY_ITEM', 'DUMMY_SUPPLIER', 'DUMMY_CUSTOMER', 'DUMMY_PENGGUNA', 'DUMMY_STANDAR', 'DEFAULT_SETTING'].forEach((k) => { if (c[k]) o[k] = c[k]; });
      be.atur(o);
    }
  });
  const G = mesin.G;
  const ctx = new Proxy(ekstra, {
    get(t, k) {
      if (k in t) return t[k];
      if (k in mesin.fns) return mesin.fns[k];
      if (k in G) return G[k];
      if (k === 'SS') return mesin.SS;
      if (k === '__mesin') return mesin;
      return mesin.be.vars()[k];
    },
    set(t, k, v) {
      if (k in G && v && typeof v === 'object' && typeof G[k] === 'object') { Object.assign(G[k], v); return true; }   // ctx.CacheService = {...} → ubah objek yang sama
      if (k in mesin.be.vars()) { const o = {}; o[k] = v; mesin.be.atur(o); return true; }
      t[k] = v; return true;
    },
    has(t, k) { return k in t || k in mesin.fns || k in G; }
  });
  return { ctx, SS: mesin.SS, mesin, db };
}

/* memuat ES module secara sinkron: ubah import/export jadi CommonJS di memori */
const MODUL = {};
function muatEsm(file) {
  if (MODUL[file]) return MODUL[file];
  let src = fs.readFileSync(file, 'utf8');
  src = src.replace(/^import\s+\{([^}]+)\}\s+from\s+'([^']+)';?/gm, (m, names, rel) => `const {${names}} = require(${JSON.stringify(path.join(path.dirname(file), rel))});`);
  src = src.replace(/^export\s+(const|function|class)\s+([A-Za-z_$][\w$]*)/gm, (m, kind, name) => { (MODUL[file + ':exports'] = MODUL[file + ':exports'] || []).push(name); return `${kind} ${name}`; });
  const exportsList = MODUL[file + ':exports'] || [];
  const wrapper = `(function (require, module, exports) { ${src}\n module.exports = { ${exportsList.join(', ')} }; })`;
  const fn = vm.runInThisContext(wrapper, { filename: file });
  const mod = { exports: {} };
  fn((rel) => muatEsm(rel), mod, mod.exports);
  MODUL[file] = mod.exports;
  return mod.exports;
}

module.exports = { baru, muatEsm };
