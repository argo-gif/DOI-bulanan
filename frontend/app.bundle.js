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
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      unit: filters.unit || 'value',
      gb: gbVal,
      keterangan: ketVal,
      products: prodVal,
      avg_months: (filters.avg_months || 6).toString()
    });
    const res = await fetch(`${API_BASE}/summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  }

  async function fetchGBSummary(filters) {
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      avg_months: (filters.avg_months || 6).toString(),
      keterangan: ketVal,
      products: prodVal,
      unit: filters.unit || 'value'
    });
    const res = await fetch(`${API_BASE}/gb-summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch GB summary');
    return res.json();
  }

  async function fetchDOITrend(filters) {
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      gb: gbVal,
      keterangan: ketVal,
      products: prodVal,
      health_status: filters.health_status || 'All',
      avg_months: (filters.avg_months || 6).toString(),
      unit: filters.unit || 'value'
    });
    const res = await fetch(`${API_BASE}/doi-trend?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch DOI trend');
    return res.json();
  }

  async function fetchDOIData(filters) {
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      unit: filters.unit || 'value',
      gb: gbVal,
      keterangan: ketVal,
      products: prodVal,
      health_status: filters.health_status,
      avg_months: (filters.avg_months || 6).toString(),
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
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-07',
      unit: filters.unit || 'value',
      gb: gbVal,
      keterangan: ketVal,
      products: prodVal,
      health_status: filters.health_status,
      avg_months: (filters.avg_months || 6).toString()
    });
    return `${API_BASE}/export?${params.toString()}`;
  }

  function renderHealthBadge(status) {
    let badgeClass = 'badge-normal';
    let dotColor = '#34d399';
    if (status === 'Understock') {
      badgeClass = 'badge-understock';
      dotColor = '#f87171';
    } else if (status === 'Overstock') {
      badgeClass = 'badge-overstock';
      dotColor = '#fbbf24';
    }
    return `<span class="badge ${badgeClass}"><span class="badge-dot" style="background:${dotColor};"></span>${status}</span>`;
  }

  function renderDOIProgress(doi, maxDoi) {
    if (!maxDoi || maxDoi <= 0) maxDoi = 90;
    const pct = Math.min(100, Math.max(6, (doi / maxDoi) * 100));
    let barColor = 'linear-gradient(90deg, #10b981, #34d399)';
    if (doi > maxDoi) barColor = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    if (doi < 30) barColor = 'linear-gradient(90deg, #ef4444, #f87171)';

    return `
      <div class="doi-progress-wrapper" title="DOI Realisasi: ${doi.toFixed(1)} Hari vs Max Master: ${maxDoi.toFixed(1)} Hari">
        <div class="doi-progress-bar" style="width: ${pct}%; background: ${barColor};"></div>
      </div>
    `;
  }

  class DashboardApp {
    constructor() {
      this.filters = {
        period: '2026-07',
        unit: 'value',          // DEFAULT VALUASI (RUPIAH)
        scale: 'compact',       // 'compact' or 'full'
        trendMode: 'total',     // 'total', 'mnj', 'kx'
        selectedGBs: [],        // [] means All
        selectedKets: [],       // [] means All
        selectedProducts: [],   // [] means All Items
        health_status: 'All',
        search: '',
        avg_months: 6,          // DEFAULT 6 BULAN TERAKHIR
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

      const avgMonthsSelect = document.getElementById('avgMonthsSelect');
      if (avgMonthsSelect) {
        avgMonthsSelect.value = (this.filters.avg_months || 6).toString();
      }

      const allProducts = (this.metadata && this.metadata.product_options) ? this.metadata.product_options : [];
      const allGBs = (this.metadata && this.metadata.gb_options) ? this.metadata.gb_options : ['GB 1', 'GB 2', 'GB 3', 'GB 4', 'GB 5', 'GB 6', 'GB 7', 'GB ET', 'Unassigned'];
      const allKets = (this.metadata && this.metadata.keterangan_options && this.metadata.keterangan_options.length > 0)
        ? this.metadata.keterangan_options
        : ['Aktif', 'Festive', 'Produk Baru', 'Streamline'];

      // --- CASCADING / INTERDEPENDENT FILTER LOGIC ---
      // A. Available GB Options based on selected Keterangan
      let availableGBs = allGBs;
      if (this.filters.selectedKets.length > 0 && allProducts.length > 0) {
        const matchingGBs = new Set(
          allProducts
            .filter(p => this.filters.selectedKets.includes(p.keterangan))
            .map(p => p.gb)
        );
        availableGBs = allGBs.filter(gb => matchingGBs.has(gb));
      }

      // B. Available Keterangan Options based on selected GB
      let availableKets = allKets;
      if (this.filters.selectedGBs.length > 0 && allProducts.length > 0) {
        const matchingKets = new Set(
          allProducts
            .filter(p => this.filters.selectedGBs.includes(p.gb))
            .map(p => p.keterangan)
        );
        availableKets = allKets.filter(ket => matchingKets.has(ket));
      }

      // C. Available Products/Items based on BOTH selected GB and selected Keterangan
      let availableProducts = allProducts;
      if (this.filters.selectedGBs.length > 0) {
        availableProducts = availableProducts.filter(p => this.filters.selectedGBs.includes(p.gb));
      }
      if (this.filters.selectedKets.length > 0) {
        availableProducts = availableProducts.filter(p => this.filters.selectedKets.includes(p.keterangan));
      }

      // D. Clean up selections if option is no longer available in filtered set
      this.filters.selectedGBs = this.filters.selectedGBs.filter(gb => availableGBs.includes(gb));
      this.filters.selectedKets = this.filters.selectedKets.filter(ket => availableKets.includes(ket));
      this.filters.selectedProducts = this.filters.selectedProducts.filter(code => availableProducts.some(p => p.code === code));

      // E. Render Multi-Select Lists
      this.renderMultiSelectOptions(
        'gbOptionsContainer',
        availableGBs,
        this.filters.selectedGBs,
        'gbMultiLabel',
        this.filters.selectedKets.length > 0 ? `Semua GB Terfilter (${availableGBs.length})` : 'Semua Group Bisnis (GB)',
        'GB',
        (updatedList) => {
          this.filters.selectedGBs = updatedList;
          this.populateFilterDropdowns();
          this.setFilter({ page: 1 });
        },
        'gbSearchInput'
      );

      this.renderMultiSelectOptions(
        'ketOptionsContainer',
        availableKets,
        this.filters.selectedKets,
        'ketMultiLabel',
        this.filters.selectedGBs.length > 0 ? `Semua Keterangan Terfilter (${availableKets.length})` : 'Semua Keterangan Produk',
        'Keterangan',
        (updatedList) => {
          this.filters.selectedKets = updatedList;
          this.populateFilterDropdowns();
          this.setFilter({ page: 1 });
        },
        'ketSearchInput'
      );

      this.renderMultiSelectOptions(
        'itemOptionsContainer',
        availableProducts,
        this.filters.selectedProducts,
        'itemMultiLabel',
        (this.filters.selectedGBs.length > 0 || this.filters.selectedKets.length > 0)
          ? `Semua Item Terfilter (${availableProducts.length})`
          : 'Semua Item / Produk',
        'Item',
        (updatedList) => {
          this.filters.selectedProducts = updatedList;
          this.setFilter({ page: 1 });
        },
        'itemSearchInput'
      );

      this.currentAvailableProducts = availableProducts;
      this.currentAvailableGBs = availableGBs;
      this.currentAvailableKets = availableKets;
    }

    renderMultiSelectOptions(containerId, options, selectedList, labelId, defaultText, unitLabel, onChangeCallback, searchInputId) {
      const container = document.getElementById(containerId);
      if (!container) return;

      if (!options || options.length === 0) {
        container.innerHTML = `
          <div style="padding: 14px; font-size: 12px; color: var(--text-muted); text-align: center;">
            Tidak ada pilihan yang sesuai filter.
          </div>
        `;
        const labelEl = document.getElementById(labelId);
        if (labelEl) labelEl.innerText = defaultText;
        return;
      }

      container.innerHTML = options.map(opt => {
        const val = typeof opt === 'object' ? opt.code : opt;
        const displayText = typeof opt === 'object' ? opt.label : opt;
        const isChecked = selectedList.includes(val);
        return `
          <label class="multiselect-option-label" data-val="${val}" data-search="${displayText.toLowerCase()}">
            <input type="checkbox" value="${val}" ${isChecked ? 'checked' : ''} />
            <span>${displayText}</span>
          </label>
        `;
      }).join('');

      const updateLabelText = () => {
        const labelEl = document.getElementById(labelId);
        if (!labelEl) return;

        if (selectedList.length === 0 || selectedList.length === options.length) {
          labelEl.innerText = defaultText;
        } else if (selectedList.length === 1) {
          const singleOpt = options.find(o => (typeof o === 'object' ? o.code : o) === selectedList[0]);
          labelEl.innerText = typeof singleOpt === 'object' ? (singleOpt.name || singleOpt.label) : singleOpt;
        } else {
          labelEl.innerText = `${selectedList.length} ${unitLabel} Terpilih`;
        }
      };

      updateLabelText();

      // Checkbox listener
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

      // Search input filter inside popover
      if (searchInputId) {
        const searchInput = document.getElementById(searchInputId);
        if (searchInput) {
          const currentQuery = searchInput.value.trim().toLowerCase();
          if (currentQuery) {
            container.querySelectorAll('.multiselect-option-label').forEach(labelEl => {
              const searchText = labelEl.getAttribute('data-search') || '';
              labelEl.style.display = (!currentQuery || searchText.includes(currentQuery)) ? 'flex' : 'none';
            });
          }

          searchInput.oninput = (e) => {
            const query = e.target.value.trim().toLowerCase();
            container.querySelectorAll('.multiselect-option-label').forEach(labelEl => {
              const searchText = labelEl.getAttribute('data-search') || '';
              labelEl.style.display = (!query || searchText.includes(query)) ? 'flex' : 'none';
            });
          };
        }
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
          const itemDropdown = document.getElementById('itemMultiDropdown');
          if (itemDropdown) itemDropdown.classList.remove('open');
        });
      }

      const gbSelectAll = document.getElementById('gbSelectAll');
      if (gbSelectAll) {
        gbSelectAll.addEventListener('click', () => {
          const availableGBs = this.currentAvailableGBs || (this.metadata && this.metadata.gb_options ? this.metadata.gb_options : []);
          this.filters.selectedGBs = [...availableGBs];
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
          const itemDropdown = document.getElementById('itemMultiDropdown');
          if (itemDropdown) itemDropdown.classList.remove('open');
        });
      }

      const ketSelectAll = document.getElementById('ketSelectAll');
      if (ketSelectAll) {
        ketSelectAll.addEventListener('click', () => {
          const availableKets = this.currentAvailableKets || (this.metadata && this.metadata.keterangan_options ? this.metadata.keterangan_options : []);
          this.filters.selectedKets = [...availableKets];
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

      // Item / Produk Multi-Select Toggle & Actions
      const itemBtn = document.getElementById('itemMultiBtn');
      const itemDropdown = document.getElementById('itemMultiDropdown');
      if (itemBtn && itemDropdown) {
        itemBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          itemDropdown.classList.toggle('open');
          if (gbDropdown) gbDropdown.classList.remove('open');
          if (ketDropdown) ketDropdown.classList.remove('open');
        });
      }

      const itemSelectAll = document.getElementById('itemSelectAll');
      if (itemSelectAll) {
        itemSelectAll.addEventListener('click', () => {
          const availableItems = this.currentAvailableProducts || (this.metadata && this.metadata.product_options ? this.metadata.product_options : []);
          this.filters.selectedProducts = availableItems.map(o => o.code);
          this.populateFilterDropdowns();
          this.setFilter({ page: 1 });
        });
      }

      const itemClearAll = document.getElementById('itemClearAll');
      if (itemClearAll) {
        itemClearAll.addEventListener('click', () => {
          this.filters.selectedProducts = [];
          this.populateFilterDropdowns();
          this.setFilter({ page: 1 });
        });
      }

      // Close popovers on click outside
      document.addEventListener('click', (e) => {
        if (gbDropdown && !gbDropdown.contains(e.target)) gbDropdown.classList.remove('open');
        if (ketDropdown && !ketDropdown.contains(e.target)) ketDropdown.classList.remove('open');
        if (itemDropdown && !itemDropdown.contains(e.target)) itemDropdown.classList.remove('open');
      });

      document.querySelectorAll('[data-health]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const health_status = e.currentTarget.getAttribute('data-health') || 'All';
          this.setFilter({ health_status, page: 1 });
          document.querySelectorAll('[data-health]').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
        });
      });

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

      // Modal Close Listeners
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
      const isVal = (this.filters.unit === 'value');

      const elSKU = document.getElementById('metricTotalSKU');
      if (elSKU) elSKU.innerText = formatNum(this.summary.total_sku);

      const elUnder = document.getElementById('metricUnderstock');
      if (elUnder) elUnder.innerText = formatNum(this.summary.understock_count);

      const elNorm = document.getElementById('metricNormal');
      if (elNorm) elNorm.innerText = formatNum(this.summary.normal_count);

      const elOver = document.getElementById('metricOverstock');
      if (elOver) elOver.innerText = formatNum(this.summary.overstock_count);

      // Card Titles
      const elMNJTitle = document.getElementById('metricTotalStokMNJTitle');
      if (elMNJTitle) elMNJTitle.innerText = isVal ? 'Stok MNJ (Distributor)' : 'Stok MNJ (Qty)';

      const elKXTitle = document.getElementById('metricTotalStokKXTitle');
      if (elKXTitle) elKXTitle.innerText = isVal ? 'Stok KX (Principal)' : 'Stok KX (Qty)';

      const elCombTitle = document.getElementById('metricTotalStokCombTitle');
      if (elCombTitle) elCombTitle.innerText = isVal ? 'Total Stok Combined' : 'Total Combined (Qty)';

      // Values
      const mnjVal = isVal ? this.summary.total_stok_mnj_value : (this.summary.total_stok_mnj_qty || 0);
      const kxVal = isVal ? this.summary.total_stok_kx_value : (this.summary.total_stok_kx_qty || 0);
      const combVal = isVal ? this.summary.total_stok_combined_value : (this.summary.total_stok_combined_qty || 0);
      const salesVal = isVal ? this.summary.total_avg_sales_value : (this.summary.total_avg_sales_qty || 0);

      const elMNJVal = document.getElementById('metricTotalStokMNJVal');
      if (elMNJVal) elMNJVal.innerText = this.formatDisplayValue(mnjVal, isVal);

      const elKXVal = document.getElementById('metricTotalStokKXVal');
      if (elKXVal) elKXVal.innerText = this.formatDisplayValue(kxVal, isVal);

      const elCombVal = document.getElementById('metricTotalStokCombVal');
      if (elCombVal) elCombVal.innerText = this.formatDisplayValue(combVal, isVal);

      // Calculated Consolidated DOIs for subtitles
      const doiMNJ = salesVal > 0 ? (mnjVal / salesVal * 30.0) : 0;
      const doiKX = salesVal > 0 ? (kxVal / salesVal * 30.0) : 0;
      const doiComb = salesVal > 0 ? (combVal / salesVal * 30.0) : 0;

      const elMNJSub = document.getElementById('metricDOIMNJSubtitle');
      if (elMNJSub) elMNJSub.innerText = `DOI MNJ: ${doiMNJ.toFixed(1)} Hari`;

      const elKXSub = document.getElementById('metricDOIKXSubtitle');
      if (elKXSub) elKXSub.innerText = `DOI KX: ${doiKX.toFixed(1)} Hari`;

      const elCombSub = document.getElementById('metricDOICombSubtitle');
      if (elCombSub) elCombSub.innerText = `DOI Total: ${doiComb.toFixed(1)} Hari`;
    }

    renderTrendChart() {
      const chartContainer = document.getElementById('trendChartContainer');
      const subtitleEl = document.getElementById('trendSubtitle');

      if (subtitleEl) {
        let filterLabel = 'Konsolidasi Seluruh SKU';
        if (this.filters.selectedProducts && this.filters.selectedProducts.length === 1) {
          const singleItem = (this.metadata && this.metadata.product_options)
            ? this.metadata.product_options.find(p => p.code === this.filters.selectedProducts[0])
            : null;
          filterLabel = singleItem ? singleItem.name : this.filters.selectedProducts[0];
        } else if (this.filters.selectedProducts && this.filters.selectedProducts.length > 1) {
          filterLabel = `${this.filters.selectedProducts.length} Item Terpilih`;
        } else if (this.filters.selectedGBs && this.filters.selectedGBs.length > 0) {
          filterLabel = `Group Bisnis: ${this.filters.selectedGBs.join(', ')}`;
        } else if (this.filters.selectedKets && this.filters.selectedKets.length > 0) {
          filterLabel = `Keterangan: ${this.filters.selectedKets.join(', ')}`;
        }
        subtitleEl.innerHTML = `Visualisasi pergerakan DOI historis MNJ, KX, dan Combined Total — <strong style="color: var(--accent-cyan);">${filterLabel}</strong>.`;
      }

      if (!chartContainer || !this.trendData || this.trendData.length === 0) return;

      const data = this.trendData;
      const mode = this.filters.trendMode || 'total';

      const getDOI = (d) => {
        if (mode === 'mnj') return d.doi_mnj_days;
        if (mode === 'kx') return d.doi_kx_days;
        return d.doi_total_days;
      };

      const strokeColor = mode === 'mnj' ? '#00f2fe' : mode === 'kx' ? '#ec4899' : '#8b5cf6';

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
              <stop offset="0%" stop-color="${strokeColor}" stop-opacity="0.45"/>
              <stop offset="100%" stop-color="${strokeColor}" stop-opacity="0.0"/>
            </linearGradient>
          </defs>

          <!-- Grid horizontal lines -->
          <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>
          <line x1="${padding.left}" y1="${padding.top + chartH / 2}" x2="${width - padding.right}" y2="${padding.top + chartH / 2}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4"/>
          <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(255,255,255,0.1)"/>

          <!-- Trend Area & Line -->
          <path d="${areaD}" fill="url(#trendGradient)" opacity="0.7"/>
          <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>

          <!-- Data Points & Labels -->
          ${points.map(p => `
            <g class="chart-point-group" data-period="${p.data.period}">
              <circle cx="${p.x}" cy="${p.y}" r="6" fill="#080c14" stroke="${strokeColor}" stroke-width="3" style="transition: all 0.2s ease; cursor: pointer;"/>
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

      const isVal = (this.filters.unit === 'value');

      const totalSKU = this.gbSummary.reduce((a, b) => a + b.total_sku, 0);
      const totalStokMNJ = this.gbSummary.reduce((a, b) => a + (isVal ? b.stok_mnj_value : b.stok_mnj_qty), 0);
      const totalStokKX = this.gbSummary.reduce((a, b) => a + (isVal ? b.stok_kx_value : b.stok_kx_qty), 0);
      const totalStokComb = this.gbSummary.reduce((a, b) => a + (isVal ? b.stok_total_value : b.stok_total_qty), 0);
      const totalMinThresh = this.gbSummary.reduce((a, b) => a + (isVal ? b.min_value_total : b.min_qty_total), 0);
      const totalMaxThresh = this.gbSummary.reduce((a, b) => a + (isVal ? b.max_value_total : b.max_qty_total), 0);
      const totalSales = this.gbSummary.reduce((a, b) => a + (isVal ? b.avg_sales_value : b.avg_sales_qty), 0);

      const doiMNJ = totalSales > 0 ? (totalStokMNJ / totalSales * 30.0) : 0;
      const doiKX = totalSales > 0 ? (totalStokKX / totalSales * 30.0) : 0;
      const doiTotal = totalSales > 0 ? (totalStokComb / totalSales * 30.0) : 0;
      const doiTargetCons = totalSales > 0 ? (totalMaxThresh / totalSales * 30.0) : 0;

      let totalHealthStatus = 'Normal';
      if (totalStokComb < totalMinThresh) {
        totalHealthStatus = 'Understock';
      } else if (totalStokComb > totalMaxThresh) {
        totalHealthStatus = 'Overstock';
      }

      const totalSelisihStok = this.gbSummary.reduce((a, b) => a + (isVal ? (b.selisih_value || 0) : (b.selisih_qty || 0)), 0);
      const totalSelisihDoi = totalSales > 0 ? (totalSelisihStok / totalSales * 30.0) : 0;
      const totalDoiAfterSelisih = doiTotal - totalSelisihDoi;

      let totalDoiVarHtml = '<span style="color: #94a3b8;">0.0 d</span>';
      let totalValVarHtml = `<span style="color: #94a3b8;">${this.formatDisplayValue(0, isVal)}</span>`;
      if (totalSelisihStok > 0) {
        totalDoiVarHtml = `<span style="color: #fbbf24; font-weight: 700;">+${totalSelisihDoi.toFixed(1)} d</span>`;
        totalValVarHtml = `<span style="color: #fbbf24; font-weight: 700;">+${this.formatDisplayValue(totalSelisihStok, isVal)}</span>`;
      } else if (totalSelisihStok < 0) {
        totalDoiVarHtml = `<span style="color: #f87171; font-weight: 700;">${totalSelisihDoi.toFixed(1)} d</span>`;
        totalValVarHtml = `<span style="color: #f87171; font-weight: 700;">${this.formatDisplayValue(totalSelisihStok, isVal)}</span>`;
      }

      let html = this.gbSummary.map(gb => {
        const mnjDisp = isVal ? gb.stok_mnj_value : gb.stok_mnj_qty;
        const kxDisp = isVal ? gb.stok_kx_value : gb.stok_kx_qty;
        const combDisp = isVal ? gb.stok_total_value : gb.stok_total_qty;
        const salesDisp = isVal ? gb.avg_sales_value : gb.avg_sales_qty;

        const maxDoi = gb.doi_max_days || gb.target_doi_days || 90;
        const isActive = this.filters.selectedGBs.includes(gb.gb);

        const selDoi = gb.selisih_doi_days || 0.0;
        const selVal = isVal ? (gb.selisih_value || 0.0) : (gb.selisih_qty || 0.0);
        const doiAfterSelisih = gb.doi_after_selisih !== undefined ? gb.doi_after_selisih : (gb.doi_total_days - selDoi);

        let selDoiHtml = '<span style="color: #94a3b8;">0.0 d</span>';
        let selValHtml = `<span style="color: #94a3b8;">${this.formatDisplayValue(0, isVal)}</span>`;
        if (selVal > 0 || selDoi > 0) {
          selDoiHtml = `<span style="color: #fbbf24; font-weight: 700;">+${selDoi.toFixed(1)} d</span>`;
          selValHtml = `<span style="color: #fbbf24; font-weight: 700;">+${this.formatDisplayValue(selVal, isVal)}</span>`;
        } else if (selVal < 0 || selDoi < 0) {
          selDoiHtml = `<span style="color: #f87171; font-weight: 700;">${selDoi.toFixed(1)} d</span>`;
          selValHtml = `<span style="color: #f87171; font-weight: 700;">${this.formatDisplayValue(selVal, isVal)}</span>`;
        }

        return `
          <tr data-gb="${gb.gb}" style="${isActive ? 'background: rgba(0, 242, 254, 0.12); border-left: 4px solid var(--accent-cyan);' : ''}">
            <td style="font-weight: 700; color: #fff;">${gb.gb}</td>
            <td style="text-align: right; font-weight: 600;">${gb.total_sku}</td>
            <td style="text-align: right; font-weight: 500; color: #cbd5e1;">${this.formatDisplayValue(mnjDisp, isVal)}</td>
            <td style="text-align: right; font-weight: 500; color: #f472b6;">${this.formatDisplayValue(kxDisp, isVal)}</td>
            <td style="text-align: right; font-weight: 700; color: #fff;">${this.formatDisplayValue(combDisp, isVal)}</td>
            <td style="text-align: right; font-weight: 500;">${this.formatDisplayValue(salesDisp, isVal)}</td>
            <td style="text-align: right; font-weight: 600; color: #60a5fa;">${gb.doi_mnj_days.toFixed(1)} d</td>
            <td style="text-align: right; font-weight: 600; color: #f472b6;">${gb.doi_kx_days.toFixed(1)} d</td>
            <td style="text-align: right; font-weight: 800; color: var(--accent-cyan); font-size: 14px;">${gb.doi_total_days.toFixed(1)} Hari</td>
            <td style="text-align: right; font-weight: 700; color: #a7f3d0; font-size: 14px;">${maxDoi.toFixed(1)} Hari</td>
            <td style="text-align: right; font-size: 13px;">${selDoiHtml}</td>
            <td style="text-align: right; font-size: 13px;">${selValHtml}</td>
            <td style="text-align: right; font-weight: 700; color: #a7f3d0; font-size: 14px;">${doiAfterSelisih.toFixed(1)} Hari</td>
            <td>${renderHealthBadge(gb.health_status_total)}</td>
          </tr>
        `;
      }).join('');

      html += `
        <tr style="background: rgba(11, 17, 32, 0.95); font-weight: 700; border-top: 2px solid var(--border-color);">
          <td style="color: var(--accent-cyan); font-size: 14px; font-weight: 800;">TOTAL KONSOLIDASI</td>
          <td style="text-align: right; color: #fff;">${totalSKU}</td>
          <td style="text-align: right; color: #cbd5e1;">${this.formatDisplayValue(totalStokMNJ, isVal)}</td>
          <td style="text-align: right; color: #f472b6;">${this.formatDisplayValue(totalStokKX, isVal)}</td>
          <td style="text-align: right; color: #fff;">${this.formatDisplayValue(totalStokComb, isVal)}</td>
          <td style="text-align: right; color: #fff;">${this.formatDisplayValue(totalSales, isVal)}</td>
          <td style="text-align: right; color: #60a5fa;">${doiMNJ.toFixed(1)} d</td>
          <td style="text-align: right; color: #f472b6;">${doiKX.toFixed(1)} d</td>
          <td style="text-align: right; color: var(--accent-cyan); font-size: 15px; font-weight: 800;">${doiTotal.toFixed(1)} Hari</td>
          <td style="text-align: right; color: #a7f3d0; font-size: 15px;">${doiTargetCons.toFixed(1)} Hari</td>
          <td style="text-align: right; font-size: 14px;">${totalDoiVarHtml}</td>
          <td style="text-align: right; font-size: 14px;">${totalValVarHtml}</td>
          <td style="text-align: right; font-weight: 800; color: #a7f3d0; font-size: 15px;">${totalDoiAfterSelisih.toFixed(1)} Hari</td>
          <td>${renderHealthBadge(totalHealthStatus)}</td>
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
            <td colspan="16" style="text-align: center; padding: 40px; color: var(--text-muted);">
              Tidak ada produk yang memenuhi kriteria filter.
            </td>
          </tr>
        `;
        return;
      }

      const isVal = (this.filters.unit === 'value');

      tableBody.innerHTML = this.doiData.data.map(item => {
        const stokMNJ = isVal ? item.stok_mnj_value : item.stok_mnj_qty;
        const stokKX = isVal ? item.stok_kx_value : item.stok_kx_qty;
        const stokTotal = isVal ? item.stok_total_value : item.stok_total_qty;
        const avgSales = isVal ? item.avg_sales_value : item.avg_sales_qty;

        const doiMNJ = item.doi_mnj_days;
        const doiKX = item.doi_kx_days;
        const doiTotal = item.doi_total_days;
        const doiMax = item.doi_max_days || item.target_doi_days || 90;
        const targetStatus = item.health_status_total;

        const selDoi = item.selisih_doi_days || 0.0;
        const selStok = isVal ? (item.selisih_value || 0.0) : (item.selisih_qty || 0.0);
        const doiAfterSelisih = item.doi_after_selisih !== undefined ? item.doi_after_selisih : (doiTotal - selDoi);

        let selDoiHtml = '<span style="color: #94a3b8;">0.0 d</span>';
        let selStokHtml = `<span style="color: #94a3b8;">${this.formatDisplayValue(0, isVal)}</span>`;
        if (targetStatus === 'Overstock') {
          selDoiHtml = `<span style="color: #fbbf24; font-weight: 700;">+${selDoi.toFixed(1)} d</span>`;
          selStokHtml = `<span style="color: #fbbf24; font-weight: 700;">+${this.formatDisplayValue(selStok, isVal)}</span>`;
        } else if (targetStatus === 'Understock') {
          selDoiHtml = `<span style="color: #f87171; font-weight: 700;">${selDoi.toFixed(1)} d</span>`;
          selStokHtml = `<span style="color: #f87171; font-weight: 700;">${this.formatDisplayValue(selStok, isVal)}</span>`;
        }

        let ketBadgeStyle = 'background: rgba(100, 116, 139, 0.2); color: #cbd5e1; border: 1px solid rgba(100, 116, 139, 0.3);';
        if (item.keterangan_produk === 'Festive') {
          ketBadgeStyle = 'background: rgba(236, 72, 153, 0.2); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4);';
        } else if (item.keterangan_produk === 'Produk Baru') {
          ketBadgeStyle = 'background: rgba(0, 242, 254, 0.2); color: var(--accent-cyan); border: 1px solid rgba(0, 242, 254, 0.4);';
        } else if (item.keterangan_produk === 'Aktif') {
          ketBadgeStyle = 'background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);';
        } else if (item.keterangan_produk === 'Streamline') {
          ketBadgeStyle = 'background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);';
        }

        return `
          <tr data-pcode="${item.product_code}" style="cursor: pointer;">
            <td>
              <div style="font-weight: 700; color: #fff;">${item.product_code}</div>
              <div style="font-size: 11px; color: var(--text-muted);">${item.principal_product_code || '-'}</div>
            </td>
            <td style="font-weight: 600;">${item.product_name}</td>
            <td><span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">${item.gb}</span></td>
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
            <td style="text-align: right; font-size: 13px;">${selDoiHtml}</td>
            <td style="text-align: right; font-size: 13px;">${selStokHtml}</td>
            <td style="text-align: right; font-weight: 700; font-size: 14px; color: #a7f3d0;">
              ${doiAfterSelisih >= 999 ? '> 999' : doiAfterSelisih.toFixed(1)} Hari
            </td>
            <td>
              ${renderHealthBadge(targetStatus)}
            </td>
          </tr>
        `;
      }).join('');

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
      const modalContent = document.getElementById('modalContent');
      const modalOverlay = document.getElementById('modalOverlay');

      if (!modalContent || !modalOverlay) return;

      const formatCurr = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
      const formatNum = (val) => new Intl.NumberFormat('id-ID').format(val);
      const doiMax = item.doi_max_days || item.target_doi_days || 90;

      modalContent.innerHTML = `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 8px;">
            <span class="badge badge-normal">${item.gb}</span>
            <span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #c084fc; border: 1px solid rgba(139, 92, 246, 0.4);">${item.keterangan_produk}</span>
          </div>
          <h2 style="font-size: 20px; font-weight: 800; color: #fff;">${item.product_name}</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Kode Produk: <strong style="color: var(--accent-cyan);">${item.product_code}</strong> | Principal Code: <strong>${item.principal_product_code || '-'}</strong></p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div style="background: rgba(15, 23, 42, 0.7); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Harga Dasar Unit</div>
            <div style="font-size: 18px; font-weight: 800; color: var(--accent-cyan); margin-top: 4px;">${formatCurr(item.harga_dasar)}</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.7); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Avg Sales Bulanan</div>
            <div style="font-size: 18px; font-weight: 800; color: #fff; margin-top: 4px;">${formatNum(item.avg_sales_qty)} Unit</div>
            <div style="font-size: 12px; color: var(--text-muted);">${formatCurr(item.avg_sales_value)}</div>
          </div>
        </div>

        <h3 style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Komparasi Persediaan &amp; Realisasi DOI (${item.period})</h3>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <!-- MNJ Row -->
          <div style="background: rgba(15, 23, 42, 0.7); padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(139, 92, 246, 0.2); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px;">🏢 Distributor (MNJ)</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${formatNum(item.stok_mnj_qty)} Unit (${formatCurr(item.stok_mnj_value)})</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: 800; color: #c084fc;">${item.doi_mnj_days.toFixed(1)} Hari</div>
              ${renderHealthBadge(item.health_status_mnj)}
            </div>
          </div>

          <!-- KX Row -->
          <div style="background: rgba(15, 23, 42, 0.7); padding: 14px 18px; border-radius: 12px; border: 1px solid rgba(236, 72, 153, 0.2); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px;">🏭 Principal (KX)</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${formatNum(item.stok_kx_qty)} Unit (${formatCurr(item.stok_kx_value)})</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: 800; color: #f472b6;">${item.doi_kx_days.toFixed(1)} Hari</div>
              ${renderHealthBadge(item.health_status_kx || item.health_status_total)}
            </div>
          </div>

          <!-- Total Row -->
          <div style="background: rgba(0, 242, 254, 0.08); border: 1px solid rgba(0, 242, 254, 0.35); padding: 16px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 800; color: #fff; font-size: 15px;">🔗 Total Combined (MNJ + KX)</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${formatNum(item.stok_total_qty)} Unit (${formatCurr(item.stok_total_value)})</div>
              <div style="font-size: 11px; color: #a7f3d0; margin-top: 4px;">Master Min/Max DOI: ${item.doi_min_days ? item.doi_min_days.toFixed(1) : '30.0'} - ${doiMax.toFixed(1)} Hari</div>
              ${item.health_status_total === 'Overstock' ? `<div style="font-size: 12px; color: #fbbf24; margin-top: 6px; font-weight: 700;">🟡 Kelebihan Overstock: +${(item.selisih_doi_days || 0).toFixed(1)} Hari (+${formatCurr(item.value_overstock || 0)})</div>` : ''}
              ${item.health_status_total === 'Understock' ? `<div style="font-size: 12px; color: #f87171; margin-top: 6px; font-weight: 700;">🔴 Kekurangan Understock: ${(item.selisih_doi_days || 0).toFixed(1)} Hari (-${formatCurr(item.value_understock || 0)})</div>` : ''}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 22px; font-weight: 800; color: var(--accent-cyan);">${item.doi_total_days.toFixed(1)} Hari</div>
              ${renderHealthBadge(item.health_status_total)}
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DashboardApp());
  } else {
    new DashboardApp();
  }
})();
