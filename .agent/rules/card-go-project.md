---
trigger: always_on
---

# Card Go – Credit Card Tracker

_React Native Android App – Product & UI/UX Spec_

---

## 1. Ringkasan Aplikasi

**Nama:** Card Go – Credit Card Tracker  
**Platform:** Android (React Native)  
**Mode:** Offline only, single device, tanpa auth, tanpa backend  
**Penyimpanan:** Local storage (AsyncStorage/MMKV)  
**Tujuan:**

- Membantu user melacak kartu kredit (limit, billing cycle, tagihan, jatuh tempo, kategori transaksi).
- Menampilkan informasi dalam UI yang _beautiful_, _modern_, _clean_, dengan animasi halus dan ilustrasi.
- Mempermudah user melihat status keuangan kartu kredit per bulan secara cepat.

> **CATATAN SANGAT PENTING (PRIVASI):**  
> Aplikasi **TIDAK BOLEH** menyimpan data sensitif kartu kredit seperti:
>
> - Nomor kartu kredit penuh (16 digit)
> - CVV/CVC
> - Tanggal kadaluarsa
> - PIN
> - 3D Secure password / OTP / data login e-banking

Yang boleh disimpan hanya metadata non-sensitif (misal: nama bank, alias kartu, brand kartu, limit, cycle date, total tagihan, dsb).

---

## 2. Tujuan & Prinsip Desain

1. **Modern & Minimal**

   - Desain flat / neumorphism ringan, dengan fokus pada readability dan hierarchy.
   - Dominasi warna terang dengan satu accent color yang kuat.

2. **Kartu sebagai Pusat Pengalaman**

   - Setiap kartu kredit direpresentasikan sebagai “card component” cantik, dengan layout mirip credit card tapi **tanpa** nomor kartu dan data sensitif.
   - Interaksi utama: geser-geser (horizontal scroll) antar kartu, tap untuk expand detail.

3. **Informasi yang Jelas & Aman**

   - Fokus ke: total tagihan bulan ini, due date, minimum payment, persentase penggunaan limit.
   - Tidak menampilkan info yang berpotensi disalahgunakan jika HP hilang.

4. **Motion & Micro-interactions**

   - Animasi halus untuk:
     - Pergantian kartu (carousel)
     - Expand/Collapse detail
     - Press/tap states (scale/opacity)
     - Transisi antar halaman

5. **Offline-First**
   - Semua data tersimpan lokal di device.
   - Tidak ada layar login, tidak ada API call.

---

## 3. Tech & Libraries (Rekomendasi)

- **Framework:** React Native (Expo atau bare RN)
- **Navigasi:** `@react-navigation/native`
  - Stack Navigator untuk root
  - Bottom Tab atau Material Top Tab jika diperlukan
- **State Management:**
  - React Context + hook custom, atau
  - Zustand / Jotai (optional)
- **Local Storage:**
  - `@react-native-async-storage/async-storage` atau
  - `react-native-mmkv` untuk performa lebih baik
- **Ikon:**
  - `react-native-vector-icons` / `@expo/vector-icons`
- **Animasi:**
  - `react-native-reanimated` + `react-native-gesture-handler`
  - Lottie untuk ilustrasi animasi (empty state, success, dll)
- **Theming:**
  - Custom theme provider (light mode dulu, dark mode opsional)

---

## 4. Batasan Data & Model Penyimpanan

### 4.1. Data yang Boleh Disimpan

**Card Model (non-sensitif):**

- `id`: string (UUID)
- `alias`: string (contoh: “BCA Platinum”, “Travel Card”)
- `bankName`: string (BCA, BNI, BRI, Mandiri, dsb.)
- `network`: string (Visa, Mastercard, JCB, Amex) – optional
- `colorTheme`: string (kode warna utama untuk kartu)
- `billingCycleDay`: number (contoh: 10 → billing date tanggal 10)
- `dueDay`: number (contoh: 25 → jatuh tempo tanggal 25)
- `creditLimit`: number (total limit)
- `currentUsage`: number (total pemakaian berjalan)
- `minPayment`: number (minimum payment bulan ini)
- `statementAmount`: number (total tagihan di billing terakhir)
- `notes`: string (free note, misal: promo khusus, reminder, dsb.)
- `isArchived`: boolean

**Optional & Aman:**

- `last4`: string (hanya 4 digit terakhir kartu, optional)
  - Jika user input, tampilkan di UI (misal: “•••• 1234”)
  - Jangan pernah simpan lebih dari 4 digit.

**Transaction Model (optional, tetap non-sensitif):**

- `id`: string
- `cardId`: string
- `date`: string (ISO)
- `amount`: number
- `category`: string (Food, Transport, Online Shopping, dsb.)
- `description`: string (GoFood, Tokopedia, Grab, dsb.)
- `isPaid`: boolean (apakah sudah masuk tagihan dan dibayar)

