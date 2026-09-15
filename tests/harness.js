/* Simulasi lingkungan Apps Script agar logika bisa diuji di Node */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

/* ---- in-memory spreadsheet ---- */
function makeSheet(name){
  return {
    name, rows: [],   // rows[0] = header
    getLastRow(){ return this.rows.length; },
    getMaxColumns(){ return this.rows[0] ? this.rows[0].length : 26; },
    deleteColumns(){},
    setFrozenRows(){}, autoResizeColumns(){},
    appendRow(r){ this.rows.push(r.slice()); },
    deleteRow(n){ this.rows.splice(n-1,1); },
    getRange(r,c,nr,nc){
      const sh=this;
      nr = nr||1; nc = nc||1;
      return {
        setValues(vals){
          for(let i=0;i<vals.length;i++){
            const ri=r-1+i;
            while(sh.rows.length<=ri) sh.rows.push([]);
            for(let j=0;j<vals[i].length;j++) sh.rows[ri][c-1+j]=vals[i][j];
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
  getSheetByName(n){ return this.sheets[n]||null; },
  insertSheet(n){ this.sheets[n]=makeSheet(n); return this.sheets[n]; },
  setSpreadsheetTimeZone(){}
};

const ctx = {
  console,
  SpreadsheetApp:{ getActiveSpreadsheet(){ return SS; } },
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
        .replace('HH',p(d.getHours())).replace('mm',p(d.getMinutes())).replace('ss',p(d.getSeconds()));
    },
    getUuid(){ return 'uuid'; },
    base64Decode(){ return []; },
    newBlob(){ return {}; }
  },
  HtmlService:{}, DocumentApp:{}
};
vm.createContext(ctx);

['Config.gs','Server.gs','Media.gs'].forEach(f=>{
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'apps-script', f), 'utf8'), ctx, {filename:f});
});

module.exports = { ctx, SS };
