# Frontend Web Dashboard UI Instruction (React + TypeScript)

Dokumen ini mendefinisikan rancangan UI/UX, arsitektur komponen, design system, serta aturan integrasi API untuk Frontend Dashboard Monitoring DOI Bulanan.

---

## 1. Design System & Aesthetics
- **Theme**: Dark Slate Glassmorphism Premium Dashboard (`#0f172a` deep background, semi-transparent frosted cards `#1e293b`/80, cyan & violet gradient accents `#06b6d4` to `#8b5cf6`).
- **Typography**: Modern Sans-Serif (`Inter`, `Plus Jakarta Sans`, system-ui).
- **Health Indicators**:
  - 🔴 **Understock (<30 Hari)**: Crimson/Red badge & glow (`#ef4444`, `rgba(239, 68, 68, 0.2)`).
  - 🟢 **Normal (30–90 Hari)**: Emerald/Green badge & glow (`#10b981`, `rgba(16, 185, 129, 0.2)`).
  - 🟡 **Overstock (>90 Hari)**: Amber/Gold badge & glow (`#f59e0b`, `rgba(245, 158, 11, 0.2)`).
- **Interactive Micro-Animations**:
  - Smooth hover scale on metric cards.
  - Active toggle pills background slider.
  - Live pulse animation on API online status indicator.

---

## 2. Component Hierarchy (`frontend/src/`)

- `src/types/index.ts`: TypeScript interfaces (`DOIRecord`, `MetadataResponse`, `SummaryResponse`, `FilterState`).
- `src/services/api.ts`: Fetch functions for `/api/v1/metadata`, `/api/v1/summary`, `/api/v1/doi-data`, and `/api/v1/export`.
- `src/components/Header.tsx`: Navbar with app title, version badge, and live API connection status pill.
- `src/components/FilterBar.tsx`: Dynamic controls:
  - Dual View Switch: Distributor (MNJ) | Principal (KX) | Total Consolidated.
  - Satuan Switch: Quantity (Unit) | Financial Value (Rupiah).
  - Avg Sales Range: 1 Bulan, 3 Bulan, 6 Bulan, 12 Bulan.
  - Group Bisnis Dropdown (GB 1, GB 2, etc.).
  - Category Dropdown.
  - Health Status Quick Filter (All, Understock, Normal, Overstock).
  - Live Search Bar.
  - Export CSV Button.
- `src/components/SummaryCards.tsx`: Top metric cards showing:
  - Total SKU Monitored.
  - Understock SKU count (<30 Hari).
  - Normal SKU count (30–90 Hari).
  - Overstock SKU count (>90 Hari).
  - Total Valuasi Persediaan (IDR).
  - Total Valuasi Rata-rata Sales (IDR).
- `src/components/DataTable.tsx`: Interactive, responsive paginated table showing:
  - Product Code & Principal Code.
  - Product Name & Category.
  - Group Bisnis (GB).
  - Stok MNJ, Stok KX, Total Stok (Qty / Value).
  - Avg Monthly Sales (Qty / Value).
  - DOI MNJ, DOI KX, DOI Total (Hari).
  - Status Health Badge.
  - Row Click -> Open Detail Modal.
- `src/components/DetailModal.tsx`: Visual pop-up modal showing comparison bar chart of MNJ vs KX DOI & Stock Breakdown for the selected SKU.

---

## 3. State Management & API Flow
- Global state tracks `view`, `unit`, `gb`, `category`, `health_status`, `search`, `avg_months`, `page`, `page_size`.
- `useEffect` automatically triggers API re-fetch when filters change.
- Instant fallback graceful UI state during data loading.
