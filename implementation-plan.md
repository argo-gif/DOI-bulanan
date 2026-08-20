# Implementation Plan: Dashboard Monitoring DOI Bulanan (MNJ & KX)

Dokumen ini mendefinisikan rencana kerja per fase dalam membangun Web Application Dashboard Monitoring DOI Bulanan.

---

## 🟢 Fase 1: Inisialisasi & Spesifikasi Proyek (SELESAI)
- [x] Membaca dan menganalisis `instructions.txt` dan `project_description.txt`.
- [x] Memeriksa struktur data input Excel (`Master produk.xlsx`, `Stok Akhir bulan MNJ.xlsx`, `Stok Akhir bulan KX dan Produksi.xlsx`, `Data sales.xlsx`).
- [x] Membuat file `project_specs.md` di root proyek.
- [x] Membuat file `implementation-plan.md` ini di root proyek dan menyelaraskan `instructions.txt`.

---

## 🟢 Fase 2: Data Processing & Ingestion Engine (Backend Data Layer) (SELESAI)
- [x] Membentuk struktur folder `backend/` dan `backend-instructions/`.
- [x] Membuat instruksi ETL di `backend-instructions/etl_pipeline.md`.
- [x] Membuat script Python cleansing data, whitelisting item dari Master Data, dan konsolidasi kode produk lama ke `Product_code` utama (`backend/etl.py`).
- [x] Membuat modul kalkulasi metrik:
  - Stok MNJ ($\text{QTY\_STOK\_BAIK} + \text{QTY\_BDP}$)
  - Stok KX ($\text{Saldo Akhir}$)
  - Avg Sales Bulanan berdasar periode terpilih
  - Kalkulasi DOI ($\frac{\text{Stok}}{\text{Avg Sales}} \times 30$)
  - Konversi Quantity ke Value ($\text{Qty} \times \text{Harga Dasar}$)
- [x] Pengujian data pipeline secara lokal (`backend/test_etl.py`) dan validasi keakuratan angka.

---

## 🟢 Fase 3: REST API Service Development (FastAPI / Python Service) (SELESAI)
- [x] Membuat instruksi API di `backend-instructions/api_service.md`.
- [x] Membangun web service API di `backend/main.py`.
- [x] Membuat endpoint:
  - `GET /` & `GET /health`: Health status.
  - `GET /api/v1/metadata`: Periode data (e.g. 2026-07, 2026-06, etc.), daftar Group Bisnis (GB), kategori, & total produk.
  - `GET /api/v1/summary`: Ringkasan metrik kesehatan stok berdasar periode terpilih.
  - `GET /api/v1/doi-data`: Detail data DOI dengan support filter dinamis per periode.
  - `GET /api/v1/export`: Ekspor hasil olahan ke format CSV.
- [x] Testing API endpoint secara lokal (`backend/test_api.py`) - Semua endpoint terverifikasi 100% lulus.

---

## 🟢 Fase 4: Frontend Web Dashboard (React + TypeScript / Modern Web UI) (SELESAI)
- [x] Membentuk struktur folder `frontend/` dan `frontend-instructions/`.
- [x] Membuat UI instructions di `frontend-instructions/dashboard_ui.md`.
- [x] Menginisialisasi project Dashboard dengan TypeScript, Glassmorphism aesthetic, dan modern UI system (`frontend/index.html`, `frontend/index.css`).
- [x] Membangun komponen UI:
  - Header dengan live API connection status indicator.
  - Risk Alert Summary Cards (Total SKU, Understock, Normal, Overstock, Total Valuasi Stok, Valuasi Avg Sales).
  - Dynamic Filter Bar (**Dropdown Filter Periode Data**, Dual View Switcher MNJ/KX/Total, Toggle Satuan Qty/Value, Rentang Avg Sales, Dropdown GB, Dropdown Kategori, Health Status Quick Filter, Live Search Bar, Export CSV Button).
  - Interactive Data Table dengan Indikator Badges (Red/Green/Yellow), Sorting, dan Paginasi.
  - Detail Pop-up Modal perbandingan stok & DOI entitas.
- [x] Integrasi Frontend dengan Backend API lokal di `frontend/src/api.ts` & `frontend/src/app.ts`.
- [x] Testing pengiriman aset frontend secara lokal - Terverifikasi 100% lulus.

---

## 🟡 Fase 5: Dokumentasi & Pre-Deployment Checklist
- [ ] Membuat `backend/requirements.txt`.
- [ ] Membuat `backend/README.md` dan `frontend/README.md`.
- [ ] Pengujian environment lokal & verifikasi environment variables (`.env`).

---

## 🟡 Fase 6: Deployment & Final Verification
- [ ] Deployment Backend ke Render.com.
- [ ] Deployment Frontend ke Vercel.
- [ ] Testing aplikasi secara live end-to-end.
- [ ] Final Sign-off.
