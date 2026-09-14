/* ============================================================
   Data contoh — supaya demo terbuka dalam keadaan "pabrik jalan"
   ============================================================ */
(function(){
  setupSistem();

  unggahFoto_ = function(dataUrl){ return { url: dataUrl || '', id: '' }; };

  var CONTOH_SJ = [
    'CV MITRA METE SULAWESI',
    'Jl. Perintis Kemerdekaan, Makassar',
    'SURAT JALAN No : SJ/2026/09/0184',
    'Kepada : PT Eramas Agri Internasional — Gudang Barang Jadi',
    '1. Kacang Mete Mentah W240 ......... 800 kg',
    '2. Kacang Mete Mentah W320 ......... 200 kg',
    'Total Netto : 1000 kg',
    'Jumlah koli : 50 karung'
  ].join('\n');
  ocrSuratJalan = function(){
    var h = parseSuratJalan_(CONTOH_SJ);
    h.ok = true; h.teks = CONTOH_SJ;
    return h;
  };

  function mundur(menit){ return new Date(Date.now() - menit*60000); }
  /* mundurkan waktu N baris terakhir (satu entri bisa jadi beberapa baris) */
  function geser(sheet, menitMulai, menitSelesai, n){
    var rows = baca_(sheet);
    var mulai = Math.max(0, rows.length - (n || 1));
    for (var i = mulai; i < rows.length; i++){
      var o = {};
      if (sheet === SHEET.PEKERJAAN){
        o.Waktu_Mulai = mundur(menitMulai); o.Waktu_Selesai = mundur(menitSelesai);
      } else {
        o.Waktu = mundur(menitMulai);
        o.Tanggal = Utilities.formatDate(mundur(menitMulai), APP.zona, 'yyyy-MM-dd');
      }
      ubahBaris_(sheet, rows[i]._baris, o);
    }
  }

  /* --- ⓪ pembelian masuk --- */
  simpanPenerimaan({ jenis:'MASUK', supplier:'CV Mitra Mete Sulawesi', noSuratJalan:'SJ/2026/09/0170',
    baris:[{kode:'RM-CSW-W240', qty:1500},{kode:'RM-CSW-W320', qty:200}], qtyOcr:1700, ident:{nama:'Yanto'} });
  geser(SHEET.PENERIMAAN, 60*70, 0, 2);
  simpanPenerimaan({ jenis:'MASUK', supplier:'UD Tani Kacang Jaya', noSuratJalan:'SJ/2026/09/0176',
    baris:[{kode:'RM-PNT-JAVA', qty:800},{kode:'RM-MIN-GRG', qty:200},{kode:'RM-BMB-BBQ', qty:40}],
    ident:{nama:'Yanto'} });
  geser(SHEET.PENERIMAAN, 60*46, 0, 3);
  simpanPenerimaan({ jenis:'MASUK', supplier:'Koperasi Sacha Inchi Kalimantan', noSuratJalan:'SJ/2026/09/0180',
    baris:[{kode:'RM-SI-SEED', qty:500}], ident:{nama:'Yanto'} });
  geser(SHEET.PENERIMAAN, 60*20, 0, 1);

  /* --- retur: kadar air ketinggian --- */
  simpanPenerimaan({ jenis:'RETUR', supplier:'UD Tani Kacang Jaya',
    baris:[{kode:'RM-PNT-JAVA', qty:40}], catatan:'kadar air ketinggian, 2 karung berjamur',
    ident:{nama:'Yanto'} });
  geser(SHEET.PENERIMAAN, 60*18, 0, 1);

  /* --- pembelian yang masih menunggu review (angka ketik beda 5 kg dari OCR) --- */
  simpanPenerimaan({ jenis:'MASUK', supplier:'CV Mitra Mete Sulawesi', noSuratJalan:'SJ/2026/09/0184',
    baris:[{kode:'RM-CSW-W240', qty:305}], qtyOcr:300,
    catatan:'timbangan gudang lebih 5 kg', ident:{nama:'Yanto'} });

  /* --- ① ③ transfer --- */
  function trf(arah, baris, menit, orang){
    simpanTransfer({ arah:arah, baris:baris, ident:{nama:orang} });
    if (menit) geser(SHEET.TRANSFER, menit, 0, baris.length);
  }
  trf('GBJ_KE_GP', [{kode:'RM-CSW-W240', qty:1050}], 60*44, 'Sri');
  trf('GBJ_KE_GP', [{kode:'RM-PNT-JAVA', qty:620},{kode:'RM-MIN-GRG', qty:160},
                    {kode:'RM-BMB-BBQ', qty:35}], 60*24, 'Yanto');
  trf('GBJ_KE_GP', [{kode:'RM-SI-SEED', qty:320}], 60*6, 'Rina');
  trf('GP_KE_GBJ', [{kode:'FG-MM-CSW', qty:400}], 60*20, 'Sri');
  trf('GP_KE_GBJ', [{kode:'FG-JM-BBQ', qty:300}], 60*10, 'Yanto');
  trf('GP_KE_GBJ', [{kode:'FG-SC-SI', qty:250}], 60*9, 'Rina');
  trf('GBJ_KE_GP', [{kode:'RM-CSW-W240', qty:120}], 0, 'Sri');   // menunggu review

  /* --- ② pekerjaan yang sudah selesai --- */
  function jobSelesai(produk, bahan, keluar, scrap, menit, orang){
    var j = mulaiPekerjaan({ kodeProduk:produk, bahanBaku:bahan, ident:{nama:orang} });
    selesaikanPekerjaan({ id:j.id, barangJadi:[{kode:produk, qty:keluar}],
      scrap: scrap ? [{kode:'SCR-KULIT', qty:scrap}] : [], ident:{nama:orang} });
    geser(SHEET.PEKERJAAN, menit + 240, menit);
  }
  jobSelesai('FG-MM-CSW', [{kode:'RM-CSW-W240', qty:300}], 285, 3, 60*40, 'Sri');   // 4,0%  normal
  jobSelesai('FG-MM-CSW', [{kode:'RM-CSW-W240', qty:300}], 284, 4, 60*30, 'Sri');   // 4,0%  normal
  jobSelesai('FG-JM-BBQ', [{kode:'RM-PNT-JAVA', qty:200},{kode:'RM-MIN-GRG', qty:60},
                           {kode:'RM-BMB-BBQ', qty:10}], 245, 5, 60*22, 'Yanto');   // 7,4%  normal
  jobSelesai('FG-JM-BBQ', [{kode:'RM-PNT-JAVA', qty:200},{kode:'RM-MIN-GRG', qty:40},
                           {kode:'RM-BMB-BBQ', qty:10}], 218, 4, 60*7,  'Yanto');   // 11,6% TINGGI
  jobSelesai('FG-SC-SI',  [{kode:'RM-SI-SEED', qty:300}], 292, 4, 60*3, 'Rina');    // 1,3%  normal

  /* --- ② pekerjaan yang sedang berjalan --- */
  mulaiPekerjaan({ kodeProduk:'FG-MM-CSW', bahanBaku:[{kode:'RM-CSW-W240', qty:420}], ident:{nama:'Sri'} });
  geser(SHEET.PEKERJAAN, 165, 0);
  mulaiPekerjaan({ kodeProduk:'FG-JM-BBQ',
    bahanBaku:[{kode:'RM-PNT-JAVA', qty:180},{kode:'RM-MIN-GRG', qty:45},{kode:'RM-BMB-BBQ', qty:9}],
    ident:{nama:'Yanto'} });
  geser(SHEET.PEKERJAAN, 75, 0);

  /* --- ④ barang keluar ke customer --- */
  function kirim(jenis, customer, sj, baris, menit, orang){
    simpanPengiriman({ jenis:jenis, customer:customer, noSuratJalan:sj, baris:baris,
      catatan: jenis==='RETUR_MASUK' ? 'kemasan penyok waktu kirim' : '', ident:{nama:orang} });
    if (menit) geser(SHEET.PENGIRIMAN, menit, 0, baris.length);
  }
  kirim('KELUAR','PT Ritel Nusantara','DO/2026/09/0038',
    [{kode:'FG-MM-CSW', qty:150}], 60*34, 'Sri');
  kirim('KELUAR','Distributor Bali Sejahtera','DO/2026/09/0040',
    [{kode:'FG-JM-BBQ', qty:120},{kode:'FG-MM-CSW', qty:60}], 60*19, 'Sri');
  kirim('RETUR_MASUK','Distributor Bali Sejahtera','',
    [{kode:'FG-JM-BBQ', qty:8}], 60*12, 'Sri');
  kirim('KELUAR','Ekspor — Singapore Trading','DO/2026/09/0041',
    [{kode:'FG-SC-SI', qty:200}], 60*5, 'Rina');
  kirim('KELUAR','Toko Grosir Pasar Baru','DO/2026/09/0044',
    [{kode:'FG-MM-CSW', qty:40}], 0, 'Sri');   // menunggu review

  /* --- sebagian sudah di-review supaya riwayat tidak seragam --- */
  var q = antrianReview({nama:'Pak Anto', pin:'2468'});
  q.slice(4).forEach(function(x, i){
    try {
      var sv = {nama:'Pak Anto', pin:'2468'};
      if (i === 1) tinjauTransfer(x.id, 'tandai', 'cek ulang timbangan, angka beda dengan catatan manual', sv);
      else tinjauTransfer(x.id, 'setuju', '', sv);
    } catch(e){}
  });

  /* --- demo: ganti peran lewat banner. STAF = anak gudang (tanpa HPP), ADMIN = manager --- */
  window.__peranDemo = 'ADMIN';
  var _pengguna = penggunaSaatIni_;
  penggunaSaatIni_ = function(ident){
    var u = _pengguna(ident || {});
    var p = window.__peranDemo;
    return { email: '', nama: p === 'STAF' ? 'Yanto' : 'Manager', peran: p, lokasi: '',
             terdaftar: true, identitasManual: false, perluNama: false };
  };

  /* --- jembatan google.script.run --- */
  window.google = { script: { run: (function(){
    var fns = ['getKonteks','simpanPenerimaan','simpanPengiriman','simpanTransfer',
               'mulaiPekerjaan','selesaikanPekerjaan','daftarPekerjaanBerjalan',
               'antrianReview','tinjauTransfer','tinjauMassal',
               'laporanSusut','laporanStok','riwayatPenerimaan','laporanPenjualan',
               'riwayatTransfer','ocrSuratJalan','unggahFoto','kalender','laporanHpp',
               'riwayatInput','ambilEntri','simpanEditEntri','batalkanEntriSendiri',
               'daftarPekerjaanSelesai','ambilPekerjaan','simpanEditPekerjaan'];
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
