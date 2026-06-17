# 📐 UML Diagrams — Sistem Business Intelligence Tataruma

Direktori ini berisi dokumentasi UML lengkap untuk **Sistem BI Tataruma**, sebuah aplikasi web Business Intelligence berbasis **Laravel + React** untuk analisis tren penjualan produk.

---

## 📋 Daftar Diagram

### 1. Use Case Diagram
| File | Deskripsi |
|------|-----------|
| `01_use_case.puml` | Use Case Diagram menyeluruh — semua aktor (Admin, Manager, Owner) dan use case sistem |

### 2. Class Diagram
| File | Deskripsi |
|------|-----------|
| `02_class_diagram.puml` | Class Diagram — Models, Controllers, Services beserta relasi antar kelas |

### 3. ERD (Entity Relationship Diagram)
| File | Deskripsi |
|------|-----------|
| `03_erd.puml` | ERD lengkap — semua tabel database dengan atribut, tipe data, PK/FK, dan relasi |

### 4. Activity Diagrams
| File | Deskripsi |
|------|-----------|
| `04_activity_login.puml` | Alur Login & Logout pengguna |
| `05_activity_produk.puml` | Manajemen Produk (tambah, edit, nonaktifkan, filter) |
| `06_activity_transaksi.puml` | Pencatatan Transaksi Penjualan Manual |
| `07_activity_analitik.puml` | Kalkulasi Rasio Tren & Deteksi Underperforming |
| `08_activity_laporan.puml` | Pembuatan & Ekspor Laporan (CSV & PDF) |
| `09_activity_pengguna.puml` | Manajemen Pengguna (tambah, edit, hapus/nonaktifkan) |
| `10_activity_etl.puml` | ETL & Import Data |

### 5. Sequence Diagrams
| File | Deskripsi |
|------|-----------|
| `11_sequence_login.puml` | Alur Login detail (validasi, token Sanctum, activity log) |
| `12_sequence_produk.puml` | Alur Tambah & Edit Produk |
| `13_sequence_transaksi.puml` | Alur Pencatatan Transaksi + Update Stok + Notifikasi |
| `14_sequence_tren.puml` | Alur Kalkulasi Tren + Heatmap + Perbandingan Periode |
| `15_sequence_laporan.puml` | Alur Export CSV & PDF |
| `16_sequence_pengguna.puml` | Alur Manajemen Pengguna lengkap |
| `17_sequence_dashboard.puml` | Alur Load Dashboard & Notifikasi |
| `18_sequence_forgot_password.puml` | Alur Lupa Password & Reset Password |

---

## 🎭 Aktor Sistem

| Aktor | Role Slug | Deskripsi |
|-------|-----------|-----------|
| **Admin** | `admin` | Akses penuh ke semua fitur. Dapat kelola produk, transaksi, pengguna, ETL, dan pengaturan |
| **Manager** | `manager` | Akses read-only ke produk & transaksi. Dapat lihat analitik dan ekspor laporan |
| **Owner** | `owner` | Akses ringkasan eksekutif. Lihat dashboard, laporan ringkasan, dan produk underperforming |

---

## 🗄️ Entitas Database Utama

| Tabel | Deskripsi |
|-------|-----------|
| `roles` | Role pengguna (admin, manager, owner) + permissions |
| `users` | Pengguna sistem dengan role & status aktif |
| `products` | Produk dengan stok, harga, threshold, dan Shopee item ID |
| `transactions` | Transaksi penjualan (manual/import/Shopee) |
| `trend_analyses` | Hasil kalkulasi rasio tren per produk per periode |
| `activity_logs` | Riwayat aktivitas pengguna |
| `notifications` | Notifikasi sistem (stok rendah, pengguna baru, dll.) |
| `settings` | Konfigurasi sistem (key-value) |
| `etl_logs` | Log proses ETL |
| `personal_access_tokens` | Token autentikasi Laravel Sanctum |

---

## 🔧 Cara Render

### Menggunakan PlantUML Online
1. Buka [https://www.plantuml.com/plantuml/uml/](https://www.plantuml.com/plantuml/uml/)
2. Salin isi file `.puml` ke editor
3. Klik "Submit"

### Menggunakan VS Code
1. Install ekstensi **PlantUML** oleh `jebbs`
2. Buka file `.puml`
3. Tekan `Alt+D` untuk pratinjau

### Menggunakan Draw.io
1. Buka [app.diagrams.net](https://app.diagrams.net)
2. Pilih **Extras → Edit Diagram**
3. Salin kode PlantUML

---

## 📌 Catatan Teknis

- **Framework**: Laravel 11 + React (Inertia.js/SPA)
- **Autentikasi**: Laravel Sanctum (Bearer Token)
- **Authorization**: Role-based middleware (`role:admin,manager`)
- **Arsitektur**: RESTful API + SPA Frontend
- **Analitik**: Trend Ratio = Current Period Revenue / Base Period Revenue

---

*Dibuat untuk keperluan dokumentasi skripsi/thesis*
*Sistem: Tataruma BI — Platform Analisis Penjualan*
