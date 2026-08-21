# Project Specifications: Multi-Select Filter Enhancement

## 1. Ringkasan Fitur Multi-Select Filter
Pengguna dapat memilih lebih dari 1 opsi (*Multi-Select*) secara bersamaan pada 2 filter utama:
1. **Multi-Select Group Bisnis (GB)**: Misal memilih `GB 1` DAN `GB 2` secara bersamaan, atau `GB 1 + GB 3 + GB 4`.
2. **Multi-Select Keterangan Produk**: Misal memilih `Festive` DAN `Produk Baru` secara bersamaan.

---

## 2. Spesifikasi UI Multi-Select Custom Dropdown Component
- **Header Button**: Menampilkan ringkasan status pilihan:
  - Jika belum memilih / pilih `Semua`: `"Semua Group Bisnis (GB)"` / `"Semua Keterangan Produk"`.
  - Jika memilih 1 opsi: Nama opsi tersebut (misal `"GB 1"` / `"Festive"`).
  - Jika memilih multiple opsi: Nama opsi yang dipilih disertai jumlah indikator (misal `"GB 1, GB 2 (2 GB)"` / `"Festive, Produk Baru (2 Ket.)"`).
- **Interactive Checkbox Popover**:
  - Popover dropdown modern dengan checkbox untuk setiap opsi.
  - Tombol **"Pilih Semua" (Select All)** dan **"Reset / Clear"**.
  - Popover otomatis tertutup saat mengklik di luar area dropdown (*click outside handler*).

---

## 3. Spesifikasi API Multi-Select Query Parameters
- API Backend menerima parameter bernilai jamak dipisahkan koma (*comma-separated string*):
  - `gb=GB 1,GB 2,GB 3`
  - `keterangan=Festive,Produk Baru`
- Backend mencocokkan data produk jika `r["gb"]` berada dalam daftar GB yang dipilih DAN `r["keterangan_produk"]` berada dalam daftar Keterangan Produk yang dipilih.
