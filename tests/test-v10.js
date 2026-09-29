/* v10: tutup bulan — COGS periodik (stok awal + pembelian − retur + jasa + proses − stok akhir), laba kotor,
   susut kelihatan saat tutup bulan (bukan per shift), kunci transaksi bulan tertutup, buka lagi (admin). */
const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'pemilik@contoh.co.id';","return '';");
fs.writeFileSync(__dirname + '/.h10.js', src);
const {ctx}=require(__dirname + '/.h10.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,e===undefined?'':JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }
ctx.setupSistem();
const SPV={nama:'Manager',pin:'1357'}, MP={nama:'Manager Produksi',pin:'1122'}, SM={nama:'Sales Manager',pin:'3344'}, STAF={nama:'Staff Gudang',pin:'1111'}, ADM={nama:'Admin',pin:'1234'};
const SUP='PT Sumber Biji Plastik', CUS='PT Nursery Hijau Lestari', VENDOR='UD Daur Ulang Makmur';
const KW='RM-BP-KW', ROLL='WIP-ROLL-KW', FG='FG-PB-KW', BS='SCR-BS-KW', DU='RM-BP-DU';

/* tanggal: bulan lalu (B) — hari ke-10, 12, 13, 14 dan hari terakhir (semua ≤ 60 hari ke belakang) */
const hariIni = ctx.tglStr_(new Date()), N = hariIni.slice(0,7);
const B = ctx.bulanSebelum_(N), B_AKHIR = ctx.akhirBulan_(B);
const tB = (d)=>B+'-'+String(d).padStart(2,'0');
const proses = 2500;

console.log('— Transaksi bulan lalu ('+B+') —');
const po = ctx.simpanPo({supplier:SUP, tanggal:tB(9), topHari:30, baris:[{kode:KW, qty:1000, harga:12000}]}, SM);
ok('PO oleh Sales Manager (SUPERVISOR) dengan TOP', po.ok && ctx.baca_(ctx.SHEET.PO)[0].TOP_Hari===30);
const rc = ctx.simpanPenerimaan({jenis:'MASUK', supplier:SUP, tanggal:tB(10), noSuratJalan:'SJ/B/1', baris:[{kode:KW, qty:1000, idPo:po.ids[0]}], ident:STAF});
ctx.tinjauTransfer(rc.ids[0], 'setuju', '', SPV);
const shB = ctx.simpanLaporanShift({tanggal:tB(10), shift:'1', blowing:{operator:['Sri','Budi'], ambil:[{kode:KW, qty:600}], hasil:[{kualitas:'KW', qty:580}], bs:[{kualitas:'KW', qty:10}]}, cutting:{operator:'Rina', rollPakai:[{kualitas:'KW', qty:575}], hasil:[{kualitas:'KW', qty:560}], bs:[{kualitas:'KW', qty:15}]}}, MP);
ok('Manager Produksi mengisi laporan shift bulan lalu (blowing + cutting)', shB.pencatat==='Manager Produksi' && shB.cutting.totalRoll===575 && shB.blowing.totalHasil===580);
const so = ctx.simpanSo({customer:CUS, tanggal:tB(11), tanggalKirim:tB(12), topHari:14, baris:[{kode:FG, qty:300, harga:25000}]}, SM);
ok('SO oleh Sales Manager: customer, TOP 14, tanggal kirim, item, harga', so.ok && ctx.baca_(ctx.SHEET.SO)[0].Jatuh_Tempo===ctx.jatuhTempo_(tB(12),14));
const kirim = ctx.simpanPengiriman({jenis:'KELUAR', customer:CUS, tanggal:tB(12), noSuratJalan:'DO/B/1', baris:[{kode:FG, qty:300, idSo:so.ids[0]}], ident:STAF});
ctx.simpanPengiriman({jenis:'KELUAR', customer:'Toko Tani Sejahtera', tanggal:tB(12), noSuratJalan:'DO/B/2', baris:[{kode:FG, qty:50}], ident:STAF});   // tanpa SO → tidak ada nilai jual
const du = ctx.mulaiDaurUlang({vendor:VENDOR, tanggal:tB(13), scrap:[{kode:BS, qty:20}], ident:STAF});
ctx.selesaikanDaurUlang({id:du.id, tanggalTerima:tB(14), hasil:[{kode:DU, qty:18}], biayaJasa:90000, ident:SPV});
const rusak = ctx.simpanKerusakan({kode:FG, qty:5, tanggal:tB(11), penyebab:'kena air', ident:STAF});
ctx.tinjauKerusakan(rusak.id, 'setuju', '', SPV);
/* opname akhir bulan: biji KW fisik 396 (sistem 400 → kurang 4) — tanggal digeser ke akhir bulan B */
const op = ctx.simpanOpname({baris:[{kode:KW, fisik:396}], catatan:'opname akhir bulan'}, SPV);
ctx.baca_(ctx.SHEET.OPNAME).forEach(r=>{ if (r.ID_Sesi===op.idSesi || r.Kode_Item===KW) ctx.ubahBaris_(ctx.SHEET.OPNAME, r._baris, { Tanggal: B_AKHIR }); });
ok('opname kurang 4 kg', op.kurang===4, op);

console.log('\n— Laporan bulanan: COGS periodik & laba kotor —');
tolak('staf tidak boleh', ()=>ctx.laporanBulanan(B, STAF), /Manager/);
tolak('format bulan salah', ()=>ctx.laporanBulanan('2026/08', SPV), /YYYY-MM/);
const lb = ctx.laporanBulanan(B, SPV);
const hargaRoll = (600*12000 + 600*proses)/580;                 // = 15.000
const hargaPb = 575*hargaRoll/560;
const stokAkhir = 396*12000 + 5*hargaRoll + 205*hargaPb + 18*5000;   // BS dinilai 0
const cogs = Math.round(0 + 12000000 - 0 + 90000 + 600*proses - Math.round(stokAkhir));
ok('nilai stok awal bulan = 0 (belum ada apa-apa sebelum '+B+')', lb.nilaiStokAwal===0, lb.nilaiStokAwal);
ok('pembelian 12 jt (1000 kg), retur 0', lb.pembelian===12000000 && lb.pembelianKg===1000 && lb.returSupplier===0, [lb.pembelian, lb.pembelianKg]);
ok('jasa chassen 90.000, biaya proses 600 × 2.500 = 1,5 jt', lb.jasaChassen===90000 && lb.biayaProses===1500000, [lb.jasaChassen, lb.biayaProses]);
ok('nilai stok akhir = biji 396@12.000 + roll 5@15.000 + polybag 205@15.402 + biji DU 18@5.000', lb.nilaiStokAkhir===Math.round(stokAkhir), [lb.nilaiStokAkhir, Math.round(stokAkhir)]);
ok('COGS = awal + pembelian − retur + jasa + proses − akhir', lb.cogs===cogs, [lb.cogs, cogs]);
const cogsCek = 350*hargaPb + 5*hargaPb + 4*12000;                    // yang keluar dari stok: terjual 350, rusak 5, susut opname 4
ok('COGS = nilai barang keluar (terjual 350 + rusak 5 + opname 4) — konsisten dengan mesin rata-rata', Math.abs(lb.cogs - cogsCek) <= 1, [lb.cogs, cogsCek]);
ok('penjualan 300 × 25.000 = 7,5 jt (yang ada harga SO), 50 kg tanpa SO', lb.penjualan===7500000 && lb.penjualanKg===350 && lb.penjualanTanpaSoKg===50, [lb.penjualan, lb.penjualanKg, lb.penjualanTanpaSoKg]);
ok('laba kotor = 7,5 jt − COGS', lb.labaKotor===7500000-cogs && lb.marginPersen===Math.round((7500000-cogs)/7500000*10000)/100, [lb.labaKotor, lb.marginPersen]);
ok('perKategori: BAHAN_BAKU, ROLL, BARANG_JADI, SCRAP ada', lb.perKategori.BAHAN_BAKU && lb.perKategori.ROLL && lb.perKategori.BARANG_JADI && lb.perKategori.SCRAP && lb.perKategori.SCRAP.akhir===0, Object.keys(lb.perKategori));
ok('rusak 5 kg dinilai rata-rata polybag', lb.rusak.kg===5 && Math.abs(lb.rusak.nilai - 5*hargaPb) <= 1, lb.rusak);
ok('daur ulang: 1 batch, 20 → 18 kg, jasa 90.000', lb.daurUlang.batch===1 && lb.daurUlang.scrapKg===20 && lb.daurUlang.hasilKg===18, lb.daurUlang);

console.log('\n— Susut kelihatan di tutup bulan —');
ok('produksi: masuk 600, roll 580, roll pakai 575, jadi 560, BS 10 + 15 = 25', lb.produksi.masukProduksiKg===600 && lb.produksi.rollKg===580 && lb.produksi.rollPakaiKg===575 && lb.produksi.hasilJadiKg===560 && lb.produksi.bsBlowingKg===10 && lb.produksi.bsCuttingKg===15 && lb.produksi.bsKg===25, lb.produksi);
ok('Δroll = +5 kg; susut produksi = 600 − 560 − 25 − 5 = 10 kg', lb.rollPerubahanKg===5 && lb.susut.produksiKg===10, [lb.rollPerubahanKg, lb.susut]);
ok('susut opname −4 kg → total 14 kg = 2,33% dari biji masuk', lb.susut.opnameMinusKg===4 && lb.susut.totalKg===14 && lb.susutPersen===2.33 && lb.susut.sesiOpname===1, lb.susut);
ok('jadi per kualitas: KW 560; BS per kualitas: KW 25', lb.produksi.jadiPerKualitas.KW===560 && lb.produksi.bsPerKualitas.KW===25);
ok('belum ditutup: bolehTutup untuk manager, bolehBuka false', lb.tertutup===false && lb.bolehTutup===true && lb.bolehBuka===false && lb.snapshot===null);
ok('laporan bulan ini: bolehTutup false (belum selesai)', ctx.laporanBulanan(N, SPV).bolehTutup===false);
ok('laporanBulanan tanpa argumen = bulan lalu', ctx.laporanBulanan(null, SPV).bulan===B);

console.log('\n— Tutup bulan —');
tolak('staf tidak boleh', ()=>ctx.tutupBulan(B, '', STAF), /Manager/);
tolak('bulan ini belum bisa ditutup', ()=>ctx.tutupBulan(N, '', SPV), /belum selesai/);
tolak('bulan depan ditolak', ()=>ctx.tutupBulan('2099-01', '', SPV), /belum selesai/);
const tb = ctx.tutupBulan(B, 'tutup buku '+B, SPV);
ok('bulan ditutup: COGS & laba kotor & susut sama dengan laporan', tb.ok && tb.cogs===lb.cogs && tb.labaKotor===lb.labaKotor && tb.susutKg===14, tb);
const rowT = ctx.baca_(ctx.SHEET.TUTUP).find(r=>r.ID===tb.id);
ok('snapshot tersimpan di Tutup_Bulan (status DITUTUP, Detail_JSON)', rowT.Status==='DITUTUP' && rowT.Bulan===B && rowT.COGS===lb.cogs && rowT.Nama_Penutup==='Manager' && JSON.parse(rowT.Detail_JSON).produksi.masukProduksiKg===600, rowT);
tolak('tutup dua kali ditolak', ()=>ctx.tutupBulan(B, '', SPV), /sudah ditutup/);
tolak('bulan sebelum yang sudah ditutup tidak bisa ditutup (urutan)', ()=>ctx.tutupBulan(ctx.bulanSebelum_(B), '', SPV), /ditutup lebih dulu/);
ok('konteks: bulanTertutup = '+B, ctx.getKonteks(STAF).bulanTertutup===B);
const lb2 = ctx.laporanBulanan(B, SPV);
ok('laporan setelah tutup: tertutup, snapshot ikut, bolehTutup false', lb2.tertutup===true && lb2.snapshot.cogs===lb.cogs && lb2.bolehTutup===false && lb2.bolehBuka===false);
ok('admin boleh buka', ctx.laporanBulanan(B, ADM).bolehBuka===true);
ok('log audit TUTUP_BULAN', ctx.baca_(ctx.SHEET.LOG).some(r=>r.Aksi==='TUTUP_BULAN' && r.Referensi===B));
const dt = ctx.daftarTutupBulan(SPV);
ok('daftarTutupBulan: 1 bulan, terakhirTertutup', dt.daftar.length===1 && dt.daftar[0].bulan===B && dt.daftar[0].status==='DITUTUP' && dt.terakhirTertutup===B && dt.bolehTutup===true && dt.bolehBuka===false, dt);
tolak('staf tidak boleh lihat daftar tutup bulan', ()=>ctx.daftarTutupBulan(STAF), /Manager/);

console.log('\n— Bulan tertutup terkunci —');
tolak('laporan shift bertanggal bulan tertutup ditolak', ()=>ctx.simpanLaporanShift({tanggal:tB(20), shift:'2', blowing:{operator:'Sri', ambil:[{kode:KW, qty:1}], hasil:[{kualitas:'KW', qty:1}]}}, MP), /sudah ditutup/);
tolak('penerimaan bertanggal bulan tertutup ditolak', ()=>ctx.simpanPenerimaan({jenis:'MASUK', supplier:SUP, tanggal:tB(20), noSuratJalan:'SJ/X', baris:[{kode:KW, qty:1}], ident:STAF}), /sudah ditutup/);
tolak('pengiriman bertanggal bulan tertutup ditolak', ()=>ctx.simpanPengiriman({jenis:'KELUAR', customer:CUS, tanggal:tB(20), noSuratJalan:'DO/X', baris:[{kode:FG, qty:1}], ident:STAF}), /sudah ditutup/);
tolak('ubah laporan shift bulan tertutup ditolak', ()=>ctx.ubahLaporanShift(shB.id, {blowing:{operator:'Sri', hasil:[{kualitas:'KW', qty:1}]}}, MP), /sudah ditutup/);
tolak('batalkan laporan shift bulan tertutup ditolak', ()=>ctx.batalkanLaporanShift(shB.id, 'x', MP), /sudah ditutup/);
tolak('edit penerimaan bulan tertutup ditolak (manager pun)', ()=>ctx.simpanEditEntri(rc.ids[0], {qty:999}, SPV), /sudah ditutup/);
ok('riwayat input: kunci BULAN_TUTUP', ctx.riwayatInput('BELI_MASUK', 60, SPV).find(x=>x.id===rc.ids[0]).kunci==='BULAN_TUTUP');
tolak('batalkan pengiriman bulan tertutup ditolak', ()=>ctx.tinjauTransfer(kirim.ids[0], 'batal', 'x', SPV), /sudah ditutup/);
tolak('ubah batch daur ulang bulan tertutup ditolak', ()=>ctx.ubahDaurUlang(du.id, {biayaJasa:1}, SPV), /sudah ditutup/);
tolak('batalkan batch daur ulang bulan tertutup ditolak', ()=>ctx.batalkanDaurUlang(du.id, 'x', SPV), /sudah ditutup/);
ok('laporan shift bulan tertutup: bolehEdit false', ctx.ambilLaporanShift(shB.id, MP).bolehEdit===false);
ok('transaksi bulan ini tetap bisa', ctx.simpanLaporanShift({shift:'1', blowing:{operator:'Sri', ambil:[{kode:KW, qty:100}], hasil:[{kualitas:'KW', qty:96}], bs:[{kualitas:'KW', qty:2}]}}, MP).blowing.totalAmbil===100);
ctx.simpanPengiriman({jenis:'KELUAR', customer:CUS, noSuratJalan:'DO/N/1', baris:[{kode:FG, qty:20}], ident:STAF});
ok('laporan bulan lalu tidak berubah oleh transaksi bulan ini', ctx.laporanBulanan(B, SPV).cogs===lb.cogs && ctx.laporanBulanan(B, SPV).nilaiStokAkhir===lb.nilaiStokAkhir);
ok('nilai stok awal bulan ini = nilai stok akhir bulan lalu', ctx.laporanBulanan(N, SPV).nilaiStokAwal===lb.nilaiStokAkhir, [ctx.laporanBulanan(N, SPV).nilaiStokAwal, lb.nilaiStokAkhir]);

console.log('\n— Ekspor bulanan memakai angka yang sama —');
const ex = ctx.eksporBulanan(B, SPV);
const ring = Object.fromEntries(ex.ringkasan);
ok('ringkasan ekspor: COGS, laba kotor, susut = laporan bulanan', ring['COGS bulan (stok awal + pembelian − retur + jasa chassen + biaya proses − stok akhir)']===lb.cogs && ring['Laba kotor bulan (penjualan dari harga SO − COGS)']===lb.labaKotor && ring['Susut produksi (kg, biji masuk − polybag − BS − perubahan roll)']===14, ring);
ok('ekspor bulan tertutup tetap boleh (hanya baca)', ex.files.length===7);

console.log('\n— Buka lagi (Admin) —');
tolak('manager tidak boleh buka', ()=>ctx.bukaBulan(B, 'salah', SPV), /Admin/);
tolak('alasan wajib', ()=>ctx.bukaBulan(B, '', ADM), /Alasan/);
tolak('bulan yang tidak tertutup', ()=>ctx.bukaBulan(N, 'x', ADM), /tidak dalam keadaan tertutup/);
const bk = ctx.bukaBulan(B, 'ada laporan shift yang terlewat', ADM);
ok('bulan dibuka: status DIBUKA, catatan & log', bk.ok && ctx.baca_(ctx.SHEET.TUTUP).find(r=>r.ID===tb.id).Status==='DIBUKA' && /dibuka .* oleh Admin: ada laporan/.test(ctx.baca_(ctx.SHEET.TUTUP).find(r=>r.ID===tb.id).Catatan) && ctx.baca_(ctx.SHEET.LOG).some(r=>r.Aksi==='BUKA_BULAN'));
ok('konteks: bulanTertutup kosong lagi', ctx.getKonteks(STAF).bulanTertutup==='');
const shTambah = ctx.simpanLaporanShift({tanggal:tB(20), shift:'2', blowing:{operator:'Sri', ambil:[{kode:KW, qty:50}], hasil:[{kualitas:'KW', qty:48}], bs:[{kualitas:'KW', qty:1}]}}, MP);
ok('laporan shift yang terlewat bisa ditambah', shTambah.blowing.totalAmbil===50);
const lb3 = ctx.laporanBulanan(B, SPV);
ok('laporan bulanan ikut laporan baru: masuk 650, proses 1,625 jt, stok akhir +125rb (nilai tetap di roll → COGS sama)', lb3.produksi.masukProduksiKg===650 && lb3.biayaProses===1625000 && lb3.nilaiStokAkhir===lb.nilaiStokAkhir+125000 && lb3.cogs===lb.cogs, [lb3.produksi.masukProduksiKg, lb3.biayaProses, lb3.nilaiStokAkhir-lb.nilaiStokAkhir]);
const tb2 = ctx.tutupBulan(B, 'tutup ulang', SPV);
ok('tutup ulang: baris baru, yang lama tetap DIBUKA (riwayat)', tb2.ok && tb2.id!==tb.id && ctx.baca_(ctx.SHEET.TUTUP).length===2 && ctx.baca_(ctx.SHEET.TUTUP).find(r=>r.ID===tb.id).Status==='DIBUKA');
ok('daftarTutupBulan: baris terakhir per bulan yang berlaku', ctx.daftarTutupBulan(SPV).daftar.length===1 && ctx.daftarTutupBulan(SPV).daftar[0].id===tb2.id && ctx.daftarTutupBulan(SPV).daftar[0].cogs===lb3.cogs);
tolak('hanya bulan tertutup terakhir yang bisa dibuka', ()=>ctx.bukaBulan(ctx.bulanSebelum_(B), 'x', ADM), /tidak dalam keadaan tertutup/);

console.log('\n— v10.1: Opname produksi (buta) + rekonsiliasi Admin —');
ok('RPC: simpanOpnameProduksi, daftarOpnameProduksi, rekonsiliasiProduksi ada di whitelist', ctx.RPC_WL.simpanOpnameProduksi && ctx.RPC_WL.daftarOpnameProduksi && ctx.RPC_WL.rekonsiliasiProduksi);
tolak('staf tidak boleh isi opname produksi', ()=>ctx.simpanOpnameProduksi({bulan:N, polybag:[{kualitas:'KW', qty:1}]}, STAF), /Manager/);
tolak('bulan tertutup ditolak', ()=>ctx.simpanOpnameProduksi({bulan:B, polybag:[{kualitas:'KW', qty:1}]}, SPV), /sudah ditutup/);
tolak('bulan depan ditolak', ()=>ctx.simpanOpnameProduksi({bulan:'2099-01', polybag:[{kualitas:'KW', qty:1}]}, SPV), /belum berjalan/);
tolak('angka negatif ditolak', ()=>ctx.simpanOpnameProduksi({bulan:N, polybag:[{kualitas:'KW', qty:-1}]}, SPV), /negatif/);
tolak('kosong ditolak', ()=>ctx.simpanOpnameProduksi({bulan:N, polybag:[], bs:[]}, SPV), /Belum ada angka/);
tolak('kualitas tak dikenal ditolak', ()=>ctx.simpanOpnameProduksi({bulan:N, polybag:[{kualitas:'X', qty:1}]}, SPV), /tidak dikenal/);
const op1 = ctx.simpanOpnameProduksi({bulan:N, polybag:[{kualitas:'KW', qty:80}], bs:[{kualitas:'KW', qty:2}], biji:[{kode:KW, qty:5}], roll:[{kualitas:'KW', qty:3}], wipMesin:2, catatan:'hitung 30/9'}, SPV);
ok('manager isi opname: total dihitung sistem = 80+2+5+3+2 = 92', op1.ok && /^OPP-/.test(op1.id) && op1.totalKg===92 && op1.polybagKg===80 && op1.bijiProduksiKg===5 && op1.wipMesinKg===2, op1);
ok('balasan ke pengisi TIDAK memuat angka pembanding (seharusnya / keluar gudang / selisih)', !/seharusnya|keluar|selisih|menurut|shift/i.test(JSON.stringify(op1)), op1);
const dOp = ctx.daftarOpnameProduksi(SPV, N);
ok('riwayat opname produksi: 1 aktif, tanpa angka pembanding', dOp.length===1 && dOp[0].status==='AKTIF' && dOp[0].detail.polybag[0].qty===80 && !/seharusnya|selisih/i.test(JSON.stringify(dOp)), dOp);
tolak('manager (SUPERVISOR) tidak boleh lihat rekonsiliasi', ()=>ctx.rekonsiliasiProduksi(N, SPV), /Admin/);
tolak('Manager Produksi juga tidak boleh', ()=>ctx.rekonsiliasiProduksi(N, MP), /Admin/);
tolak('staf tidak boleh', ()=>ctx.rekonsiliasiProduksi(N, STAF), /Admin/);
const rk = ctx.rekonsiliasiProduksi(N, ADM);
ok('Admin: keluar gudang ke produksi bulan ini (neraca) = 100 kg = menurut laporan shift', rk.keluarGudang.total===100 && rk.keluarGudang.totalMenurutShift===100 && rk.keluarGudang.daftar.find(x=>x.kode===KW).keluarKeProduksi===100, rk.keluarGudang);
ok('Admin: seharusnya 100 (tanpa opname bulan lalu), dihitung 92 → selisih 8 kg (8%)', rk.awalProduksi===0 && rk.adaOpnameLalu===false && rk.seharusnyaKg===100 && rk.opname.totalKg===92 && rk.selisihKg===8 && rk.selisihPersen===8, rk);
ok('Admin: banding laporan shift — polybag 80 vs 0 dilaporkan (+80), roll fisik 3 vs sisa roll laporan 96', rk.laporanShift.ambil===100 && rk.laporanShift.rollSisa===96 && rk.bandingShift.polybag===80 && rk.bandingShift.roll===3-96, rk.bandingShift);
const op2 = ctx.simpanOpnameProduksi({bulan:N, polybag:[{kualitas:'KW', qty:85}], bs:[{kualitas:'KW', qty:2}], biji:[{kode:KW, qty:5}], roll:[{kualitas:'KW', qty:3}], wipMesin:2}, SPV);
ok('opname ulang bulan yang sama: yang lama DIBATALKAN otomatis, yang baru dipakai (selisih 3)', ctx.daftarOpnameProduksi(SPV, N).length===2 && ctx.daftarOpnameProduksi(SPV, N).find(o=>o.id===op1.id).status==='DIBATALKAN' && ctx.rekonsiliasiProduksi(N, ADM).selisihKg===3, ctx.daftarOpnameProduksi(SPV, N).map(o=>[o.id,o.status]));
/* bahan yang sudah ada di area produksi awal bulan (opname bulan lalu) ikut dihitung sebagai "seharusnya" */
ctx.bukaBulan(B, 'isi opname produksi', ADM);
const opB = ctx.simpanOpnameProduksi({bulan:B, polybag:[{kualitas:'KW', qty:600}], bs:[{kualitas:'KW', qty:26}], biji:[{kode:KW, qty:10}], roll:[{kualitas:'KW', qty:5}], wipMesin:1}, SPV);
ok('opname bulan lalu tersimpan setelah bulan dibuka', opB.ok && opB.totalKg===642);
const rk2 = ctx.rekonsiliasiProduksi(N, ADM);
ok('awal produksi bulan ini = biji 10 + roll 5 + isi mesin 1 = 16 → seharusnya 116, selisih 19', rk2.adaOpnameLalu===true && rk2.awalProduksi===16 && rk2.seharusnyaKg===116 && rk2.selisihKg===19, rk2);
const rkB = ctx.rekonsiliasiProduksi(B, ADM);
ok('rekonsiliasi bulan lalu: keluar gudang menurut neraca 654 (shift 650 + opname gudang −4), dihitung 642, selisih 12', rkB.keluarGudang.total===654 && rkB.keluarGudang.totalMenurutShift===650 && rkB.keluarGudang.daftar.find(x=>x.kode===KW).opname===-4 && rkB.opname.totalKg===642 && rkB.selisihKg===12, rkB.keluarGudang);
ctx.tutupBulan(B, 'tutup lagi', SPV);
ok('bulan lalu ditutup lagi; opname produksi bulan lalu tetap terbaca', ctx.getKonteks(STAF).bulanTertutup===B && ctx.daftarOpnameProduksi(SPV, B).length===1);
{
  const semuaMgr = JSON.stringify([ctx.daftarOpnameProduksi(SPV), ctx.getKonteks(SPV), ctx.getKonteks(MP)]);
  ok('tidak ada angka "seharusnya"/rekonsiliasi di balasan untuk manager', !/seharusnya|selisihKg|keluarGudang/.test(semuaMgr));
}

console.log('\n— Harga tidak bocor ke STAF —');
{
  const semua = JSON.stringify([ctx.getKonteks(STAF), ctx.daftarLaporanShift(STAF, 60), ctx.laporanProduksi(B, STAF), ctx.kalender(B, STAF)]);
  ok('tidak ada field hpp/harga/nilai/biaya/cogs di balasan untuk staf', !/"(hpp|harga\w*|nilai\w*|biaya\w*|cogs|labaKotor)":/i.test(semua));
}

fs.unlinkSync(__dirname + '/.h10.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
