/* v13 "alur kirim": DO (draft) → surat jalan → kirim → foto DO. Draft tidak pernah menggerakkan stok; stok bergerak saat Kirim. */
const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'pemilik@contoh.co.id';","return '';");
fs.writeFileSync(__dirname + '/.h13.js', src);
const {ctx}=require(__dirname + '/.h13.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
ctx.setupSistem();
const SPV={nama:'Manager',pin:'1357'}, MP={nama:'Bastari',pin:'4433'}, SM={nama:'Deny',pin:'3322'}, YS={nama:'Yansen',pin:'2211'}, STAF={nama:'Staff Gudang',pin:'1111'}, ADM={nama:'Admin',pin:'1234'};
const CUS='PT Nursery Hijau Lestari', FG='FG-PB-KW', SCR='SCR-BS-KW', VENDOR='PT Chassen Jaya';
const FOTO='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
const SH = ctx.SHEET, baca = (n) => ctx.baca_(n);
const hari = ctx.tglStr_(new Date());
const geser = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return ctx.tglStr_(d); };
const besok = geser(1);
const stok = (kode) => ctx.laporanStok(SPV).daftar.find(s => s.kode === kode).gbj;
const soBaris = (no) => baca(SH.SO).filter(r => r.No_SO === no);
const soInfo = (no, ident) => ctx.daftarSo(ident || SM).find(x => x.noSo === no);
const pub = (token) => ctx.ambilDokumenPublik_(token);
const log = (aksi) => baca(SH.LOG).filter(l => l.Aksi === aksi);

console.log('— Skema & akses v13 —');
const ss = ctx.SpreadsheetApp.getActiveSpreadsheet();
ok('sheet Kiriman & Kiriman_Detail ada', !!ss.getSheetByName('Kiriman') && !!ss.getSheetByName('Kiriman_Detail'));
ok('Pengiriman & Daur_Ulang punya kolom ID_Kiriman', ctx.HEADER['Pengiriman'].indexOf('ID_Kiriman') >= 0 && ctx.HEADER['Daur_Ulang'].indexOf('ID_Kiriman') >= 0);
ok('versi 13.3.0', ctx.APP.versi === '13.3.0');
{ const ky = ctx.getKonteks(YS), kd = ctx.getKonteks(SM), kb = ctx.getKonteks(MP), ks = ctx.getKonteks(STAF);
  ok('konteks: bisaKirim Yansen (GUDANG) true; Deny (SO saja), Bastari (PRODUKSI), STAF false', ky.bisaKirim === true && kd.bisaKirim === false && kb.bisaKirim === false && ks.bisaKirim === false, [ky.bisaKirim, kd.bisaKirim, kb.bisaKirim, ks.bisaKirim]);
  ok('konteks: penghitung siapKirim & belumFotoSj ada (0)', ky.ringkasan.siapKirim === 0 && ky.ringkasan.belumFotoSj === 0 && kd.ringkasan.siapKirim === 0); }

console.log('\n— Siapkan stok & SO —');
ctx.simpanOpname({baris:[{kode:FG, fisik:1000}, {kode:SCR, fisik:500}], catatan:'uji v13'}, ADM);
ok('stok polybag KW 1000, BS KW 500', stok(FG) === 1000 && stok(SCR) === 500);
const so = ctx.simpanSo({customer:CUS, tanggal:hari, tanggalKirim:hari, topHari:0, baris:[{kode:FG, qty:300, harga:25000, ukuran:'30 x 50'}]}, SM);
const idSo = soBaris(so.noSo)[0].ID;
ok('SO 300 kg polybag KW dibuat oleh Deny', so.ok !== false && !!idSo, so);

console.log('\n— Buat DO (draft) —');
tolak('STAF tidak boleh membuat DO', () => ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, baris:[{idSo, qty:100}]}, STAF), /Gudang atau Sales order/);
tolak('Bastari (PRODUKSI saja) tidak boleh membuat DO', () => ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, baris:[{idSo, qty:100}]}, MP), /Gudang atau Sales order/);
tolak('customer kosong ditolak', () => ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:'', baris:[{idSo, qty:100}]}, SM), /Customer belum dipilih/);
tolak('baris kosong ditolak', () => ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, baris:[]}, SM), /Item belum diisi/);
tolak('qty 0 ditolak dengan nomor baris', () => ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, baris:[{idSo, qty:0}]}, SM), /Baris #1 .*qty harus > 0/);
tolak('customer beda dengan SO ditolak', () => ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:'Toko Lain', baris:[{idSo, qty:100}]}, SM), /customer tidak sama dengan SO/);
tolak('tanggal rencana format salah ditolak', () => ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, tanggalRencana:'3/11/2026', baris:[{idSo, qty:100}]}, SM), /YYYY-MM-DD/);
tolak('tanggal rencana > 90 hari ke depan ditolak', () => ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, tanggalRencana:geser(120), baris:[{idSo, qty:100}]}, SM), /terlalu jauh/);
const stok0 = stok(FG), nPeng0 = baca(SH.PENGIRIMAN).length;
const d1 = ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, tanggalRencana:besok, baris:[{idSo, qty:200}], pengangkut:'B 1 AB · Udin', catatan:'muat pagi'}, SM);
ok('Deny (modul SO) membuat DO dari SO: nomor SJ/YYYY/MM/001, token, 200 kg, tanpa peringatan', d1.ok && /^SJ\/\d{4}\/\d{2}\/001$/.test(d1.nomor) && !!d1.token && d1.totalKg === 200 && d1.peringatan.length === 0, d1);
ok('draft: TIDAK ada pergerakan stok, TIDAK ada baris Pengiriman', stok(FG) === stok0 && baca(SH.PENGIRIMAN).length === nPeng0, [stok(FG), stok0]);
{ const s1 = soInfo(so.noSo);
  ok('SO tetap TERBUKA, dikirim 0, dijadwalkan 200, sisaRencana 100, kartu SO membawa DO-nya', soBaris(so.noSo)[0].Status === 'TERBUKA' && s1.dikirim === 0 && s1.dijadwalkan === 200 && s1.sisaRencana === 100 && s1.kiriman.length === 1 && s1.kiriman[0].id === d1.id && s1.kiriman[0].status === 'DISIAPKAN' && s1.kiriman[0].nomor === d1.nomor, s1); }
{ const p1 = pub(d1.token);
  ok('dokumen SJ aktif: SURAT JALAN, customer, no SO, 200 kg, tanggal kirim = rencana, ukuran dari SO, kendaraan, draft', p1.jenis === 'SJ' && p1.pihak.nama === CUS && p1.noSo === so.noSo && p1.totalKg === 200 && p1.tanggalKirim === besok && p1.baris[0].ukuran === '30 x 50' && p1.pengangkut === 'B 1 AB · Udin' && p1.draft === true && p1.sumber === 'KIRIM', p1); }
{ const k = ctx.getKonteks(YS), g = k.soHariIni.find(x => x.noSo === so.noSo);
  ok('beranda Yansen: Kirim hari ini membawa dijadwalkan 200 + DO; siapKirim 1, belumFotoSj 0', g && g.dijadwalkan === 200 && g.kiriman.length === 1 && g.baris[0].sisaRencana === 100 && k.ringkasan.siapKirim === 1 && k.ringkasan.belumFotoSj === 0, g);
  const kd = ctx.getKonteks(SM);
  ok('beranda Deny (SO saja): bisaKirim false tapi siapKirim terlihat', kd.bisaKirim === false && kd.ringkasan.siapKirim === 1); }
