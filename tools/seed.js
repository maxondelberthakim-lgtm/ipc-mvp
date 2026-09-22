/* ============================================================
   Data contoh — supaya demo terbuka dalam keadaan "pabrik jalan"
   (SKU polybag, sama dengan sistem sungguhan)
   ============================================================ */
(function(){
  setupSistem();
  try { migrasiSkema(); } catch(e) {}
  // staf gudang tambahan untuk demo (supaya riwayat & aktivitas per user terlihat)
  [['Yanto','2222','Gudang'],['Sri','3333','Produksi'],['Rina','4444','Produksi']].forEach(function(u){
    tambah_(SHEET.PENGGUNA, { Email:'', Nama:u[0], Peran:PERAN.STAF, Lokasi:u[2], PIN:u[1], Aktif:'YA' });
  });

  unggahFoto_ = function(dataUrl){ return { url: dataUrl || '', id: '' }; };

  var CONTOH_SJ = [
    'PT SUMBER BIJI PLASTIK',
    'Kawasan Industri, Tangerang',
    'SURAT JALAN No : SJ/2026/09/0184',
    'Kepada : Pabrik Polybag — Gudang Barang Jadi',
    '1. Biji Plastik KW ......... 1000 kg',
    '2. Biji Plastik Super ...... 500 kg',
    'Total Netto : 1500 kg',
    'Jumlah koli : 60 karung'
  ].join('\n');
  ocrSuratJalan = function(){
    var h = parseSuratJalan_(CONTOH_SJ);
    h.ok = true; h.teks = CONTOH_SJ;
    return h;
  };

  var STAF = { 'Staff Gudang':'1111', Yanto:'2222', Sri:'3333', Rina:'4444' };
  function id(nama){ return { nama:nama, pin: STAF[nama] || '' }; }
  var MGR = { nama:'Manager', pin:'1357' };
  function mundur(menit){ return new Date(Date.now() - menit*60000); }
  function tglMundur(menit){ return Utilities.formatDate(mundur(menit), APP.zona, 'yyyy-MM-dd'); }
  /* mundurkan waktu N baris terakhir (satu entri bisa jadi beberapa baris) */
  function geser(sheet, menitMulai, menitSelesai, n){
    var rows = baca_(sheet);
    var mulai = Math.max(0, rows.length - (n || 1));
    for (var i = mulai; i < rows.length; i++){
      var o = {};
      if (sheet === SHEET.PEKERJAAN){
        o.Waktu_Mulai = mundur(menitMulai); o.Waktu_Selesai = mundur(menitSelesai);
        o.Tanggal = Utilities.formatDate(mundur(menitMulai), APP.zona, 'yyyy-MM-dd');
      } else {
        o.Waktu = mundur(menitMulai);
        o.Tanggal = Utilities.formatDate(mundur(menitMulai), APP.zona, 'yyyy-MM-dd');
      }
      ubahBaris_(sheet, rows[i]._baris, o);
    }
  }

  /* --- PO oleh manager (v7) --- */
  var po1 = simpanPo({ supplier:'PT Sumber Biji Plastik', tanggal:tglMundur(60*75), perkiraanDatang:tglMundur(60*70),
    baris:[{kode:'RM-BP-KW', qty:2000, harga:13000, spesifikasi:'KW hitam, MFI 0.3–0.5, kadar air <1%'},
           {kode:'RM-BP-SUP', qty:500, harga:15000, spesifikasi:'Super hitam, bening tanpa bintik'}],
    catatan:'Stok produksi minggu ini' }, MGR);
  geser(SHEET.PO, 60*75, 0, 2);
  var po2 = simpanPo({ supplier:'CV Warna Pigmen Jaya', tanggal:tglMundur(60*50), perkiraanDatang:tglMundur(60*44),
    baris:[{kode:'RM-PG-KW', qty:100, harga:28000, spesifikasi:'Masterbatch hitam KW'},
           {kode:'RM-AF', qty:50, harga:13500, spesifikasi:'Antifoam cair, jerigen 25 kg'}] }, MGR);
  geser(SHEET.PO, 60*50, 0, 2);
  simpanPo({ supplier:'UD Daur Ulang Makmur', tanggal:tglMundur(60*5), perkiraanDatang:tglMundur(-60*48),
    baris:[{kode:'RM-BS-KW', qty:800, harga:13000, spesifikasi:'BS KW giling bersih, tanpa logam'}],
    catatan:'Datang lusa' }, MGR);
  geser(SHEET.PO, 60*5, 0, 1);

  function poBaris(noPo, kode){ return baca_(SHEET.PO).filter(function(r){ return r.No_PO===noPo && r.Kode_Item===kode; })[0]; }

  /* --- ⓪ penerimaan barang vs PO --- */
  simpanPenerimaan({ jenis:'MASUK', supplier:'PT Sumber Biji Plastik', noSuratJalan:'SJ/2026/09/0170',
    baris:[{kode:'RM-BP-KW', qty:1500, idPo:poBaris(po1.noPo,'RM-BP-KW').ID},{kode:'RM-BP-SUP', qty:500, idPo:poBaris(po1.noPo,'RM-BP-SUP').ID}],
    qtyOcr:2000, catatanQc:'Karung utuh, warna sesuai', ident:id('Staff Gudang') });
  geser(SHEET.PENERIMAAN, 60*70, 0, 2);
  simpanPenerimaan({ jenis:'MASUK', supplier:'CV Warna Pigmen Jaya', noSuratJalan:'SJ/2026/09/0176',
    baris:[{kode:'RM-PG-KW', qty:100, idPo:poBaris(po2.noPo,'RM-PG-KW').ID},{kode:'RM-AF', qty:50, idPo:poBaris(po2.noPo,'RM-AF').ID}],
    catatanQc:'1 jerigen antifoam penyok, isi aman', ident:id('Staff Gudang') });
  geser(SHEET.PENERIMAAN, 60*46, 0, 2);
  /* datang tanpa PO */
  simpanPenerimaan({ jenis:'MASUK', supplier:'UD Daur Ulang Makmur', noSuratJalan:'SJ/2026/09/0180',
    baris:[{kode:'RM-BS-SUP', qty:300}], catatan:'kiriman tambahan tanpa PO', ident:id('Staff Gudang') });
  geser(SHEET.PENERIMAAN, 60*20, 0, 1);

  /* --- retur: dari penerimaan yang sudah tercatat --- */
  var asalPg = hitungReturSisa_('CV Warna Pigmen Jaya').find(function(x){ return x.kode==='RM-PG-KW'; });
  if (asalPg) simpanPenerimaan({ jenis:'RETUR', supplier:'CV Warna Pigmen Jaya',
    baris:[{kode:'RM-PG-KW', qty:10, idAsal:asalPg.id}], catatan:'warna belang, 2 sak dikembalikan',
    ident:id('Staff Gudang') });
  geser(SHEET.PENERIMAAN, 60*18, 0, 1);

  /* --- penerimaan sisa PO yang masih menunggu review (angka ketik beda 5 kg dari OCR) --- */
  simpanPenerimaan({ jenis:'MASUK', supplier:'PT Sumber Biji Plastik', noSuratJalan:'SJ/2026/09/0184',
    baris:[{kode:'RM-BP-KW', qty:505, idPo:poBaris(po1.noPo,'RM-BP-KW').ID}], qtyOcr:500,
    catatan:'timbangan gudang lebih 5 kg', catatanQc:'3 karung lembab', ident:id('Staff Gudang') });

  /* --- invoice supplier (v7): satu sudah valid, satu menunggu --- */
  try {
    var inv1 = simpanInvoice({ noPo:po2.noPo, noInvoice:'INV/WPJ/0912', tanggalInvoice:tglMundur(60*40), totalInvoice:100*28000 + 50*13500 }, MGR);
    validasiInvoice(inv1.id, 'valid', {}, 'cocok', MGR);
    simpanInvoice({ noPo:po1.noPo, noInvoice:'INV/SBP/2231', tanggalInvoice:tglMundur(60*30), totalInvoice:1500*13125 + 500*15000,
      catatan:'harga biji KW naik jadi 13.125?' }, MGR);
  } catch(e) {}

  /* --- ① pekerjaan yang sudah selesai (v9: bahan langsung dari gudang, hasil langsung ke gudang) --- */
  function jobSelesai(produk, bahan, keluar, scrap, menit, orang){
    var j = mulaiPekerjaan({ kodeProduk:produk, bahanBaku:bahan, ident:id(orang) });
    selesaikanPekerjaan({ id:j.id, barangJadi:[{kode:produk, qty:keluar}], scrapKg: scrap || 0, ident:id(orang) });
    geser(SHEET.PEKERJAAN, menit + 240, menit);
  }
  jobSelesai('FG-PB-HP', [{kode:'RM-BP-KW', qty:400},{kode:'RM-PG-KW', qty:8},{kode:'RM-AF', qty:4}], 398, 5, 60*40, 'Sri');    // 2,2% normal
  jobSelesai('FG-PB-HP', [{kode:'RM-BP-KW', qty:400},{kode:'RM-PG-KW', qty:8},{kode:'RM-AF', qty:4}], 396, 6, 60*30, 'Sri');    // 2,4% normal
  jobSelesai('FG-PB-HP', [{kode:'RM-BP-SUP', qty:300},{kode:'RM-PG-KW', qty:6},{kode:'RM-AF', qty:3}], 290, 6, 60*22, 'Yanto'); // 4,2% normal
  jobSelesai('FG-PB-HP', [{kode:'RM-BS-SUP', qty:200},{kode:'RM-PG-KW', qty:4},{kode:'RM-AF', qty:2}], 178, 8, 60*7,  'Rina');  // 9,7% TINGGI
  jobSelesai('FG-PB-HP', [{kode:'RM-BP-KW', qty:300},{kode:'RM-PG-KW', qty:6},{kode:'RM-AF', qty:3}], 300, 3, 60*3, 'Sri');     // 1,9% normal

  /* --- ② pekerjaan yang sedang berjalan --- */
  mulaiPekerjaan({ kodeProduk:'FG-PB-HP', bahanBaku:[{kode:'RM-BP-KW', qty:250},{kode:'RM-PG-KW', qty:5},{kode:'RM-AF', qty:2}], ident:id('Sri') });
  geser(SHEET.PEKERJAAN, 165, 0);
  mulaiPekerjaan({ kodeProduk:'FG-PB-HP', bahanBaku:[{kode:'RM-BP-SUP', qty:120},{kode:'RM-PG-KW', qty:3},{kode:'RM-AF', qty:1}], ident:id('Staff Gudang') });
  geser(SHEET.PEKERJAAN, 75, 0);

  /* --- ④ barang keluar ke customer --- */
  function kirim(jenis, customer, sj, baris, menit, orang){
    simpanPengiriman({ jenis:jenis, customer:customer, noSuratJalan:sj, baris:baris,
      catatan: jenis==='RETUR_MASUK' ? 'kemasan sobek waktu kirim' : '', ident:id(orang) });
    if (menit) geser(SHEET.PENGIRIMAN, menit, 0, baris.length);
  }
  kirim('KELUAR','PT Nursery Hijau Lestari','DO/2026/09/0038', [{kode:'FG-PB-HP', qty:400}], 60*34, 'Sri');
  kirim('KELUAR','Toko Tani Sejahtera','DO/2026/09/0040', [{kode:'FG-PB-HP', qty:250}], 60*19, 'Sri');
  kirim('RETUR_MASUK','Toko Tani Sejahtera','', [{kode:'FG-PB-HP', qty:12}], 60*12, 'Sri');
  kirim('KELUAR','Koperasi Perkebunan Sawit','DO/2026/09/0041', [{kode:'FG-PB-HP', qty:300}], 60*5, 'Rina');
  kirim('KELUAR','Toko Tani Sejahtera','DO/2026/09/0044', [{kode:'FG-PB-HP', qty:80}], 0, 'Sri');   // menunggu review

  /* --- sebagian sudah di-review supaya riwayat tidak seragam --- */
  var q = antrianReview(MGR);
  q.slice(4).forEach(function(x, i){
    try {
      if (i === 1) tinjauTransfer(x.id, 'tandai', 'cek ulang timbangan, angka beda dengan catatan manual', MGR);
      else tinjauTransfer(x.id, 'setuju', '', MGR);
    } catch(e){}
  });

  /* --- laporan barang rusak (v7): satu disetujui, satu menunggu --- */
  try {
    var d1 = simpanKerusakan({ kode:'RM-BP-KW', qty:25, penyebab:'karung bocor kena hujan di bongkar muat', ident:id('Yanto') });
    geser(SHEET.KERUSAKAN, 60*26, 0, 1);
    tinjauKerusakan(d1.id, 'setuju', '', MGR);
    simpanKerusakan({ kode:'RM-PG-KW', qty:2, penyebab:'sak pigmen tumpah', ident:id('Rina') });
    geser(SHEET.KERUSAKAN, 60*2, 0, 1);
  } catch(e) {}

  /* --- sales order (v8): satu jatuh tempo hari ini (muncul di "Kirim hari ini"), satu 3 hari lagi, satu sudah terkirim sebagian --- */
  try {
    function tglMaju(hari){ var d = new Date(); d.setDate(d.getDate() + hari); return Utilities.formatDate(d, APP.zona, 'yyyy-MM-dd'); }
    simpanSo({ customer:'PT Nursery Hijau Lestari', tanggal:tglMundur(60*30), tanggalKirim:tglMaju(0),
               baris:[{kode:'FG-PB-HP', qty:300, harga:21500}], catatan:'kirim pagi, truk sendiri' }, MGR);
    var so2 = simpanSo({ customer:'Koperasi Perkebunan Sawit', tanggal:tglMundur(60*50), tanggalKirim:tglMundur(60*24),
               baris:[{kode:'FG-PB-HP', qty:500, harga:21000}], catatan:'' }, MGR);
    simpanPengiriman({ jenis:'KELUAR', customer:'Koperasi Perkebunan Sawit', noSuratJalan:'DO/2026/09/0045',
      baris:[{kode:'FG-PB-HP', qty:100, idSo:so2.ids[0]}], catatan:'', ident:id('Rina') });
    geser(SHEET.PENGIRIMAN, 60*23, 0, 1);
    simpanSo({ customer:'Toko Tani Sejahtera', tanggal:tglMundur(60*3), tanggalKirim:tglMaju(3),
               baris:[{kode:'FG-PB-HP', qty:150, harga:22000}], catatan:'' }, MGR);
  } catch(e) { console.warn('seed SO', e); }

  /* --- backup (v8): di demo pura-pura sudah terpasang --- */
  window.ScriptApp = { getProjectTriggers:function(){ return [{ getHandlerFunction:function(){ return 'backupHarian'; } }]; } };
  DriveApp.getFoldersByName = function(nama){
    if (nama !== 'IPC Backup') return { hasNext:function(){ return false; } };
    var n = 0, hariIni = Utilities.formatDate(new Date(), APP.zona, 'yyyy-MM-dd');
    return { hasNext:function(){ return true; }, next:function(){ return { getFiles:function(){ return {
      hasNext:function(){ return n < 12; },
      next:function(){ n++; var d = new Date(); d.setDate(d.getDate() - n + 1); return { getName:function(){ return 'IPC Backup ' + Utilities.formatDate(d, APP.zona, 'yyyy-MM-dd') + ' 02.00'; } }; }
    }; } }; } };
  };

  /* --- daur ulang scrap (v9): satu batch selesai (jasa diisi manager), satu masih di chassen --- */
  try {
    var du1 = mulaiDaurUlang({ vendor:'UD Daur Ulang Makmur', tanggal:tglMundur(60*30), noSuratJalan:'SJ/CH/0091', scrap:[{kode:'SCR-FG-PB-HP', qty:20}], catatan:'dikirim pakai pickup', ident:id('Yanto') });
    geser(SHEET.DAUR, 60*30, 0, 1);
    selesaikanDaurUlang({ id:du1.id, hasil:[{kode:'RM-BP-DU', qty:18.5}], biayaJasa:60000, catatan:'diterima sore, karung 2', ident:MGR });
    mulaiDaurUlang({ vendor:'UD Daur Ulang Makmur', scrap:[{kode:'SCR-FG-PB-HP', qty:6}], ident:id('Sri') });
    geser(SHEET.DAUR, 60*5, 0, 1);
  } catch(e) { console.warn('seed daur ulang', e); }

  /* --- contoh opname oleh Manager --- */
  simpanOpname({ baris:[{kode:'RM-BP-KW', fisik:620, catatan:'2 karung sobek'}, {kode:'RM-BS-SUP', fisik:98}], catatan:'opname mingguan' }, MGR);
  geser(SHEET.OPNAME, 60*15, 0, 2);

  /* --- demo: login pakai layar identitas asli (nama + PIN). Akun ada di banner. --- */
  try { localStorage.removeItem('ipc_nama'); localStorage.removeItem('ipc_pin'); } catch(e) {}

  /* --- jembatan google.script.run --- */
  window.google = { script: { run: (function(){
    var fns = ['getKonteks','simpanPenerimaan','simpanPengiriman',
               'mulaiPekerjaan','selesaikanPekerjaan','daftarPekerjaanBerjalan',
               'antrianReview','tinjauTransfer','tinjauMassal',
               'laporanSusut','laporanStok','riwayatPenerimaan','laporanPenjualan',
               'ocrSuratJalan','unggahFoto','kalender','laporanHpp',
               'riwayatInput','ambilEntri','simpanEditEntri','batalkanEntriSendiri',
               'daftarPekerjaanSelesai','ambilPekerjaan','simpanEditPekerjaan',
               'daftarPengguna','simpanPengguna','aktivitasStaf','daftarSku','simpanSku','hapusSku',
               'siapkanOpname','simpanOpname','riwayatOpname','daftarPermintaan','tinjauPermintaan',
               'simpanPo','ubahPo','batalkanPo','daftarPo','poTerbuka','returTersedia','ringkasanPo',
               'simpanInvoice','validasiInvoice','daftarInvoice','laporanNilaiStok','hitungUlangHpp',
               'simpanKerusakan','daftarKerusakan','tinjauKerusakan','laporanStandarSusut','terapkanStandarSusut',
               'diagnosa','prediksiBeli','simpanSo','ubahSo','batalkanSo','daftarSo','soTerbuka','eksporBulanan','statusBackup',
               'tambahMaster','mulaiDaurUlang','selesaikanDaurUlang','daftarDaurUlang','ambilDaurUlang','ubahDaurUlang','batalkanDaurUlang','laporanDaurUlang'];
    function buat(sukses, gagal){
      var o = { withSuccessHandler:function(f){ return buat(f, gagal); },
                withFailureHandler:function(f){ return buat(sukses, f); } };
      fns.forEach(function(nm){
        o[nm] = function(){
          var args = [].slice.call(arguments);
          setTimeout(function(){
            try { var r = window[nm].apply(null, args); if (sukses) sukses(r); }
            catch(e){ if (gagal) gagal({ message: String(e && e.message || e) }); }
          }, 160);
        };
      });
      return o;
    }
    return buat(null, null);
  })() } };
})();
