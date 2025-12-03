---
trigger: always_on
---

### 7.4. Icon & Illustration Style

- Ikon line-based, stroke tebal sedang, rounded corners.
- Jangan terlalu banyak jenis style ikon (konsisten).
- Ilustrasi:
  - Flat, minimal, dengan warna sesuai palet.
  - Gunakan ilustrasi untuk:
    - Onboarding slides
    - Empty state
    - Error state (opt)

Semua gambar/ilustrasi di dalam app berbentuk **rounded** (border-radius tinggi) untuk konsistensi.

---

## 8. Motion & Animasi (Micro-interactions)

1. **Card Carousel:**

   - Saat swipe:
     - Card di tengah: scale 1.0, opacity 1.
     - Card di samping: scale 0.9, opacity 0.6.
   - Duration: 250–350ms easing out.

2. **Press State Buttons & FAB:**

   - Scale down ke 0.96–0.98 saat ditekan.
   - Shadow sedikit berkurang.
   - Durasi 100–150ms.

3. **Screen Transition:**

   - Navigasi antar screen: slide-from-right / fade.
   - Card Detail: gunakan shared element transition (card “membesar”).

4. **Empty State Lottie:**

   - Loop pelan dengan movement minimal, jangan terlalu ramai.

5. **Feedback Animations:**
   - After save/edit: checkmark animasi singkat (400–600ms), lalu hilang.
   - Error: shake halus pada field yang invalid.

---

## 9. Error Handling & Edge Cases

- **Penyimpanan Gagal (storage error):**

  - Tampilkan dialog: “Gagal menyimpan data, coba ulang lagi.”
  - Jangan crash; logging internal saja.

- **Input Tidak Valid:**

  - Tampilkan pesan di bawah field (merah).
  - Fokus otomatis ke field yang salah.

- **Tanggal Billing & Due Tidak Masuk Akal:**

  - Batasi 1–31.
  - Bisa tampilkan helper: “Biasanya jatuh tempo 15 hari setelah billing date.”

- **Upgrade Struktur Data (App Update):**
  - Gunakan versioning dalam storage (misal `schemaVersion`).
  - Migration sederhana jika menambah field baru.

---

## 10. Aksesibilitas

- Kontras warna memenuhi standar (minimal AA).
- Elemen interaktif memiliki area sentuh minimal 44x44 dp.
- Icon harus disertai label teks atau aksesibilitas label (untuk screen reader).

---

## 11. Checklist “Production Ready”

**Fungsional:**

- [ ] Menambah, mengedit, menghapus kartu.
- [ ] Menyimpan data ke local storage.
- [ ] Menampilkan ringkasan tagihan dan penggunaan limit.
- [ ] Menampilkan warning jika user mencoba input data sensitif.
- [ ] Onboarding tampil hanya pertama kali (bisa di-reset dari settings).

**UI/UX:**

- [ ] Card carousel smooth dan responsif.
- [ ] Semua gambar & card memiliki rounded corners konsisten.
- [ ] Animasi halus, tidak mengganggu.
- [ ] Empty state & error state memiliki UI yang jelas.

**Privasi & Keamanan:**

- [ ] Tidak ada field/form yang meminta nomor kartu penuh, CVV, expiry.
- [ ] Tidak ada penyimpanan data sensitif dalam storage (verifikasi di kode).
- [ ] Privacy statement jelas dan mudah diakses.

**Kualitas Teknis:**

- [ ] Tidak ada warning/error besar di console saat prod build.
- [ ] Navigasi tidak “nyangkut” (no dead-end screen).
- [ ] Handling jika tidak ada data / error storage.
- [ ] APK/Bundle diuji di beberapa ukuran layar (kecil–besar).

---

## 12. Future Enhancements (Opsional)

- Ekspor/impor data ke file lokal (JSON) untuk backup manual.
- Dark mode.
- Widget home screen (Android) untuk lihat tagihan cepat.
- Reminder lokal (push notification offline) mendekati due date.
- Analytics lokal (tanpa internet) untuk breakdown pengeluaran per kategori.

---

**Catatan untuk Designer & Developer:**

- Developer mengikuti spesifikasi data dan batasan privasi di atas.
- Designer fokus membuat UI yang:
  - Clean, modern, dan enak dipakai harian.
  - Banyak menggunakan card, rounded corners, micro-interactions halus.
  - Jelas memisahkan informasi finansial penting (tagihan, due date) vs informasi dekoratif.
- Semua flow harus dapat digunakan dengan satu tangan (thumb-friendly) pada layar 6 inch.