tolak('over-planning ditolak: DO kedua 150 kg > sisa belum dijadwalkan 100', () => ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, baris:[{idSo, qty:150}]}, YS), /melebihi sisa SO .* belum dijadwalkan \(100/);
const d2 = ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, baris:[{idSo, qty:100}]}, YS);
ok('DO kedua 100 kg (tepat sisa) boleh → nomor …/002, tanggal rencana = hari ini', /\/002$/.test(d2.nomor) && ctx.ambilKiriman(d2.id, YS).tanggalRencana === hari, d2);
const d3 = ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, baris:[{kode:FG, qty:5000}]}, YS);
ok('stok kurang hanya PERINGATAN: DO 5000 kg (stok 1000) tetap dibuat, peringatan menyebut butuh & stok', d3.ok && d3.peringatan.length === 1 && d3.peringatan[0].kode === FG && d3.peringatan[0].butuh === 5000 && d3.peringatan[0].stok === 1000, d3.peringatan);
ok('log KIRIMAN_SIAP mencatat stok kurang', /stok kurang/.test(log('KIRIMAN_SIAP').slice(-1)[0].Detail));
ctx.batalkanKiriman(d3.id, 'hanya uji peringatan', YS);

console.log('\n— Daftar —');
{ const siap = ctx.daftarKiriman(YS, 'siap', 'CUSTOMER');
  ok('Siap kirim (Yansen): 2 DO urut tanggal rencana (hari ini dulu), token ikut, bolehKirim/bolehUbah true, baris membawa no SO & ukuran', siap.length === 2 && siap[0].id === d2.id && siap[1].id === d1.id && siap.every(x => x.token && x.bolehKirim && x.bolehUbah && x.bolehBatal) && siap[1].baris[0].noSo === so.noSo && siap[1].baris[0].ukuran === '30 x 50', siap.map(x => [x.id, x.tanggalRencana]));
  const siapDeny = ctx.daftarKiriman(SM, 'siap');
  ok('Deny (SO) melihat daftar: bolehUbah/bolehBatal true, bolehKirim false', siapDeny.length === 2 && siapDeny.every(x => x.bolehUbah && x.bolehBatal && !x.bolehKirim));
  const siapStaf = ctx.daftarKiriman(STAF, 'siap');
  ok('STAF (modul GUDANG) melihat daftar tanpa token link & tanpa hak apa pun', siapStaf.length === 2 && siapStaf.every(x => !x.token && !x.bolehKirim && !x.bolehUbah));
  tolak('Bastari (PRODUKSI) tidak bisa membuka daftar', () => ctx.daftarKiriman(MP, 'siap'), /akses Gudang \/ Sales order/);
  ok('tab semua memuat yang dibatalkan', ctx.daftarKiriman(YS, 'semua').some(x => x.id === d3.id && x.status === 'DIBATALKAN')); }

console.log('\n— Ubah draft —');
const u1 = ctx.ubahKiriman(d1.id, {baris:[{idSo, qty:150}], pengangkut:'B 2 CD · Asep'}, SM);
ok('ubah draft (Deny): qty 150 & kendaraan; nomor SJ tetap; dokumen lama DIGANTI, dokumen baru 150 kg; dijadwalkan 250', u1.berubah && u1.nomor === d1.nomor && pub(d1.token).diganti === true && pub(u1.token).totalKg === 150 && pub(u1.token).pengangkut === 'B 2 CD · Asep' && soInfo(so.noSo).dijadwalkan === 250, u1);
tolak('ubah melebihi sisa (DO lain 100 + 250 > 300) ditolak', () => ctx.ubahKiriman(d1.id, {baris:[{idSo, qty:250}]}, SM), /melebihi sisa SO/);
ok('ubah tanpa perubahan → berubah false', ctx.ubahKiriman(d1.id, {}, SM).berubah === false);
ok('Log_Edit draft berisi stempel perubahan', /qty|item: Polybag KW 150/.test(ctx.ambilKiriman(d1.id, YS).logEdit));

