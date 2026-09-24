/* Simulasi lingkungan Apps Script agar logika bisa diuji di Node */
/* IPC_HARNESS=cf → suite yang sama dijalankan di atas mesin Cloudflare (cloudflare/src/mesin.js + SQLite) */
if (process.env.IPC_HARNESS === 'cf') { module.exports = require(__dirname + '/harness-cf.js').baru({ email: /harness\.js$/.test(__filename) ? 'pemilik@contoh' + '.co.id' : '' }); return; }
function otoTanggal_(v){ return (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) ? new Date(v + 'T00:00:00') : v; }
const fs = require('fs');
const vm = require('vm');
const path = require('path');

/* ---- in-memory spreadsheet ---- */
function makeSheet(name){
  return {
    name, rows: [],   // rows[0] = header
    getLastRow(){ return this.rows.length; },
    getMaxColumns(){ return this.rows[0] ? this.rows[0].length : 26; },
    deleteColumns(){}, insertColumnsAfter(){},
    /* v9: migrasi menghapus kolom Stok_Awal_GP & mengganti nama sheet Transfer */
    deleteColumn(c){ this.rows.forEach(r=>{ if (r.length>=c) r.splice(c-1,1); }); },
    setName(n){ delete SS.sheets[this.name]; this.name=n; SS.sheets[n]=this; },
    setFrozenRows(){}, autoResizeColumns(){},
    /* Sheets mengubah teks 'YYYY-MM-DD' jadi Date otomatis -> tiru supaya bug normalisasi tanggal ketahuan di test */
    appendRow(r){ this.rows.push(r.map(otoTanggal_)); },
    deleteRow(n){ this.rows.splice(n-1,1); },
    deleteRows(n,k){ this.rows.splice(n-1,k||1); },
    getRange(r,c,nr,nc){
      const sh=this;
      nr = nr||1; nc = nc||1;
      return {
        setValues(vals){
          for(let i=0;i<vals.length;i++){
            const ri=r-1+i;
            while(sh.rows.length<=ri) sh.rows.push([]);
            for(let j=0;j<vals[i].length;j++) sh.rows[ri][c-1+j]=otoTanggal_(vals[i][j]);
          }
          return this;
        },
        getValues(){
          const out=[];
          for(let i=0;i<nr;i++){
            const row=sh.rows[r-1+i]||[];
            const o=[]; for(let j=0;j<nc;j++) o.push(row[c-1+j]===undefined?'':row[c-1+j]);
            out.push(o);
          }
          return out;
        },
        setValue(v){
          const ri=r-1; while(sh.rows.length<=ri) sh.rows.push([]);
          sh.rows[ri][c-1]=v; return this;
        },
        setFontWeight(){return this}, setBackground(){return this}, setFontColor(){return this}
      };
    }
  };
}

const SS = {
  sheets:{},
  getId(){ return 'SS1'; },
  getSheets(){ return Object.keys(this.sheets).map(n=>({ getName:()=>n })); },
  getSheetByName(n){ return this.sheets[n]||null; },
  insertSheet(n){ this.sheets[n]=makeSheet(n); return this.sheets[n]; },
  setSpreadsheetTimeZone(){}
};

const ctx = {
  console,
  SpreadsheetApp:{ getActiveSpreadsheet(){ return SS; } },
  /* mock Sheets API v4 batchGet: nilai Date -> serial (zona lokal), string/angka apa adanya, sel kosong di ujung dibuang */
  Sheets:{ Spreadsheets:{ Values:{ batchGet(id, opt){
    ctx.__batchCalls = (ctx.__batchCalls||0) + 1;
    return { valueRanges: opt.ranges.map(rg=>{
      const n = rg.replace(/^'|'$/g,''); const sh = SS.sheets[n]; const rows = sh ? sh.rows : [];
      const values = rows.map(r=>{ const o = r.map(v=>{
          if (Object.prototype.toString.call(v)==='[object Date]') return (v.getTime() - v.getTimezoneOffset()*60000)/86400000 + 25569;
          return v===undefined||v===null ? '' : v; });
        while (o.length && o[o.length-1]==='') o.pop(); return o; });
      return { range: rg, values };
    }) };
  } } } },
  Session:{ getActiveUser(){ return { getEmail(){ return 'pemilik@contoh.co.id'; } }; } },
  LockService:{ getScriptLock(){ return { waitLock(){}, releaseLock(){} }; } },
  DriveApp:{
    Access:{ANYONE_WITH_LINK:'a'}, Permission:{VIEW:'v'},
    getFoldersByName(){ return { hasNext(){return false;} }; },
    createFolder(n){ return { getId:()=>'FOLDER123', getUrl:()=>'https://drive/FOLDER123' }; },
    getFolderById(id){ return { getId:()=>id, getUrl:()=>'https://drive/'+id,
      createFile:(b)=>({getUrl:()=>'https://drive/file',getId:()=>'FILE1'}) }; }
  },
  Utilities:{
    formatDate(d, tz, fmt){
      const p=(n,l=2)=>String(n).padStart(l,'0');
      return fmt.replace('yyyy',d.getFullYear()).replace('yy',String(d.getFullYear()).slice(2))
        .replace('MMM',['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()])
        .replace('MM',p(d.getMonth()+1)).replace('dd',p(d.getDate()))
        .replace('HH',p(d.getHours())).replace('mm',p(d.getMinutes())).replace('ss',p(d.getSeconds())).replace('SSS',p(d.getMilliseconds(),3))
        .replace(/(^|[^+-])Z$/, (m,a)=>{ const off=-d.getTimezoneOffset(); const s=off<0?'-':'+'; const ao=Math.abs(off); return a+s+p(Math.floor(ao/60))+p(ao%60); });
    },
    getUuid(){ return 'uuid'; },
    base64Decode(){ return []; },
    newBlob(){ return {}; }
  },
  HtmlService:{}, DocumentApp:{}
};
vm.createContext(ctx);

['Config.gs','Server.gs','Media.gs','Pembelian.gs','Penjualan.gs','DaurUlang.gs'].forEach(f=>{
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script', f), 'utf8'), ctx, {filename:f});
});
// tes memakai master data contoh (kacang) — deploy sungguhan memakai DUMMY_ITEM di Config.gs
vm.runInContext(fs.readFileSync(path.join(__dirname, 'fixture-master.js'), 'utf8'), ctx, {filename:'fixture-master.js'});

module.exports = { ctx, SS };
