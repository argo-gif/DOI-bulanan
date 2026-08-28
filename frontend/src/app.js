import { fetchMetadata, fetchSummary, fetchDOIData, getExportUrl } from './api.js';

class DashboardApp {
  constructor() {
    this.filters = {
      period: '',
      view: 'total',
      unit: 'value',
      gb: 'All',
      category: 'All',
      health_status: 'All',
      search: '',
      avg_months: 6,
      page: 1,
      page_size: 15,
      sort_by: 'doi_total_days',
      sort_order: 'desc'
    };

    this.metadata = null;
    this.summary = null;
    this.doiData = null;
    this.selectedRecord = null;

    this.init();
  }

  async init() {
    try {
      this.metadata = await fetchMetadata();
      if (this.metadata && this.metadata.periods && this.metadata.periods.length > 0) {
        this.filters.period = this.metadata.periods[0]; // Default to latest period
      }
      this.populateFilterDropdowns();
      this.bindEvents();
      await this.refreshData();
    } catch (err) {
      console.error('Initialization error:', err);
      this.showError('Gagal terhubung ke API backend. Pastikan server backend FastAPI berjalan di http://localhost:8000.');
    }
  }

  populateFilterDropdowns() {
    if (!this.metadata) return;

    // Period Select
    const periodSelect = document.getElementById('periodSelect');
    if (periodSelect && this.metadata.periods) {
      periodSelect.innerHTML = this.metadata.periods
        .map(p => {
          const parts = p.split('-');
          const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
          const monthIdx = parseInt(parts[1], 10) - 1;
          const label = (monthIdx >= 0 && monthIdx < 12) ? `${monthNames[monthIdx]} ${parts[0]}` : p;
          return `<option value="${p}">${label}</option>`;
        })
        .join('');

      if (this.filters.period) {
        periodSelect.value = this.filters.period;
      }
    }

    // GB Select
    const gbSelect = document.getElementById('gbSelect');
    if (gbSelect) {
      gbSelect.innerHTML = this.metadata.gb_options
        .map(gb => `<option value="${gb}">${gb === 'All' ? 'Semua Group Bisnis (GB)' : gb}</option>`)
        .join('');
    }

    // Category Select
    const catSelect = document.getElementById('categorySelect');
    if (catSelect) {
      catSelect.innerHTML = (this.metadata.categories || [])
        .map(cat => `<option value="${cat}">${cat === 'All' ? 'Semua Kategori' : cat}</option>`)
        .join('');
    }
  }