console.log('\n— Kirim —');
tolak('Deny (SO saja) tidak boleh mengirim', () => ctx.kirimKiriman(d1.id, {}, SM), /akses Gudang yang bisa mengirim/);
tolak('STAF tidak boleh mengirim', () => ctx.kirimKiriman(d1.id, {}, STAF), /akses Gudang yang bisa mengirim/);
tolak('tanggal kirim di masa depan ditolak', () => ctx.kirimKiriman(d1.id, {tanggalKirim:besok}, YS), /masa depan/);
const kr1 = ctx.kirimKiriman(d1.id, {foto:FOTO}, YS);
{ const peng = baca(SH.PENGIRIMAN).filter(r => r.ID_Kiriman === d1.id), sb = soBaris(so.noSo)[0];
  ok('Kirim (qty sesuai draft, dengan foto): stok turun 150, 1 baris Pengiriman dengan ID_Kiriman, no SJ & foto; SO SEBAGIAN dikirim 150; bukan cetak ulang', kr1.ok && stok(FG) === stok0 - 150 && peng.length === 1 && peng[0].No_Surat_Jalan === d1.nomor && !!peng[0].Foto_URL && peng[0].Qty_Kg === 150 && sb.Status === 'SEBAGIAN' && sb.Qty_Dikirim_Kg === 150 && kr1.cetakUlang === false && kr1.fotoMenyusul === false, [kr1, peng.length, sb.Status]);
  const k1 = ctx.ambilKiriman(d1.id, YS);
  ok('kiriman DIKIRIM: foto tersalin, ref = ID pengiriman, tanggal kirim hari ini; dijadwalkan SO turun ke 100', k1.status === 'DIKIRIM' && k1.foto === peng[0].Foto_URL && k1.ref === peng[0].ID && k1.tanggalKirim === hari && soInfo(so.noSo).dijadwalkan === 100 && soInfo(so.noSo).kiriman.find(x => x.id === d1.id).status === 'DIKIRIM', k1); }
tolak('kirim dua kali ditolak', () => ctx.kirimKiriman(d1.id, {}, YS), /sudah DIKIRIM/);
const kr2 = ctx.kirimKiriman(d2.id, {baris:[{idSo, qty:80}], catatan:'kurang 20 kg, sisanya besok'}, YS);
ok('Kirim dengan qty beda (80 dari 100) TANPA foto: cetakUlang true, nomor sama, token baru, fotoMenyusul; dokumen lama DIGANTI, baru 80 kg', kr2.ok && kr2.cetakUlang === true && kr2.nomor === d2.nomor && !!kr2.token && kr2.fotoMenyusul === true && pub(d2.token).diganti === true && pub(kr2.token).totalKg === 80 && pub(kr2.token).draft === false, kr2);
{ const sb = soBaris(so.noSo)[0], s2 = soInfo(so.noSo);
  ok('stok turun 80 lagi; SO dikirim 230 (SEBAGIAN), sisa 70, dijadwalkan 0', stok(FG) === stok0 - 230 && sb.Qty_Dikirim_Kg === 230 && sb.Status === 'SEBAGIAN' && s2.sisa === 70 && s2.dijadwalkan === 0, [stok(FG), sb.Qty_Dikirim_Kg, s2.sisa]);
  ok('detail kiriman ikut diganti ke 80 kg', ctx.ambilKiriman(d2.id, YS).baris[0].qty === 80 && ctx.ambilKiriman(d2.id, YS).totalKg === 80); }
{ const rw = ctx.riwayatInput('JUAL_KELUAR', 14, YS);
  ok('riwayat barang keluar: baris dari kiriman membawa idKiriman, tombol SJ lama (bolehSj) dimatikan', rw.length === 2 && rw[0].idKiriman === d2.id && rw[0].bolehSj === false && rw[1].idKiriman === d1.id, rw.map(r => [r.idKiriman, r.bolehSj])); }
{ const bf = ctx.daftarKiriman(YS, 'belumFoto'), dk = ctx.daftarKiriman(YS, 'dikirim'), k = ctx.getKonteks(YS);
  ok('Belum foto DO: hanya DO kedua, bolehFoto Yansen true', bf.length === 1 && bf[0].id === d2.id && bf[0].bolehFoto === true, bf.map(x => x.id));
  ok('Sudah dikirim: 2, terbaru dulu, yang pertama berfoto', dk.length === 2 && dk[0].id === d2.id && dk[1].id === d1.id && !!dk[1].foto && !dk[0].foto, dk.map(x => [x.id, !!x.foto]));
  ok('konteks: siapKirim 0, belumFotoSj 1', k.ringkasan.siapKirim === 0 && k.ringkasan.belumFotoSj === 1, k.ringkasan); }

console.log('\n— Foto DO (menyusul / ganti) —');
tolak('foto DO oleh Deny (SO saja) ditolak', () => ctx.fotoSj(d2.id, FOTO, SM), /akses Gudang/);
tolak('foto bukan gambar ditolak', () => ctx.fotoSj(d2.id, 'abc', YS), /Foto belum dipilih/);
const dihapus0 = (ctx.__fotoDihapus || []).length;
const f1 = ctx.fotoSj(d2.id, FOTO, YS);
{ const peng = baca(SH.PENGIRIMAN).find(r => r.ID_Kiriman === d2.id);
  ok('+ Foto DO: tersimpan di Kiriman DAN baris Pengiriman, log FOTO_TAMBAH, Belum foto kosong, belumFotoSj 0', f1.ok && f1.ganti === false && ctx.ambilKiriman(d2.id, YS).foto === f1.foto && peng.Foto_URL === f1.foto && ctx.daftarKiriman(YS, 'belumFoto').length === 0 && log('FOTO_TAMBAH').some(l => l.Referensi === d2.id) && ctx.getKonteks(YS).ringkasan.belumFotoSj === 0, f1); }