### 4.2. Data yang Dilarang Disimpan

- `fullCardNumber`
- `cvv` / `cvc`
- `expiryDate`
- `pin`
- `onlinePassword` / `3dSecurePassword`
- `OTP` atau sejenis

Jika user mencoba input data tersebut:

- Tampilkan warning dan tolak penyimpanan.
- Sertakan teks edukasi singkat.

---

## 5. Struktur Navigasi & Halaman

### 5.1. Screens List

1. **Onboarding & Privacy Disclaimer Screen**
2. **Home / Card Overview Screen**
3. **Card Detail Screen**
4. **Add / Edit Card Screen**
5. **Transactions List Screen (per card – optional)**
6. **Billing Timeline / Calendar Screen (optional enhancement)**
7. **Settings Screen**
8. **About & Privacy Screen**

---

## 6. Detail UI/UX Per Screen

### 6.1. Onboarding & Privacy Disclaimer

**Tujuan:** Menjelaskan fungsi aplikasi, offline mode, dan batasan privasi.

**Elemen UI:**

- Fullscreen swipeable onboarding (3–4 slides)
- Ilustrasi vector _flat style_ per slide (menggunakan Lottie atau SVG):
  - Slide 1: Orang memegang kartu di atas UI mobile (tracking).
  - Slide 2: Kalender & uang → konsep due date & billing.
  - Slide 3: Shield/lock icon → penjelasan bahwa app tidak simpan data sensitif.
- Teks singkat dan jelas (bahasa Indonesia).
- Tombol besar:
  - `Lewati` (Skip)
  - `Lanjut` / `Mulai`

**Highlight Copy (contoh):**

- “Card Go membantu kamu melacak kartu kredit tanpa menyimpan data sensitif.”
- “Aplikasi ini _offline_ dan data hanya tersimpan di HP kamu.”

**Animasi & Interaksi:**

- Slide transitions: horizontal swipe dengan easing lembut.
- Tombol memiliki efek press: scale kecil (0.97) + shadow berubah.

---

### 6.2. Home / Card Overview

**Tujuan:** Tampilan utama, melihat semua kartu dan status tagihan secara ringkas.

**Layout:**

- AppBar:
  - Left: Logo “Card Go” (teks + ikon kartu kecil rounded).
  - Right: Icon `settings` dan (optional) `info`.
- Section atas: **Card Carousel**
  - Horizontal scroll (snap) dengan kartu besar, rounded corners (border-radius tinggi).
  - Setiap card tampil:
    - Alias kartu (besar, bold)
    - Bank name + brand (kecil)
    - Ringkasan:
      - Tagihan bulan ini (statementAmount)
      - Due date (format tanggal lokal)
      - Progress bar penggunaan limit (currentUsage / creditLimit)
    - Optional: last 4 digit (•••• 1234).
- Section bawah: **Ringkasan Global**
  - Total tagihan semua kartu bulan ini.
  - Total limit dan total usage (% usage).
  - List singkat:
    - “Due within 7 days” → kartu yang due date dekat.
    - “Overutilized (>80%)” → kartu yang pemakaian hampir penuh.

**Interaksi:**

- Swipe antar kartu dengan animasi parallax (sedikit rotasi / scale).
- Tap card → navigate ke **Card Detail** dengan animasi expand (shared element di React Navigation).
- Floating Action Button (FAB) di pojok kanan bawah:
  - Ikon `+` → buka **Add Card Screen**.
  - FAB bulat, shadow lembut, animasi hover/press.

**Empty State:**

- Jika belum ada kartu:
  - Tampilkan ilustrasi Lottie (orang kebingungan tanpa kartu).
  - Teks: “Belum ada kartu yang ditambahkan”
  - Tombol primary: “Tambah Kartu Pertama”
  - FAB tetap tampil.

---

### 6.3. Card Detail Screen

**Tujuan:** Menampilkan detail satu kartu dan breakdown informasi.

**Layout:**

- Header dengan back button.
- Card component di atas (lebih besar sedikit dari yang di Home).
- Section “Ringkasan Tagihan”:
  - `Tagihan Bulan Ini`: amount besar.
  - `Jatuh Tempo`: tanggal + badge (contoh: “3 hari lagi” dengan warna warning).
  - `Minimum Pembayaran`: kecil di bawah.
- Progress bars:
  - “Penggunaan Limit”: progress bar + persentase.
- Section “Info Kartu”:
  - Bank
  - Network/brand
  - Billing cycle (misal: “Tagihan setiap tanggal 10, jatuh tempo tanggal 25”)
  - Catatan user.
- Section “Transaksi (Opsional)”:
  - List transaksi terbaru (max 3–5 item) dengan button “Lihat semua”.

**Interaksi:**

