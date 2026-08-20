# Dashboard Monitoring DOI Bulanan (MNJ & KX)

Dashboard web interaktif untuk memonitoring persediaan barang, Days of Inventory (DOI), dan kesehatan stok distributor MNJ dan principal KX secara bulanan.

## 🚀 Fitur Utama

- **Metrik Summary Real-time**: Total SKU, Understock (<30 Hari), Normal (30–90 Hari), Overstock (>90 Hari), Total Valuasi Stok, dan Valuasi Sales.
- **Dua Satuan View**:
  - Quantity (Unit)
  - Valuasi (Rupiah IDR)
- **Opsi Skala Display**: Format Singkat (Miliar / Juta) dan Format Angka Penuh (Full IDR).
- **Trend DOI Historis**: Visualisasi grafik tren pergerakan DOI (Januari 2026 – Juli 2026) dengan garis acuan batas understock (30 Hari) dan overstock (90 Hari).
- **Group Business (GB) Analytics**: Tabel ringkasan DOI weighted dan sebaran status kesehatan stok per Group Bisnis (GB 1 – GB 7, GB ET) serta Total Konsolidasi.
- **Multi-filter**:
  - Filter Periode Waktu Data (`2026-07`, `2026-06`, ..., `2026-01`)
  - Filter Rentang Lookback Average Sales (1, 3, 6, 12 Bulan)
  - Filter Group Bisnis (GB)
  - Filter Keterangan Produk (`Festive`, `Produk Baru`, `Regular`)
  - Live Search Kode Produk / Nama Produk
- **Export Data**: Fitur ekspor data ke file CSV.

---

## 🛠️ Panduan Menjalankan Secara Lokal

### Prerequisites
- Python 3.8+
- Library `openpyxl` (`pip install openpyxl`)

### Langkah Menjalankan Backend & Dashboard UI
1. Clone repositori ini:
   ```bash
   git clone https://github.com/argo-gif/DOI-bulanan.git
   cd DOI-bulanan
   ```
2. Jalankan server Python:
   ```bash
   python backend/main.py
   ```
3. Buka browser dan akses:
   ```
   http://localhost:8000
   ```

---

## 📂 Struktur Repositori

```
DOI-bulanan/
├── backend/
│   ├── etl.py          # Data Engine, Preloader & DOI Calculator
│   ├── main.py         # REST API Server & Static File Host
│   ├── test_etl.py     # Local ETL Test Suite
│   └── test_api.py     # Local API Test Suite
├── frontend/
│   ├── index.html      # Glassmorphism HTML Dashboard
│   ├── index.css       # Modern Dark Mode CSS Stylesheet
│   └── app.bundle.js   # Standalone Bundled Application Logic
├── project_specs.md    # Technical Project Specification
├── implementation-plan.md # Phase Implementation Roadmap
└── README.md
```
