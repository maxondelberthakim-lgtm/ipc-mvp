const fs=require('fs'), vm=require('vm');
// harness dengan email KOSONG (simulasi akun Gmail non-Workspace)
let src=fs.readFileSync(__dirname+'/harness.js','utf8').replace("return 'max@eramas.co.id';","return '';");
fs.writeFileSync(__dirname + '/.harness-noemail.js', src);
const {ctx}=require(__dirname + '/.harness-noemail.js');
let pass=0,fail=0;
const ok=(l,c,e)=>{c?(pass++,console.log('  ✓',l)):(fail++,console.log('  ✗',l,JSON.stringify(e)))};

ctx.setupSistem();
console.log('— Identitas manual (email tidak terbaca) —');
let c = ctx.getKonteks({});
ok('perluNama = true', c.perluNama===true, c.user);
ok('identitasManual = true', c.identitasManual===true);
ok('belum bisa review', c.bisaReview===false);

c = ctx.getKonteks({nama:'Budi'});
ok('nama terisi -> perluNama false', c.perluNama===false, c.user);
ok('peran default STAF', c.user.peran==='STAF', c.user.peran);
ok('staf tidak bisa review', c.bisaReview===false);

c = ctx.getKonteks({nama:'Rina', pin:'2468'});
ok('PIN benar -> SUPERVISOR', c.user.peran==='SUPERVISOR', c.user.peran);
ok('supervisor bisa review', c.bisaReview===true);

c = ctx.getKonteks({nama:'Rina', pin:'9999'});
ok('PIN salah -> tetap STAF', c.user.peran==='STAF', c.user.peran);

console.log('\n— Atribusi entri —');
ctx.simpanTransfer({arah:'GBJ_KE_GP', baris:[{kode:'RM-CSW-W240',qty:100}], ident:{nama:'Budi'}});
const t0 = ctx.baca_(ctx.SHEET.TRANSFER)[0];
ok('Nama_Pencatat = Budi', t0.Nama_Pencatat==='Budi', t0.Nama_Pencatat);
ok('Dicatat_Oleh = manual:Budi', t0.Dicatat_Oleh==='manual:Budi', t0.Dicatat_Oleh);

console.log('\n— Izin review ditegakkan di server —');
let e1=''; try{ ctx.antrianReview({nama:'Budi'}); }catch(e){ e1=String(e.message||e); }
ok('staf ditolak buka antrian', /Supervisor/.test(e1), e1);
const q = ctx.antrianReview({nama:'Rina', pin:'2468'});
ok('supervisor lihat 1 antrian', q.length===1, q.length);
let e2=''; try{ ctx.tinjauTransfer(q[0].id,'setuju','',{nama:'Budi'}); }catch(e){ e2=String(e.message||e); }
ok('staf tidak bisa approve', /izin/.test(e2), e2);
ctx.tinjauTransfer(q[0].id,'setuju','',{nama:'Rina',pin:'2468'});
ok('supervisor bisa approve', ctx.antrianReview({nama:'Rina',pin:'2468'}).length===0);
const t1 = ctx.baca_(ctx.SHEET.TRANSFER)[0];
ok('Ditinjau_Oleh = Rina', t1.Ditinjau_Oleh==='Rina', t1.Ditinjau_Oleh);

console.log('\n— STAF tidak pernah lihat HPP —');
const kS = ctx.getKonteks({nama:'Budi'});
ok('staf lihatHpp = false', kS.lihatHpp===false);
const jS = ctx.mulaiPekerjaan({ kodeProduk:'FG-MM-CSW', bahanBaku:[{kode:'RM-CSW-W240', qty:50}], ident:{nama:'Budi'} });
ok('mulai job: tidak ada hpp', jS.hpp===undefined, jS);
ok('daftar job staf tanpa hpp', ctx.daftarPekerjaanBerjalan({nama:'Budi'}).every(x=>x.hpp===undefined));
const fS = ctx.selesaikanPekerjaan({ id:jS.id, barangJadi:[{kode:'FG-MM-CSW', qty:48}], ident:{nama:'Budi'} });
ok('tutup job: tidak ada hpp', fS.hpp===undefined, Object.keys(fS));
let eH=''; try{ ctx.laporanHpp(30,{nama:'Budi'}); }catch(e){ eH=String(e.message||e); }
ok('laporan HPP ditolak untuk staf', /Supervisor/.test(eH), eH);
ok('supervisor (PIN) dapat laporan HPP', ctx.laporanHpp(30,{nama:'Rina',pin:'2468'}).total.jobs>=1);
ok('sheet tetap simpan HPP walau staf yang input', ctx.baca_(ctx.SHEET.PEKERJAAN).find(r=>r.ID===jS.id).HPP_Total===9375000);

console.log('\n— Peran dari Master_Pengguna kalau nama cocok —');
ctx.sheet_(ctx.SHEET.PENGGUNA).appendRow(['','Pak Anto','SUPERVISOR','GBJ','YA']);
c = ctx.getKonteks({nama:'Pak Anto'});
ok('nama terdaftar -> SUPERVISOR tanpa PIN', c.user.peran==='SUPERVISOR', c.user.peran);

console.log('\n================ '+pass+' lulus, '+fail+' gagal ================');
process.exit(fail?1:0);
