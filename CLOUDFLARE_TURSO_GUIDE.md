# 🚀 Panduan Panduan Integrasi Turso Database & Deployment Cloudflare Pages (via GitHub)

Dokumen ini berisi panduan langkah demi langkah untuk:
1. **Membuat & Mengkonfigurasi Turso Database (SQLite Edge)**
2. **Menghubungkan Aplikasi ke Cloudflare Pages via GitHub**
3. **Mengatur Environment Variables di Cloudflare**

---

## 📍 LANGKAH 1: Membuat Database Turso

1. **Install Turso CLI (opsional) atau gunakan Dashboard Web Turso:**
   - Website Turso: [https://turso.tech](https://turso.tech)
   - Login / Daftar akun gratis.

2. **Buat Database Baru:**
   ```bash
   turso db create tani-makmur-db
   ```

3. **Dapatkan Database URL & Auth Token:**
   - Run command berikut di terminal Turso CLI:
     ```bash
     turso db show tani-makmur-db --url
     # Output contoh: libsql://tani-makmur-db-username.turso.io

     turso db tokens create tani-makmur-db
     # Output contoh: eyJhbGciOiJF... (Auth Token)
     ```

4. **Inisialisasi Tabel (Opsional):**
   - File skema database `turso-schema.sql` telah disediakan di root repository ini.
   - Anda dapat mengunggah skema via CLI:
     ```bash
     turso db shell tani-makmur-db < turso-schema.sql
     ```
   *(Catatan: Aplikasi & Cloudflare Function juga akan secara otomatis membuat tabel jika belum ada).*

---

## 📍 LANGKAH 2: Upload Project ke GitHub

1. Buka terminal di folder project ini.
2. Inisialisasi Git dan Push ke Repository GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Integration Turso & Cloudflare Pages"
   git branch -M main
   git remote add origin https://github.com/USERNAME_ANDA/tani-makmur-baru.git
   git push -u origin main
   ```

---

## 📍 LANGKAH 3: Deploy ke Cloudflare Pages

1. **Buka Dashboard Cloudflare:**
   - Login ke [https://dash.cloudflare.com](https://dash.cloudflare.com)
   - Pilih menu **Workers & Pages** di sidebar $\rightarrow$ Klik **Create Application** $\rightarrow$ Tab **Pages** $\rightarrow$ **Connect to Git**.

2. **Pilih Repository GitHub:**
   - Hubungkan akun GitHub Anda dan pilih repository `tani-makmur-baru`.

3. **Konfigurasi Build Settings:**
   - **Framework preset:** `Vite` (atau `None`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

4. **Konfigurasi Environment Variables (PENTING!):**
   - Di bagian **Environment variables (advanced)**, tambahkan:
     - `TURSO_DATABASE_URL` = `libsql://tani-makmur-db-username.turso.io`
     - `TURSO_AUTH_TOKEN` = `eyJhbGciOiJF...` (Token dari Turso)

5. **Klik "Save and Deploy"**:
   - Cloudflare akan otomatis mem-build project dan menyediakannya di URL gratis `https://tani-makmur-baru.pages.dev`.

---

## 📍 LANGKAH 4: Konfigurasi Kredensial di Web Application

1. Buka aplikasi web yang sudah ter-deploy di Cloudflare Pages (atau saat jalankan di lokal).
2. Masuk ke menu **Pengaturan** $\rightarrow$ Tab **8. Turso DB & Cloudflare Cloud**.
3. Masukkan **TURSO DATABASE URL** dan **TURSO AUTH TOKEN**.
4. Klik **🚀 Push / Upload Data Ke Turso Cloud** untuk menyinkronkan seluruh data aplikasi Anda ke cloud!

---

🎉 **Selamat! Aplikasi Tani Makmur Baru Anda kini aktif secara penuh di Cloudflare Pages dengan database SQLite Edge Turso yang super cepat!**
