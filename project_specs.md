# Project Specifications: Dashboard Monitoring DOI MNJ (Formula Alignment & Precision)

## 1. Ringkasan Perbaikan Perhitungan DOI
Ditemukan inkonsistensi antara nilai tampilan **Valuasi (Rupiah)** dan **Weighted DOI (Hari)** pada agregasi Group Bisnis (GB) dan Total Konsolidasi. 

### Akar Masalah:
Sebelumnya, DOI pada level GB dan Total Konsolidasi selalu dihitung berdasarkan rasio **Quantity (Unit)** ($\frac{\text{Stok Qty}}{\text{Sales Qty}} \times 30$), meskipun pengguna memilih modul view **Valuasi (Rupiah)**. Karena setiap SKU memiliki `Harga Dasar` yang berbeda-beda, nilai DOI berbasis Valuasi Rupiah berbeda dengan DOI berbasis Quantity.

---

## 2. Formula Perhitungan DOI Presisi (Dual-Mode Dynamic)

### A. Level SKU Individual (Item Product):
Karena `Harga Dasar` pada pembilang dan penyebut sama, nilai DOI Qty dan DOI Value pada level SKU bernilai identik:
$$\text{DOI SKU (Hari)} = \left( \frac{\text{Stok MNJ Qty}}{\text{Avg Sales Qty}} \right) \times 30 = \left( \frac{\text{Stok MNJ Value (IDR)}}{\text{Avg Sales Value (IDR)}} \right) \times 30$$

### B. Level Agregasi Group Bisnis (GB) & Total Konsolidasi:

1. **Mode View: Quantity (Unit)**:
   $$\text{DOI GB (Quantity)} = \left( \frac{\sum \text{Stok MNJ Qty}}{\sum \text{Avg Sales Qty}} \right) \times 30$$

2. **Mode View: Valuasi (Rupiah)**:
   $$\text{DOI GB (Valuasi IDR)} = \left( \frac{\sum \text{Stok MNJ Value (IDR)}}{\sum \text{Avg Sales Value (IDR)}} \right) \times 30$$

---

## 3. Pembuktian Matematika (Contoh GB 1):
- **Total Stok MNJ (Value)**: $\text{Rp } 26.865.663.472$
- **Total Avg Sales (Value)**: $\text{Rp } 16.136.662.439$
- **Perhitungan Mode Valuasi (Rupiah)**:
  $$\text{DOI GB 1 (Valuasi)} = \left( \frac{26.865.663.472}{16.136.662.439} \right) \times 30 = 1,664878 \times 30 = \mathbf{49,9 \text{ Hari}}$$
- **Perhitungan Mode Quantity (Unit)**:
  $$\text{DOI GB 1 (Quantity)} = \left( \frac{4.874.186}{3.021.189} \right) \times 30 = 1,613333 \times 30 = \mathbf{48,4 \text{ Hari}}$$

Sistem telah disesuaikan secara **dinamis** agar nilai DOI pada tabel GB dan Grafik Trend selalu tepat 100% mengikuti mode satuan yang dipilih (*Quantity* vs *Valuasi*).
