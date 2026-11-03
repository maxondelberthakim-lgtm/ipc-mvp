const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'pemilik@contoh.co.id';","return '';");
fs.writeFileSync(__dirname + '/.h3.js', src);
const {ctx}=require(__dirname + '/.h3.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
ctx.setupSistem();
const ANTO={nama:'Manager',pin:'1357'}, YANTO={nama:'Staff Gudang',pin:'1111'};

console.log('— SKU: tambah / ubah / hapus —');
tolak('staf tidak boleh', ()=>ctx.daftarSku(YANTO), /Supervisor/);
const n0 = ctx.daftarSku(ANTO).length;
const r1 = ctx.simpanSku({kode:'rm pistachio', nama:'Pistachio Mentah', kategori:'BAHAN_BAKU', harga:320000, awalGBJ:50}, ANTO);
ok('kode dinormalisasi', r1.kode==='RM-PISTACHIO', r1);
ok('SKU bertambah 1', ctx.daftarSku(ANTO).length===n0+1, ctx.daftarSku(ANTO).length-n0);
const rR = ctx.simpanSku({kode:'WIP-ROLL-HITAM', nama:'Roll Hitam', kategori:'ROLL', kualitas:'KW'}, ANTO);
ok('SKU kategori ROLL dengan kualitas bisa ditambah', rR.ok && ctx.daftarSku(ANTO).find(s=>s.kode==='WIP-ROLL-HITAM').kategori==='ROLL' && ctx.daftarSku(ANTO).find(s=>s.kode==='WIP-ROLL-HITAM').kualitas==='KW', rR);
ctx.hapusSku('WIP-ROLL-HITAM', ANTO);
tolak('kualitas tak dikenal ditolak', ()=>ctx.simpanSku({kode:'FG-PB-X', nama:'Polybag X', kategori:'BARANG_JADI', kualitas:'PREMIUM'}, ANTO), /Kualitas/);

ok('muncul di dropdown', ctx.getKonteks(ANTO).items.some(i=>i.kode==='RM-PISTACHIO'));
ok('stok awal ikut', ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='RM-PISTACHIO').gbj===50);
ok('harga tampil ke supervisor', ctx.daftarSku(ANTO).find(s=>s.kode==='RM-PISTACHIO').harga===320000);
tolak('kode dobel ditolak', ()=>ctx.simpanSku({kode:'RM-PISTACHIO', nama:'X', kategori:'BAHAN_BAKU'}, ANTO), /sudah ada/);
tolak('kode aneh ditolak', ()=>ctx.simpanSku({kode:'a', nama:'X'}, ANTO), /Kode/);
const b = ctx.daftarSku(ANTO).find(s=>s.kode==='RM-PISTACHIO').baris;
ctx.simpanSku({baris:b, kode:'RM-PISTACHIO', nama:'Pistachio Mentah Iran', kategori:'BAHAN_BAKU', harga:330000, awal:50}, ANTO);
ok('ubah nama', ctx.daftarSku(ANTO).find(s=>s.kode==='RM-PISTACHIO').nama==='Pistachio Mentah Iran');
// belum dipakai -> hapus beneran
const h1 = ctx.hapusSku('RM-PISTACHIO', ANTO);
ok('belum dipakai -> dihapus beneran', h1.dihapus===true && !ctx.daftarSku(ANTO).some(s=>s.kode==='RM-PISTACHIO'), h1);
// sudah dipakai -> nonaktif
ctx.simpanPenerimaan({jenis:'MASUK',supplier:'X',noSuratJalan:'A',baris:[{kode:'RM-AF',qty:10}],ident:YANTO});
const h2 = ctx.hapusSku('RM-AF', ANTO);
ok('sudah dipakai -> dinonaktifkan, bukan dihapus', h2.dinonaktifkan===true && ctx.daftarSku(ANTO).find(s=>s.kode==='RM-AF').aktif===false, h2);
ok('nonaktif hilang dari dropdown', !ctx.getKonteks(ANTO).items.some(i=>i.kode==='RM-AF'));
ok('riwayat stok tetap utuh', ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='RM-AF').beli===10);
tolak('ganti kode SKU yang sudah dipakai ditolak', ()=>ctx.simpanSku({baris:ctx.daftarSku(ANTO).find(s=>s.kode==='RM-AF').baris, kode:'RM-AF-X', nama:'Antifoam', kategori:'BAHAN_BAKU'}, ANTO), /sudah dipakai/);