  bindEvents() {
    // Period Select Change
    const periodSelect = document.getElementById('periodSelect');
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        this.setFilter({ period: e.target.value, page: 1 });
      });
    }

    // View Switchers (Total, MNJ, KX)
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        this.setFilter({ view, page: 1 });
        document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // Unit Switchers (Qty vs Value)
    document.querySelectorAll('[data-unit]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const unit = e.currentTarget.getAttribute('data-unit');
        this.setFilter({ unit });
        document.querySelectorAll('[data-unit]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // Avg Months Select
    const monthsSelect = document.getElementById('avgMonthsSelect');
    if (monthsSelect) {
      monthsSelect.addEventListener('change', (e) => {
        this.setFilter({ avg_months: parseInt(e.target.value, 10), page: 1 });
      });
    }

    // GB Select
    const gbSelect = document.getElementById('gbSelect');
    if (gbSelect) {
      gbSelect.addEventListener('change', (e) => {
        this.setFilter({ gb: e.target.value, page: 1 });
      });
    }

    // Category Select
    const catSelect = document.getElementById('categorySelect');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.setFilter({ category: e.target.value, page: 1 });
      });
    }

    // Health Status Quick Filters
    document.querySelectorAll('[data-health]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const health_status = e.currentTarget.getAttribute('data-health') || 'All';
        this.setFilter({ health_status, page: 1 });
        document.querySelectorAll('[data-health]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
      });
    });

    // Search Input with Debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.setFilter({ search: e.target.value, page: 1 });
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

  async setFilter(newFilters) {
    this.filters = { ...this.filters, ...newFilters };
    await this.refreshData();
  }

  async refreshData() {
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

  renderSummaryCards() {
    if (!this.summary) return;

    const formatCurrency = (val) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    };

    const formatNum = (val) => new Intl.NumberFormat('id-ID').format(val);

    document.getElementById('metricTotalSKU').innerText = formatNum(this.summary.total_sku);
    document.getElementById('metricUnderstock').innerText = formatNum(this.summary.understock_count);
    document.getElementById('metricNormal').innerText = formatNum(this.summary.normal_count);
    document.getElementById('metricOverstock').innerText = formatNum(this.summary.overstock_count);
    if (document.getElementById('metricTotalStokVal')) {
      document.getElementById('metricTotalStokVal').innerText = formatCurrency(this.summary.total_stok_value);
    }
    if (document.getElementById('metricAvgSalesVal')) {
      document.getElementById('metricAvgSalesVal').innerText = formatCurrency(this.summary.total_avg_sales_value);
    }
  }

  renderTable() {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody || !this.doiData) return;

    if (this.doiData.data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="13" style="text-align: center; padding: 40px; color: var(--text-muted);">
            Tidak ada produk yang memenuhi kriteria filter.
          </td>
        </tr>
      `;
      return;
    }

    const isVal = this.filters.unit === 'value';
    const view = this.filters.view;

    const formatVal = (num) => {
      if (isVal) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
      }
      return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num);
    };

    tableBody.innerHTML = this.doiData.data.map(item => {
      const stokMNJ = isVal ? item.stok_mnj_value : item.stok_mnj_qty;
      const stokKX = isVal ? item.stok_kx_value : item.stok_kx_qty;
      const totalStok = isVal ? item.stok_total_value : item.stok_total_qty;
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
      let dotColor = '#34d399';
      if (targetStatus === 'Understock') { badgeClass = 'badge-understock'; dotColor = '#f87171'; }
      if (targetStatus === 'Overstock') { badgeClass = 'badge-overstock'; dotColor = '#fbbf24'; }

      return `
        <tr data-pcode="${item.product_code}">
          <td>
            <div style="font-weight: 700; color: #fff;">${item.product_code}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${item.principal_product_code || '-'}</div>
          </td>
          <td style="font-weight: 600;">${item.product_name}</td>
          <td><span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">${item.gb}</span></td>
          <td><span class="badge" style="background: rgba(100, 116, 139, 0.2); color: #cbd5e1; border: 1px solid rgba(100, 116, 139, 0.3);">${item.keterangan_produk}</span></td>
          <td style="text-align: right; font-weight: 500;">${formatVal(stokMNJ)}</td>
          <td style="text-align: right; font-weight: 500;">${formatVal(stokKX)}</td>
          <td style="text-align: right; font-weight: 700; color: #fff;">${formatVal(totalStok)}</td>
          <td style="text-align: right; font-weight: 500;">${formatVal(avgSales)}</td>
          <td style="text-align: right; font-weight: 600; color: #60a5fa;">${item.doi_mnj_days.toFixed(1)} d</td>
          <td style="text-align: right; font-weight: 600; color: #f472b6;">${item.doi_kx_days.toFixed(1)} d</td>
          <td style="text-align: right; font-weight: 800; font-size: 14px; color: var(--accent-cyan);">
            ${targetDOI >= 999 ? '> 999' : targetDOI.toFixed(1)} Hari
          </td>
          <td style="text-align: right; font-weight: 700; font-size: 14px; color: #a7f3d0;">
            ${((item.doi_max_days !== undefined && item.doi_max_days !== null) ? item.doi_max_days : (item.target_doi_days !== undefined && item.target_doi_days !== null ? item.target_doi_days : 90)).toFixed(1)} Hari
          </td>
          <td>
            <span class="badge ${badgeClass}"><span class="badge-dot" style="background:${dotColor};"></span>${targetStatus}</span>
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

  renderPagination() {
    if (!this.doiData) return;

    const info = document.getElementById('paginationInfo');
    if (info) {
      const start = (this.filters.page - 1) * this.filters.page_size + 1;
      const end = Math.min(this.filters.page * this.filters.page_size, this.doiData.total_records);
      info.innerText = `Menampilkan ${start} - ${end} dari ${this.doiData.total_records} SKU (Halaman ${this.filters.page} dari ${this.doiData.total_pages})`;
    }

    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');

    if (btnPrev) btnPrev.disabled = this.filters.page <= 1;
    if (btnNext) btnNext.disabled = this.filters.page >= this.doiData.total_pages;
  }

  openDetailModal(item) {
    this.selectedRecord = item;
    const modalContent = document.getElementById('modalContent');
    const modalOverlay = document.getElementById('modalOverlay');

    if (!modalContent || !modalOverlay) return;

    const formatCurr = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
    const formatNum = (val) => new Intl.NumberFormat('id-ID').format(val);
    const doiMax = (item.doi_max_days !== undefined && item.doi_max_days !== null) ? item.doi_max_days : (item.target_doi_days !== undefined && item.target_doi_days !== null ? item.target_doi_days : 90);

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

      <h3 style="font-size: 14px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 12px;">Komparasi DOI & Stok Entitas (${item.period})</h3>

      <div style="display: flex; flex-direction: column; gap: 12px;">
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

        <div style="background: rgba(15, 23, 42, 0.6); padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: #fff;">Principal (KX)</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${formatNum(item.stok_kx_qty)} Unit (${formatCurr(item.stok_kx_value)})</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 800; color: var(--accent-cyan);">${item.doi_kx_days.toFixed(1)} Hari</div>
            <span class="badge ${item.health_status_kx === 'Understock' ? 'badge-understock' : item.health_status_kx === 'Overstock' ? 'badge-overstock' : 'badge-normal'}">${item.health_status_kx || 'Normal'}</span>
          </div>
        </div>

        <div style="background: rgba(0, 242, 254, 0.1); border: 1px solid rgba(0, 242, 254, 0.3); padding: 14px 18px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: #fff;">Total Konsolidasi (Max: ${doiMax.toFixed(1)} Hari)</div>
            <div style="font-size: 12px; color: var(--text-secondary);">${formatNum(item.stok_total_qty)} Unit (${formatCurr(item.stok_total_value)})</div>
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

  showError(msg) {
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="13" style="text-align: center; padding: 40px; color: var(--status-understock);">
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
