# Cara deploy (sekali saja, ±3 menit)

1. Buka **Terminal** di Mac.
2. Ketik (ganti path kalau foldernya dipindah):
   ```
   cd "$HOME/Claude Co Work/ipc-cloudflare" && bash deploy.sh
   ```
3. Saat browser terbuka "Wrangler wants to access your account" → klik **Allow**.
4. Tunggu sampai muncul `SELESAI. API: https://ipc-api.....workers.dev/exec`.
5. Kirim hasil layar itu ke Claude → Claude akan ganti alamat API di app GitHub dan uji semuanya.

Kalau `node -v` gagal: `brew install node` dulu (atau unduh dari nodejs.org), lalu ulangi langkah 2.
File `ADMIN_KEY.txt` = kunci admin server baru (untuk impor/reset). Simpan, jangan dibagikan.

# Update backend (setiap ada versi baru, ±1 menit)

1. Claude mengirim file `ipc-cloudflare-update.zip` (isi: folder `src/` + `wrangler.jsonc`).
2. Di Mac: buka zip itu, **timpa** folder `src` dan `wrangler.jsonc` di `Claude Co Work/ipc-cloudflare`
   (atau: `cd "$HOME/Claude Co Work/ipc-cloudflare" && unzip -o ~/Downloads/ipc-cloudflare-update.zip`).
3. Terminal: `cd "$HOME/Claude Co Work/ipc-cloudflare" && bash deploy.sh`
   (login Cloudflare sudah tersimpan; impor data hanya jalan sekali di deploy pertama — data yang ada tidak disentuh).
4. Migrasi skema (mis. v9 → v10) berjalan sendiri saat request pertama setelah deploy. Buka app, login sebagai Manager,
   cek Laporan → Nilai stok dan tab Produksi. Data lama tetap ada.
