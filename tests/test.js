/* v10: alur inti — pembelian, laporan shift (blowing → cutting), stok, penjualan, review, laporan, HPP rata-rata */
const {ctx} = require('./harness.js');
let pass=0, fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }

ctx.setupSistem();
ctx.setSetting_('PAKSA_LOGIN_MANUAL','TIDAK'); ctx.setSetting_('AKSES_TERBUKA','YA'); // test pakai identitas email pemilik + nama bebas
const SUP='PT Sumber Biji Plastik', SUP2='CV Warna Pigmen Jaya', CUS='PT Nursery Hijau Lestari', CUS2='Toko Tani Sejahtera';

console.log('— 1. Setup & master —');
const k = ctx.getKonteks({});
ok('16 item aktif (biji, pigmen, roll, polybag, BS)', k.items.length===16, k.items.length);
ok('4 supplier aktif', k.supplier.length===4, k.supplier.length);
ok('4 customer aktif', k.customer.length===4, k.customer.length);
ok('user ADMIN & bisa review', k.user.peran==='ADMIN' && k.bisaReview);
ok('sheet Laporan_Shift & Tutup_Bulan ada, Pekerjaan tidak', !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Laporan_Shift') && !!ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Tutup_Bulan') && !ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pekerjaan'));
ok('Master_Item punya kolom Kualitas', ctx.HEADER['Master_Item'].indexOf('Kualitas')>=0);
ok('konteks: peta kualitas KW/Super/Super Plus lengkap', k.kualitas.length===3 && k.kualitas.every(q=>q.biji && q.roll && q.jadi && q.bs) && k.kualitas[0].kualitas==='KW', k.kualitas);
ok('items bawa kualitas & kategori ROLL/SCRAP', k.items.some(i=>i.kategori==='ROLL' && i.kualitas==='KW') && k.items.some(i=>i.kategori==='SCRAP'));
ok('konteks: bulanTertutup kosong', k.bulanTertutup==='');

console.log('\n— 2. ⓪ Pembelian masuk (Supplier → GBJ) —');
const r1 = ctx.simpanPenerimaan({ jenis:'MASUK', supplier:SUP,
  noSuratJalan:'SJ/2026/09/0184', qtyOcr:1000,
  baris:[{kode:'RM-BP-KW', qty:800},{kode:'RM-BP-SUP', qty:200}], ident:{nama:'Yanto'} });
ok('2 baris tersimpan, total 1000 kg', r1.jumlah===2 && r1.totalKg===1000, r1);
const rcv = ctx.baca_(ctx.SHEET.PENERIMAAN);
ok('status MENUNGGU', rcv[0].Status==='MENUNGGU');
ok('selisih OCR = 0 (cocok)', rcv[0].Selisih_OCR===0, rcv[0].Selisih_OCR);
ok('supplier tersimpan', rcv[0].Supplier===SUP);
tolak('masuk tanpa surat jalan ditolak', ()=>ctx.simpanPenerimaan({jenis:'MASUK',supplier:'X',baris:[{kode:'RM-BP-KW',qty:1}]}), /surat jalan/);
tolak('tanpa supplier ditolak', ()=>ctx.simpanPenerimaan({jenis:'MASUK',noSuratJalan:'A',baris:[{kode:'RM-BP-KW',qty:1}]}), /[Ss]upplier/);

console.log('\n— 3. Stok GBJ naik dari pembelian —');
let st = ctx.laporanStok({});
let kw = st.daftar.find(s=>s.kode==='RM-BP-KW');
ok('GBJ biji KW = 800', kw.gbj===800, kw);
ok('kolom beli = 800', kw.beli===800);
ok('total stok 1000 kg', st.total.total===1000, st.total);

