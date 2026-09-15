const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'max@eramas.co.id';","return '';");
fs.writeFileSync(__dirname + '/.harness-noemail.js', src);
const {ctx}=require(__dirname + '/.harness-noemail.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }

ctx.setupSistem();
const ANTO={nama:'Pak Anto',pin:'1111'}, YANTO={nama:'Yanto',pin:'2222'}, SRI={nama:'Sri',pin:'3333'};

console.log('— Identitas: nama + PIN per user —');
let c = ctx.getKonteks({});
ok('tanpa nama -> perluNama', c.perluNama===true);
tolak('nama terdaftar, PIN salah -> ditolak', ()=>ctx.getKonteks({nama:'Yanto',pin:'9999'}), /PIN salah/);
tolak('nama terdaftar, PIN kosong -> ditolak', ()=>ctx.getKonteks({nama:'Yanto'}), /PIN salah/);
c = ctx.getKonteks(YANTO);
ok('PIN benar -> masuk sebagai STAF', c.user.peran==='STAF' && c.user.terdaftar===true, c.user);
ok('ejaan nama pakai yang resmi', ctx.getKonteks({nama:'yanto',pin:'2222'}).user.nama==='Yanto');
c = ctx.getKonteks(ANTO);
ok('Pak Anto -> SUPERVISOR lewat PIN sendiri', c.user.peran==='SUPERVISOR' && c.bisaReview===true, c.user);
ok('supervisor bukan admin', c.bisaAdmin===false);
c = ctx.getKonteks({nama:'Budi'});
ok('nama belum terdaftar (akses terbuka) -> STAF', c.user.peran==='STAF' && c.user.terdaftar===false);
ok('PIN darurat masih jalan untuk nama TAK terdaftar', ctx.getKonteks({nama:'Tamu',pin:'2468'}).user.peran==='SUPERVISOR');
ok('PIN darurat TIDAK menimpa user terdaftar', (()=>{ try{ ctx.getKonteks({nama:'Yanto',pin:'2468'}); return false; }catch(e){ return true; } })());

console.log('\n— Atribusi entri —');
ctx.simpanTransfer({arah:'GBJ_KE_GP', baris:[{kode:'RM-CSW-W240',qty:100}], ident:YANTO});
const t0 = ctx.baca_(ctx.SHEET.TRANSFER)[0];
ok('Nama_Pencatat = Yanto', t0.Nama_Pencatat==='Yanto');
ok('Dicatat_Oleh = manual:Yanto', t0.Dicatat_Oleh==='manual:Yanto');

console.log('\n— Izin review ditegakkan di server —');
tolak('staf ditolak buka antrian', ()=>ctx.antrianReview(YANTO), /Supervisor/);
const q = ctx.antrianReview(ANTO);
ok('supervisor lihat 1 antrian', q.length===1);
tolak('staf tidak bisa approve', ()=>ctx.tinjauTransfer(q[0].id,'setuju','',YANTO), /izin/);
ctx.tinjauTransfer(q[0].id,'setuju','',ANTO);
ok('Ditinjau_Oleh = Pak Anto', ctx.baca_(ctx.SHEET.TRANSFER)[0].Ditinjau_Oleh==='Pak Anto');

console.log('\n— STAF tidak pernah lihat HPP —');
ok('staf lihatHpp = false', ctx.getKonteks(YANTO).lihatHpp===false);
const jS = ctx.mulaiPekerjaan({ kodeProduk:'FG-MM-CSW', bahanBaku:[{kode:'RM-CSW-W240', qty:50}], ident:YANTO });
ok('mulai job: tidak ada hpp', jS.hpp===undefined);
const fS = ctx.selesaikanPekerjaan({ id:jS.id, barangJadi:[{kode:'FG-MM-CSW', qty:48}], scrapKg:1, ident:YANTO });
ok('tutup job: tidak ada hpp', fS.hpp===undefined);
tolak('laporan HPP ditolak untuk staf', ()=>ctx.laporanHpp(30,YANTO), /Supervisor/);
ok('supervisor dapat laporan HPP', ctx.laporanHpp(30,ANTO).total.jobs>=1);

console.log('\n— ADMIN: kelola pengguna —');
// jadikan Pak Anto admin lewat sheet (bootstrap), lalu uji fungsi admin
const shU = ctx.sheet_(ctx.SHEET.PENGGUNA);
shU.appendRow(['', 'Max', 'ADMIN', 'HQ', '0000', 'YA']);
const MAX={nama:'Max',pin:'0000'};
ok('admin bisaAdmin', ctx.getKonteks(MAX).bisaAdmin===true);
tolak('supervisor tidak boleh kelola pengguna', ()=>ctx.daftarPengguna(ANTO), /Admin/);
const dp = ctx.daftarPengguna(MAX);
ok('daftar pengguna 5 orang, PIN tidak bocor', dp.length===5 && dp.every(x=>x.pin===undefined) && dp.find(x=>x.nama==='Yanto').punyaPin===true, dp);
ctx.simpanPengguna({nama:'Budi', peran:'STAF', lokasi:'GBJ', pin:'5555'}, MAX);
ok('tambah user baru', ctx.daftarPengguna(MAX).some(x=>x.nama==='Budi'));
tolak('nama dobel ditolak', ()=>ctx.simpanPengguna({nama:'budi', peran:'STAF', pin:'1234'}, MAX), /sudah dipakai/);
tolak('PIN bukan angka ditolak', ()=>ctx.simpanPengguna({nama:'Cici', peran:'STAF', pin:'ab'}, MAX), /4–8 angka/);
const bBudi = ctx.daftarPengguna(MAX).find(x=>x.nama==='Budi').baris;
ctx.simpanPengguna({baris:bBudi, nama:'Budi', peran:'SUPERVISOR', lokasi:'GBJ'}, MAX);
ok('naikkan peran jadi SUPERVISOR', ctx.getKonteks({nama:'Budi',pin:'5555'}).bisaReview===true);
ctx.simpanPengguna({baris:bBudi, nama:'Budi', peran:'SUPERVISOR', pin:'6666'}, MAX);
ok('ganti PIN', ctx.getKonteks({nama:'Budi',pin:'6666'}).user.nama==='Budi');
ctx.simpanPengguna({baris:bBudi, nama:'Budi', peran:'SUPERVISOR', aktif:false}, MAX);
tolak('user nonaktif ditolak login', ()=>ctx.getKonteks({nama:'Budi',pin:'6666'}), /dinonaktifkan/);
const bMax = ctx.daftarPengguna(MAX).find(x=>x.nama==='Max').baris;
tolak('admin terakhir tidak bisa diturunkan', ()=>ctx.simpanPengguna({baris:bMax, nama:'Max', peran:'STAF'}, MAX), /admin terakhir/);

console.log('\n— Aktivitas staf —');
const akt = ctx.aktivitasStaf('', 30, ANTO);
ok('aktivitas per user ada Yanto', akt.daftar.some(x=>x.nama==='Yanto' && x.total>=2), akt.daftar.map(x=>[x.nama,x.total]));
const aktY = ctx.aktivitasStaf('Yanto', 30, ANTO);
ok('filter satu user', aktY.daftar.length===1 && aktY.daftar[0].jenis.KE_GP===1 && aktY.daftar[0].jenis.JOB===1, aktY.daftar[0] && aktY.daftar[0].jenis);
tolak('staf tidak boleh lihat aktivitas', ()=>ctx.aktivitasStaf('', 30, YANTO), /Supervisor/);

fs.unlinkSync(__dirname + '/.harness-noemail.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
