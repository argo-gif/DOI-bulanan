# Backend REST API Service Instruction (FastAPI)

Dokumen ini mendefinisikan rancangan endpoint REST API, struktur response, serta aturan filter data untuk Dashboard Monitoring DOI Bulanan.

---

## 1. Stack & Konfigurasi
- **Framework**: FastAPI (Python)
- **CORS**: Mengizinkan request dari frontend local (`http://localhost:5173` / `http://localhost:3000`) dan production domain Vercel.
- **Port Local**: `8000` (`http://localhost:8000`)

---

## 2. API Endpoints Specification

### A. Health Check & Root
- **GET `/`**
  - **Deskripsi**: Cek status server API.
  - **Response**: `{"status": "online", "version": "1.0.0", "app": "DOI Bulanan Monitoring API"}`

### B. Metadata Endpoint
- **GET `/api/v1/metadata`**
  - **Deskripsi**: Mengambil opsi filter dinamis untuk frontend UI.
  - **Response**:
    ```json
    {
      "gb_options": ["All", "GB 1", "GB 2", ...],
      "categories": ["All", "KAT A", "KAT B", ...],
      "periods": ["Januari 2026", "Desember 2025", ...],
      "avg_months_options": [1, 3, 6, 12],
      "total_products": 260
    }
    ```

### C. Health Status Summary Endpoint
- **GET `/api/v1/summary`**
  - **Query Parameters**:
    - `view`: `mnj` | `kx` | `total` (Default: `total`)
    - `unit`: `qty` | `value` (Default: `qty`)
    - `gb`: `str` (Default: `All`)
    - `category`: `str` (Default: `All`)
    - `avg_months`: `int` (Default: `1`)
  - **Response**:
    ```json
    {
      "view": "total",
      "unit": "qty",
      "total_sku": 260,
      "understock_count": 85,
      "normal_count": 71,
      "overstock_count": 104,
      "total_stok_value": 15420000000.0,
      "total_avg_sales_value": 4500000000.0
    }
    ```

### D. Main DOI Data Endpoint
- **GET `/api/v1/doi-data`**
  - **Query Parameters**:
    - `view`: `mnj` | `kx` | `total` (Default: `total`)
    - `unit`: `qty` | `value` (Default: `qty`)
    - `gb`: `str` (Default: `All`)
    - `category`: `str` (Default: `All`)
    - `health_status`: `All` | `Understock` | `Normal` | `Overstock`
    - `search`: `str` (Searching by Product Code or Name)
    - `avg_months`: `int` (Default: `1`)
    - `page`: `int` (Default: `1`)
    - `page_size`: `int` (Default: `50`)
  - **Response**:
    ```json
    {
      "total_records": 260,
      "page": 1,
      "page_size": 50,
      "total_pages": 6,
      "data": [
        {
          "product_code": "ANA005",
          "principal_product_code": "ANAK-  -K-030-  -56",
          "product_name": "ANAKONIDIN 30 ML",
          "gb": "GB 1",
          "category": "KAT A",
          "harga_dasar": 5458.65,
          "stok_mnj_qty": 69408.0,
          "stok_kx_qty": 113391.0,
          "total_stok_qty": 182799.0,
          "avg_sales_qty": 66496.0,
          "stok_mnj_value": 378875080.2,
          "stok_kx_value": 618964782.15,
          "total_stok_value": 997839862.35,
          "avg_sales_value": 362978380.8,
          "doi_mnj_days": 31.3,
          "doi_kx_days": 51.2,
          "doi_total_days": 82.5,
          "health_status_mnj": "Normal",
          "health_status_kx": "Normal",
          "health_status_total": "Normal"
        }
      ]
    }
    ```

### E. Export Endpoint
- **GET `/api/v1/export`**
  - **Query Parameters**: Same filter parameters as `/doi-data`
  - **Response**: Binary file download (CSV / Excel format) for filtered DOI report.