console.log('\n— 4. Retur mengurangi stok —');
tolak('retur tanpa rujukan penerimaan ditolak', ()=>ctx.simpanPenerimaan({ jenis:'RETUR', supplier:SUP, baris:[{kode:'RM-BP-KW', qty:50}], ident:{nama:'Yanto'} }), /merujuk penerimaan/);
const bisaRetur = ctx.returTersedia({nama:'Yanto'});
ok('returTersedia: 2 penerimaan (800 & 200)', bisaRetur.length===2 && bisaRetur.some(x=>x.sisa===800), bisaRetur);
const asalKw = bisaRetur.find(x=>x.kode==='RM-BP-KW');
tolak('retur melebihi yang diterima ditolak', ()=>ctx.simpanPenerimaan({ jenis:'RETUR', supplier:SUP, baris:[{kode:'RM-BP-KW', qty:801, idAsal:asalKw.id}], ident:{nama:'Yanto'} }), /melebihi/);
ctx.simpanPenerimaan({ jenis:'RETUR', supplier:SUP, baris:[{kode:'RM-BP-KW', qty:50, idAsal:asalKw.id}], catatan:'karung lembab', ident:{nama:'Yanto'} });
ok('sisa bisa diretur turun jadi 750', ctx.returTersedia({nama:'Yanto'}).find(x=>x.kode==='RM-BP-KW').sisa===750);
st = ctx.laporanStok({}); kw = st.daftar.find(s=>s.kode==='RM-BP-KW');
ok('GBJ KW turun jadi 750', kw.gbj===750, kw);
ok('kolom retur = 50', kw.retur===50);
ok('total stok jadi 950', st.total.total===950, st.total);