/* kiriman "lama 3 hari" — tanpa batas 24 jam / MAKS_EDIT_HARI untuk Manager gudang */
{ const k = baca(SH.KIRIMAN).find(x => x.ID === d2.id), p = baca(SH.PENGIRIMAN).find(r => r.ID_Kiriman === d2.id), lama = new Date(Date.now() - 3 * 86400000);
  ctx.ubahBaris_(SH.KIRIMAN, k._baris, { Waktu_Kirim: lama, Tanggal_Kirim: geser(-3) });
  ctx.ubahBaris_(SH.PENGIRIMAN, p._baris, { Waktu: lama, Tanggal: geser(-3) });
  const f2 = ctx.fotoSj(d2.id, FOTO, YS);
  const p2 = baca(SH.PENGIRIMAN).find(r => r.ID_Kiriman === d2.id);
  ok('Ganti foto DO oleh Yansen pada kiriman 3 hari lalu: ganti true, foto baru di Kiriman & Pengiriman, foto lama dihapus, log FOTO_GANTI', f2.ok && f2.ganti === true && f2.foto !== f1.foto && ctx.ambilKiriman(d2.id, YS).foto === f2.foto && p2.Foto_URL === f2.foto && (!ctx.__fotoDihapus || ctx.__fotoDihapus.length > dihapus0) && log('FOTO_GANTI').some(l => l.Referensi === d2.id), [f2, (ctx.__fotoDihapus || []).length - dihapus0]);
  ok('Log_Edit Pengiriman & Kiriman mencatat "foto SJ diganti"', /foto SJ diganti/.test(p2.Log_Edit) && /foto SJ diganti/.test(ctx.ambilKiriman(d2.id, YS).logEdit)); }

console.log('\n— Batal draft —');
const d4 = ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, baris:[{idSo, qty:50}]}, YS);
ok('DO keempat 50 kg (sisa 70) dibuat, dijadwalkan 50', d4.ok && soInfo(so.noSo).dijadwalkan === 50);
tolak('foto DO untuk draft (belum dikirim) ditolak', () => ctx.fotoSj(d4.id, FOTO, YS), /belum dikirim/);
tolak('batal tanpa alasan ditolak', () => ctx.batalkanKiriman(d4.id, '', YS), /Alasan pembatalan wajib/);
{ const nPeng = baca(SH.PENGIRIMAN).length, st = stok(FG);
  const b = ctx.batalkanKiriman(d4.id, 'salah customer', YS);
  ok('batal draft: DIBATALKAN, dokumen SJ-nya dibatalkan (link mati), stok & Pengiriman tidak berubah, dijadwalkan 0, log KIRIMAN_BATAL', b.ok && ctx.ambilKiriman(d4.id, YS).status === 'DIBATALKAN' && pub(d4.token).dibatalkan === true && !pub(d4.token).diganti && stok(FG) === st && baca(SH.PENGIRIMAN).length === nPeng && soInfo(so.noSo).dijadwalkan === 0 && log('KIRIMAN_BATAL').some(l => l.Referensi === d4.id && /salah customer/.test(l.Detail)), b); }
tolak('batal kiriman yang sudah dikirim → diarahkan ke riwayat', () => ctx.batalkanKiriman(d1.id, 'coba', YS), /sudah dikirim/);
tolak('kirim draft yang dibatalkan ditolak', () => ctx.kirimKiriman(d4.id, {}, YS), /sudah DIBATALKAN/);
tolak('ubah draft yang dibatalkan ditolak', () => ctx.ubahKiriman(d4.id, {catatan:'x'}, YS), /sudah DIBATALKAN/);
ok('nomor SJ draft yang dibatalkan tidak dipakai ulang: DO berikutnya …/005', /\/005$/.test(ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, baris:[{idSo, qty:10}]}, YS).nomor));

console.log('\n— DO daur ulang (BS ke chassen) —');
tolak('DO daur: item bukan scrap ditolak', () => ctx.siapkanKiriman({jenis:'DAUR', tujuan:VENDOR, baris:[{kode:FG, qty:10}]}, YS), /bukan scrap/);
tolak('DO daur: vendor kosong ditolak', () => ctx.siapkanKiriman({jenis:'DAUR', tujuan:'', baris:[{kode:SCR, qty:10}]}, YS), /Tempat chassen/);
const nDaur0 = baca(SH.DAUR).length;
const dd = ctx.siapkanKiriman({jenis:'DAUR', tujuan:VENDOR, baris:[{kode:SCR, qty:120}]}, YS);
ok('DO daur dibuat: nomor SJ urut, halaman = jasa daur ulang (sumber DAUR), 120 kg, stok BS tetap, Daur_Ulang belum bertambah', dd.ok && /\/006$/.test(dd.nomor) && pub(dd.token).pihak.label === 'Jasa daur ulang' && pub(dd.token).sumber === 'DAUR' && pub(dd.token).totalKg === 120 && stok(SCR) === 500 && baca(SH.DAUR).length === nDaur0, dd);
ok('daftar siap kirim jenis DAUR: 1', ctx.daftarKiriman(YS, 'siap', 'DAUR').length === 1 && ctx.daftarKiriman(YS, 'siap', 'CUSTOMER').length === 1);
const kd = ctx.kirimKiriman(dd.id, {}, YS);
{ const dr = baca(SH.DAUR).find(r => r.ID_Kiriman === dd.id);
  ok('Kirim daur TANPA foto → batch BERJALAN dengan ID_Kiriman & no SJ, tanpa foto, stok BS turun 120, fotoMenyusul', kd.ok && dr && dr.Status === 'BERJALAN' && dr.No_Surat_Jalan === dd.nomor && !dr.Foto_Kirim_URL && kd.ref === dr.ID && stok(SCR) === 380 && kd.fotoMenyusul === true, kd);
  ok('daftarDaurUlang: idKiriman ikut', ctx.daftarDaurUlang(YS).find(x => x.id === dr.ID).idKiriman === dd.id);
  const bf = ctx.daftarKiriman(YS, 'belumFoto', 'DAUR');
  ok('Belum foto DO (DAUR) berisi batch itu', bf.length === 1 && bf[0].id === dd.id);
  const f3 = ctx.fotoSj(dd.id, FOTO, YS);
  ok('foto DO daur menyusul → Foto_Kirim_URL terisi di Daur_Ulang & Kiriman', f3.ok && baca(SH.DAUR).find(r => r.ID === dr.ID).Foto_Kirim_URL === f3.foto && ctx.ambilKiriman(dd.id, YS).foto === f3.foto);
  tolak('terima hasil masih wajib foto surat jalan vendor (tidak berubah)', () => ctx.selesaikanDaurUlang({id:dr.ID, hasil:[{kode:'RM-BP-DU', qty:100}], ident:YS}), /Foto surat jalan dari tempat chassen wajib/); }

