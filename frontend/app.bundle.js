// Combined Standalone Frontend Script for Dashboard Monitoring DOI MNJ (Guaranteed Data Loading & Robust Error Fallbacks)
(function() {
  const API_BASE = '/api/v1';

  async function fetchMetadata() {
    const res = await fetch(`${API_BASE}/metadata`);
    if (!res.ok) throw new Error('Failed to fetch metadata');
    return res.json();
  }

  async function fetchSummary(filters) {
    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      unit: filters.unit,
      gb: filters.gb,
      keterangan: filters.keterangan,
      avg_months: filters.avg_months.toString()
    });
    const res = await fetch(`${API_BASE}/summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  }

  async function fetchGBSummary(filters) {
    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      avg_months: filters.avg_months.toString(),
      keterangan: filters.keterangan,
      unit: filters.unit
    });
    const res = await fetch(`${API_BASE}/gb-summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch GB summary');
    return res.json();
  }

  async function fetchDOITrend(filters) {
    const params = new URLSearchParams({
      gb: filters.gb,
      keterangan: filters.keterangan,
      avg_months: filters.avg_months.toString(),
      unit: filters.unit
    });
    const res = await fetch(`${API_BASE}/doi-trend?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch DOI trend');
    return res.json();
  }

  async function fetchDOIData(filters) {
    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      unit: filters.unit,
      gb: filters.gb,
      keterangan: filters.keterangan,
      health_status: filters.health_status,
      search: filters.search,
      avg_months: filters.avg_months.toString(),
      page: filters.page.toString(),
      page_size: filters.page_size.toString()
    });
    const res = await fetch(`${API_BASE}/doi-data?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch DOI data');
    return res.json();
  }

  function getExportUrl(filters) {
    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      unit: filters.unit,
      gb: filters.gb,
      keterangan: filters.keterangan,
      health_status: filters.health_status,
      search: filters.search,
      avg_months: filters.avg_months.toString()
    });
    return `${API_BASE}/export?${params.toString()}`;
  }

  class DashboardApp {
    constructor() {
      this.filters = {
        period: '2026-07',
        unit: 'qty',
        scale: 'compact', // 'compact' or 'full'
        gb: 'All',
        keterangan: 'All',
        health_status: 'All',
        search: '',
        avg_months: 1,
        page: 1,
        page_size: 15
      };

      this.metadata = null;
      this.summary = null;
      this.gbSummary = null;
      this.trendData = null;
      this.doiData = null;

      this.init();
    }

    async init() {
      try {
        this.metadata = await fetchMetadata();
        if (this.metadata && this.metadata.periods && this.metadata.periods.length > 0) {
          this.filters.period = this.metadata.periods[0];
        } else {
          this.filters.period = '2026-07';
        }
        this.populateFilterDropdowns();
        this.bindEvents();
        await this.refreshData();
      } catch (err) {
        console.error('[DASHBOARD] Initialization error:', err);
        this.filters.period = '2026-07';
        this.populateFilterDropdowns();
        this.bindEvents();
        await this.refreshData();
      }
    }

    formatDisplayValue(num, isCurrency = false) {
      if (num === null || num === undefined || isNaN(num)) return isCurrency ? 'Rp 0' : '0';

      const isCompact = this.filters.scale === 'compact';

      if (isCompact) {
        const abs = Math.abs(num);
        if (abs >= 1e9) {
          const val = (num / 1e9).toFixed(2);
          return isCurrency ? `Rp ${val} Miliar` : `${val} M Unit`;
        }
        if (abs >= 1e6) {
          const val = (num / 1e6).toFixed(2);
          return isCurrency ? `Rp ${val} Juta` : `${val} Jt Unit`;
        }
        if (abs >= 1e3) {
          const val = (num / 1e3).toFixed(1);
          return isCurrency ? `Rp ${val} Ribu` : `${val} Rb Unit`;
        }
      }

      if (isCurrency) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
      }
      return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(num);
    }

    populateFilterDropdowns() {
      const periodSelect = document.getElementById('periodSelect');
      if (periodSelect) {
        const periods = (this.metadata && this.metadata.periods && this.metadata.periods.length > 0)
          ? this.metadata.periods
          : ['2026-07', '2026-06', '2026-05', '2026-04', '2026-03', '2026-02', '2026-01'];

        periodSelect.innerHTML = periods
          .map(p => {
            const parts = p.split('-');
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
            const monthIdx = parseInt(parts[1], 10) - 1;
            const label = (monthIdx >= 0 && monthIdx < 12) ? `${monthNames[monthIdx]} ${parts[0]}` : p;
            return `<option value="${p}">${label}</option>`;
          })
          .join('');

        if (this.filters.period) {
          periodSelect.value = this.filters.period;
        }
      }

      const gbSelect = document.getElementById('gbSelect');
      if (gbSelect) {
        const gbOpts = (this.metadata && this.metadata.gb_options)
          ? this.metadata.gb_options
          : ['All', 'GB 1', 'GB 2', 'GB 3', 'GB 4', 'GB 5', 'GB 6', 'GB ET'];

        gbSelect.innerHTML = gbOpts
          .map(gb => `<option value="${gb}">${gb === 'All' ? 'Semua Group Bisnis (GB)' : gb}</option>`)
          .join('');
        gbSelect.value = this.filters.gb;
      }

      const ketSelect = document.getElementById('ketSelect');
      if (ketSelect) {
        const ketOpts = (this.metadata && this.metadata.keterangan_options)
          ? this.metadata.keterangan_options
          : ['All', 'Festive', 'Produk Baru', 'Regular'];

        ketSelect.innerHTML = ketOpts
          .map(k => `<option value="${k}">${k === 'All' ? 'Semua Keterangan Produk' : k}</option>`)
          .join('');
        ketSelect.value = this.filters.keterangan;
      }
    }

    bindEvents() {
      const periodSelect = document.getElementById('periodSelect');
      if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
          this.setFilter({ period: e.target.value, page: 1 });
        });
      }

      document.querySelectorAll('[data-unit]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const unit = e.currentTarget.getAttribute('data-unit');
          this.setFilter({ unit, page: 1 });
          document.querySelectorAll('[data-unit]').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
        });
      });

      const scaleSelect = document.getElementById('scaleSelect');
      if (scaleSelect) {
        scaleSelect.addEventListener('change', (e) => {
          this.filters.scale = e.target.value;
          this.renderSummaryCards();
          this.renderGBTable();
          this.renderTable();
        });
      }

      const monthsSelect = document.getElementById('avgMonthsSelect');
      if (monthsSelect) {
        monthsSelect.addEventListener('change', (e) => {
          this.setFilter({ avg_months: parseInt(e.target.value, 10), page: 1 });
        });
      }

      const gbSelect = document.getElementById('gbSelect');
      if (gbSelect) {
        gbSelect.addEventListener('change', (e) => {
          this.setFilter({ gb: e.target.value, page: 1 });
        });
      }

      const ketSelect = document.getElementById('ketSelect');
      if (ketSelect) {
        ketSelect.addEventListener('change', (e) => {
          this.setFilter({ keterangan: e.target.value, page: 1 });
        });
      }

      document.querySelectorAll('[data-health]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const health_status = e.currentTarget.getAttribute('data-health') || 'All';
          this.setFilter({ health_status, page: 1 });
          document.querySelectorAll('[data-health]').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
        });
      });

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

      const btnExport = document.getElementById('btnExport');
      if (btnExport) {
        btnExport.addEventListener('click', () => {
          window.open(getExportUrl(this.filters), '_blank');
        });
      }

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
    }

    async setFilter(newFilters) {
      this.filters = { ...this.filters, ...newFilters };
      await this.refreshData();
    }

    async refreshData() {
      try {
        const [summaryRes, gbSummaryRes, trendRes, doiRes] = await Promise.all([
          fetchSummary(this.filters),
          fetchGBSummary(this.filters),
          fetchDOITrend(this.filters),
          fetchDOIData(this.filters)
        ]);

        this.summary = summaryRes;
        this.gbSummary = gbSummaryRes;
        this.trendData = trendRes;
        this.doiData = doiRes;

        this.renderSummaryCards();
        this.renderTrendChart();
        this.renderGBTable();
        this.renderTable();
        this.renderPagination();
      } catch (err) {
        console.error('[DASHBOARD] Data refresh error:', err);
        this.showError('Gagal mengambil data dari server API.');
      }
    }

    renderSummaryCards() {
      if (!this.summary) return;

      const formatNum = (val) => new Intl.NumberFormat('id-ID').format(val);

      document.getElementById('metricTotalSKU').innerText = formatNum(this.summary.total_sku);
      document.getElementById('metricUnderstock').innerText = formatNum(this.summary.understock_count);
      document.getElementById('metricNormal').innerText = formatNum(this.summary.normal_count);
      document.getElementById('metricOverstock').innerText = formatNum(this.summary.overstock_count);

      document.getElementById('metricTotalStokVal').innerText = this.formatDisplayValue(this.summary.total_stok_value, true);
      document.getElementById('metricAvgSalesVal').innerText = this.formatDisplayValue(this.summary.total_avg_sales_value, true);
    }

    renderTrendChart() {
      const chartContainer = document.getElementById('trendChartContainer');
      if (!chartContainer || !this.trendData || this.trendData.length === 0) return;

      const data = this.trendData;
      const maxDOI = Math.max(...data.map(d => d.doi_mnj_days), 100);
      const minDOI = 0;

      const width = 800;
      const height = 220;
      const padding = { top: 20, right: 30, bottom: 40, left: 50 };

      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      const xStep = chartW / Math.max(1, data.length - 1);

      const points = data.map((d, i) => {
        const x = padding.left + i * xStep;
        const y = padding.top + chartH - ((d.doi_mnj_days - minDOI) / (maxDOI - minDOI)) * chartH;
        return { x, y, data: d };
      });

      const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
      const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

      const y30 = padding.top + chartH - ((30 - minDOI) / (maxDOI - minDOI)) * chartH;
      const y90 = padding.top + chartH - ((90 - minDOI) / (maxDOI - minDOI)) * chartH;

      chartContainer.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;">
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
            </linearGradient>
          </defs>

          <!-- Understock 30 Day Reference Line -->
          <line x1="${padding.left}" y1="${y30}" x2="${width - padding.right}" y2="${y30}" stroke="#ef4444" stroke-dasharray="4 4" stroke-opacity="0.6" stroke-width="1.5"/>
          <text x="${width - padding.right - 10}" y="${y30 - 5}" fill="#ef4444" font-size="10" font-weight="700" text-anchor="end">Batas Understock (30 Hari)</text>

          <!-- Overstock 90 Day Reference Line -->
          <line x1="${padding.left}" y1="${y90}" x2="${width - padding.right}" y2="${y90}" stroke="#f59e0b" stroke-dasharray="4 4" stroke-opacity="0.6" stroke-width="1.5"/>
          <text x="${width - padding.right - 10}" y="${y90 - 5}" fill="#f59e0b" font-size="10" font-weight="700" text-anchor="end">Batas Overstock (90 Hari)</text>

          <!-- Trend Area & Line -->
          <path d="${areaD}" fill="url(#trendGradient)" />
          <path d="${pathD}" fill="none" stroke="#06b6d4" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Data Points & Labels -->
          ${points.map(p => `
            <g class="chart-point-group" data-period="${p.data.period}">
              <circle cx="${p.x}" cy="${p.y}" r="6" fill="#090d16" stroke="#06b6d4" stroke-width="3" style="transition: r 0.2s ease; cursor: pointer;"/>
              <text x="${p.x}" y="${p.y - 12}" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">${p.data.doi_mnj_days} Hari</text>
              <text x="${p.x}" y="${height - padding.bottom + 18}" fill="#94a3b8" font-size="11" font-weight="600" text-anchor="middle">${p.data.period_label}</text>
            </g>
          `).join('')}
        </svg>
      `;

      chartContainer.querySelectorAll('.chart-point-group').forEach(el => {
        el.addEventListener('click', () => {
          const p = el.getAttribute('data-period');
          if (p) {
            this.setFilter({ period: p, page: 1 });
            const periodSelect = document.getElementById('periodSelect');
            if (periodSelect) periodSelect.value = p;
          }
        });
      });
    }

    renderGBTable() {
      const tableBody = document.getElementById('gbTableBody');
      if (!tableBody || !this.gbSummary) return;

      const isVal = this.filters.unit === 'value';

      const totalSKU = this.gbSummary.reduce((a, b) => a + b.total_sku, 0);
      const totalStokQty = this.gbSummary.reduce((a, b) => a + b.stok_mnj_qty, 0);
      const totalStokVal = this.gbSummary.reduce((a, b) => a + b.stok_mnj_value, 0);
      const totalSalesQty = this.gbSummary.reduce((a, b) => a + b.avg_sales_qty, 0);
      const totalSalesVal = this.gbSummary.reduce((a, b) => a + b.avg_sales_value, 0);

      const totalDOI = isVal
        ? (totalSalesVal > 0 ? (totalStokVal / totalSalesVal * 30.0) : 0)
        : (totalSalesQty > 0 ? (totalStokQty / totalSalesQty * 30.0) : 0);

      let totalBadge = 'badge-normal';
      if (totalDOI < 30) totalBadge = 'badge-understock';
      if (totalDOI > 90) totalBadge = 'badge-overstock';

      let html = this.gbSummary.map(gb => {
        const stokDisplay = isVal ? gb.stok_mnj_value : gb.stok_mnj_qty;
        const salesDisplay = isVal ? gb.avg_sales_value : gb.avg_sales_qty;

        let badgeClass = 'badge-normal';
        if (gb.health_status_mnj === 'Understock') badgeClass = 'badge-understock';
        if (gb.health_status_mnj === 'Overstock') badgeClass = 'badge-overstock';

        const isActive = this.filters.gb === gb.gb;

        return `
          <tr data-gb="${gb.gb}" style="${isActive ? 'background: rgba(6, 182, 212, 0.15); border-left: 4px solid var(--accent-cyan);' : ''}">
            <td style="font-weight: 700; color: #fff;">${gb.gb}</td>
            <td style="text-align: right; font-weight: 600;">${gb.total_sku}</td>
            <td style="text-align: right; font-weight: 600; color: #fff;">${this.formatDisplayValue(stokDisplay, isVal)}</td>
            <td style="text-align: right; font-weight: 500;">${this.formatDisplayValue(salesDisplay, isVal)}</td>
            <td style="text-align: right; font-weight: 800; color: var(--accent-cyan); font-size: 14px;">${gb.doi_mnj_days.toFixed(1)} Hari</td>
            <td><span class="badge ${badgeClass}">${gb.health_status_mnj}</span></td>
            <td style="font-size: 12px;">
              <span style="color: #f87171;">🔴 ${gb.understock_count}</span> | 
              <span style="color: #34d399;">🟢 ${gb.normal_count}</span> | 
              <span style="color: #fbbf24;">🟡 ${gb.overstock_count}</span>
            </td>
          </tr>
        `;
      }).join('');

      const totStokDisp = isVal ? totalStokVal : totalStokQty;
      const totSalesDisp = isVal ? totalSalesVal : totalSalesQty;

      html += `
        <tr style="background: rgba(15, 23, 42, 0.9); font-weight: 700; border-top: 2px solid var(--border-color);">
          <td style="color: var(--accent-cyan); font-size: 14px;">TOTAL KONSOLIDASI</td>
          <td style="text-align: right; color: #fff;">${totalSKU}</td>
          <td style="text-align: right; color: #fff;">${this.formatDisplayValue(totStokDisp, isVal)}</td>
          <td style="text-align: right; color: #fff;">${this.formatDisplayValue(totSalesDisp, isVal)}</td>
          <td style="text-align: right; color: var(--accent-cyan); font-size: 15px;">${totalDOI.toFixed(1)} Hari</td>
          <td><span class="badge ${totalBadge}">${totalDOI < 30 ? 'Understock' : totalDOI > 90 ? 'Overstock' : 'Normal'}</span></td>
          <td>-</td>
        </tr>
      `;

      tableBody.innerHTML = html;

      tableBody.querySelectorAll('tr[data-gb]').forEach(row => {
        row.addEventListener('click', () => {
          const selectedGB = row.getAttribute('data-gb');
          if (selectedGB) {
            const newGB = this.filters.gb === selectedGB ? 'All' : selectedGB;
            this.setFilter({ gb: newGB, page: 1 });
            const gbSelect = document.getElementById('gbSelect');
            if (gbSelect) gbSelect.value = newGB;
          }
        });
      });
    }

    renderTable() {
      const tableBody = document.getElementById('tableBody');
      if (!tableBody || !this.doiData) return;

      if (this.doiData.data.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
              Tidak ada produk yang memenuhi kriteria filter.
            </td>
          </tr>
        `;
        return;
      }

      const isVal = this.filters.unit === 'value';

      tableBody.innerHTML = this.doiData.data.map(item => {
        const stokMNJ = isVal ? item.stok_mnj_value : item.stok_mnj_qty;
        const avgSales = isVal ? item.avg_sales_value : item.avg_sales_qty;
        const targetDOI = item.doi_mnj_days;
        const targetStatus = item.health_status_mnj;

        let badgeClass = 'badge-normal';
        if (targetStatus === 'Understock') badgeClass = 'badge-understock';
        if (targetStatus === 'Overstock') badgeClass = 'badge-overstock';

        let ketBadgeStyle = 'background: rgba(100, 116, 139, 0.2); color: #cbd5e1; border: 1px solid rgba(100, 116, 139, 0.3);';
        if (item.keterangan_produk === 'Festive') {
          ketBadgeStyle = 'background: rgba(236, 72, 153, 0.2); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4);';
        } else if (item.keterangan_produk === 'Produk Baru') {
          ketBadgeStyle = 'background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);';
        }

        return `
          <tr data-pcode="${item.product_code}">
            <td>
              <div style="font-weight: 700; color: #fff;">${item.product_code}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${item.principal_product_code || '-'}</div>
            </td>
            <td style="font-weight: 600;">${item.product_name}</td>
            <td><span style="font-size: 12px; color: var(--text-secondary);">${item.gb}</span></td>
            <td><span class="badge" style="${ketBadgeStyle}">${item.keterangan_produk}</span></td>
            <td style="text-align: right; font-weight: 500; color: #cbd5e1;">${this.formatDisplayValue(item.qty_baik * (isVal ? item.harga_dasar : 1), isVal)}</td>
            <td style="text-align: right; font-weight: 500; color: #cbd5e1;">${this.formatDisplayValue(item.qty_bdp * (isVal ? item.harga_dasar : 1), isVal)}</td>
            <td style="text-align: right; font-weight: 700; color: #fff;">${this.formatDisplayValue(stokMNJ, isVal)}</td>
            <td style="text-align: right; font-weight: 500;">${this.formatDisplayValue(avgSales, isVal)}</td>
            <td style="text-align: right; font-weight: 800; font-size: 14px; color: var(--accent-cyan);">
              ${targetDOI >= 999 ? '> 999' : targetDOI.toFixed(1)} Hari
            </td>
            <td>
              <span class="badge ${badgeClass}">${targetStatus}</span>
            </td>
          </tr>
        `;
      }).join('');
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

    showError(msg) {
      const tableBody = document.getElementById('tableBody');
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="10" style="text-align: center; padding: 40px; color: var(--status-understock);">
              ❌ ${msg}
            </td>
          </tr>
        `;
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DashboardApp());
  } else {
    new DashboardApp();
  }
})();