console.log('\n— 5. Satu gudang — tidak ada transfer / GP —');
ok('sheet Transfer tidak ada di skema', ctx.SHEET.TRANSFER===undefined && !ctx.SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Transfer'));
ok('fungsi pekerjaan/FIFO tidak ada di whitelist RPC', !ctx.RPC_WL.mulaiPekerjaan && !ctx.RPC_WL.selesaikanPekerjaan && !ctx.RPC_WL.laporanSusut && !ctx.RPC_WL.laporanHpp && !ctx.RPC_WL.laporanStandarSusut);
ok('fungsi shift & tutup bulan ada di whitelist', ctx.RPC_WL.simpanLaporanShift && ctx.RPC_WL.laporanProduksi && ctx.RPC_WL.laporanBulanan && ctx.RPC_WL.tutupBulan);

console.log('\n— 6. ① Laporan shift (v10.1): satu laporan per tanggal+shift, blowing & cutting terpisah —');
const cfg = ctx.konfigurasiShift({});
ok('konfigurasi: 3 kualitas, tidak ada SKU yang kurang, shift 1-2 (12 jam), operator per mesin', cfg.kualitas.length===3 && cfg.kurang.length===0 && cfg.shift.length===2 && /08/.test(cfg.jamShift['1']) && /20/.test(cfg.jamShift['2']) && Array.isArray(cfg.operator.BLOWING) && Array.isArray(cfg.operator.CUTTING), cfg);
ok('bahan baku untuk blowing: biji plastik & pigmen (bukan roll/polybag)', cfg.bahan.some(b=>b.kode==='RM-BP-KW') && !cfg.bahan.some(b=>b.kode==='WIP-ROLL-KW'));
const s1 = ctx.simpanLaporanShift({ shift:'1',
  blowing:{ operator:['Sri','Budi'], ambil:[{kode:'RM-BP-KW', qty:500}], hasil:[{kualitas:'KW', qty:470}], bs:[{kualitas:'KW', qty:20}] },
  cutting:{ operator:'Rina', rollPakai:[{kualitas:'KW', qty:465}], hasil:[{kualitas:'KW', qty:440}], bs:[{kualitas:'KW', qty:25}] },
  catatan:'mesin 1 lancar' }, {});
ok('laporan tersimpan: ID SHF-, blowing ambil 500 roll 470 BS 20', /^SHF-/.test(s1.id) && s1.blowing.totalAmbil===500 && s1.blowing.totalHasil===470 && s1.blowing.totalBs===20, s1);
ok('cutting: roll dipakai 465 (diisi, BUKAN otomatis), polybag 440, BS 25', s1.cutting.totalRoll===465 && s1.cutting.totalHasil===440 && s1.cutting.totalBs===25 && s1.cutting.rollPakai[0].kode==='WIP-ROLL-KW', s1.cutting);
ok('hasil blowing = roll KW, hasil cutting = polybag KW, BS = SCR-BS-KW', s1.blowing.hasil[0].kode==='WIP-ROLL-KW' && s1.cutting.hasil[0].kode==='FG-PB-KW' && s1.blowing.bs[0].kode==='SCR-BS-KW' && s1.cutting.bs[0].kode==='SCR-BS-KW');
ok('operator terpisah per mesin: blowing Sri+Budi, cutting Rina', s1.blowing.operator.length===2 && s1.cutting.operator.length===1 && s1.cutting.operator[0]==='Rina', [s1.blowing.operator, s1.cutting.operator]);
ok('%BS blowing 20/500 = 4, %BS cutting 25/465', s1.blowing.persenBs===4 && s1.cutting.persenBs===Math.round(25/465*10000)/100, [s1.blowing.persenBs, s1.cutting.persenBs]);
ok('jam shift 1 = 08.00–20.00, total BS 45', /08/.test(s1.jam) && s1.totalBs===45);
ok('tidak ada persetujuan: status AKTIF, bolehEdit', s1.status==='AKTIF' && s1.bolehEdit===true);
tolak('laporan dobel (tanggal+shift) ditolak', ()=>ctx.simpanLaporanShift({ shift:'1', blowing:{ operator:'Sri', ambil:[{kode:'RM-BP-KW', qty:1}] } }, {}), /sudah ada/);
st = ctx.laporanStok({});
kw = st.daftar.find(s=>s.kode==='RM-BP-KW');
ok('biji KW keluar gudang: 750 − 500 = 250, dipakai 500', kw.gbj===250 && kw.dipakai===500, kw);
ok('roll KW: dihasilkan 470, dipakai 465 → sisa 5', st.daftar.find(s=>s.kode==='WIP-ROLL-KW').gbj===5 && st.daftar.find(s=>s.kode==='WIP-ROLL-KW').dihasilkan===470, st.daftar.find(s=>s.kode==='WIP-ROLL-KW'));
ok('polybag KW masuk gudang 440', st.daftar.find(s=>s.kode==='FG-PB-KW').gbj===440);
ok('BS KW total 20 + 25 = 45 (dihitung di dua mesin)', st.daftar.find(s=>s.kode==='SCR-BS-KW').gbj===45);
ok('susut TIDAK dihitung per shift (tidak ada field susut)', s1.susut===undefined && s1.status!=='TINGGI');

console.log('\n— 7. Validasi laporan shift —');
tolak('kedua mesin kosong ditolak', ()=>ctx.simpanLaporanShift({ shift:'2', blowing:null, cutting:null }, {}), /minimal satu mesin/);
tolak('cutting: operator ada tapi tanpa roll/polybag ditolak', ()=>ctx.simpanLaporanShift({ shift:'2', cutting:{ operator:'Rina', rollPakai:[], hasil:[], bs:[] } }, {}), /Cutting: isi/);
tolak('blowing: operator ada tapi tanpa ambil/roll ditolak', ()=>ctx.simpanLaporanShift({ shift:'2', blowing:{ operator:'Sri', ambil:[], hasil:[] } }, {}), /Blowing: isi/);
tolak('kualitas tak dikenal ditolak', ()=>ctx.simpanLaporanShift({ shift:'2', cutting:{ operator:'Rina', hasil:[{kualitas:'PREMIUM', qty:1}] } }, {}), /tidak dikenal/);
tolak('shift 3 ditolak (hanya 2 shift × 12 jam)', ()=>ctx.simpanLaporanShift({ shift:'3', cutting:{ operator:'Rina', hasil:[{kualitas:'KW', qty:1}] } }, {}), /1 atau 2/);
tolak('operator cutting kosong ditolak', ()=>ctx.simpanLaporanShift({ shift:'2', cutting:{ operator:'', hasil:[{kualitas:'KW', qty:1}] } }, {}), /Operator cutting/);
tolak('operator blowing kosong ditolak', ()=>ctx.simpanLaporanShift({ shift:'2', blowing:{ operator:[], ambil:[{kode:'RM-BP-KW', qty:1}] } }, {}), /Operator blowing/);
tolak('roll diambil sebagai bahan baku ditolak', ()=>ctx.simpanLaporanShift({ shift:'2', blowing:{ operator:'Sri', ambil:[{kode:'WIP-ROLL-KW', qty:1}], hasil:[{kualitas:'KW', qty:1}] } }, {}), /bukan bahan baku/);
ok('polybag 235 kg TIDAK mengubah roll jadi (roll dipakai diisi sendiri)', (()=>{
  const r = ctx.simpanLaporanShift({ tanggal: ctx.tglStr_(new Date(Date.now()-86400000)), shift:'2',
    blowing:{ operator:'Sri', ambil:[{kode:'RM-BP-KW', qty:250}], hasil:[{kualitas:'KW', qty:240}], bs:[{kualitas:'KW', qty:20}] },
    cutting:{ operator:'Rina', rollPakai:[{kualitas:'KW', qty:200}], hasil:[{kualitas:'KW', qty:235}] } }, {});
  const okk = r.blowing.totalHasil===240 && r.cutting.totalRoll===200 && r.cutting.totalHasil===235;
  ctx.batalkanLaporanShift(r.id, 'uji', {});
  return okk; })());
ok('cutting boleh tanpa blowing (mesin blowing tidak jalan)', (()=>{
  const r = ctx.simpanLaporanShift({ tanggal: ctx.tglStr_(new Date(Date.now()-86400000)), shift:'2', cutting:{ operator:'Rina', rollPakai:[{kualitas:'KW', qty:3}], hasil:[{kualitas:'KW', qty:3}] } }, {});
  const okk = r.blowing.aktif===false && r.blowing.operator.length===0 && r.cutting.aktif===true;
  ctx.batalkanLaporanShift(r.id, 'uji', {});
  return okk; })());

console.log('\n— 8. Shift kedua (Super) + beranda + laporan produksi —');
ctx.simpanLaporanShift({ shift:'2',
  blowing:{ operator:['Sri'], ambil:[{kode:'RM-BP-SUP', qty:200}], hasil:[{kualitas:'SUPER', qty:190}], bs:[{kualitas:'SUPER', qty:5}] },
  cutting:{ operator:['Rina','Budi'], rollPakai:[{kualitas:'SUPER', qty:188}], hasil:[{kualitas:'SUPER', qty:180}], bs:[{kualitas:'SUPER', qty:8}] } }, {});
st = ctx.laporanStok({});
ok('roll Super 190 − 188 = 2, polybag Super 180, BS Super 13', st.daftar.find(s=>s.kode==='WIP-ROLL-SUP').gbj===2 && st.daftar.find(s=>s.kode==='FG-PB-SUP').gbj===180 && st.daftar.find(s=>s.kode==='SCR-BS-SUP').gbj===13);
const kB = ctx.getKonteks({});
ok('beranda: 2 shift hari ini, jadi 620 kg, BS 58 kg', kB.ringkasan.shiftHariIni===2 && kB.ringkasan.jadiHariIni===620 && kB.ringkasan.bsHariIni===58, kB.ringkasan);
const daftar = ctx.daftarLaporanShift({}, 7);
ok('daftar laporan shift: 2, urut terbaru (shift 2 dulu)', daftar.length===2 && daftar[0].shift==='2', daftar.map(d=>d.tanggal+' S'+d.shift));
ok('daftar per tanggal', ctx.daftarLaporanShift({}, 7, kB.hariIni).length===2 && ctx.daftarLaporanShift({}, 7, '2020-01-01').length===0);
const lp = ctx.laporanProduksi(null, {});
ok('laporan produksi total: 2 shift, ambil 700, roll 660, jadi 620, BS 58, roll pakai 653', lp.total.shift===2 && lp.total.ambil===700 && lp.total.roll===660 && lp.total.jadi===620 && lp.total.bs===58 && lp.total.rollPakai===653, lp.total);
ok('roll sisa menurut laporan = 660 − 653 = 7', lp.rollSisaMenurutLaporan===7);
ok('per mesin: BLOWING masuk 700 hasil 660; CUTTING masuk 653 hasil 620', (()=>{const b=lp.perMesin.find(m=>m.mesin==='BLOWING'), c=lp.perMesin.find(m=>m.mesin==='CUTTING'); return b.masuk===700 && b.hasil===660 && b.bs===25 && c.masuk===653 && c.hasil===620 && c.bs===33;})(), lp.perMesin);
ok('per operator per mesin: Sri 2 shift blowing (660 kg), Rina 2 cutting (620), Budi 1 blowing + 1 cutting', lp.perOperator.some(o=>o.operator==='Sri' && o.mesin==='BLOWING' && o.shift===2 && o.hasil===660) && lp.perOperator.some(o=>o.operator==='Rina' && o.mesin==='CUTTING' && o.hasil===620) && lp.perOperator.filter(o=>o.operator==='Budi').length===2, lp.perOperator);
ok('per kualitas: KW jadi 440 BS 45 roll 470; SUPER jadi 180 BS 13', (()=>{const a=lp.perKualitas.find(q=>q.kualitas==='KW'), b=lp.perKualitas.find(q=>q.kualitas==='SUPER'); return a.jadi===440 && a.bs===45 && a.roll===470 && a.rollPakai===465 && b.jadi===180 && b.bs===13;})(), lp.perKualitas);
ok('per hari: 1 hari, 2 shift', lp.perHari.length===1 && lp.perHari[0].shift===2);
ok('laporan produksi tidak memuat harga', JSON.stringify(lp).indexOf('harga')<0 && JSON.stringify(lp).indexOf('hpp')<0);

console.log('\n— 9. ④ Barang keluar ke customer —');
const j = ctx.simpanPengiriman({ jenis:'KELUAR', customer:CUS, noSuratJalan:'DO/2026/09/0042', baris:[{kode:'FG-PB-KW', qty:300}], ident:{nama:'Sri'} });
ctx.simpanPengiriman({ jenis:'KELUAR', customer:CUS2, noSuratJalan:'DO/SCR/1', baris:[{kode:'SCR-BS-KW', qty:5}], ident:{nama:'Sri'} });
ok('BS bisa dijual ke customer', ctx.laporanStok({}).daftar.find(x=>x.kode==='SCR-BS-KW').jual===5);
ok('penjualan 300 kg tersimpan', j.totalKg===300 && j.jenis==='KELUAR', j);
let stokJ = ctx.laporanStok({});
let fg = stokJ.daftar.find(s=>s.kode==='FG-PB-KW');
ok('GBJ polybag KW turun jadi 140', fg.gbj===140, fg);
ok('kolom jual = 300', fg.jual===300, fg);
ok('total keluar di ringkasan', stokJ.total.jual===305, stokJ.total);
tolak('keluar tanpa customer ditolak', ()=>ctx.simpanPengiriman({jenis:'KELUAR',noSuratJalan:'X',baris:[{kode:'FG-PB-KW',qty:1}]}), /[Cc]ustomer/);
tolak('keluar tanpa surat jalan ditolak', ()=>ctx.simpanPengiriman({jenis:'KELUAR',customer:CUS,baris:[{kode:'FG-PB-KW',qty:1}]}), /surat jalan/);

console.log('\n— 9c. Retur dari customer menambah stok —');
ctx.simpanPengiriman({ jenis:'RETUR_MASUK', customer:CUS, baris:[{kode:'FG-PB-KW', qty:25}], catatan:'kemasan sobek', ident:{nama:'Sri'} });
stokJ = ctx.laporanStok({}); fg = stokJ.daftar.find(s=>s.kode==='FG-PB-KW');
ok('GBJ naik lagi jadi 165', fg.gbj===165, fg);
ok('kolom retur customer = 25', fg.returCust===25, fg);

console.log('\n— 9d. Laporan penjualan —');
ctx.simpanPengiriman({ jenis:'KELUAR', customer:CUS2, noSuratJalan:'DO/2026/09/0043', baris:[{kode:'FG-PB-SUP', qty:120}], ident:{nama:'Yanto'} });
const jual = ctx.laporanPenjualan(30, {});
ok('total keluar 425 kg', jual.total.keluar===425, jual.total);
ok('total retur customer 25 kg', jual.total.retur===25, jual.total);
ok('bersih 400 kg', jual.total.bersih===400, jual.total);
ok('2 customer', jual.perCustomer.length===2, jual.perCustomer);
const cNur = jual.perCustomer.find(c=>c.customer===CUS);
ok('Nursery bersih 275 kg', cNur.bersih===275, cNur);
ok('perItem ada 3 item', jual.perItem.length===3, jual.perItem);
ok('perItem diurut bersih desc', jual.perItem[0].bersih >= jual.perItem[1].bersih);

console.log('\n— 10. Antrian review gabungan (laporan shift TIDAK masuk antrian) —');
ctx.simpanPenerimaan({jenis:'MASUK',supplier:SUP2,noSuratJalan:'SJ/2', baris:[{kode:'RM-PG-KW',qty:40},{kode:'RM-AF',qty:10},{kode:'RM-BP-SPL',qty:100}]});
const q = ctx.antrianReview({});
ok('pembelian + penjualan satu antrian = 10', q.length===10, q.length);
ok('ada entri PENERIMAAN', q.some(x=>x.sumber==='PENERIMAAN'));
ok('tidak ada entri SHIFT', !q.some(x=>x.sumber==='SHIFT' || /SHF-/.test(x.id)));
ok('label retur benar', q.some(x=>x.jenis==='RETUR' && /^GBJ →/.test(x.label)), q.filter(x=>x.jenis==='RETUR')[0]);
ok('label pembelian benar', q.some(x=>x.jenis==='MASUK' && / → GBJ$/.test(x.label)));
const idRcv = q.find(x=>x.sumber==='PENERIMAAN').id;
const idTrf = q.find(x=>x.sumber==='PENERIMAAN' && x.kode==='RM-AF').id;   // antifoam 10 kg dipakai untuk uji Tandai → Batal
ctx.tinjauTransfer(idRcv,'setuju','',{});
ctx.tinjauTransfer(idTrf,'tandai','foto buram',{});
ok('ada entri PENGIRIMAN', q.some(x=>x.sumber==='PENGIRIMAN'));
ok('label penjualan benar', q.some(x=>x.jenis==='KELUAR' && /^GBJ → PT Nursery/.test(x.label)), q.filter(x=>x.jenis==='KELUAR')[0]);
ok('label retur customer benar', q.some(x=>x.jenis==='RETUR_MASUK' && / → GBJ$/.test(x.label)));
const idOut = q.find(x=>x.sumber==='PENGIRIMAN').id;
ctx.tinjauTransfer(idOut,'setuju','',{});
ok('review pengiriman jalan (routing ID benar)', ctx.antrianReview({}).length===7, ctx.antrianReview({}).length);
tolak('tidak bisa review 2x', ()=>ctx.tinjauTransfer(idRcv,'setuju','',{}), /sudah final/);

console.log('\n— 11. Review: Setuju / Tandai (arsip) / Batal —');
const arsip = ctx.antrianReview({}, 'DITANDAI');
ok('entri ditandai muncul di tab Ditandai', arsip.some(x=>x.id===idTrf), arsip.map(x=>x.id));
ok('catatan tinjau ikut', arsip.find(x=>x.id===idTrf).catatanTinjau==='foto buram');
const trfDitandai = ctx.baca_(ctx.SHEET.PENERIMAAN).find(r=>r.ID===idTrf);
const stokA = ctx.laporanStok({}); const itemA = stokA.daftar.find(x=>x.kode===trfDitandai.Kode_Item);
ok('DITANDAI tetap dihitung di stok', itemA.beli >= trfDitandai.Qty_Kg, {arus:itemA.beli, qty:trfDitandai.Qty_Kg});
tolak('tidak bisa tandai dua kali', ()=>ctx.tinjauTransfer(idTrf,'tandai','',{}), /sudah ditandai/);
ctx.tinjauTransfer(idTrf,'batal','salah item',{});
const stokB = ctx.laporanStok({}); const itemB = stokB.daftar.find(x=>x.kode===trfDitandai.Kode_Item) || {beli:0};
ok('DIBATALKAN dikeluarkan dari stok', Math.abs((itemA.beli - itemB.beli) - trfDitandai.Qty_Kg) < 0.01, {sebelum:itemA.beli, sesudah:itemB.beli});
ok('catatan tinjau digabung', ctx.baca_(ctx.SHEET.PENERIMAAN).find(r=>r.ID===idTrf).Catatan_Tinjau==='foto buram | salah item');
tolak('final tidak bisa diubah lagi', ()=>ctx.tinjauTransfer(idTrf,'setuju','',{}), /sudah final/);
ok('hilang dari tab Ditandai', !ctx.antrianReview({}, 'DITANDAI').some(x=>x.id===idTrf));
const qB = ctx.antrianReview({}); const idB = qB[0].id;
ctx.tinjauTransfer(idB,'batal','dobel input',{});
ok('menunggu -> batal langsung', !ctx.antrianReview({}).some(x=>x.id===idB));
ok('ringkasan hitung ditandai', typeof ctx.getKonteks({}).ringkasan.ditandai === 'number');

console.log('\n— 12. Laporan pembelian —');
const beli = ctx.riwayatPenerimaan(30, {});
ok('total masuk 1040 kg (antifoam 10 kg & Super Plus 100 kg dibatalkan tidak dihitung)', beli.total.masuk===1040, beli.total);
ok('total retur 50 kg', beli.total.retur===50, beli.total);
ok('bersih 990 kg', beli.total.bersih===990, beli.total);
ok('2 supplier', beli.perSupplier.length===2, beli.perSupplier);

console.log('\n— 12b. Neraca stok per item konsisten —');
const stokAkhir = ctx.laporanStok({});
let semuaCocok = true, contoh = null;
stokAkhir.daftar.forEach(function(s){
  // GBJ = awal + beli − retur supplier + retur customer − terjual − dipakai (ambil biji / roll terpakai) + dihasilkan (roll / polybag / BS) − scrap ke chassen + biji daur ulang − rusak ± opname
  const gbjHitung = s.awal + s.beli - s.retur + s.returCust - s.jual - s.dipakai + s.dihasilkan - s.daurKirim + s.daurHasil - s.rusak + s.opname;
  if (Math.abs(gbjHitung - s.gbj) > 0.01){ semuaCocok = false; contoh = {item:s.nama, gbjHitung, gbj:s.gbj}; }
});
ok('baris neraca menjumlah persis ke saldo (satu gudang)', semuaCocok, contoh);
ok('total = gbj tiap item', stokAkhir.daftar.every(s=>Math.abs(s.gbj-s.total)<0.01));
ok('roll ikut di laporan stok dengan kategori ROLL', stokAkhir.daftar.some(s=>s.kode==='WIP-ROLL-KW' && s.kategori==='ROLL'));

console.log('\n— 12c. HPP rata-rata: biji → roll → polybag; hanya untuk manager —');
const kM = ctx.getKonteks({});
ok('admin lihatHpp = true', kM.lihatHpp===true);
ok('items tidak bawa harga ke client', kM.items.every(i=>i.harga===undefined));
const nilai = ctx.laporanNilaiStok({});
ok('metode RATA', nilai.metode==='RATA');
const nKw = nilai.daftar.find(x=>x.kode==='RM-BP-KW');
ok('biji KW sisa 250 kg @13.000 (harga master, penerimaan tanpa PO)', nKw.qty===250 && nKw.rata===13000, nKw);
// roll KW: (500 × 13.000 + 500 × 2.500 proses) / 470 kg = 16.489,36/kg ; cutting: 465 × 16.489,36 / 440 = 17.426,26/kg
const hargaRoll = (500*13000 + 500*2500)/470, hargaPb = 465*hargaRoll/440;
const nRoll = nilai.daftar.find(x=>x.kode==='WIP-ROLL-KW');
ok('roll KW sisa 5 kg @ (biji + biaya proses)/hasil = 16.489', nRoll.qty===5 && nRoll.rata===Math.round(hargaRoll), nRoll);
const nPb = nilai.daftar.find(x=>x.kode==='FG-PB-KW');
ok('polybag KW @ roll terpakai / polybag = 17.426', nPb.rata===Math.round(hargaPb), nPb);
ok('BS dinilai 0 (nilainya kembali lewat jasa chassen)', nilai.daftar.filter(x=>/^SCR/.test(x.kode)).every(x=>x.nilai===0 && x.rata===0), nilai.daftar.filter(x=>/SCR/.test(x.kode)));
const kirimRow = ctx.baca_(ctx.SHEET.PENGIRIMAN).find(r=>r.ID===j.ids[0]);
ok('pengiriman menyimpan HPP_Per_Kg rata-rata polybag', Math.abs(kirimRow.HPP_Per_Kg - hargaPb) < 0.01, kirimRow.HPP_Per_Kg);
ok('nilai stok total > 0', nilai.total.nilai > 0);

console.log('\n— 12d. Kalender —');
const kal = ctx.kalender(null, {});
const hariIni = kal.hari.find(h=>h.tanggal===kal.hariIni);
ok('hari ini ada kejadian', hariIni && hariIni.kejadian.length>0, hariIni && hariIni.kejadian.length);
ok('shift dihitung: 2', hariIni.shift===2, hariIni.shift);
ok('kejadian SHIFT dengan polybag, roll, ambil & bs', hariIni.kejadian.some(e=>e.jenis==='SHIFT' && e.qty===440 && e.roll===470 && e.ambil===500 && e.bs===45 && e.sheet==='shift' && e.jam==='S1' && /Blowing/.test(e.label) && /Cutting/.test(e.label)), hariIni.kejadian.filter(e=>e.jenis==='SHIFT'));
ok('kejadian urut terbaru dulu', hariIni.kejadian[0].t >= hariIni.kejadian[hariIni.kejadian.length-1].t);
ok('kalender tidak bocorkan harga/HPP', JSON.stringify(kal).indexOf('hpp')===-1 && JSON.stringify(kal).indexOf('Harga')===-1);
const kalLalu = ctx.kalender('2020-01', {});
ok('bulan kosong -> tidak ada hari', kalLalu.hari.length===0 && kalLalu.jumlahHari===31);

console.log('\n— 13. Ubah & batalkan laporan shift —');
const u1 = ctx.ubahLaporanShift(s1.id, { blowing:{ operator:['Sri','Budi'], ambil:[{kode:'RM-BP-KW', qty:500}], hasil:[{kualitas:'KW', qty:475}], bs:[{kualitas:'KW', qty:15}] } }, {});
ok('ubah roll 470 → 475, BS blowing 20 → 15, log tercatat', u1.ok && u1.laporan.blowing.totalHasil===475 && u1.laporan.blowing.totalBs===15 && /roll jadi 470 → 475/.test(u1.log.join(';')), u1.log);
ok('cutting tidak ikut berubah (bagian yang tidak dikirim tetap)', u1.laporan.cutting.totalRoll===465 && u1.laporan.cutting.totalHasil===440 && u1.laporan.cutting.operator[0]==='Rina');
ok('detail ditulis ulang (tidak ditumpuk): 3 blowing + 3 cutting', ctx.baca_(ctx.SHEET.SHIFT_DETAIL).filter(d=>d.ID_Shift===s1.id).length===6);
ok('stok ikut: roll KW 475 − 465 = 10', ctx.laporanStok({}).daftar.find(s=>s.kode==='WIP-ROLL-KW').gbj===10);
ok('ambilLaporanShift', ctx.ambilLaporanShift(s1.id, {}).blowing.totalHasil===475 && /Log|roll/.test(ctx.ambilLaporanShift(s1.id, {}).logEdit));
const u2 = ctx.ubahLaporanShift(s1.id, { cutting:{ operator:'Dewi', rollPakai:[{kualitas:'KW', qty:465}], hasil:[{kualitas:'KW', qty:440}], bs:[{kualitas:'KW', qty:25}] } }, {});
ok('ganti operator cutting → Dewi, blowing tetap Sri+Budi', u2.laporan.cutting.operator[0]==='Dewi' && u2.laporan.blowing.operator.length===2 && /operator cutting: Dewi/.test(u2.log.join(';')), u2.log);
const kemarinT = ctx.tglStr_(new Date(Date.now()-86400000));
const s3 = ctx.simpanLaporanShift({ tanggal:kemarinT, shift:'1', blowing:{ operator:'Sri', ambil:[{kode:'RM-BP-KW', qty:10}], hasil:[{kualitas:'KW', qty:9}] } }, {});
ctx.batalkanLaporanShift(s3.id, 'salah shift', {});
ok('dibatalkan: tidak dihitung di stok & hilang dari daftar', ctx.laporanStok({}).daftar.find(s=>s.kode==='RM-BP-KW').gbj===250 && !ctx.daftarLaporanShift({},7).some(x=>x.id===s3.id));
tolak('batal 2x ditolak', ()=>ctx.batalkanLaporanShift(s3.id, '', {}), /sudah dibatalkan/);
tolak('ubah yang dibatalkan ditolak', ()=>ctx.ubahLaporanShift(s3.id, {}, {}), /sudah dibatalkan/);
ok('setelah dibatalkan, tanggal+shift yang sama boleh diisi lagi', ctx.simpanLaporanShift({ tanggal:kemarinT, shift:'1', blowing:{ operator:'Sri', ambil:[{kode:'RM-BP-KW', qty:10}], hasil:[{kualitas:'KW', qty:9}], bs:[{kualitas:'KW', qty:1}] } }, {}).blowing.totalAmbil===10);
ok('aktivitas staf mencatat SHIFT untuk pencatat', (()=>{ const a=ctx.aktivitasStaf('', 30, {}).daftar.find(x=>x.jenis && x.jenis.SHIFT); return !!a && a.jenis.SHIFT>=3; })(), ctx.aktivitasStaf('', 30, {}).daftar.map(x=>[x.nama,x.jenis]));

console.log('\n— 15. Parser surat jalan —');
const p = ctx.parseSuratJalan_('SURAT JALAN No : SJ/2026/09/0184\n1. Biji Plastik KW ... 250 kg\n2. Biji Plastik Super ... 1.250,5 kg\nTotal Netto : 1500,5');
ok('no SJ terbaca', p.noSuratJalan==='SJ/2026/09/0184', p.noSuratJalan);
ok('1.250,5 -> 1250.5', p.kandidatQty.some(c=>c.qty===1250.5));
ok('saran nilai terbesar bersatuan', p.qtySaran===1250.5, p.qtySaran);
[['1.250,5',1250.5],['1,250.5',1250.5],['1.250',1250],['250',250],['12,5',12.5],['0,75',0.75]].forEach(([i,e])=>{
  ok('normalisasi '+i+' -> '+e, ctx.normalisasiAngka_(i)===e, ctx.normalisasiAngka_(i));
});

console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