console.log('\n— Stock opname —');
ctx.simpanPenerimaan({jenis:'MASUK',supplier:'X',noSuratJalan:'B',baris:[{kode:'RM-BP-KW',qty:1000}],ident:YANTO});
ctx.simpanLaporanShift({shift:'1',blowing:{operator:'Sri',ambil:[{kode:'RM-BP-KW',qty:300}],hasil:[{kualitas:'KW',qty:290}],bs:[{kualitas:'KW',qty:5}]}}, ANTO);   // 300 kg biji masuk blowing → keluar dari gudang
tolak('staf tidak boleh opname', ()=>ctx.siapkanOpname(YANTO), /Manajemen/);
const prep = ctx.siapkanOpname(ANTO);
ok('daftar item gudang dengan stok sistem (1000 − 300 diambil blowing)', prep.items.find(i=>i.kode==='RM-BP-KW').sistem===700, prep.items.find(i=>i.kode==='RM-BP-KW'));
ok('opname tanpa pilihan lokasi (v9)', prep.lokasi==='GBJ');
ok('item nonaktif tidak ikut', !prep.items.some(i=>i.kode==='RM-AF'));
// fisik: mete 688 (kurang 12), W320 tidak dihitung (kosong), sacha inchi seed 20 (lebih 20 — ada stok tak tercatat)
const o = ctx.simpanOpname({baris:[
  {kode:'RM-BP-KW', fisik:688, catatan:'karung sobek'},
  {kode:'RM-BP-SUP', fisik:''},
  {kode:'RM-PG-SPL', fisik:20}
], catatan:'opname bulanan'}, ANTO);
ok('2 item dicatat (yang kosong dilewati)', o.jumlahItem===2, o);
ok('kurang 12, lebih 20, bersih +8', o.kurang===12 && o.lebih===20 && o.selisih===8, o);
const st = ctx.laporanStok(ANTO);
ok('stok GBJ mete jadi 688 (= fisik)', st.daftar.find(s=>s.kode==='RM-BP-KW').gbj===688);
ok('penyesuaian tercatat di neraca', st.daftar.find(s=>s.kode==='RM-BP-KW').opname===-12);
ok('pigmen Super Plus muncul dari 0 jadi 20', st.daftar.find(s=>s.kode==='RM-PG-SPL').gbj===20);
ok('biji yang diambil blowing tercatat dipakai 300', st.daftar.find(s=>s.kode==='RM-BP-KW').dipakai===300);
// neraca tetap konsisten
const m = st.daftar.find(s=>s.kode==='RM-BP-KW');
ok('rumus gudang + opname = saldo', Math.abs((m.awal + m.beli - m.retur + m.returCust - m.jual - m.dipakai + m.dihasilkan + m.opname - m.rusak) - m.gbj) < 0.01);
// opname kedua: sistem sekarang 688
// riwayat diurutkan per milidetik Waktu — di mesin cepat dua sesi bisa jatuh di ms yang sama (urutan acak), jadi beri jeda sebentar
{ const t0 = Date.now(); while (Date.now() - t0 < 5) {} }
const o2 = ctx.simpanOpname({baris:[{kode:'RM-BP-KW', fisik:683}]}, ANTO);
ok('opname kedua: kurang 5', o2.kurang===5);
ok('stok jadi 683', ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='RM-BP-KW').gbj===683);
ok('siapkanOpname pakai stok terbaru', ctx.siapkanOpname(ANTO).items.find(i=>i.kode==='RM-BP-KW').sistem===683);
const rw = ctx.riwayatOpname(90, ANTO);
ok('riwayat: 2 sesi, terbaru dulu', rw.length===2 && rw[0].lokasi==='GBJ' && rw[1].jumlahItem===2, rw.map(x=>[x.lokasi,x.jumlahItem]));
ok('riwayat sesi simpan catatan per item', rw[1].item.find(i=>i.kode==='RM-BP-KW').catatan==='karung sobek');
tolak('fisik negatif ditolak', ()=>ctx.simpanOpname({baris:[{kode:'RM-BP-KW', fisik:-1}]}, ANTO), /negatif/);
tolak('semua kosong ditolak', ()=>ctx.simpanOpname({baris:[{kode:'RM-BP-KW', fisik:''}]}, ANTO), /Belum ada item/);
console.log('\n— v12.6: opname bertanggal (posisi akhir hari) —');
{
  const t = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ctx.tglStr_(d); };
  // sekarang: RM-BP-KW 683 (semua transaksi hari ini). Tambah penerimaan kemarin 100 & shift 2 hari lalu ambil 50
  ctx.simpanPenerimaan({jenis:'MASUK',supplier:'X',noSuratJalan:'C',tanggal:t(1),baris:[{kode:'RM-BP-KW',qty:100}],ident:YANTO});
  ctx.simpanLaporanShift({tanggal:t(2), shift:'2', blowing:{operator:'Sri',ambil:[{kode:'RM-BP-KW',qty:50}],hasil:[{kualitas:'KW',qty:48}],bs:[{kualitas:'KW',qty:1}]}}, ANTO);
  ok('stok sekarang = 683 + 100 − 50 = 733', ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='RM-BP-KW').gbj===733);
  const p2 = ctx.siapkanOpname(ANTO, t(2));
  ok('posisi akhir 2 hari lalu: hanya shift 2 hari lalu (−50), tanpa transaksi hari ini & kemarin → 1000 − 50 = 950? tidak — transaksi "hari ini" (shift 300, opname −12, −5, penerimaan 1000) bertanggal hari ini dikecualikan → 0 − 50 = −50', p2.items.find(i=>i.kode==='RM-BP-KW').sistem===-50 && p2.akhirHari===true && p2.tanggal===t(2), p2.items.find(i=>i.kode==='RM-BP-KW'));
  const p1 = ctx.siapkanOpname(ANTO, t(1));
  ok('posisi akhir kemarin = −50 + 100 = 50', p1.items.find(i=>i.kode==='RM-BP-KW').sistem===50);
  ok('tanpa tanggal / hari ini = stok sekarang 733, akhirHari false', ctx.siapkanOpname(ANTO).items.find(i=>i.kode==='RM-BP-KW').sistem===733 && ctx.siapkanOpname(ANTO, t(0)).akhirHari===false);
  tolak('tanggal masa depan ditolak', ()=>ctx.siapkanOpname(ANTO, '2099-01-01'), /masa depan/);
  // hitung pagi hari ini sebelum kerja = posisi akhir kemarin: fisik 60 → selisih +10 terhadap 50, bukan terhadap 733
  const o3 = ctx.simpanOpname({baris:[{kode:'RM-BP-KW', fisik:60}], tanggal:t(1)}, ANTO);
  ok('opname bertanggal kemarin: selisih = 60 − 50 = +10 (bukan 60 − 733)', o3.lebih===10 && o3.kurang===0 && o3.tanggal===t(1), o3);
  const baris = ctx.baca_(ctx.SHEET.OPNAME).filter(r=>r.ID_Sesi===o3.idSesi)[0];
  ok('baris opname: Tanggal = kemarin, Stok_Sistem 50, Fisik 60', String(baris.Tanggal)===t(1) && ctx.angka_(baris.Stok_Sistem)===50 && ctx.angka_(baris.Stok_Fisik)===60, baris);
  ok('stok sekarang naik 10 → 743 (penyesuaian berlaku ke depan)', ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='RM-BP-KW').gbj===743);
  ok('posisi akhir kemarin sekarang 60 (opname kemarin ikut), posisi 2 hari lalu tetap −50', ctx.siapkanOpname(ANTO, t(1)).items.find(i=>i.kode==='RM-BP-KW').sistem===60 && ctx.siapkanOpname(ANTO, t(2)).items.find(i=>i.kode==='RM-BP-KW').sistem===-50);
  ok('riwayat opname membawa tanggal posisi', ctx.riwayatOpname(90, ANTO)[0].tanggal===t(1));
  // BS saja (SCRAP) dihitung Minggu, item lain kosong → hanya BS yang berubah
  const bsSebelum = ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='SCR-BS-KW');
  const o4 = ctx.simpanOpname({baris:[{kode:'SCR-BS-KW', fisik:40},{kode:'RM-BP-KW', fisik:''}], tanggal:t(1)}, ANTO);
  ok('opname BS saja: 1 item, item lain tak tersentuh; BS posisi kemarin 1 → fisik 40 = +39, stok sekarang 6 + 39 = 45', o4.jumlahItem===1 && o4.lebih===39 && ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='RM-BP-KW').gbj===743 && ctx.laporanStok(ANTO).daftar.find(s=>s.kode==='SCR-BS-KW').gbj===45, [bsSebelum && bsSebelum.gbj, o4]);
}
const kal = ctx.kalender(null, ANTO);
ok('opname muncul di kalender', kal.hari.some(h=>h.kejadian.some(e=>e.jenis==='OPNAME')));
ok('aktivitas staf hitung opname', ctx.aktivitasStaf('Manager',30,ANTO).daftar[0].jenis.OPNAME===5, ctx.aktivitasStaf('Manager',30,ANTO).daftar[0].jenis);

fs.unlinkSync(__dirname + '/.h3.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
