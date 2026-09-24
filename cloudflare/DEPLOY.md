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
