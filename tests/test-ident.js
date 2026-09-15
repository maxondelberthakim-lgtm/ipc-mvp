const fs=require('fs');
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'pemilik@contoh.co.id';","return '';");
fs.writeFileSync(__dirname + '/.harness-noemail.js', src);
const {ctx}=require(__dirname + '/.harness-noemail.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,JSON.stringify(e)))};
function tolak(label, fn, pola){ let e=''; try{ fn(); }catch(x){ e=String(x.message||x); } ok(label, pola.test(e), e); }

ctx.setupSistem();
ctx.setSetting_('AKSES_TERBUKA','YA'); // uji nama tak terdaftar (Sri, Budi, Tamu)
const ANTO={nama:'Manager',pin:'1357'}, YANTO={nama:'Staff Gudang',pin:'1111'}, SRI={nama:'Sri'};

console.log('— Identitas: nama + PIN per user —');
let c = ctx.getKonteks({});
ok('tanpa nama -> perluNama', c.perluNama===true);
tolak('nama terdaftar, PIN salah -> ditolak', ()=>ctx.getKonteks({nama:'Staff Gudang',pin:'9999'}), /PIN salah/);
tolak('nama terdaftar, PIN kosong -> ditolak', ()=>ctx.getKonteks({nama:'Staff Gudang'}), /PIN salah/);
c = ctx.getKonteks(YANTO);
ok('PIN benar -> masuk sebagai STAF', c.user.peran==='STAF' && c.user.terdaftar===true, c.user);
ok('ejaan nama pakai yang resmi', ctx.getKonteks({nama:'staff gudang',pin:'1111'}).user.nama==='Staff Gudang');
c = ctx.getKonteks(ANTO);
ok('Manager -> SUPERVISOR lewat PIN sendiri', c.user.peran==='SUPERVISOR' && c.bisaReview===true, c.user);
ok('supervisor bukan admin', c.bisaAdmin===false);
c = ctx.getKonteks({nama:'Budi'});
ok('nama belum terdaftar (akses terbuka) -> STAF', c.user.peran==='STAF' && c.user.terdaftar===false);
ok('PIN darurat masih jalan untuk nama TAK terdaftar', ctx.getKonteks({nama:'Tamu',pin:'2468'}).user.peran==='SUPERVISOR');
ok('PIN darurat TIDAK menimpa user terdaftar', (()=>{ try{ ctx.getKonteks({nama:'Staff Gudang',pin:'2468'}); return false; }catch(e){ return true; } })());
ok('Direktur = ADMIN', ctx.getKonteks({nama:'Direktur',pin:'2468'}).bisaAdmin===true);
ok('Admin = ADMIN', ctx.getKonteks({nama:'Admin',pin:'1234'}).bisaAdmin===true);

console.log('\n— Atribusi entri —');
ctx.simpanTransfer({arah:'GBJ_KE_GP', baris:[{kode:'RM-CSW-W240',qty:100}], ident:YANTO});
const t0 = ctx.baca_(ctx.SHEET.TRANSFER)[0];
ok('Nama_Pencatat = Staff Gudang', t0.Nama_Pencatat==='Staff Gudang');
ok('Dicatat_Oleh = manual:Staff Gudang', t0.Dicatat_Oleh==='manual:Staff Gudang');

console.log('\n— Izin review ditegakkan di server —');
tolak('staf ditolak buka antrian', ()=>ctx.antrianReview(YANTO), /Supervisor/);
const q = ctx.antrianReview(ANTO);
ok('supervisor lihat 1 antrian', q.length===1);
tolak('staf tidak bisa approve', ()=>ctx.tinjauTransfer(q[0].id,'setuju','',YANTO), /izin/);
ctx.tinjauTransfer(q[0].id,'setuju','',ANTO);
ok('Ditinjau_Oleh = Manager', ctx.baca_(ctx.SHEET.TRANSFER)[0].Ditinjau_Oleh==='Manager');

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
const MAX={nama:'Direktur',pin:'2468'};
ok('admin bisaAdmin', ctx.getKonteks(MAX).bisaAdmin===true);
tolak('supervisor tidak boleh kelola pengguna', ()=>ctx.daftarPengguna(ANTO), /Admin/);
const dp = ctx.daftarPengguna(MAX);
ok('daftar pengguna 4 orang, PIN tidak bocor', dp.length===4 && dp.every(x=>x.pin===undefined) && dp.find(x=>x.nama==='Staff Gudang').punyaPin===true, dp);
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
// dua admin (Admin + Direktur): turunkan satu boleh, yang terakhir tidak
const bAdm = ctx.daftarPengguna(MAX).find(x=>x.nama==='Admin').baris;
ctx.simpanPengguna({baris:bAdm, nama:'Admin', peran:'SUPERVISOR'}, MAX);
const bDir = ctx.daftarPengguna(MAX).find(x=>x.nama==='Direktur').baris;
tolak('admin terakhir tidak bisa diturunkan', ()=>ctx.simpanPengguna({baris:bDir, nama:'Direktur', peran:'STAF'}, MAX), /admin terakhir/);
ctx.simpanPengguna({baris:bAdm, nama:'Admin', peran:'ADMIN'}, MAX);

console.log('\n— Aktivitas staf —');
const akt = ctx.aktivitasStaf('', 30, ANTO);
ok('aktivitas per user ada Staff Gudang', akt.daftar.some(x=>x.nama==='Staff Gudang' && x.total>=2), akt.daftar.map(x=>[x.nama,x.total]));
const aktY = ctx.aktivitasStaf('Staff Gudang', 30, ANTO);
ok('filter satu user', aktY.daftar.length===1 && aktY.daftar[0].jenis.KE_GP===1 && aktY.daftar[0].jenis.JOB===1, aktY.daftar[0] && aktY.daftar[0].jenis);
tolak('staf tidak boleh lihat aktivitas', ()=>ctx.aktivitasStaf('', 30, YANTO), /Supervisor/);

console.log('— Hardening: PAKSA_LOGIN_MANUAL & AKSES_TERBUKA —');
ctx.setSetting_('AKSES_TERBUKA','TIDAK');
tolak('AKSES_TERBUKA=TIDAK: nama tak terdaftar ditolak', ()=>ctx.getKonteks({nama:'Tamu',pin:'2468'}), /belum terdaftar/);
ok('AKSES_TERBUKA=TIDAK: akun terdaftar tetap masuk', ctx.getKonteks(YANTO).user.nama==='Staff Gudang');
ctx.simpanPengguna({nama:'TanpaPin', peran:'STAF', lokasi:'GBJ'}, MAX);
tolak('akun terdaftar tanpa PIN tidak bisa login', ()=>ctx.getKonteks({nama:'TanpaPin'}), /belum punya PIN/);
// pemilik Sheet (email) juga harus login nama+PIN kalau PAKSA_LOGIN_MANUAL=YA
const {ctx:cEmail}=require(__dirname + '/harness.js');
cEmail.setupSistem();
ok('PAKSA_LOGIN_MANUAL=YA: email pemilik tetap diminta login', cEmail.getKonteks({}).user.perluNama===true);
ok('PAKSA_LOGIN_MANUAL=YA: pemilik login sebagai Admin/1234', cEmail.getKonteks({nama:'Admin',pin:'1234'}).bisaAdmin===true);
cEmail.setSetting_('PAKSA_LOGIN_MANUAL','TIDAK');
ok('PAKSA_LOGIN_MANUAL=TIDAK: email pemilik masuk otomatis sebagai ADMIN', cEmail.getKonteks({}).user.peran==='ADMIN' && cEmail.getKonteks({}).user.identitasManual===false);

fs.unlinkSync(__dirname + '/.harness-noemail.js');
console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
