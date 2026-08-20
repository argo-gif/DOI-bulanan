# Backend Data Ingestion & ETL Pipeline Instruction

Dokumen ini mendefinisikan aturan pemrosesan data (ETL Pipeline), data cleansing, whitelisting, agregasi stok & sales, serta formula kalkulasi Days of Inventory (DOI) dan Valuasi persediaan.

---

## 1. Input Datasets & Schema Target

### A. Master Data Item (`Master produk.xlsx`)
- **Fungsi**: Sumber kebenaran tunggal (*Single Source of Truth*) untuk whitelisting produk dan harga dasar.
- **Kolom Utama**:
  - `Principal_product_code`: Kode unik dari principal (KX).
  - `Product_code`: Kode produk utama di sistem distributor/MNJ.
  - `Product_code_lama`: Kode referensi historis produk (digunakan untuk mapping sales & stok lama).
  - `Product_name`: Nama resmi produk.
  - `GB`: Group Bisnis (contoh: GB 1, GB 2, dll.).
  - `Harga Dasar`: Harga per unit (satuan Rupiah) untuk konversi ke Value.
  - `KATEGORI`: Kategori produk.

### B. Stok Akhir Bulan MNJ (`Stok Akhir bulan MNJ.xlsx`)
- **Fungsi**: Data stok akhir bulan di tingkat distributor (MNJ).
- **Formula Stok MNJ**: $\text{Qty Stok MNJ} = \text{QTY\_STOK\_BAIK} + \text{QTY\_BDP}$
- **Mapping**: Jika `KODE_PRODUK` berada di `Product_code_lama`, konversikan ke `Product_code` utama.

### C. Stok Akhir Bulan KX (`Stok Akhir bulan KX dan Produksi.xlsx`)
- **Fungsi**: Data stok akhir bulan di tingkat principal (KX).
- **Formula Stok KX**: $\text{Qty Stok KX} = \text{Saldo Akhir}$ (diambil dari baris produk utama berdasar `Principal_product_code`).

### D. Data Sales (`Data sales.xlsx`)
- **Fungsi**: Data transaksi penjualan per periode.
- **Mapping**: Konversi `kode_produk` lama ke `Product_code` utama.

---

## 2. Aturan Cleansing & Transformation Flow

1. **Whitelisting**:
   - Filter semua data stok dan sales. Hanya sertakan produk yang `Product_code` atau `Principal_product_code`-nya terdaftar di Master Data Item.
2. **Product Code Normalization**:
   - Ganti `Product_code_lama` menjadi `Product_code` utama sebelum melakukan agregasi stok dan sales.
3. **Agregasi Penjualan (Avg Sales Bulanan)**:
   - Hitung total sales Qty per `Product_code` pada rentang periode yang dipilih.
   - $\text{Avg Sales Bulanan} = \frac{\sum \text{Qty Sales}}{\text{Jumlah Bulan dalam Periode}}$
4. **Kalkulasi DOI**:
   - $\text{DOI MNJ (Hari)} = \left( \frac{\text{Stok MNJ}}{\text{Avg Sales Bulanan}} \right) \times 30$
   - $\text{DOI KX (Hari)} = \left( \frac{\text{Stok KX}}{\text{Avg Sales Bulanan}} \right) \times 30$
   - $\text{DOI Total (Hari)} = \left( \frac{\text{Stok MNJ} + \text{Stok KX}}{\text{Avg Sales Bulanan}} \right) \times 30$
5. **Konversi Value (Financial View)**:
   - $\text{Stok Value} = \text{Qty Stok} \times \text{Harga Dasar}$
   - $\text{Sales Value} = \text{Qty Sales} \times \text{Harga Dasar}$
6. **Health Matrix Threshold**:
   - **Understock**: $\text{DOI} < 30 \text{ Hari}$
   - **Normal**: $30 \le \text{DOI} \le 90 \text{ Hari}$
   - **Overstock**: $\text{DOI} > 90 \text{ Hari}$

---

## 3. Output Data Structure (DataFrame / JSON)
Setiap record data hasil olahan berisi:
- `product_code`: str
- `principal_product_code`: str
- `product_name`: str
- `gb`: str
- `category`: str
- `harga_dasar`: float
- `stok_mnj_qty`: float
- `stok_mnj_value`: float
- `stok_kx_qty`: float
- `stok_kx_value`: float
- `total_stok_qty`: float
- `total_stok_value`: float
- `avg_sales_qty`: float
- `avg_sales_value`: float
- `doi_mnj_days`: float
- `doi_kx_days`: float
- `doi_total_days`: float
- `health_status_mnj`: str ("Understock" | "Normal" | "Overstock")
- `health_status_kx`: str ("Understock" | "Normal" | "Overstock")
- `health_status_total`: str ("Understock" | "Normal" | "Overstock")