console.log('\n— Kiriman lama (sebelum v13) —');
const lama = ctx.simpanPengiriman({jenis:'KELUAR', customer:CUS, baris:[{kode:FG, qty:5}, {kode:FG, qty:7}], ident:YS});
{ const dk = ctx.daftarKiriman(YS, 'dikirim', 'CUSTOMER'), e = dk.find(x => x.lama);
  ok('2 baris lama yang disimpan sekaligus tampil sebagai SATU kiriman sudah dikirim (lama:true, 12 kg, id = kedua ID, terbaru dulu)', e && dk[0] === e && e.totalKg === 12 && e.id === lama.ids.join(',') && e.baris.length === 2 && e.bolehFoto === true && !e.token, e);
  const bf = ctx.daftarKiriman(YS, 'belumFoto', 'CUSTOMER');
  ok('kiriman lama tanpa foto masuk Belum foto DO; belumFotoSj menghitungnya 1', bf.length === 1 && bf[0].lama && ctx.getKonteks(YS).ringkasan.belumFotoSj === 1, bf.map(x => x.id));
  const f4 = ctx.fotoSj(lama.ids.join(','), FOTO, YS);
  const rows = baca(SH.PENGIRIMAN).filter(r => lama.ids.indexOf(r.ID) >= 0);
  ok('fotoSj pada id gabungan mengisi kedua baris; Belum foto kosong', f4.ok && rows.every(r => r.Foto_URL === f4.foto) && ctx.daftarKiriman(YS, 'belumFoto', 'CUSTOMER').length === 0);
  const sjLama = ctx.buatDokumen({jenis:'SJ', ref:lama.ids.slice().reverse().join(',')}, YS);
  ok('surat jalan lama (ref id urutan lain) terbaca sebagai link kiriman lama', ctx.daftarKiriman(YS, 'dikirim', 'CUSTOMER').find(x => x.lama).token === sjLama.token); }
{ const duL = ctx.mulaiDaurUlang({vendor:VENDOR, scrap:[{kode:SCR, qty:10}], ident:YS});
  ok('mulaiDaurUlang langsung tanpa foto sekarang diterima (BERJALAN) — foto menyusul', duL.ok && baca(SH.DAUR).find(r => r.ID === duL.id).Status === 'BERJALAN');
  const dk = ctx.daftarKiriman(YS, 'dikirim', 'DAUR');
  ok('daur lama tampil di Sudah dikirim (DAUR) sebagai lama:true & di Belum foto', dk.some(x => x.lama && x.id === duL.id) && ctx.daftarKiriman(YS, 'belumFoto', 'DAUR').some(x => x.id === duL.id)); }

console.log('\n— Tanpa rupiah & pemeliharaan —');
ok('payload kiriman tidak pernah memuat harga / nilai / hpp', !/harga|nilai|hpp|"rp"/i.test(JSON.stringify(ctx.daftarKiriman(YS, 'semua'))) && !/harga|nilai|hpp/i.test(JSON.stringify(ctx.ambilKiriman(d1.id, STAF))));
ok('tidak ada baris Pengiriman tanpa ID_Kiriman dari alur baru; baris lama tetap kosong', baca(SH.PENGIRIMAN).filter(r => r.ID_Kiriman).length === 2 && baca(SH.PENGIRIMAN).filter(r => !r.ID_Kiriman).length === 2);
{ ctx.simpanSku({kode:'FG-PB-X', nama:'Polybag X', kategori:'BARANG_JADI', kualitas:'KW'}, ADM);
  const dx = ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, baris:[{kode:'FG-PB-X', qty:3}]}, YS);
  ctx.gabungItem('FG-PB-X', FG);
  ok('gabungItem mengganti kode item di Kiriman_Detail', baca(SH.KIRIMAN_DETAIL).filter(d => d.ID_Kiriman === dx.id).every(d => d.Kode_Item === FG && d.Nama_Item === 'Polybag KW'));
  ctx.batalkanKiriman(dx.id, 'uji gabung', YS); }
{ const tua = ctx.siapkanKiriman({jenis:'CUSTOMER', tujuan:CUS, tanggalRencana:geser(-10), baris:[{kode:FG, qty:1}]}, YS);
  const nK = baca(SH.KIRIMAN).length, nD = baca(SH.KIRIMAN_DETAIL).length;
  ctx.hapusTransaksiSebelum(geser(-5));
  ok('hapusTransaksiSebelum menghapus DO bertanggal rencana lama beserta detailnya, yang lain tetap', !baca(SH.KIRIMAN).some(k => k.ID === tua.id) && !baca(SH.KIRIMAN_DETAIL).some(d => d.ID_Kiriman === tua.id) && baca(SH.KIRIMAN).length === nK - 1 && baca(SH.KIRIMAN_DETAIL).length === nD - 1); }

