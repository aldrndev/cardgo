# Card Go – Credit Card Tracker 💳

**Card Go** adalah aplikasi mobile berbasis React Native yang dirancang untuk membantu pengguna melacak penggunaan kartu kredit, tagihan, dan limit dengan mudah, aman, dan tanpa perlu koneksi internet (Offline-First).

Aplikasi ini fokus pada privasi pengguna dengan **TIDAK** menyimpan data sensitif seperti nomor kartu lengkap, CVV, atau PIN.

---

## 📱 Fitur Utama

### 1. Manajemen Kartu Kredit 🏦

- **Tambah/Edit Kartu**: Simpan informasi kartu seperti nama bank, alias, limit, tanggal cetak tagihan, dan tanggal jatuh tempo.
- **Visualisasi Kartu**: Tampilan kartu yang elegan dengan pilihan warna gradient yang dapat disesuaikan.
- **Privasi Terjamin**: Hanya menyimpan 4 digit terakhir nomor kartu. Data sensitif tidak pernah diminta atau disimpan.

### 2. Dashboard Informatif 📊

- **Card Carousel**: Geser untuk melihat ringkasan setiap kartu (sisa limit, tagihan berjalan).
- **Peringatan Limit**: Notifikasi visual jika penggunaan kartu melebihi 80% dari limit.
- **Pengingat Mendatang**: Daftar tagihan yang akan jatuh tempo, biaya tahunan (Annual Fee), dan jadwal kenaikan limit.
- **Aktivitas Terakhir**: Ringkasan transaksi terbaru dari semua kartu.

### 3. Pencatatan Transaksi 💸

- **Catat Pengeluaran**: Input transaksi manual dengan kategori (Makan, Belanja, Travel, dll).
- **Multi-Currency**: Dukungan untuk transaksi mata uang asing dengan konversi otomatis ke IDR (estimasi).
- **Riwayat Transaksi**: Lihat riwayat lengkap per kartu atau secara global.

### 4. Manajemen Langganan (Subscriptions) 📅

- **Lacak Langganan**: Catat tagihan rutin bulanan (Netflix, Spotify, Gym, dll).
- **Total Tagihan**: Lihat estimasi total tagihan bulanan dari semua langganan aktif.
- **Pengingat Otomatis**: Tanggal tagihan langganan otomatis muncul di kalender dan pengingat.

### 5. Riwayat Kenaikan Limit 📈

- **Tracking Pengajuan**: Catat riwayat pengajuan kenaikan limit (tanggal request, nominal, status).
- **Smart Reminders**: Aplikasi akan menghitung kapan Anda bisa mengajukan kenaikan limit berikutnya berdasarkan frekuensi yang diizinkan bank (misal: setiap 6 bulan).
- **Status Approval**: Tandai pengajuan sebagai Disetujui atau Ditolak untuk pencatatan yang akurat.

### 6. Kalender Keuangan 🗓️

- **Visualisasi Tanggal**: Lihat tanggal cetak tagihan, jatuh tempo, dan jadwal kenaikan limit dalam tampilan kalender.

---

## 🛠️ Teknologi yang Digunakan

- **Framework**: React Native (Expo)
- **Bahasa**: TypeScript
- **Penyimpanan Lokal**: `@react-native-async-storage/async-storage` (Data tersimpan aman di perangkat pengguna)
- **Navigasi**: React Navigation (Stack & Bottom Tabs)
- **Styling**: StyleSheet standar dengan Design System terpusat (Theme)
- **Icons**: Ionicons (@expo/vector-icons)
- **Gradient**: `expo-linear-gradient`
- **Gestures**: `react-native-gesture-handler`

---

## 🚀 Cara Menjalankan Project

1.  **Clone Repository**

    ```bash
    git clone https://github.com/username/card-go.git
    cd card-go
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    # atau
    yarn install
    ```

3.  **Jalankan Aplikasi**
    ```bash
    npx expo start
    ```
    - Scan QR code dengan aplikasi **Expo Go** di Android/iOS.
    - Atau tekan `a` untuk menjalankan di Android Emulator.
    - Atau tekan `i` untuk menjalankan di iOS Simulator.

---

## 🔒 Keamanan & Privasi

Card Go didesain dengan prinsip **Privacy First**:

- **Offline Only**: Tidak ada data yang dikirim ke server cloud. Semua data tetap berada di HP Anda.
- **No Sensitive Data**: Aplikasi memblokir input nomor kartu kredit penuh (16 digit) dan tidak menyediakan kolom untuk CVV atau PIN.

---

## 🎨 Aset & Desain

- **Icon Aplikasi**: Tersedia di folder `./assets/icon.png`
- **Splash Screen**: Tersedia di folder `./assets/splash.png`
- **Adaptive Icon**: Tersedia di folder `./assets/adaptive-icon.png` (untuk Android 8+)

---

**Dikembangkan dengan ❤️ untuk manajemen finansial yang lebih baik.**
