/* ============================================================
   Demo shim — menjalankan backend Apps Script asli di browser.
   Sheet diganti array in-memory. Tidak ada data yang keluar dari HP.
   ============================================================ */
(function (G) {
  function makeSheet(name){
    return {
      name:name, rows:[],
      getLastRow(){ return this.rows.length; },
      getMaxColumns(){ return this.rows[0] ? this.rows[0].length : 26; },
      deleteColumns(){}, setFrozenRows(){}, autoResizeColumns(){},
      appendRow(r){ this.rows.push(r.slice()); },
    deleteRow(n){ this.rows.splice(n-1,1); },
      deleteRows(n,k){ this.rows.splice(n-1,k||1); },
      getRange(r,c,nr,nc){
        var sh=this; nr=nr||1; nc=nc||1;
        return {
          setValues:function(vals){
            for(var i=0;i<vals.length;i++){ var ri=r-1+i;
              while(sh.rows.length<=ri) sh.rows.push([]);
              for(var j=0;j<vals[i].length;j++) sh.rows[ri][c-1+j]=vals[i][j]; }
            return this;
          },
          getValues:function(){
            var out=[];
            for(var i=0;i<nr;i++){ var row=sh.rows[r-1+i]||[], o=[];
              for(var j=0;j<nc;j++) o.push(row[c-1+j]===undefined?'':row[c-1+j]);
              out.push(o); }
            return out;
          },
          setValue:function(v){ var ri=r-1; while(sh.rows.length<=ri) sh.rows.push([]);
            sh.rows[ri][c-1]=v; return this; },
          setFontWeight:function(){return this}, setBackground:function(){return this},
          setFontColor:function(){return this}
        };
      }
    };
  }
  var SS = { sheets:{},
    getSheetByName:function(n){ return this.sheets[n]||null; },
    insertSheet:function(n){ this.sheets[n]=makeSheet(n); return this.sheets[n]; },
    setSpreadsheetTimeZone:function(){} };

  G.__SS = SS;
  G.SpreadsheetApp = { getActiveSpreadsheet:function(){ return SS; } };
  G.Session = { getActiveUser:function(){ return { getEmail:function(){ return ''; } }; } };
  G.LockService = { getScriptLock:function(){ return { waitLock:function(){}, releaseLock:function(){} }; } };
  G.DriveApp = {
    Access:{ANYONE_WITH_LINK:'a'}, Permission:{VIEW:'v'},
    getFoldersByName:function(){ return { hasNext:function(){return false;} }; },
    createFolder:function(){ return { getId:function(){return 'DEMO';}, getUrl:function(){return '#';} }; },
    getFolderById:function(id){ return { getId:function(){return id;}, getUrl:function(){return '#';},
      createFile:function(){ return { getUrl:function(){return '#';}, getId:function(){return 'F';} }; } }; }
  };
  var BLN=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  G.Utilities = {
    formatDate:function(d,tz,fmt){
      function p(n){ return String(n).padStart(2,'0'); }
      return String(fmt).replace('yyyy',d.getFullYear()).replace('yy',String(d.getFullYear()).slice(2))
        .replace('MMM',BLN[d.getMonth()]).replace('MM',p(d.getMonth()+1)).replace('dd',p(d.getDate()))
        .replace('HH',p(d.getHours())).replace('mm',p(d.getMinutes())).replace('ss',p(d.getSeconds()));
    },
    getUuid:function(){ return 'u'+Math.random().toString(36).slice(2); },
    base64Decode:function(){ return []; }, newBlob:function(){ return {}; }
  };
  G.HtmlService = {}; G.DocumentApp = {};
})(window);