console.log('\n— v13.1: Kirim langsung (langkah Buat DO opsional) —');
{ const so = ctx.simpanSo({customer:CUS, tanggalKirim:hari, topHari:0, baris:[{kode:FG, qty:40, harga:1000}, {kode:FG, qty:10, harga:1000, ukuran:'uji 13.1'}]}, SM);
  const noL = baca(SH.SO).find(r => r.ID === so.ids[0]).No_SO;
  const s0 = stok(FG), nK = baca(SH.KIRIMAN).length, nSiap = ctx.daftarKiriman(YS, 'siap', 'CUSTOMER').length, nDok = baca(SH.DOKUMEN).length;
  tolak('kirimLangsung: Deny (SO saja, tanpa Gudang) ditolak', () => ctx.kirimLangsung({jenis:'CUSTOMER', tujuan:CUS, tanggalKirim:hari, baris:[{kode:FG, qty:40, idSo:so.ids[0]}]}, SM), /Gudang/);
  tolak('kirimLangsung: tanggal kirim ke depan ditolak', () => ctx.kirimLangsung({jenis:'CUSTOMER', tujuan:CUS, tanggalKirim:besok, baris:[{kode:FG, qty:40, idSo:so.ids[0]}]}, YS), /tanggal|Tanggal/);
  tolak('kirimLangsung: qty melebihi sisa SO ditolak', () => ctx.kirimLangsung({jenis:'CUSTOMER', tujuan:CUS, tanggalKirim:hari, baris:[{kode:FG, qty:41, idSo:so.ids[0]}]}, YS), /melebihi sisa SO/);
  ok('… tidak ada draft / dokumen tertinggal, stok tetap', baca(SH.KIRIMAN).length === nK && ctx.daftarKiriman(YS, 'siap', 'CUSTOMER').length === nSiap && baca(SH.DOKUMEN).length === nDok && stok(FG) === s0);
  const r = ctx.kirimLangsung({jenis:'CUSTOMER', tujuan:CUS, tanggalKirim:hari, baris:[{kode:FG, qty:40, idSo:so.ids[0]}], pengangkut:'B 131 LG', foto:FOTO, catatan:'langsung'}, YS);
  const k = baca(SH.KIRIMAN).find(x => x.ID === r.id);
  ok('kirimLangsung Yansen: ok, langsung:true, nomor SJ, token dokumen, DIKIRIM, stok −40, foto, kendaraan, catatan, bukan foto menyusul', r.ok && r.langsung === true && /^SJ\//.test(r.nomor) && !!r.token && !!k && k.Status === 'DIKIRIM' && k.No_Surat_Jalan === r.nomor && stok(FG) === s0 - 40 && !!k.Foto_SJ_URL && k.Pengangkut === 'B 131 LG' && k.Catatan === 'langsung' && r.fotoMenyusul === false, [r, k && k.Status]);
  const pg = baca(SH.PENGIRIMAN).filter(x => x.ID_Kiriman === r.id);
  ok('baris Pengiriman tertaut (ID_Kiriman) dengan no. SJ = nomor DO; SO baris 1 SELESAI, baris 2 TERBUKA', pg.length === 1 && pg[0].No_Surat_Jalan === r.nomor && soBaris(noL).find(x => x.ID === so.ids[0]).Status === 'SELESAI' && soBaris(noL).find(x => x.ID === so.ids[1]).Status === 'TERBUKA', [pg.length, soBaris(noL).map(x => x.Status)]);
  const dk = ctx.daftarKiriman(YS, 'dikirim', 'CUSTOMER').find(x => x.id === r.id);
  ok('tampil di Sudah dikirim (foto ada, token → Cetak DO), tidak di Belum foto, tidak di Siap kirim', !!dk && !!dk.token && !!dk.foto && !dk.lama && !ctx.daftarKiriman(YS, 'belumFoto', 'CUSTOMER').some(x => x.id === r.id) && !ctx.daftarKiriman(YS, 'siap', 'CUSTOMER').some(x => x.id === r.id) && !!pub(dk.token), dk);
  const r2 = ctx.kirimLangsung({jenis:'CUSTOMER', tujuan:CUS, tanggalKirim:hari, baris:[{kode:FG, qty:5}]}, YS);
  ok('kirimLangsung tanpa foto & tanpa SO: fotoMenyusul, masuk Belum foto DO, stok −5 lagi', r2.ok && r2.fotoMenyusul === true && ctx.daftarKiriman(YS, 'belumFoto', 'CUSTOMER').some(x => x.id === r2.id) && stok(FG) === s0 - 45, r2);
  const sb = stok(SCR);
  const r3 = ctx.kirimLangsung({jenis:'DAUR', tujuan:VENDOR, tanggalKirim:hari, baris:[{kode:SCR, qty:7}], pengangkut:'L 1'}, YS);
  const d3 = baca(SH.DAUR).find(x => x.ID_Kiriman === r3.id);
  ok('kirimLangsung DAUR: Daur_Ulang BERJALAN tertaut, no. SJ = nomor DO, Kiriman DIKIRIM, stok BS −7', r3.ok && r3.jenis === 'DAUR' && !!d3 && d3.Status === 'BERJALAN' && d3.No_Surat_Jalan === r3.nomor && stok(SCR) === sb - 7 && baca(SH.KIRIMAN).find(x => x.ID === r3.id).Status === 'DIKIRIM', [r3, d3 && d3.Status]);
  tolak('kirimLangsung DAUR dengan item bukan scrap ditolak', () => ctx.kirimLangsung({jenis:'DAUR', tujuan:VENDOR, tanggalKirim:hari, baris:[{kode:FG, qty:1}]}, YS), /bukan scrap/);
  ok('tanpa rupiah di hasil kirimLangsung', !/harga|nilai|hpp/i.test(JSON.stringify(r)) && !/harga|nilai|hpp/i.test(JSON.stringify(dk)));
  ok('RPC_WL memuat kirimLangsung', typeof ctx.RPC_WL !== 'object' || ctx.RPC_WL.kirimLangsung === 1); }

console.log('— v13.2: laporan shift bisa diubah / dihapus kapan saja (sampai tutup bulan); semua hapus wajib alasan —');
{ const BJ = 'RM-BP-KW', nS = () => baca(SH.SHIFT).length, aktif = () => baca(SH.SHIFT).filter(x => x.Status !== 'DIBATALKAN').length;
  const tg = geser(-3);
  const lap = ctx.simpanLaporanShift({tanggal:tg, shift:'1', blowing:{operator:['Sri'], ambil:[{kode:BJ, qty:100}], hasil:[{kualitas:'KW', qty:95}], bs:[{kualitas:'KW', qty:3}]}}, MP);
  const stk = (k) => (ctx.laporanStok(SPV).daftar.find(x => x.kode === k) || {gbj:0}).gbj;   // stok 0 tanpa mutasi tidak ada di daftar
  const n1 = nS(), rollId = lap.blowing.hasil[0].kode, st0 = stk(rollId);
  ok('laporan 3 hari lalu (blowing saja = cutting belum diisi) bolehEdit untuk Bastari & Admin; Yansen (tanpa Produksi) hanya lihat', lap.bolehEdit === true && ctx.ambilLaporanShift(lap.id, ADM).bolehEdit === true && ctx.ambilLaporanShift(lap.id, YS).bolehEdit === false);
  const u1 = ctx.ubahLaporanShift(lap.id, {tanggal:tg, shift:'1', blowing:{operator:['Sri'], ambil:[{kode:BJ, qty:100}], hasil:[{kualitas:'KW', qty:95}], bs:[{kualitas:'KW', qty:3}]},
                                           cutting:{operator:['Rina'], rollPakai:[{kualitas:'KW', qty:50}], hasil:[{kualitas:'KW', qty:48}], bs:[{kualitas:'KW', qty:2}]}}, MP);
  ok('ubah (tambah cutting belakangan): ID sama, TIDAK membuat laporan baru, Log_Edit terisi', u1.ok && u1.laporan.id === lap.id && nS() === n1 && u1.laporan.cutting.totalHasil === 48 && /polybag/.test(u1.laporan.logEdit), [nS(), n1, u1.laporan.logEdit]);
  ok('… stok roll ikut: +95 jadi − 50 dipakai', Math.abs(stk(rollId) - (st0 - 50)) < 1e-6, [st0, stk(rollId)]);
  const u2 = ctx.ubahLaporanShift(lap.id, {tanggal:tg, shift:'1', blowing:{operator:['Sri','Budi'], ambil:[{kode:BJ, qty:110}], hasil:[{kualitas:'KW', qty:104}], bs:[{kualitas:'KW', qty:3}]},
                                           cutting:{operator:['Rina'], rollPakai:[{kualitas:'KW', qty:50}], hasil:[{kualitas:'KW', qty:48}], bs:[{kualitas:'KW', qty:2}]}}, ADM);
  ok('Admin mengubah laporan yang sudah lengkap: tetap satu laporan, angka baru', u2.laporan.id === lap.id && nS() === n1 && u2.laporan.blowing.totalHasil === 104 && u2.laporan.blowing.operator.length === 2);
  tolak('Yansen (tanpa Produksi) tidak bisa mengubah', () => ctx.ubahLaporanShift(lap.id, {catatan:'x'}, YS), /Manager \/ Admin/);
  tolak('hapus laporan tanpa alasan ditolak', () => ctx.batalkanLaporanShift(lap.id, '', ADM), /Alasan/);
  tolak('hapus laporan alasan < 3 huruf ditolak', () => ctx.batalkanLaporanShift(lap.id, 'ab', ADM), /Alasan/);
  const a0 = aktif();
  ok('hapus laporan dengan alasan: DIBATALKAN (baris tetap ada), hilang dari daftar, alasan di Log_Edit + Log_Audit, stok roll kembali',
     ctx.batalkanLaporanShift(lap.id, 'salah tanggal', ADM).ok && nS() === n1 && aktif() === a0 - 1 && !ctx.daftarLaporanShift(ADM, 14, tg).some(x => x.id === lap.id) &&
     /salah tanggal/.test(baca(SH.SHIFT).find(x => x.ID === lap.id).Log_Edit) && log('SHIFT_BATAL').some(l => l.Referensi === lap.id && /salah tanggal/.test(l.Detail)) && Math.abs(stk(rollId) - (st0 - 95)) < 1e-6);
  tolak('laporan yang sudah dihapus tidak bisa diubah', () => ctx.ubahLaporanShift(lap.id, {catatan:'x'}, ADM), /dibatalkan/);
  /* hapus SKU / kontak WA: alasan wajib + tercatat */
  ctx.simpanSku({kode:'RM-UJI-132', nama:'Uji hapus', kategori:'BAHAN_BAKU'}, ADM);
  tolak('hapus SKU tanpa alasan ditolak', () => ctx.hapusSku('RM-UJI-132', ADM), /Alasan/);
  ok('… SKU masih ada', ctx.daftarSku(ADM).some(x => x.kode === 'RM-UJI-132'));
  ok('hapus SKU dengan alasan: terhapus + alasan di Log_Audit', ctx.hapusSku('RM-UJI-132', ADM, 'salah buat').dihapus === true && log('ADMIN_SKU').some(l => l.Referensi === 'RM-UJI-132' && /salah buat/.test(l.Detail)));
  const kw = ctx.simpanKontakWa({nama:'Kontak Uji', nomor:'0811222333'}, YS);
  tolak('hapus kontak WA tanpa alasan ditolak', () => ctx.hapusKontakWa(kw.id, YS), /Alasan/);
  ok('hapus kontak WA dengan alasan: nonaktif + Log_Audit', ctx.hapusKontakWa(kw.id, YS, 'nomor salah').ok && !ctx.daftarKontakWa(YS).some(x => x.id === kw.id) && log('KONTAK_WA_HAPUS').some(l => l.Referensi === kw.id && /nomor salah/.test(l.Detail))); }

console.log('— v13.3: satu SKU BS untuk semua kualitas (Max 13 Nov); laporan stok membawa kategori —');
{ const BJ = 'RM-BP-KW', BSL = ['SCR-BS-KW', 'SCR-BS-SUP', 'SCR-BS-SPL'];
  const stk = (k) => { const s = ctx.hitungStokSemua_()[k]; return s ? s.gbj : 0; };
  ok('awal: tiap kualitas memakai SKU BS-nya sendiri', ctx.petaKualitas_().every(q => q.bs && BSL.indexOf(q.bs.kode) >= 0 && !q.bsUmum) && !ctx.konfigurasiShift(MP).bsUmum);
  ctx.simpanSku({kode:'SCR-BS', nama:'BS (KW + Super + Super Plus)', kategori:'SCRAP'}, ADM);
  ok('SCR-BS dibuat (scrap tanpa kualitas) → BS per kualitas yang masih aktif tetap dipakai', ctx.petaKualitas_().every(q => q.bs.kode !== 'SCR-BS') && ctx.konfigurasiShift(MP).bsUmum === 'SCR-BS');
  const total0 = BSL.reduce((a, k) => a + stk(k), 0);
  const nDetBs = baca(SH.SHIFT_DETAIL).filter(d => d.Jenis === 'BS').length;
  BSL.forEach(k => ctx.gabungItem(k, 'SCR-BS'));
  ok('gabungItem ×3: stok SCR-BS = jumlah BS lama, BS lama 0', Math.abs(stk('SCR-BS') - total0) < 1e-6 && BSL.every(k => Math.abs(stk(k)) < 1e-6), [stk('SCR-BS'), total0]);
  ok('… semua baris BS laporan shift pindah ke SCR-BS tanpa kualitas', baca(SH.SHIFT_DETAIL).filter(d => d.Jenis === 'BS').length === nDetBs && baca(SH.SHIFT_DETAIL).filter(d => d.Jenis === 'BS').every(d => d.Kode_Item === 'SCR-BS' && !d.Kualitas));
  ok('semua kualitas memakai SCR-BS; form tidak melaporkan SKU BS kurang', ctx.petaKualitas_().every(q => q.bs.kode === 'SCR-BS' && q.bsUmum) && !ctx.konfigurasiShift(MP).kurang.some(x => /BS/.test(x)) && ctx.getKonteks(MP).kualitas.every(q => q.bs === 'SCR-BS'));
  const tg = geser(-4), s0 = stk('SCR-BS');
  const l1 = ctx.simpanLaporanShift({tanggal:tg, shift:'2',
    blowing:{operator:['Sri'], ambil:[{kode:BJ, qty:100}], hasil:[{kualitas:'KW', qty:90}], bs:[{kualitas:'KW', qty:3}, {kualitas:'SUPER_PLUS', qty:2}]},
    cutting:{operator:['Rina'], rollPakai:[{kualitas:'KW', qty:50}], hasil:[{kualitas:'KW', qty:47}], bs:[{kualitas:'', qty:3}]}}, MP);
  const dBs = (id) => baca(SH.SHIFT_DETAIL).filter(d => d.ID_Shift === id && d.Jenis === 'BS');
  ok('simpan: BS per kualitas (format lama) jadi SATU baris SCR-BS 5 kg; kualitas kosong = BS umum 3 kg', dBs(l1.id).length === 2 && dBs(l1.id).every(d => d.Kode_Item === 'SCR-BS' && !d.Kualitas) && dBs(l1.id).find(d => d.Mesin === 'BLOWING').Qty_Kg === 5 && dBs(l1.id).find(d => d.Mesin === 'CUTTING').Qty_Kg === 3 && l1.blowing.totalBs === 5 && l1.totalBs === 8, dBs(l1.id));
  ok('… stok SCR-BS +8; laporan lihat: BS tanpa label kualitas, nama SKU baru', Math.abs(stk('SCR-BS') - s0 - 8) < 1e-6 && l1.blowing.bs.length === 1 && l1.blowing.bs[0].kualitas === '' && /BS \(KW \+ Super \+ Super Plus\)/.test(l1.blowing.bs[0].nama));
  const u = ctx.ubahLaporanShift(l1.id, {tanggal:tg, shift:'2',
    blowing:{operator:['Sri'], ambil:[{kode:BJ, qty:100}], hasil:[{kualitas:'KW', qty:90}], bs:[{kualitas:'KW', qty:6}]},
    cutting:{operator:['Rina'], rollPakai:[{kualitas:'KW', qty:50}], hasil:[{kualitas:'KW', qty:47}], bs:[{kualitas:'KW', qty:3}]}}, MP);
  ok('ubah: BS blowing 5 → 6 kg, tetap satu baris per mesin; stok ikut', u.ok && dBs(l1.id).length === 2 && dBs(l1.id).find(d => d.Mesin === 'BLOWING').Qty_Kg === 6 && Math.abs(stk('SCR-BS') - s0 - 9) < 1e-6);
  ok('ubah catatan saja: baris BS tanpa kualitas ikut tersimpan ulang', ctx.ubahLaporanShift(l1.id, {catatan:'cek v13.3'}, MP).ok && dBs(l1.id).length === 2 && Math.abs(stk('SCR-BS') - s0 - 9) < 1e-6);
  const lp = ctx.laporanProduksi(tg.slice(0, 7), MP);
  ok('laporan produksi: total BS memuat SCR-BS; BS umum tidak dibagi per kualitas', lp.total.bs >= 9 && lp.perKualitas.every(p => !p.bs));
  ok('opname produksi: BS satu baris (dikirim dengan kualitas pertama) diterima', ctx.simpanOpnameProduksi({bulan: tg.slice(0, 7), bs:[{kualitas:'KW', qty:4}], polybag:[{kualitas:'KW', qty:10}]}, MP).bsKg === 4);
  ok('SKU BS lama yang sudah kosong bisa dihapus permanen (alasan wajib)', BSL.every(k => ctx.hapusSku(k, ADM, 'digabung ke SCR-BS').dihapus === true) && !ctx.daftarSku(ADM).some(s => BSL.indexOf(s.kode) >= 0));
  ok('sesudah dihapus: semua kualitas tetap memakai SCR-BS; simpan laporan baru tetap jalan', ctx.petaKualitas_().every(q => q.bs.kode === 'SCR-BS') &&
     ctx.simpanLaporanShift({tanggal:geser(-5), shift:'1', blowing:{operator:['Sri'], ambil:[{kode:BJ, qty:10}], hasil:[{kualitas:'SUPER', qty:9}], bs:[{kualitas:'SUPER', qty:1}]}}, MP).blowing.bs[0].kode === 'SCR-BS');
  const ls = ctx.laporanStok(SPV).daftar;
  ok('laporanStok membawa kategori tiap barang (menu Stok per kategori)', ls.every(s => typeof s.kategori === 'string') && ls.some(s => s.kode === 'SCR-BS' && s.kategori === 'SCRAP') && ls.some(s => s.kategori === 'BAHAN_BAKU') && ls.some(s => s.kategori === 'BARANG_JADI')); }

fs.unlinkSync(__dirname+'/.h13.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