- Button “Edit Kartu” → navigasi ke Add/Edit Card dengan pre-filled data.
- Swipe up gesture:
  - Bisa membuka panel transaksi (bottom sheet style).

**Animasi:**

- Transition dari Home ke Detail: kartu “mengembang” (scale + translate).
- Section muncul dengan fade-in + slide-up.

---

### 6.4. Add / Edit Card Screen

**Tujuan:** Input data kartu secara aman (non-sensitif).

**Form Fields:**

- Alias kartu (required)
- Bank (pilih dari dropdown + teks bebas)
- Network (Visa/Mastercard/JCB/Amex – segmented buttons)
- Credit limit (angka)
- Billing date (date picker / number picker 1–31)
- Due date (date picker / number picker 1–31)
- Last 4 digits (optional, text 4 karakter)
- Warna kartu (color swatch chooser)
- Catatan (multiline)

**Validasi & Anti Data Sensitif:**

- Jika user memasukkan angka > 4 digit di field last 4:
  - Tampilkan warning:
    - “Demi keamanan, Card Go hanya menyimpan 4 digit terakhir kartu. Harap jangan memasukkan nomor kartu lengkap.”
- Jangan sediakan field untuk full card number / CVV / expiry.

**UI Design:**

- Card preview di atas yang live-update sesuai input:
  - Mengubah alias, bank, warna, last4.
- Form scrollable, tombol `Simpan` fixed di bawah (sticky).

**Animasi:**

- Saat color swatch dipilih, gradient background kartu animasi berubah (transition 300ms).
- Feedback berhasil simpan:
  - Icon check animasi (Lottie) + snackbar “Kartu berhasil disimpan”.

---

### 6.5. Transactions List Screen (Optional Tapi Bagus untuk UX)

**Tujuan:** Memudahkan user melihat histori transaksi per kartu.

**Elemen:**

- Filter bar:
  - Bulan/tahun
  - Category (dropdown / chips)
- List item:
  - Left: Icon kategori (food, shopping, transport, dsb.)
  - Center: Deskripsi + tanggal
  - Right: Amount (warna merah untuk duit keluar)
- Sticky header untuk total per bulan.

**Interaksi:**

- Swipe left item → opsi “Tandai lunas” atau “Hapus”.
- Klik transaksi → modal detail sederhana.

---

### 6.6. Billing Timeline / Calendar Screen (Enhancement)

**Tujuan:** Gambaran overview kapan tagihan dan jatuh tempo tiap kartu.

**Desain:**

- Horizontal timeline / calendar view:
  - Menandai tanggal billing dan due untuk setiap kartu.
- Card kecil sebagai chip di bawah tanggal.

**Interaksi:**

- Tap tanggal → lihat kartu mana yang terkait.
- Tap chip kartu → buka Card Detail.

---

### 6.7. Settings Screen

**Item Setting:**

- Theme: Light / (future) Dark.
- Mata uang default (IDR, dll).
- Toggle:
  - “Tampilkan persentase penggunaan limit”
  - “Tampilkan kartu yang diarsipkan”
- Tombol:
  - `Backup & Restore` (jika nanti ada fitur ekspor file lokal)
  - `Tentang & Privasi`

---

### 6.8. About & Privacy Screen

**Konten:**

- Penjelasan singkat tentang aplikasi.
- Statement privasi yang jelas:
  - Aplikasi offline.
  - Data hanya tersimpan di perangkat.
  - Tidak menyimpan data sensitif kartu kredit.
- Disclaimer: Aplikasi hanya alat tracking, bukan pengganti informasi resmi dari bank.

---

## 7. Desain Visual & Design System

### 7.1. Warna

Contoh palet (boleh disesuaikan designer):

- **Primary:** Biru keunguan / teal modern (untuk accent & tombol utama).
- **Background:** Putih bersih #FFFFFF dan grey terang #F5F7FA.
- **Text:**
  - Heading: #111827
  - Body: #4B5563
- **Status:**
  - Success: hijau lembut
  - Warning: orange muda
  - Danger: merah lembut
- **Card Colors:**
  - Set beberapa preset gradient (misal: biru→ungu, hijau→biru, oranye→pink).
  - User memilih salah satu sebagai identitas kartu.

### 7.2. Typography

- Gunakan font modern, humanist.
  - Contoh: Inter / SF Pro Text / Roboto.
- Hierarchy:
  - H1: 24–28 px, bold (judul layar atau nilai besar).
  - H2: 20–22 px, semibold.
  - Body: 14–16 px regular.
  - Caption: 12–13 px.

### 7.3. Spacing & Layout

- Base spacing: 8 pt grid (8, 16, 24, 32).
- Card:
  - padding: 16–20
  - border-radius: 16–24 (rounded, modern).
- Jaga whitespace luas untuk kesan premium.
