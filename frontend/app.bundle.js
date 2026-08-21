// Combined Standalone Frontend Script for Dashboard Monitoring DOI (MNJ Distributor & KX Principal)
(function() {
  const API_BASE = '/api/v1';

  async function fetchMetadata() {
    const res = await fetch(`${API_BASE}/metadata`);
    if (!res.ok) throw new Error('Failed to fetch metadata');
    return res.json();
  }

  async function fetchSummary(filters) {
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      unit: filters.unit,
      gb: gbVal,
      keterangan: ketVal,
      avg_months: filters.avg_months.toString()
    });
    const res = await fetch(`${API_BASE}/summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  }

  async function fetchGBSummary(filters) {
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      avg_months: filters.avg_months.toString(),
      keterangan: ketVal,
      unit: filters.unit
    });
    const res = await fetch(`${API_BASE}/gb-summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch GB summary');
    return res.json();
  }

  async function fetchDOITrend(filters) {
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';

    const params = new URLSearchParams({
      gb: gbVal,
      keterangan: ketVal,
      avg_months: filters.avg_months.toString(),
      unit: filters.unit
    });
    const res = await fetch(`${API_BASE}/doi-trend?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch DOI trend');
    return res.json();
  }

  async function fetchDOIData(filters) {
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      unit: filters.unit,
      gb: gbVal,
      keterangan: ketVal,
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
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      unit: filters.unit,
      gb: gbVal,
      keterangan: ketVal,
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
        trendMode: 'total', // 'total', 'mnj', 'kx'
        selectedGBs: [],  // [] means All
        selectedKets: [], // [] means All
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
        } else {
          this.filters.period = periods[0];
          periodSelect.value = periods[0];
        }
      }

      // Populate GB Multi-Select Options
      const gbOptions = (this.metadata && this.metadata.gb_options)
        ? this.metadata.gb_options
        : ['GB 1', 'GB 2', 'GB 3', 'GB 4', 'GB 5', 'GB 6', 'GB 7', 'GB ET', 'Unassigned'];

      this.renderMultiSelectOptions(
        'gbOptionsContainer',
        gbOptions,
        this.filters.selectedGBs,
        'gbMultiLabel',
        'Semua Group Bisnis (GB)',
        'GB',
        (updatedList) => {
          this.filters.selectedGBs = updatedList;
          this.setFilter({ page: 1 });
        }
      );

      // Populate Keterangan Multi-Select Options
      const ketOptions = (this.metadata && this.metadata.keterangan_options)
        ? this.metadata.keterangan_options
        : ['Festive', 'Produk Baru', 'Regular'];

      this.renderMultiSelectOptions(
        'ketOptionsContainer',
        ketOptions,
        this.filters.selectedKets,
        'ketMultiLabel',
        'Semua Keterangan Produk',
        'Keterangan',
        (updatedList) => {
          this.filters.selectedKets = updatedList;
          this.setFilter({ page: 1 });
        }
      );
    }

    renderMultiSelectOptions(containerId, options, selectedList, labelId, defaultText, unitLabel, onChangeCallback) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = options.map(opt => {
        const isChecked = selectedList.includes(opt);
        return `
          <label class="multiselect-option-label">
            <input type="checkbox" value="${opt}" ${isChecked ? 'checked' : ''} />
            <span>${opt}</span>
          </label>
        `;
      }).join('');

      const updateLabelText = () => {
        const labelEl = document.getElementById(labelId);
        if (!labelEl) return;

        if (selectedList.length === 0 || selectedList.length === options.length) {
          labelEl.innerText = defaultText;
        } else if (selectedList.length === 1) {
          labelEl.innerText = selectedList[0];
        } else {
          labelEl.innerText = `${selectedList.slice(0, 2).join(', ')} (${selectedList.length} ${unitLabel})`;
        }
      };

      updateLabelText();

      container.querySelectorAll('input[type="checkbox"]').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const val = e.target.value;
          if (e.target.checked) {
            if (!selectedList.includes(val)) selectedList.push(val);
          } else {
            const idx = selectedList.indexOf(val);
            if (idx > -1) selectedList.splice(idx, 1);
          }
          updateLabelText();
          onChangeCallback(selectedList);
        });
      });
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

      document.querySelectorAll('[data-trend-mode]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const mode = e.currentTarget.getAttribute('data-trend-mode');
          this.filters.trendMode = mode;
          document.querySelectorAll('[data-trend-mode]').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.renderTrendChart();
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

      // GB Multi-Select Toggle & Actions
      const gbBtn = document.getElementById('gbMultiBtn');
      const gbDropdown = document.getElementById('gbMultiDropdown');
      if (gbBtn && gbDropdown) {
        gbBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          gbDropdown.classList.toggle('open');
          const ketDropdown = document.getElementById('ketMultiDropdown');
          if (ketDropdown) ketDropdown.classList.remove('open');
        });
      }

      const gbSelectAll = document.getElementById('gbSelectAll');
      if (gbSelectAll) {
        gbSelectAll.addEventListener('click', () => {
          const gbOptions = (this.metadata && this.metadata.gb_options) ? this.metadata.gb_options : ['GB 1', 'GB 2', 'GB 3', 'GB 4', 'GB 5', 'GB 6', 'GB 7', 'GB ET', 'Unassigned'];
          this.filters.selectedGBs = [...gbOptions];
          this.populateFilterDropdowns();
          this.setFilter({ page: 1 });
        });
      }

      const gbClearAll = document.getElementById('gbClearAll');
      if (gbClearAll) {
        gbClearAll.addEventListener('click', () => {
          this.filters.selectedGBs = [];
          this.populateFilterDropdowns();
          this.setFilter({ page: 1 });
        });
      }

      // Keterangan Multi-Select Toggle & Actions
      const ketBtn = document.getElementById('ketMultiBtn');
      const ketDropdown = document.getElementById('ketMultiDropdown');
      if (ketBtn && ketDropdown) {
        ketBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          ketDropdown.classList.toggle('open');
          if (gbDropdown) gbDropdown.classList.remove('open');
        });
      }

      const ketSelectAll = document.getElementById('ketSelectAll');
      if (ketSelectAll) {
        ketSelectAll.addEventListener('click', () => {
          const ketOptions = (this.metadata && this.metadata.keterangan_options) ? this.metadata.keterangan_options : ['Festive', 'Produk Baru', 'Regular'];
          this.filters.selectedKets = [...ketOptions];
          this.populateFilterDropdowns();
          this.setFilter({ page: 1 });
        });
      }

      const ketClearAll = document.getElementById('ketClearAll');
      if (ketClearAll) {
        ketClearAll.addEventListener('click', () => {
          this.filters.selectedKets = [];
          this.populateFilterDropdowns();
          this.setFilter({ page: 1 });
        });
      }

      // Close popovers on click outside
      document.addEventListener('click', (e) => {
        if (gbDropdown && !gbDropdown.contains(e.target)) gbDropdown.classList.remove('open');
        if (ketDropdown && !ketDropdown.contains(e.target)) ketDropdown.classList.remove('open');
      });

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
      const isVal = this.filters.unit === 'value';

      document.getElementById('metricTotalSKU').innerText = formatNum(this.summary.total_sku);
      document.getElementById('metricUnderstock').innerText = formatNum(this.summary.understock_count);
      document.getElementById('metricNormal').innerText = formatNum(this.summary.normal_count);
      document.getElementById('metricOverstock').innerText = formatNum(this.summary.overstock_count);

      // Card Titles
      document.getElementById('metricTotalStokMNJTitle').innerText = isVal ? 'Stok MNJ (Distributor)' : 'Stok MNJ (Qty)';
      document.getElementById('metricTotalStokKXTitle').innerText = isVal ? 'Stok KX (Principal)' : 'Stok KX (Qty)';
      document.getElementById('metricTotalStokCombTitle').innerText = isVal ? 'Total Stok Combined' : 'Total Combined (Qty)';

      // Values
      const mnjVal = isVal ? this.summary.total_stok_mnj_value : (this.summary.total_stok_mnj_qty || 0);
      const kxVal = isVal ? this.summary.total_stok_kx_value : (this.summary.total_stok_kx_qty || 0);
      const combVal = isVal ? this.summary.total_stok_combined_value : (this.summary.total_stok_combined_qty || 0);
      const salesVal = isVal ? this.summary.total_avg_sales_value : (this.summary.total_avg_sales_qty || 0);

      document.getElementById('metricTotalStokMNJVal').innerText = this.formatDisplayValue(mnjVal, isVal);
      document.getElementById('metricTotalStokKXVal').innerText = this.formatDisplayValue(kxVal, isVal);
      document.getElementById('metricTotalStokCombVal').innerText = this.formatDisplayValue(combVal, isVal);

      // Calculated Consolidated DOIs for subtitles
      const doiMNJ = salesVal > 0 ? (mnjVal / salesVal * 30.0) : 0;
      const doiKX = salesVal > 0 ? (kxVal / salesVal * 30.0) : 0;
      const doiComb = salesVal > 0 ? (combVal / salesVal * 30.0) : 0;

      document.getElementById('metricDOIMNJSubtitle').innerText = `DOI MNJ: ${doiMNJ.toFixed(1)} Hari`;
      document.getElementById('metricDOIKXSubtitle').innerText = `DOI KX: ${doiKX.toFixed(1)} Hari`;
      document.getElementById('metricDOICombSubtitle').innerText = `DOI Total: ${doiComb.toFixed(1)} Hari`;
    }

    renderTrendChart() {
      const chartContainer = document.getElementById('trendChartContainer');
      if (!chartContainer || !this.trendData || this.trendData.length === 0) return;

      const data = this.trendData;
      const mode = this.filters.trendMode || 'total';

      const getDOI = (d) => {
        if (mode === 'mnj') return d.doi_mnj_days;
        if (mode === 'kx') return d.doi_kx_days;
        return d.doi_total_days;
      };

      const strokeColor = mode === 'mnj' ? '#06b6d4' : mode === 'kx' ? '#ec4899' : '#8b5cf6';

      const maxDOI = Math.max(...data.map(d => getDOI(d)), 100);
      const minDOI = 0;

      const width = 800;
      const height = 220;
      const padding = { top: 20, right: 30, bottom: 40, left: 50 };

      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      const xStep = chartW / Math.max(1, data.length - 1);

      const points = data.map((d, i) => {
        const doiVal = getDOI(d);
        const x = padding.left + i * xStep;
        const y = padding.top + chartH - ((doiVal - minDOI) / (maxDOI - minDOI)) * chartH;
        return { x, y, doiVal, data: d };
      });

      const pathD = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
      const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

      chartContainer.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;">
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0"/>
            </linearGradient>
          </defs>

          <!-- Trend Area & Line -->
          <path d="${areaD}" fill="url(#trendGradient)" opacity="0.6"/>
          <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Data Points & Labels -->
          ${points.map(p => `
            <g class="chart-point-group" data-period="${p.data.period}">
              <circle cx="${p.x}" cy="${p.y}" r="6" fill="#090d16" stroke="${strokeColor}" stroke-width="3" style="transition: r 0.2s ease; cursor: pointer;"/>
              <text x="${p.x}" y="${p.y - 12}" fill="#ffffff" font-size="11" font-weight="700" text-anchor="middle">${p.doiVal} Hari</text>
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
      const totalStokMNJ = this.gbSummary.reduce((a, b) => a + (isVal ? b.stok_mnj_value : b.stok_mnj_qty), 0);
      const totalStokKX = this.gbSummary.reduce((a, b) => a + (isVal ? b.stok_kx_value : b.stok_kx_qty), 0);
      const totalStokComb = this.gbSummary.reduce((a, b) => a + (isVal ? b.stok_total_value : b.stok_total_qty), 0);
      const totalMaxThresh = this.gbSummary.reduce((a, b) => a + (isVal ? b.max_value_total : b.max_qty_total), 0);
      const totalSales = this.gbSummary.reduce((a, b) => a + (isVal ? b.avg_sales_value : b.avg_sales_qty), 0);

      const doiMNJ = totalSales > 0 ? (totalStokMNJ / totalSales * 30.0) : 0;
      const doiKX = totalSales > 0 ? (totalStokKX / totalSales * 30.0) : 0;
      const doiTotal = totalSales > 0 ? (totalStokComb / totalSales * 30.0) : 0;
      const doiTargetCons = totalSales > 0 ? (totalMaxThresh / totalSales * 30.0) : 0;

      let html = this.gbSummary.map(gb => {
        const mnjDisp = isVal ? gb.stok_mnj_value : gb.stok_mnj_qty;
        const kxDisp = isVal ? gb.stok_kx_value : gb.stok_kx_qty;
        const combDisp = isVal ? gb.stok_total_value : gb.stok_total_qty;
        const salesDisp = isVal ? gb.avg_sales_value : gb.avg_sales_qty;

        let badgeClass = 'badge-normal';
        if (gb.health_status_total === 'Understock') badgeClass = 'badge-understock';
        if (gb.health_status_total === 'Overstock') badgeClass = 'badge-overstock';

        const isActive = this.filters.selectedGBs.includes(gb.gb);

        return `
          <tr data-gb="${gb.gb}" style="${isActive ? 'background: rgba(6, 182, 212, 0.15); border-left: 4px solid var(--accent-cyan);' : ''}">
            <td style="font-weight: 700; color: #fff;">${gb.gb}</td>
            <td style="text-align: right; font-weight: 600;">${gb.total_sku}</td>
            <td style="text-align: right; font-weight: 500; color: #cbd5e1;">${this.formatDisplayValue(mnjDisp, isVal)}</td>
            <td style="text-align: right; font-weight: 500; color: #f472b6;">${this.formatDisplayValue(kxDisp, isVal)}</td>
            <td style="text-align: right; font-weight: 700; color: #fff;">${this.formatDisplayValue(combDisp, isVal)}</td>
            <td style="text-align: right; font-weight: 500;">${this.formatDisplayValue(salesDisp, isVal)}</td>
            <td style="text-align: right; font-weight: 600; color: #60a5fa;">${gb.doi_mnj_days.toFixed(1)} d</td>
            <td style="text-align: right; font-weight: 600; color: #f472b6;">${gb.doi_kx_days.toFixed(1)} d</td>
            <td style="text-align: right; font-weight: 800; color: var(--accent-cyan); font-size: 14px;">${gb.doi_total_days.toFixed(1)} Hari</td>
            <td style="text-align: right; font-weight: 700; color: #a7f3d0; font-size: 14px;">${gb.doi_max_days ? gb.doi_max_days.toFixed(1) : (gb.target_doi_days ? gb.target_doi_days.toFixed(1) : '0.0')} Hari</td>
            <td><span class="badge ${badgeClass}">${gb.health_status_total}</span></td>
          </tr>
        `;
      }).join('');

      html += `
        <tr style="background: rgba(15, 23, 42, 0.9); font-weight: 700; border-top: 2px solid var(--border-color);">
          <td style="color: var(--accent-cyan); font-size: 14px;">TOTAL KONSOLIDASI</td>
          <td style="text-align: right; color: #fff;">${totalSKU}</td>
          <td style="text-align: right; color: #cbd5e1;">${this.formatDisplayValue(totalStokMNJ, isVal)}</td>
          <td style="text-align: right; color: #f472b6;">${this.formatDisplayValue(totalStokKX, isVal)}</td>
          <td style="text-align: right; color: #fff;">${this.formatDisplayValue(totalStokComb, isVal)}</td>
          <td style="text-align: right; color: #fff;">${this.formatDisplayValue(totalSales, isVal)}</td>
          <td style="text-align: right; color: #60a5fa;">${doiMNJ.toFixed(1)} d</td>
          <td style="text-align: right; color: #f472b6;">${doiKX.toFixed(1)} d</td>
          <td style="text-align: right; color: var(--accent-cyan); font-size: 15px;">${doiTotal.toFixed(1)} Hari</td>
          <td style="text-align: right; color: #a7f3d0; font-size: 15px;">${doiTargetCons.toFixed(1)} Hari</td>
          <td><span class="badge badge-normal">Evaluasi Master</span></td>
        </tr>
      `;

      tableBody.innerHTML = html;

      tableBody.querySelectorAll('tr[data-gb]').forEach(row => {
        row.addEventListener('click', () => {
          const selectedGB = row.getAttribute('data-gb');
          if (selectedGB) {
            if (this.filters.selectedGBs.includes(selectedGB)) {
              this.filters.selectedGBs = this.filters.selectedGBs.filter(g => g !== selectedGB);
            } else {
              this.filters.selectedGBs.push(selectedGB);
            }
            this.populateFilterDropdowns();
            this.setFilter({ page: 1 });
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
            <td colspan="13" style="text-align: center; padding: 40px; color: var(--text-muted);">
              Tidak ada produk yang memenuhi kriteria filter.
            </td>
          </tr>
        `;
        return;
      }

      const isVal = this.filters.unit === 'value';

      tableBody.innerHTML = this.doiData.data.map(item => {
        const stokMNJ = isVal ? item.stok_mnj_value : item.stok_mnj_qty;
        const stokKX = isVal ? item.stok_kx_value : item.stok_kx_qty;
        const stokTotal = isVal ? item.stok_total_value : item.stok_total_qty;
        const avgSales = isVal ? item.avg_sales_value : item.avg_sales_qty;

        const doiMNJ = item.doi_mnj_days;
        const doiKX = item.doi_kx_days;
        const doiTotal = item.doi_total_days;
        const doiMax = item.doi_max_days || item.target_doi_days;
        const targetStatus = item.health_status_total;

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
            <td style="text-align: right; font-weight: 500; color: #cbd5e1;">${this.formatDisplayValue(stokMNJ, isVal)}</td>
            <td style="text-align: right; font-weight: 500; color: #f472b6;">${this.formatDisplayValue(stokKX, isVal)}</td>
            <td style="text-align: right; font-weight: 700; color: #fff;">${this.formatDisplayValue(stokTotal, isVal)}</td>
            <td style="text-align: right; font-weight: 500;">${this.formatDisplayValue(avgSales, isVal)}</td>
            <td style="text-align: right; font-weight: 600; color: #60a5fa;">${doiMNJ >= 999 ? '> 999' : doiMNJ.toFixed(1)} d</td>
            <td style="text-align: right; font-weight: 600; color: #f472b6;">${doiKX >= 999 ? '> 999' : doiKX.toFixed(1)} d</td>
            <td style="text-align: right; font-weight: 800; font-size: 14px; color: var(--accent-cyan);">
              ${doiTotal >= 999 ? '> 999' : doiTotal.toFixed(1)} Hari
            </td>
            <td style="text-align: right; font-weight: 700; font-size: 14px; color: #a7f3d0;">
              ${doiMax >= 999 ? '> 999' : doiMax ? doiMax.toFixed(1) : '0.0'} Hari
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
            <td colspan="13" style="text-align: center; padding: 40px; color: var(--status-understock);">
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
