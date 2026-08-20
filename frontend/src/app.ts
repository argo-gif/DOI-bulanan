import { FilterState, DOIRecord, MetadataResponse, SummaryResponse, DOIResponse } from './types';
import { fetchMetadata, fetchSummary, fetchDOIData, getExportUrl } from './api';

class DashboardApp {
  private filters: FilterState = {
    view: 'total',
    unit: 'qty',
    gb: 'All',
    category: 'All',
    health_status: 'All',
    search: '',
    avg_months: 1,
    page: 1,
    page_size: 15,
    sort_by: 'doi_total_days',
    sort_order: 'desc'
  };

  private metadata: MetadataResponse | null = null;
  private summary: SummaryResponse | null = null;
  private doiData: DOIResponse | null = null;
  private selectedRecord: DOIRecord | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.metadata = await fetchMetadata();
      this.populateFilterDropdowns();
      this.bindEvents();
      await this.refreshData();
    } catch (err) {
      console.error('Initialization error:', err);
      this.showError('Gagal terhubung ke API backend. Pastikan server backend FastAPI berjalan di http://localhost:8000.');
    }
  }

  private populateFilterDropdowns() {
    if (!this.metadata) return;

    const gbSelect = document.getElementById('gbSelect') as HTMLSelectElement;
    if (gbSelect) {
      gbSelect.innerHTML = this.metadata.gb_options
        .map(gb => `<option value="${gb}">${gb === 'All' ? 'Semua Group Bisnis (GB)' : gb}</option>`)
        .join('');
    }

    const catSelect = document.getElementById('categorySelect') as HTMLSelectElement;
    if (catSelect) {
      catSelect.innerHTML = this.metadata.categories
        .map(cat => `<option value="${cat}">${cat === 'All' ? 'Semua Kategori' : cat}</option>`)
        .join('');
    }
  }

  private bindEvents() {
    // View Switchers (Total, MNJ, KX)
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = (e.currentTarget as HTMLElement).getAttribute('data-view') as 'total' | 'mnj' | 'kx';
        this.setFilter({ view, page: 1 });
        document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
      });
    });

    // Unit Switchers (Qty vs Value)
    document.querySelectorAll('[data-unit]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const unit = (e.currentTarget as HTMLElement).getAttribute('data-unit') as 'qty' | 'value';
        this.setFilter({ unit });
        document.querySelectorAll('[data-unit]').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
      });
    });

    // Avg Months Select
    const monthsSelect = document.getElementById('avgMonthsSelect') as HTMLSelectElement;
    if (monthsSelect) {
      monthsSelect.addEventListener('change', (e) => {
        this.setFilter({ avg_months: parseInt((e.target as HTMLSelectElement).value, 10), page: 1 });
      });
    }

    // GB Select
    const gbSelect = document.getElementById('gbSelect') as HTMLSelectElement;
    if (gbSelect) {
      gbSelect.addEventListener('change', (e) => {
        this.setFilter({ gb: (e.target as HTMLSelectElement).value, page: 1 });
      });
    }

    // Category Select
    const catSelect = document.getElementById('categorySelect') as HTMLSelectElement;
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.setFilter({ category: (e.target as HTMLSelectElement).value, page: 1 });
      });
    }

    // Health Status Quick Filters
    document.querySelectorAll('[data-health]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const health_status = (e.currentTarget as HTMLElement).getAttribute('data-health') || 'All';
        this.setFilter({ health_status, page: 1 });
        document.querySelectorAll('[data-health]').forEach(b => b.classList.remove('active'));
        (e.currentTarget as HTMLElement).classList.add('active');
      });
    });

    // Search Input with Debounce
    const searchInput = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInput) {
      let timeout: any;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.setFilter({ search: (e.target as HTMLInputElement).value, page: 1 });
        }, 300);
      });
    }

    // Export Button
    const btnExport = document.getElementById('btnExport');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        window.open(getExportUrl(this.filters), '_blank');
      });
    }

    // Pagination Buttons
    const btnPrev = document.getElementById('btnPrevPage');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (this.filters.page > 1) this.setFilter({ page: this.filters.page - 1 });
      });
    }

    const btnNext = document.getElementById('btnNextPage');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (this.doiData && this.filters.page < this.doiData.total_pages) {
          this.setFilter({ page: this.filters.page + 1 });
        }
      });
    }

    // Modal Close
    const btnCloseModal = document.getElementById('btnCloseModal');
    const modalOverlay = document.getElementById('modalOverlay');
    if (btnCloseModal && modalOverlay) {
      btnCloseModal.addEventListener('click', () => modalOverlay.classList.remove('active'));
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active');
      });
    }
  }

  private async setFilter(newFilters: Partial<FilterState>) {
    this.filters = { ...this.filters, ...newFilters };
    await this.refreshData();
  }

  private async refreshData() {
    try {
      const [summaryRes, doiRes] = await Promise.all([
        fetchSummary(this.filters),
        fetchDOIData(this.filters)
      ]);

      this.summary = summaryRes;
      this.doiData = doiRes;

      this.renderSummaryCards();
      this.renderTable();
      this.renderPagination();
    } catch (err) {
      console.error('Data refresh error:', err);
      this.showError('Gagal mengambil data dari server API.');
    }
  }

  private renderSummaryCards() {
    if (!this.summary) return;

    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    const formatNum = (val: number) => new Intl.NumberFormat('id-ID').format(val);

    (document.getElementById('metricTotalSKU') as HTMLElement).innerText = formatNum(this.summary.total_sku);
    (document.getElementById('metricUnderstock') as HTMLElement).innerText = formatNum(this.summary.understock_count);
    (document.getElementById('metricNormal') as HTMLElement).innerText = formatNum(this.summary.normal_count);
    (document.getElementById('metricOverstock') as HTMLElement).innerText = formatNum(this.summary.overstock_count);
    (document.getElementById('metricTotalStokVal') as HTMLElement).innerText = formatCurrency(this.summary.total_stok_value);
    (document.getElementById('metricAvgSalesVal') as HTMLElement).innerText = formatCurrency(this.summary.total_avg_sales_value);
  }

  private renderTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody || !this.doiData) return;

    if (this.doiData.data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Tidak ada produk yang memenuhi kriteria filter.
          </td>
        </tr>
      `;
      return;
    }

    const isVal = this.filters.unit === 'value';
    const view = this.filters.view;

    const formatVal = (num: number) => {
      if (isVal) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
      }
      return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num);
    };

    tableBody.innerHTML = this.doiData.data.map(item => {
      const stokMNJ = isVal ? item.stok_mnj_value : item.stok_mnj_qty;
      const stokKX = isVal ? item.stok_kx_value : item.stok_kx_qty;
      const totalStok = isVal ? item.total_stok_value : item.total_stok_qty;
      const avgSales = isVal ? item.avg_sales_value : item.avg_sales_qty;

      let targetDOI = item.doi_total_days;
      let targetStatus = item.health_status_total;

      if (view === 'mnj') {
        targetDOI = item.doi_mnj_days;
        targetStatus = item.health_status_mnj;
      } else if (view === 'kx') {
        targetDOI = item.doi_kx_days;
        targetStatus = item.health_status_kx;
      }

      let badgeClass = 'badge-normal';
      if (targetStatus === 'Understock') badgeClass = 'badge-understock';
      if (targetStatus === 'Overstock') badgeClass = 'badge-overstock';

      return `
        <tr data-pcode="${item.product_code}">
          <td>
            <div style="font-weight: 700; color: #fff;">${item.product_code}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${item.principal_product_code || '-'}</div>
          </td>
          <td style="font-weight: 600;">${item.product_name}</td>
          <td><span style="font-size: 12px; color: var(--text-secondary);">${item.gb}</span></td>
          <td style="text-align: right; font-weight: 500;">${formatVal(stokMNJ)}</td>
          <td style="text-align: right; font-weight: 500;">${formatVal(stokKX)}</td>
          <td style="text-align: right; font-weight: 700; color: #fff;">${formatVal(totalStok)}</td>
          <td style="text-align: right; font-weight: 500;">${formatVal(avgSales)}</td>
          <td style="text-align: right; font-weight: 800; font-size: 14px; color: var(--accent-cyan);">
            ${targetDOI >= 999 ? '> 999' : targetDOI.toFixed(1)} Hari
          </td>
          <td>
            <span class="badge ${badgeClass}">${targetStatus}</span>
          </td>
        </tr>
      `;
    }).join('');

    // Row Click Listener for Detail Modal
    tableBody.querySelectorAll('tr[data-pcode]').forEach(row => {
      row.addEventListener('click', () => {
        const pcode = row.getAttribute('data-pcode');
        const item = this.doiData?.data.find(d => d.product_code === pcode);
        if (item) this.openDetailModal(item);
      });
    });
  }

  private renderPagination() {
    if (!this.doiData) return;

    const info = document.getElementById('paginationInfo');
    if (info) {
      const start = (this.filters.page - 1) * this.filters.page_size + 1;
      const end = Math.min(this.filters.page * this.filters.page_size, this.doiData.total_records);
      info.innerText = `Menampilkan ${start} - ${end} dari ${this.doiData.total_records} SKU (Halaman ${this.filters.page} dari ${this.doiData.total_pages})`;
    }

    const btnPrev = document.getElementById('btnPrevPage') as HTMLButtonElement;
    const btnNext = document.getElementById('btnNextPage') as HTMLButtonElement;

    if (btnPrev) btnPrev.disabled = this.filters.page <= 1;
    if (btnNext) btnNext.disabled = this.filters.page >= this.doiData.total_pages;
  }

  private openDetailModal(item: DOIRecord) {
    this.selectedRecord = item;
    const modalContent = document.getElementById('modalContent');
    const modalOverlay = document.getElementById('modalOverlay');

    if (!modalContent || !modalOverlay) return;

    const formatCurr = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
    const formatNum = (val: number) => new Intl.NumberFormat('id-ID').format(val);

    modalContent.innerHTML = `
      <div style="margin-bottom: 20px;">
        <span class="badge badge-normal" style="margin-bottom: 8px;">${item.gb}</span>
        <h2 style="font-size: 20px; font-weight: 700; color: #fff;">${item.product_name}</h2>
        <p style="font-size: 13px; color: var(--text-secondary);">Product Code: <strong>${item.product_code}</strong> | Principal Code: <strong>${item.principal_product_code}</strong></p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Harga Dasar Unit</div>
          <div style="font-size: 18px; font-weight: 700; color: var(--accent-cyan); margin-top: 4px;">${formatCurr(item.harga_dasar)}</div>
        </div>
        <div style="background: rgba(15, 23, 42, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--border-color);">
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Avg Sales Bulanan</div>
          <div style="font-size: 18px; font-weight: 700; color: #fff; margin-top: 4px;">${formatNum(item.avg_sales_qty)} Unit</div>
          <div style="font-size: 12px; color: var(--text-muted);">${formatCurr(item.avg_sales_value)}</div>
        </div>
      </div>

      <h3 style="font-size: 14px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 12px;">Komparasi DOI & Stok Entitas</h3>

      <div style="display: flex; flex-direction: column; gap: 12px;">
        <!-- MNJ Row -->
        <div style="background: rgba(15, 23, 42, 0.6); padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: #fff;">Distributor (MNJ)</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${formatNum(item.stok_mnj_qty)} Unit (${formatCurr(item.stok_mnj_value)})</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 800; color: var(--accent-cyan);">${item.doi_mnj_days.toFixed(1)} Hari</div>
            <span class="badge ${item.health_status_mnj === 'Understock' ? 'badge-understock' : item.health_status_mnj === 'Overstock' ? 'badge-overstock' : 'badge-normal'}">${item.health_status_mnj}</span>
          </div>
        </div>

        <!-- KX Row -->
        <div style="background: rgba(15, 23, 42, 0.6); padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: #fff;">Principal (KX)</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${formatNum(item.stok_kx_qty)} Unit (${formatCurr(item.stok_kx_value)})</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 800; color: var(--accent-cyan);">${item.doi_kx_days.toFixed(1)} Hari</div>
            <span class="badge ${item.health_status_kx === 'Understock' ? 'badge-understock' : item.health_status_kx === 'Overstock' ? 'badge-overstock' : 'badge-normal'}">${item.health_status_kx}</span>
          </div>
        </div>

        <!-- Total Row -->
        <div style="background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.3); padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: #fff;">Total Konsolidasi</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${formatNum(item.total_stok_qty)} Unit (${formatCurr(item.total_stok_value)})</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 20px; font-weight: 800; color: #fff;">${item.doi_total_days.toFixed(1)} Hari</div>
            <span class="badge ${item.health_status_total === 'Understock' ? 'badge-understock' : item.health_status_total === 'Overstock' ? 'badge-overstock' : 'badge-normal'}">${item.health_status_total}</span>
          </div>
        </div>
      </div>
    `;

    modalOverlay.classList.add('active');
  }

  private showError(msg: string) {
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 40px; color: var(--status-understock);">
            ❌ ${msg}
          </td>
        </tr>
      `;
    }
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  new DashboardApp();
});
