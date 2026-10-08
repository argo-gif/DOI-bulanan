// Combined Standalone Frontend Script for Dashboard Monitoring DOI (MNJ Distributor & KX Principal)
(function() {
  let API_BASE = '/api/v1';
  if (typeof window !== 'undefined') {
    if (window.location.origin && window.location.origin.startsWith('http')) {
      API_BASE = window.location.origin.replace(/\/$/, '') + '/api/v1';
    } else {
      API_BASE = 'http://localhost:8000/api/v1';
    }
  }

  async function fetchWithRetry(url, options = {}, retries = 3, delay = 500) {
    let targetUrl = url;
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(targetUrl, options);
        if (res.ok) return res;
      } catch (err) {
        if (targetUrl.includes('localhost')) {
          targetUrl = targetUrl.replace('localhost', '127.0.0.1');
        } else if (targetUrl.includes('127.0.0.1')) {
          targetUrl = targetUrl.replace('127.0.0.1', 'localhost');
        }
        if (i === retries - 1) throw err;
      }
      await new Promise(r => setTimeout(r, delay));
    }
    return fetch(targetUrl, options);
  }

  async function fetchMetadata() {
    const res = await fetchWithRetry(`${API_BASE}/metadata`);
    if (!res.ok) throw new Error('Failed to fetch metadata');
    return res.json();
  }

  async function fetchSummary(filters) {
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-10',
      unit: filters.unit || 'value',
      gb: gbVal,
      keterangan: ketVal,
      products: prodVal,
      health_status: filters.health_status || 'All',
      avg_months: (filters.avg_months || 6).toString(),
      view_mode: filters.activeTab || 'combined'
    });
    const res = await fetchWithRetry(`${API_BASE}/summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  }

  async function fetchGBSummary(filters) {
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-10',
      avg_months: (filters.avg_months || 6).toString(),
      keterangan: ketVal,
      products: prodVal,
      health_status: filters.health_status || 'All',
      unit: filters.unit || 'value',
      view_mode: filters.activeTab || 'combined'
    });
    const res = await fetchWithRetry(`${API_BASE}/gb-summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch GB summary');
    return res.json();
  }

  async function fetchCategoryGBSummary(filters) {
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-10',
      avg_months: (filters.avg_months || 6).toString(),
      keterangan: ketVal,
      products: prodVal,
      health_status: filters.health_status || 'All',
      unit: filters.unit || 'value',
      gb: gbVal,
      view_mode: filters.activeTab || 'combined'
    });
    const res = await fetchWithRetry(`${API_BASE}/category-gb-summary?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch Category GB summary');
    return res.json();
  }

  function formatPeriodFullLabel(periodStr) {
    if (!periodStr) return '';
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const parts = periodStr.split('-');
    if (parts.length === 2) {
      const mIdx = parseInt(parts[1], 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return `${months[mIdx]} ${parts[0]}`;
      }
    }
    return periodStr;
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
      period: filters.period || '2026-10',
      avg_months: (filters.avg_months || 6).toString(),
      unit: filters.unit || 'value'
    });
    const res = await fetchWithRetry(`${API_BASE}/doi-trend?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch DOI trend');
    return res.json();
  }

  async function fetchDOIData(filters) {
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-10',
      unit: filters.detailSelisihUnit || filters.unit || 'value',
      gb: gbVal,
      keterangan: ketVal,
      products: prodVal,
      health_status: filters.health_status || 'All',
      avg_months: (filters.avg_months || 6).toString(),
      view_mode: filters.activeTab || 'combined',
      page: (filters.page || 1).toString(),
      page_size: (filters.page_size || 15).toString()
    });
    const res = await fetchWithRetry(`${API_BASE}/doi-data?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch DOI data');
    return res.json();
  }

  function getExportUrl(filters) {
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-10',
      unit: filters.detailSelisihUnit || filters.unit || 'value',
      gb: gbVal,
      keterangan: ketVal,
      products: prodVal,
      health_status: filters.health_status,
      avg_months: (filters.avg_months || 6).toString(),
      view_mode: filters.activeTab || 'combined'
    });
    return `${API_BASE}/export?${params.toString()}`;
  }

  function getExportExcelUrl(filters) {
    const gbVal = (filters.selectedGBs && filters.selectedGBs.length > 0) ? filters.selectedGBs.join(',') : 'All';
    const ketVal = (filters.selectedKets && filters.selectedKets.length > 0) ? filters.selectedKets.join(',') : 'All';
    const prodVal = (filters.selectedProducts && filters.selectedProducts.length > 0) ? filters.selectedProducts.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-10',
      unit: filters.detailSelisihUnit || filters.unit || 'value',
      gb: gbVal,
      keterangan: ketVal,
      products: prodVal,
      health_status: filters.health_status,
      avg_months: (filters.avg_months || 6).toString(),
      view_mode: filters.activeTab || 'combined'
    });
    return `${API_BASE}/export-excel?${params.toString()}`;
  }

  function getExportPPTUrl(filters) {
    const gbVal = Array.isArray(filters.selectedGBs) && filters.selectedGBs.length > 0 ? filters.selectedGBs.join(',') : 'All';
    const ketVal = Array.isArray(filters.selectedKets) && filters.selectedKets.length > 0 ? filters.selectedKets.join(',') : 'All';
    const prodVal = Array.isArray(filters.selectedItems) && filters.selectedItems.length > 0 ? filters.selectedItems.join(',') : 'All';

    const params = new URLSearchParams({
      period: filters.period || '2026-10',
      unit: filters.detailSelisihUnit || filters.unit || 'value',
      gb: gbVal,
      keterangan: ketVal,
      products: prodVal,
      health_status: filters.health_status,
      avg_months: (filters.avg_months || 6).toString(),
      view_mode: filters.activeTab || 'combined'
    });
    return `${API_BASE}/export-ppt?${params.toString()}`;
  }

  function renderHealthBadge(status) {
    let badgeClass = 'badge-normal';
    let dotColor = '#16a34a';
    let customStyle = '';
    if (status === 'Understock') {
      badgeClass = 'badge-understock';
      dotColor = '#dc2626';
    } else if (status === 'Overstock') {
      badgeClass = 'badge-overstock';
      dotColor = '#d97706';
    } else if (status === 'Streamline') {
      badgeClass = 'badge-streamline';
      dotColor = '#9d174d';
      customStyle = 'background: #fce7f3; color: #9d174d; border: 1px solid #fbcfe8;';
    } else if (status === 'Festive') {
      badgeClass = 'badge-festive';
      dotColor = '#be185d';
      customStyle = 'background: #fce7f3; color: #be185d; border: 1px solid #fbcfe8;';
    }
    const styleAttr = customStyle ? `style="${customStyle}"` : '';
    return `<span class="badge ${badgeClass}" ${styleAttr}><span class="badge-dot" style="background:${dotColor};"></span>${status}</span>`;
  }

  function renderDOIProgress(doi, maxDoi) {
    if (!maxDoi || maxDoi <= 0) maxDoi = 90;
    const pct = Math.min(100, Math.max(6, (doi / maxDoi) * 100));
    let barColor = 'linear-gradient(90deg, #10b981, #34d399)';
    if (doi > maxDoi) barColor = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    if (doi < 30) barColor = 'linear-gradient(90deg, #ef4444, #f87171)';

    return `
      <div class="doi-progress-wrapper" title="DOI Realisasi: ${doi.toFixed(0)} Hari vs Max Master: ${maxDoi.toFixed(0)} Hari">
        <div class="doi-progress-bar" style="width: ${pct}%; background: ${barColor};"></div>
      </div>
    `;
  }

  class DashboardApp {
    constructor() {
      this.filters = {
        activeTab: 'combined',
        detailStockUnit: 'value',
        detailSelisihUnit: 'value',  // 'combined', 'mnj', 'kx'
        period: '2026-10',
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
          this.filters.period = '2026-10';
        }
        this.updateApiStatus(true, 'API Live Connected');
        this.populateFilterDropdowns();
        this.bindEvents();
        await this.refreshData();
      } catch (err) {
        console.error('[DASHBOARD] Initialization error:', err);
        this.updateApiStatus(false, 'API Disconnected');
        this.filters.period = '2026-10';
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
          return isCurrency ? `Rp ${val} Miliar` : `${val} M`;
        }
        if (abs >= 1e6) {
          const val = (num / 1e6).toFixed(2);
          return isCurrency ? `Rp ${val} Juta` : `${val} Jt`;
        }
        if (abs >= 1e3) {
          const val = (num / 1e3).toFixed(1);
          return isCurrency ? `Rp ${val} Rb` : `${val} Rb`;
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
          : ['2026-10', '2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04', '2026-03', '2026-02', '2026-01'];

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

      // Filter 1: Detail Table Stok & Sales Unit (Stand-Alone)
      document.querySelectorAll('#detailStockUnitToggleContainer [data-detail-stock-unit]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const unit = e.currentTarget.getAttribute('data-detail-stock-unit');
          this.filters.detailStockUnit = unit;
          document.querySelectorAll('#detailStockUnitToggleContainer [data-detail-stock-unit]').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.renderTable();
        });
      });

      // Filter 2: Detail Table Hitung Selisih (Stok & Nas) Unit (Stand-Alone)
      document.querySelectorAll('#detailSelisihUnitToggleContainer [data-detail-selisih-unit]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const unit = e.currentTarget.getAttribute('data-detail-selisih-unit');
          this.filters.detailSelisihUnit = unit;
          document.querySelectorAll('#detailSelisihUnitToggleContainer [data-detail-selisih-unit]').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.setFilter({ page: 1 });
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

      // Sheet View Tab Switchers
      document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const tab = e.currentTarget.getAttribute('data-tab');
          this.filters.activeTab = tab;
          document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
          e.currentTarget.classList.add('active');
          this.updateTabUI(tab);
          this.setFilter({ page: 1 });
        });
      });

      const btnExportExcel = document.getElementById('btnExportExcel');
      if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
          window.open(getExportExcelUrl(this.filters), '_blank');
        });
      }

      const btnExport = document.getElementById('btnExport');
      if (btnExport) {
        btnExport.addEventListener('click', () => {
          window.open(getExportUrl(this.filters), '_blank');
        });
      }

      const btnExportPPT = document.getElementById('btnExportPPT');
      if (btnExportPPT) {
        btnExportPPT.addEventListener('click', () => {
          window.open(getExportPPTUrl(this.filters), '_blank');
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

    updateTabUI(tab) {
      const trendChartTitle = document.getElementById('trendChartTitle');
      const trendSubtitle = document.getElementById('trendSubtitle');
      const gbTitle = document.getElementById('gbSectionTitle');
      const gbSub = document.getElementById('gbSectionSub');
      const catGbTitle = document.getElementById('catGbSectionTitle');
      const catGbSub = document.getElementById('catGbSectionSub');
      const detailTitle = document.getElementById('detailSectionTitle');
      const detailSub = document.getElementById('detailSectionSub');

      const periodLabel = formatPeriodFullLabel(this.filters.period);
      const gbBadge = `<span id="gbPeriodBadge" style="font-size: 12px; font-weight: 600; color: #0284c7; background: #e0f2fe; padding: 2px 10px; border-radius: 12px; border: 1px solid #bae6fd; margin-left: 4px;">Periode: ${periodLabel}</span>`;
      const catGbBadge = `<span id="catGbPeriodBadge" style="font-size: 12px; font-weight: 600; color: #0284c7; background: #e0f2fe; padding: 2px 10px; border-radius: 12px; border: 1px solid #bae6fd; margin-left: 4px;">Periode: ${periodLabel}</span>`;
      const detailBadge = `<span id="detailPeriodBadge" style="font-size: 11px; font-weight: 600; color: #0284c7; background: #e0f2fe; padding: 2px 8px; border-radius: 12px; border: 1px solid #bae6fd; margin-left: 4px;">Periode: ${periodLabel}</span>`;

      if (tab === 'mnj') {
        if (trendChartTitle) trendChartTitle.innerHTML = `<span>🏢</span> Trend Pergerakan DOI MNJ (Distributor Khusus)`;
        if (trendSubtitle) trendSubtitle.innerText = 'Visualisasi pergerakan level kesehatan DOI Distributor MNJ per bulan.';

        if (gbTitle) gbTitle.innerHTML = `<span>🏢</span> Ringkasan DOI MNJ Per Group Business (GB) ${gbBadge}`;
        if (gbSub) gbSub.innerText = 'Perbandingan stok, realisasi DOI, Max DOI MNJ (Master), dan status understock/overstock khusus Distributor MNJ per GB.';

        if (catGbTitle) catGbTitle.innerHTML = `<span>📊</span> Matrix Impact Selisih DOI MNJ Per Status & Group Business ${catGbBadge}`;
        if (catGbSub) catGbSub.innerText = 'Matrix rincian dampak Selisih DOI MNJ per Status Evaluasi (Understock < 15 Hari, Normal, Overstock > Max DOI MNJ).';

        if (detailTitle) detailTitle.innerHTML = `<span>📋</span> Detail Produk & Evaluasi Realisasi DOI MNJ (Distributor) ${detailBadge}`;
        if (detailSub) detailSub.innerText = 'Rincian evaluasi DOI khusus distributor MNJ per produk. Threshold Understock < 15 Hari.';
      } else if (tab === 'kx') {
        if (trendChartTitle) trendChartTitle.innerHTML = `<span>🏭</span> Trend Pergerakan DOI KX (Principal Khusus)`;
        if (trendSubtitle) trendSubtitle.innerText = 'Visualisasi pergerakan level kesehatan DOI Principal KX per bulan.';

        if (gbTitle) gbTitle.innerHTML = `<span>🏭</span> Ringkasan DOI KX Per Group Business (GB) ${gbBadge}`;
        if (gbSub) gbSub.innerText = 'Perbandingan stok, realisasi DOI, Max DOI KX (Master), dan status understock/overstock khusus Principal KX per GB.';

        if (catGbTitle) catGbTitle.innerHTML = `<span>📊</span> Matrix Impact Selisih DOI KX Per Status & Group Business ${catGbBadge}`;
        if (catGbSub) catGbSub.innerText = 'Matrix rincian dampak Selisih DOI KX per Status Evaluasi (Understock < 15 Hari, Normal, Overstock > Max DOI KX).';

        if (detailTitle) detailTitle.innerHTML = `<span>📋</span> Detail Produk & Evaluasi Realisasi DOI KX (Principal) ${detailBadge}`;
        if (detailSub) detailSub.innerText = 'Rincian evaluasi DOI khusus principal KX per produk. Threshold Understock < 15 Hari.';
      } else {
        if (trendChartTitle) trendChartTitle.innerHTML = `<span>📈</span> Trend Pergerakan DOI Historis (Januari 2026 – Oktober 2026)`;
        if (trendSubtitle) trendSubtitle.innerText = 'Visualisasi perbandingan pergerakan DOI MNJ, DOI KX, dan DOI Combined Total.';

        if (gbTitle) gbTitle.innerHTML = `<span>🏢</span> Ringkasan DOI Per Group Business (GB) & Total Konsolidasi ${gbBadge}`;
        if (gbSub) gbSub.innerText = 'Perbandingan stok persediaan MNJ, KX Principal, Total Combined, DOI Total, dan DOI Max Master per GB.';

        if (catGbTitle) catGbTitle.innerHTML = `<span>📊</span> Matrix Impact Selisih DOI GB Per Status & Group Business ${catGbBadge}`;
        if (catGbSub) catGbSub.innerText = 'Matrix rincian dampak Selisih DOI GB per Status Evaluasi (Overstock, Understock, Streamline, Festive) untuk tiap Group Business dan Total Konsolidasi.';

        if (detailTitle) detailTitle.innerHTML = `<span>📋</span> Detail Produk & Evaluasi Realisasi DOI vs DOI Max Master ${detailBadge}`;
        if (detailSub) detailSub.innerText = 'Rincian evaluasi DOI seluruh produk distributor dan principal. Threshold Understock < 45 Hari.';
      }
    }

    async setFilter(newFilters) {
      this.filters = { ...this.filters, ...newFilters };
      await this.refreshData();
    }

    async refreshData() {
      try {
        const [summaryRes, gbSummaryRes, catGbSummaryRes, trendRes, doiRes] = await Promise.all([
          fetchSummary(this.filters),
          fetchGBSummary(this.filters),
          fetchCategoryGBSummary(this.filters),
          fetchDOITrend(this.filters),
          fetchDOIData(this.filters)
        ]);

        this.summary = summaryRes;
        this.gbSummary = gbSummaryRes;
        this.catGbSummary = catGbSummaryRes;
        this.trendData = trendRes;
        this.doiData = doiRes;

        this.updateApiStatus(true, 'API Live Connected');
        this.renderSummaryCards();
        this.renderTrendChart();
        this.renderGBTable();
        this.renderCatGBTable();
        this.renderTable();
        this.renderPagination();
      } catch (err) {
        console.error('[DASHBOARD] Data refresh error:', err);
        this.updateApiStatus(false, 'API Error');
        const errDetail = (err && err.message) ? err.message : String(err);
        this.showError(`Terjadi kesalahan memuat data: ${errDetail}`);
      }
    }

    renderSummaryCards() {
      if (!this.summary) return;

      const formatNum = (val) => new Intl.NumberFormat('id-ID').format(val);
      const isStockVal = (this.filters.detailStockUnit ? this.filters.detailStockUnit === 'value' : true);
      const isSelisihVal = (this.filters.detailSelisihUnit ? this.filters.detailSelisihUnit === 'value' : true);

      const elSKU = document.getElementById('metricTotalSKU');
      if (elSKU) elSKU.innerText = formatNum(this.summary.total_sku);

      const elUnder = document.getElementById('metricUnderstock');
      if (elUnder) elUnder.innerText = formatNum(this.summary.understock_count);

      const elNorm = document.getElementById('metricNormal');
      if (elNorm) elNorm.innerText = formatNum(this.summary.normal_count);

      const elOver = document.getElementById('metricOverstock');
      if (elOver) elOver.innerText = formatNum(this.summary.overstock_count);

      // Status Filter Cards SKU Counts
      const cntAll = document.getElementById('countAllSku');
      if (cntAll) cntAll.innerText = `${formatNum(this.summary.total_sku)} SKU`;

      const cntUnder = document.getElementById('countUnderstockSku');
      if (cntUnder) cntUnder.innerText = `${formatNum(this.summary.understock_count)} SKU`;

      const cntNorm = document.getElementById('countNormalSku');
      if (cntNorm) cntNorm.innerText = `${formatNum(this.summary.normal_count)} SKU`;

      const cntOver = document.getElementById('countOverstockSku');
      if (cntOver) cntOver.innerText = `${formatNum(this.summary.overstock_count)} SKU`;

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
      if (elMNJSub) elMNJSub.innerText = `DOI MNJ: ${doiMNJ.toFixed(0)} Hari`;

      const elKXSub = document.getElementById('metricDOIKXSubtitle');
      if (elKXSub) elKXSub.innerText = `DOI KX: ${doiKX.toFixed(0)} Hari`;

      const elCombSub = document.getElementById('metricDOICombSubtitle');
      if (elCombSub) elCombSub.innerText = `DOI Total: ${doiComb.toFixed(0)} Hari`;
    }

    renderTrendChart() {
      const chartContainer = document.getElementById('trendChartContainer');
      const subtitleEl = document.getElementById('trendSubtitle');

      const titleEl = document.getElementById('trendChartTitle');
      if (titleEl && this.trendData && this.trendData.length > 0) {
        const startLabel = formatPeriodFullLabel(this.trendData[0].period);
        const endLabel = formatPeriodFullLabel(this.trendData[this.trendData.length - 1].period);
        const rangeText = (this.trendData.length > 1) ? `(${startLabel} – ${endLabel})` : `(${endLabel})`;
        const activeTab = this.filters.activeTab || 'combined';
        if (activeTab === 'mnj') {
          titleEl.innerHTML = `<span>🏢</span> Trend Pergerakan DOI MNJ (Distributor Khusus) ${rangeText}`;
        } else if (activeTab === 'kx') {
          titleEl.innerHTML = `<span>🏭</span> Trend Pergerakan DOI KX (Principal Khusus) ${rangeText}`;
        } else {
          titleEl.innerHTML = `<span>📈</span> Trend Pergerakan DOI Historis ${rangeText}`;
        }
      }

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
        subtitleEl.innerHTML = `Visualisasi perbandingan tren pergerakan DOI historis 3-in-1 — <strong style="color: var(--accent-cyan);">${filterLabel}</strong>.`;
      }

      if (!chartContainer || !this.trendData || this.trendData.length === 0) return;

      const data = this.trendData;

      const allValues = data.flatMap(d => [d.doi_total_days || 0, d.doi_mnj_days || 0, d.doi_kx_days || 0]);
      const maxDOI = Math.max(...allValues, 100) * 1.12;
      const minDOI = 0;

      const width = 850;
      const height = 250;
      const padding = { top: 25, right: 30, bottom: 45, left: 55 };

      const chartW = width - padding.left - padding.right;
      const chartH = height - padding.top - padding.bottom;

      const xStep = chartW / Math.max(1, data.length - 1);

      const getY = (val) => padding.top + chartH - ((val - minDOI) / (maxDOI - minDOI)) * chartH;

      const pointsMNJ = data.map((d, i) => ({ x: padding.left + i * xStep, y: getY(d.doi_mnj_days), val: d.doi_mnj_days, data: d }));
      const pointsKX = data.map((d, i) => ({ x: padding.left + i * xStep, y: getY(d.doi_kx_days), val: d.doi_kx_days, data: d }));
      const pointsTotal = data.map((d, i) => ({ x: padding.left + i * xStep, y: getY(d.doi_total_days), val: d.doi_total_days, data: d }));

      const pathMNJ = pointsMNJ.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
      const pathKX = pointsKX.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
      const pathTotal = pointsTotal.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
      const areaTotal = `${pathTotal} L ${pointsTotal[pointsTotal.length - 1].x} ${height - padding.bottom} L ${pointsTotal[0].x} ${height - padding.bottom} Z`;

      const activeTab = this.filters.activeTab || 'combined';
      let mnjStrokeWidth = "2.5", mnjOpacity = "0.95", mnjFilter = "";
      let kxStrokeWidth = "2.5", kxOpacity = "0.95", kxFilter = "";
      let totalStrokeWidth = "3.5", totalOpacity = "1.0", totalFilter = 'filter="url(#glow)"';

      if (activeTab === 'mnj') {
        mnjStrokeWidth = "4.0"; mnjOpacity = "1.0"; mnjFilter = 'filter="url(#glow)"';
        kxOpacity = "0.2";
        totalOpacity = "0.2";
      } else if (activeTab === 'kx') {
        kxStrokeWidth = "4.0"; kxOpacity = "1.0"; kxFilter = 'filter="url(#glow)"';
        mnjOpacity = "0.2";
        totalOpacity = "0.2";
      }

      chartContainer.innerHTML = `
        <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: 100%; overflow: visible;">
          <defs>
            <linearGradient id="trendGradientTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#a855f7" stop-opacity="0.28"/>
              <stop offset="100%" stop-color="#a855f7" stop-opacity="0.0"/>
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Grid horizontal lines -->
          <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="#cbd5e1" stroke-dasharray="4"/>
          <line x1="${padding.left}" y1="${padding.top + chartH / 2}" x2="${width - padding.right}" y2="${padding.top + chartH / 2}" stroke="#cbd5e1" stroke-dasharray="4"/>
          <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#94a3b8"/>

          <!-- Area under Total line -->
          <path d="${areaTotal}" fill="url(#trendGradientTotal)" opacity="${totalOpacity}"/>

          <!-- Series 1: DOI MNJ (Distributor - Bold Red) -->
          <path d="${pathMNJ}" fill="none" stroke="#dc2626" stroke-width="${mnjStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${mnjOpacity}" ${mnjFilter}/>

          <!-- Series 2: DOI KX (Principal - Bold Blue) -->
          <path d="${pathKX}" fill="none" stroke="#0284c7" stroke-width="${kxStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${kxOpacity}" ${kxFilter}/>

          <!-- Series 3: DOI Combined Total (Bold Purple Glow) -->
          <path d="${pathTotal}" fill="none" stroke="#7c3aed" stroke-width="${totalStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${totalOpacity}" ${totalFilter}/>

          <!-- Data Points & Interactive Group -->
          ${data.map((d, i) => {
            const pMNJ = pointsMNJ[i];
            const pKX = pointsKX[i];
            const pTot = pointsTotal[i];

            // Smart label Y-positioning
            let yMNJText = pMNJ.y - 8;
            let yKXText = pKX.y + 15;

            if (pKX.y < pMNJ.y) {
              yKXText = pKX.y - 8;
              yMNJText = pMNJ.y + 15;
            }

            if (Math.abs(yMNJText - (pTot.y - 10)) < 12) {
              yMNJText = pMNJ.y + 15;
            }
            if (Math.abs(yKXText - (pTot.y - 10)) < 12) {
              yKXText = pKX.y + 15;
            }

            return `
              <g class="chart-point-group" data-period="${d.period}" style="cursor: pointer;">
                <!-- Vertical guide line -->
                <line x1="${pTot.x}" y1="${padding.top}" x2="${pTot.x}" y2="${height - padding.bottom}" stroke="#cbd5e1" stroke-dasharray="3"/>

                <!-- MNJ Point & Label (Bold Red) -->
                <circle cx="${pMNJ.x}" cy="${pMNJ.y}" r="${activeTab === 'mnj' ? 6 : 4}" fill="#ffffff" stroke="#dc2626" stroke-width="${activeTab === 'mnj' ? 3.5 : 2.5}" opacity="${mnjOpacity}"/>
                <text x="${pMNJ.x}" y="${yMNJText}" fill="#b91c1c" font-size="${activeTab === 'mnj' ? 11 : 10}" font-weight="800" text-anchor="middle" opacity="${mnjOpacity}">${pMNJ.val.toFixed(0)}d</text>

                <!-- KX Point & Label (Bold Blue) -->
                <circle cx="${pKX.x}" cy="${pKX.y}" r="${activeTab === 'kx' ? 6 : 4}" fill="#ffffff" stroke="#0284c7" stroke-width="${activeTab === 'kx' ? 3.5 : 2.5}" opacity="${kxOpacity}"/>
                <text x="${pKX.x}" y="${yKXText}" fill="#0369a1" font-size="${activeTab === 'kx' ? 11 : 10}" font-weight="800" text-anchor="middle" opacity="${kxOpacity}">${pKX.val.toFixed(0)}d</text>

                <!-- Total Point & Label (Bold Purple) -->
                <circle cx="${pTot.x}" cy="${pTot.y}" r="5" fill="#ffffff" stroke="#7c3aed" stroke-width="3" opacity="${totalOpacity}"/>
                <text x="${pTot.x}" y="${pTot.y - 10}" fill="#6d28d9" font-size="11" font-weight="800" text-anchor="middle" opacity="${totalOpacity}">${pTot.val.toFixed(0)}d</text>

                <!-- Period X Label -->
                <text x="${pTot.x}" y="${height - padding.bottom + 20}" fill="#334155" font-size="11" font-weight="700" text-anchor="middle">${d.period_label}</text>
              </g>
            `;
          }).join('')}
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

      const gbBadge = document.getElementById('gbPeriodBadge');
      if (gbBadge) {
        gbBadge.innerText = `Periode: ${formatPeriodFullLabel(this.filters.period)}`;
      }

      const activeTab = this.filters.activeTab || 'combined';
      const thStokMnj = document.getElementById('gbThStokMnj');
      const thStokKx = document.getElementById('gbThStokKx');
      const thComb = document.getElementById('gbThComb');
      const thMnj = document.getElementById('gbThDoiMnj');
      const thKx = document.getElementById('gbThDoiKx');
      const thDoiTotal = document.getElementById('gbThDoiTotal');
      const thMax = document.getElementById('gbThDoiMax');
      const thSelDoi = document.getElementById('gbThSelDoi');
      const thSelStok = document.getElementById('gbThSelStok');
      const thStatus = document.getElementById('gbThStatus');

      if (thStokMnj) thStokMnj.style.display = (activeTab === 'kx') ? 'none' : '';
      if (thStokKx) thStokKx.style.display = (activeTab === 'mnj') ? 'none' : '';
      if (thComb) thComb.style.display = (activeTab === 'mnj' || activeTab === 'kx') ? 'none' : '';
      if (thMnj) thMnj.style.display = (activeTab === 'kx') ? 'none' : '';
      if (thKx) thKx.style.display = (activeTab === 'mnj') ? 'none' : '';
      if (thDoiTotal) thDoiTotal.style.display = (activeTab === 'mnj' || activeTab === 'kx') ? 'none' : '';

      if (activeTab === 'mnj') {
        if (thMax) thMax.innerText = 'Max DOI MNJ';
        if (thSelDoi) thSelDoi.innerText = 'Sel. DOI MNJ';
        if (thSelStok) thSelStok.innerText = 'Sel. Stok MNJ';
        if (thStatus) thStatus.innerText = 'Status MNJ';
      } else if (activeTab === 'kx') {
        if (thMax) thMax.innerText = 'Max DOI KX';
        if (thSelDoi) thSelDoi.innerText = 'Sel. DOI KX';
        if (thSelStok) thSelStok.innerText = 'Sel. Stok KX';
        if (thStatus) thStatus.innerText = 'Status KX';
      } else {
        if (thMax) thMax.innerText = 'DOI Max';
        if (thSelDoi) thSelDoi.innerText = 'Sel. DOI';
        if (thSelStok) thSelStok.innerText = 'Sel. Stok';
        if (thStatus) thStatus.innerText = 'Status Total';
      }

      const isStockVal = (this.filters.detailStockUnit ? this.filters.detailStockUnit === 'value' : true);
      const isSelisihVal = (this.filters.detailSelisihUnit ? this.filters.detailSelisihUnit === 'value' : true);
      const isGBFilterActive = Boolean(this.filters.selectedGBs && this.filters.selectedGBs.length > 0);

      const targetGBList = isGBFilterActive
        ? this.gbSummary.filter(gb => this.filters.selectedGBs.includes(gb.gb))
        : this.gbSummary;

      const totalSKU = targetGBList.reduce((a, b) => a + b.total_sku, 0);
      const totalStokMNJ = targetGBList.reduce((a, b) => a + (isVal ? b.stok_mnj_value : b.stok_mnj_qty), 0);
      const totalStokKX = targetGBList.reduce((a, b) => a + (isVal ? b.stok_kx_value : b.stok_kx_qty), 0);
      const totalStokComb = targetGBList.reduce((a, b) => a + (isVal ? b.stok_total_value : b.stok_total_qty), 0);
      const totalMinThresh = targetGBList.reduce((a, b) => a + (isVal ? b.min_value_total : b.min_qty_total), 0);
      const totalMaxThresh = targetGBList.reduce((a, b) => a + (isVal ? b.max_value_total : b.max_qty_total), 0);
      const totalSales = targetGBList.reduce((a, b) => a + (isVal ? b.avg_sales_value : b.avg_sales_qty), 0);
      const totalSalesActive = targetGBList.reduce((a, b) => a + (isVal ? (b.avg_sales_value_active || b.avg_sales_value) : (b.avg_sales_qty_active || b.avg_sales_qty)), 0);
      const totalSalesActive2026 = targetGBList.reduce((a, b) => a + (isVal ? (b.avg_sales_2026_value_active || b.avg_sales_value_active || b.avg_sales_value) : (b.avg_sales_2026_qty_active || b.avg_sales_qty_active || b.avg_sales_qty)), 0);

      const simInputEl = document.getElementById('simTargetDoiInput');
      const customSimTargetDoi = (simInputEl && simInputEl.value) ? parseFloat(simInputEl.value) : null;

      const doiMNJ = Math.ceil(totalSales > 0 ? (totalStokMNJ / totalSales * 30.0) : 0);
      const doiKX = Math.ceil(totalSales > 0 ? (totalStokKX / totalSales * 30.0) : 0);
      const doiTotal = Math.ceil(totalSales > 0 ? (totalStokComb / totalSales * 30.0) : 0);

      let masterDoiTargetCons = 74;
      let totalHealthStatus = 'Normal';
      let totalSelisihStok = targetGBList.reduce((a, b) => a + (isVal ? (b.selisih_value || 0) : (b.selisih_qty || 0)), 0);

      if (activeTab === 'mnj') {
        const totalMaxThreshMNJ2026 = targetGBList.reduce((a, b) => a + (isVal ? (b.max_value_mnj_2026 || b.max_value_mnj || b.max_value_total) : (b.max_qty_mnj_2026 || b.max_qty_mnj || b.max_qty_total)), 0);
        masterDoiTargetCons = Math.ceil(totalSalesActive2026 > 0 ? (totalMaxThreshMNJ2026 / totalSalesActive2026 * 30.0) : 33);
        totalSelisihStok = targetGBList.reduce((a, b) => a + (isVal ? (b.selisih_value_mnj || 0) : (b.selisih_qty_mnj || 0)), 0);

        const totalMaxThreshMNJActive = targetGBList.reduce((a, b) => a + (isVal ? (b.max_value_mnj || b.max_value_total) : (b.max_qty_mnj || b.max_qty_total)), 0);
        if (totalStokMNJ < (15.0 / 30.0) * totalSales) {
          totalHealthStatus = 'Understock';
        } else if (totalStokMNJ <= totalMaxThreshMNJActive) {
          totalHealthStatus = 'Normal';
        } else {
          totalHealthStatus = 'Overstock';
        }
      } else if (activeTab === 'kx') {
        const totalMaxThreshKX2026 = targetGBList.reduce((a, b) => a + (isVal ? (b.max_value_kx_2026 || b.max_value_kx || b.max_value_total) : (b.max_qty_kx_2026 || b.max_qty_kx || b.max_qty_total)), 0);
        masterDoiTargetCons = Math.ceil(totalSalesActive2026 > 0 ? (totalMaxThreshKX2026 / totalSalesActive2026 * 30.0) : 60);
        totalSelisihStok = targetGBList.reduce((a, b) => a + (isVal ? (b.selisih_value_kx || 0) : (b.selisih_qty_kx || 0)), 0);

        const totalMaxThreshKXActive = targetGBList.reduce((a, b) => a + (isVal ? (b.max_value_kx || b.max_value_total) : (b.max_qty_kx || b.max_qty_total)), 0);
        if (totalStokKX < (15.0 / 30.0) * totalSales) {
          totalHealthStatus = 'Understock';
        } else if (totalStokKX <= totalMaxThreshKXActive) {
          totalHealthStatus = 'Normal';
        } else {
          totalHealthStatus = 'Overstock';
        }
      } else {
        const actualTotalDoi = doiTotal;
        const maxTotalTarget = (customSimTargetDoi && customSimTargetDoi > 0) ? Math.ceil(customSimTargetDoi) : masterDoiTargetCons;
        if (actualTotalDoi < 45) {
          totalHealthStatus = 'Understock';
        } else if (actualTotalDoi > maxTotalTarget) {
          totalHealthStatus = 'Overstock';
        } else {
          totalHealthStatus = 'Normal';
        }
      }

      const doiTargetCons = (customSimTargetDoi && customSimTargetDoi > 0) ? Math.ceil(customSimTargetDoi) : masterDoiTargetCons;
      const isSimulated = Boolean(customSimTargetDoi && customSimTargetDoi > 0);

      let totalSelisihDoi = Math.ceil(totalSales > 0 ? (totalSelisihStok / totalSales * 30.0) : 0);

      if (isSimulated) {
        const simMaxThresh = (customSimTargetDoi / 30.0) * totalSalesActive;
        totalSelisihStok = Math.max(0, totalStokComb - simMaxThresh);
        totalSelisihDoi = Math.ceil(Math.max(0, doiTotal - customSimTargetDoi));
      }

      const totalDoiAfterSelisih = Math.ceil(doiTotal - totalSelisihDoi);

      let totalDoiVarHtml = '<span style="color: #64748b;">0 d</span>';
      let totalValVarHtml = `<span style="color: #64748b;">${this.formatDisplayValue(0, isVal)}</span>`;
      if (totalSelisihStok > 0) {
        totalDoiVarHtml = `<span style="color: #b45309; font-weight: 800;">+${totalSelisihDoi.toFixed(0)} d</span>`;
        totalValVarHtml = `<span style="color: #b45309; font-weight: 800;">+${this.formatDisplayValue(totalSelisihStok, isVal)}</span>`;
      } else if (totalSelisihStok < 0) {
        totalDoiVarHtml = `<span style="color: #b91c1c; font-weight: 800;">${totalSelisihDoi.toFixed(0)} d</span>`;
        totalValVarHtml = `<span style="color: #b91c1c; font-weight: 800;">${this.formatDisplayValue(totalSelisihStok, isVal)}</span>`;
      }

      const stokMnjColStyle = (activeTab === 'kx') ? 'display:none;' : '';
      const stokKxColStyle = (activeTab === 'mnj') ? 'display:none;' : '';
      const combColStyle = (activeTab === 'mnj' || activeTab === 'kx') ? 'display:none;' : '';
      const doiMnjColStyle = (activeTab === 'kx') ? 'display:none;' : '';
      const doiKxColStyle = (activeTab === 'mnj') ? 'display:none;' : '';
      const doiTotalColStyle = (activeTab === 'mnj' || activeTab === 'kx') ? 'display:none;' : '';

      let html = targetGBList.map(gb => {
        const mnjDisp = isVal ? gb.stok_mnj_value : gb.stok_mnj_qty;
        const kxDisp = isVal ? gb.stok_kx_value : gb.stok_kx_qty;
        const combDisp = isVal ? gb.stok_total_value : gb.stok_total_qty;
        const salesDisp = isVal ? gb.avg_sales_value : gb.avg_sales_qty;

        let masterMaxDoi = (gb.doi_max_days !== undefined && gb.doi_max_days !== null) ? gb.doi_max_days : (gb.target_doi_days !== undefined && gb.target_doi_days !== null ? gb.target_doi_days : 90);
        let actualDoi = gb.doi_total_days;

        if (activeTab === 'mnj') {
          masterMaxDoi = (gb.doi_max_mnj !== undefined && gb.doi_max_mnj !== null) ? gb.doi_max_mnj : masterMaxDoi;
          actualDoi = gb.doi_mnj_days;
        } else if (activeTab === 'kx') {
          masterMaxDoi = (gb.doi_max_kx !== undefined && gb.doi_max_kx !== null) ? gb.doi_max_kx : masterMaxDoi;
          actualDoi = gb.doi_kx_days;
        }

        const minDoi = (activeTab === 'mnj' || activeTab === 'kx') ? 15 : 45;
        const maxDoi = isSimulated ? Math.ceil(customSimTargetDoi) : masterMaxDoi;
        let gbStatus = 'Normal';
        if (actualDoi < minDoi) {
          gbStatus = 'Understock';
        } else if (actualDoi > maxDoi) {
          gbStatus = 'Overstock';
        }
        const isActive = this.filters.selectedGBs.includes(gb.gb);

        let selVal = isVal ? (gb.selisih_value || 0.0) : (gb.selisih_qty || 0.0);
        let selDoi = gb.selisih_doi || 0.0;
        if (activeTab === 'mnj') {
          selVal = isVal ? (gb.selisih_value_mnj || 0.0) : (gb.selisih_qty_mnj || 0.0);
          selDoi = Math.ceil(salesDisp > 0 ? (selVal / salesDisp * 30.0) : 0);
        } else if (activeTab === 'kx') {
          selVal = isVal ? (gb.selisih_value_kx || 0.0) : (gb.selisih_qty_kx || 0.0);
          selDoi = Math.ceil(salesDisp > 0 ? (selVal / salesDisp * 30.0) : 0);
        }

        let doiAfterSelisih = gb.doi_after_selisih !== undefined ? gb.doi_after_selisih : (actualDoi - selDoi);

        if (isSimulated) {
          const gbSalesActive = isVal ? (gb.avg_sales_2026_value_active || gb.avg_sales_value_active || gb.avg_sales_value) : (gb.avg_sales_2026_qty_active || gb.avg_sales_qty_active || gb.avg_sales_qty);
          const simMaxThreshVal = (customSimTargetDoi / 30.0) * gbSalesActive;
          selVal = Math.max(0, combDisp - simMaxThreshVal);
          selDoi = Math.ceil(salesDisp > 0 ? (selVal / salesDisp * 30.0) : 0);
          doiAfterSelisih = Math.ceil(gb.doi_total_days - selDoi);
        }

        let selDoiHtml = '<span style="color: #64748b;">0 d</span>';
        let selValHtml = `<span style="color: #64748b;">${this.formatDisplayValue(0, isVal)}</span>`;
        if (selVal > 0 || selDoi > 0) {
          selDoiHtml = `<span style="color: #b45309; font-weight: 800;">+${selDoi.toFixed(0)} d</span>`;
          selValHtml = `<span style="color: #b45309; font-weight: 800;">+${this.formatDisplayValue(selVal, isVal)}</span>`;
        } else if (selVal < 0 || selDoi < 0) {
          selDoiHtml = `<span style="color: #b91c1c; font-weight: 800;">${selDoi.toFixed(0)} d</span>`;
          selValHtml = `<span style="color: #b91c1c; font-weight: 800;">${this.formatDisplayValue(selVal, isVal)}</span>`;
        }

        return `
          <tr data-gb="${gb.gb}" style="${isActive ? 'background: #e0f2fe; border-left: 4px solid #0284c7;' : ''}">
            <td style="font-weight: 800; color: #0f172a;">${gb.gb}</td>
            <td style="text-align: right; font-weight: 700; color: #1e293b;">${gb.total_sku}</td>
            <td style="${stokMnjColStyle} text-align: right; font-weight: 600; color: #b91c1c;">${this.formatDisplayValue(mnjDisp, isVal)}</td>
            <td style="${stokKxColStyle} text-align: right; font-weight: 600; color: #0369a1;">${this.formatDisplayValue(kxDisp, isVal)}</td>
            <td style="${combColStyle} text-align: right; font-weight: 800; color: #0f172a;">${this.formatDisplayValue(combDisp, isVal)}</td>
            <td style="text-align: right; font-weight: 600; color: #334155;">${this.formatDisplayValue(salesDisp, isVal)}</td>
            <td style="${doiMnjColStyle} text-align: right; font-weight: 700; color: #dc2626;">${(gb.doi_mnj_days || 0).toFixed(0)} d</td>
            <td style="${doiKxColStyle} text-align: right; font-weight: 700; color: #0284c7;">${(gb.doi_kx_days || 0).toFixed(0)} d</td>
            <td style="${doiTotalColStyle} text-align: right; font-weight: 800; color: #1d4ed8;">${(gb.doi_total_days || 0).toFixed(0)} d</td>
            <td style="text-align: right; font-weight: 700; color: #047857;">${(maxDoi || 0).toFixed(0)} d</td>
            <td>${renderHealthBadge(gbStatus)}</td>
          </tr>
        `;
      }).join('');

      if (targetGBList.length > 1) {
        const totalLabel = isGBFilterActive ? 'TOTAL TERPILIH' : 'TOTAL KONSOLIDASI';

        html += `
          <tr style="background: #e0f2fe; font-weight: 800; border-top: 2px solid #93c5fd;">
            <td style="color: #0369a1; font-weight: 800;">${totalLabel}</td>
            <td style="text-align: right; color: #0f172a;">${totalSKU}</td>
            <td style="${stokMnjColStyle} text-align: right; color: #b91c1c;">${this.formatDisplayValue(totalStokMNJ, isVal)}</td>
            <td style="${stokKxColStyle} text-align: right; color: #0369a1;">${this.formatDisplayValue(totalStokKX, isVal)}</td>
            <td style="${combColStyle} text-align: right; color: #0f172a;">${this.formatDisplayValue(totalStokComb, isVal)}</td>
            <td style="text-align: right; color: #334155;">${this.formatDisplayValue(totalSales, isVal)}</td>
            <td style="${doiMnjColStyle} text-align: right; color: #dc2626;">${(doiMNJ || 0).toFixed(0)} d</td>
            <td style="${doiKxColStyle} text-align: right; color: #0284c7;">${(doiKX || 0).toFixed(0)} d</td>
            <td style="${doiTotalColStyle} text-align: right; color: #1d4ed8; font-weight: 800;">${(doiTotal || 0).toFixed(0)} d</td>
            <td style="text-align: right; color: #047857;">${(doiTargetCons || 0).toFixed(0)} d</td>
            <td>${renderHealthBadge(totalHealthStatus)}</td>
          </tr>
        `;
      }

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

    renderCatGBTable() {
      const tableBody = document.getElementById('catGbTableBody');
      if (!tableBody || !this.catGbSummary) return;

      const badge = document.getElementById('catGbPeriodBadge');
      if (badge) {
        badge.innerText = `Periode: ${formatPeriodFullLabel(this.filters.period)}`;
      }

      // Collect all distinct GB names (excluding Total Konsolidasi)
      const gbSet = new Set();
      const statuses = ['Overstock', 'Understock', 'Streamline', 'Festive'];
      const matrix = {};

      statuses.forEach(st => {
        matrix[st] = {};
      });

      this.catGbSummary.forEach(item => {
        const gb = item.gb;
        const st = item.health_status;
        if (!gb || !st) return;

        if (gb !== 'Total Konsolidasi') {
          gbSet.add(gb);
        }

        if (!matrix[st]) {
          matrix[st] = {};
        }

        matrix[st][gb] = {
          selGb: item.selisih_doi_gb || 0.0,
          totalSku: item.total_sku || 0
        };
      });

      // Sort GBs naturally (GB 1, GB 2, ..., GB ET)
      const gbList = Array.from(gbSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      const allCols = [...gbList, 'Total Konsolidasi'];

      // Dynamically update table <thead>
      const tableElem = tableBody.closest('table');
      if (tableElem) {
        const theadElem = tableElem.querySelector('thead');
        if (theadElem) {
          theadElem.innerHTML = `
            <tr>
              <th style="min-width: 140px;">Status Evaluasi</th>
              ${allCols.map(gb => {
                const isCons = (gb === 'Total Konsolidasi');
                const style = isCons
                  ? 'text-align: right; color: #0369a1; font-weight: 800; background: #e0f2fe;'
                  : 'text-align: right; color: #0f172a;';
                const label = isCons ? '🌐 Total Konsolidasi' : gb;
                return `<th style="${style}">${label}</th>`;
              }).join('')}
            </tr>
          `;
        }
      }

      if (this.catGbSummary.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="${allCols.length + 1}" style="text-align: center; padding: 25px; color: #64748b;">
              Tidak ada data matrix selisih GB per status evaluasi.
            </td>
          </tr>
        `;
        return;
      }

      const rowsHtml = statuses.map(st => {
        // Check if there is any data for this status
        const hasData = allCols.some(gb => matrix[st][gb] && (Math.abs(matrix[st][gb].selGb) > 0.001 || matrix[st][gb].totalSku > 0));
        if (!hasData) return '';

        const cellsHtml = allCols.map(gb => {
          const isCons = (gb === 'Total Konsolidasi');
          const cellData = matrix[st] ? matrix[st][gb] : null;

          if (!cellData) {
            const bgStyle = isCons ? 'background: #f0f9ff;' : '';
            return `<td style="text-align: right; color: #64748b; ${bgStyle}">-</td>`;
          }

          const selGb = cellData.selGb;
          const skuCount = cellData.totalSku;

          let selGbHtml = '<span style="color: #64748b;">0d</span>';
          if (selGb > 0) {
            selGbHtml = `<span style="color: #b45309; font-weight: 700;">+${selGb.toFixed(0)}d</span>`;
          } else if (selGb < 0) {
            selGbHtml = `<span style="color: #b91c1c; font-weight: 700;">${selGb.toFixed(0)}d</span>`;
          }

          const skuSub = skuCount > 0 ? `<div style="font-size: 10px; color: #475569; margin-top: 2px;">(${skuCount} SKU)</div>` : '';
          const bgStyle = isCons ? 'background: #e0f2fe; font-weight: 600;' : '';

          return `
            <td style="text-align: right; ${bgStyle}">
              <div>${selGbHtml}</div>
              ${skuSub}
            </td>
          `;
        }).join('');

        return `
          <tr>
            <td style="font-weight: 700; white-space: nowrap;">${renderHealthBadge(st)}</td>
            ${cellsHtml}
          </tr>
        `;
      }).join('');

      // Calculate totals per column
      const totalCellsHtml = allCols.map(gb => {
        const isCons = (gb === 'Total Konsolidasi');
        let totSelGb = 0.0;
        let totSku = 0;

        statuses.forEach(st => {
          if (matrix[st] && matrix[st][gb]) {
            totSelGb += matrix[st][gb].selGb || 0.0;
            totSku += matrix[st][gb].totalSku || 0;
          }
        });

        let totSelGbHtml = '<span style="color: #475569; font-weight: 800;">0d</span>';
        if (totSelGb > 0) {
          totSelGbHtml = `<span style="color: #b45309; font-weight: 800;">+${totSelGb.toFixed(0)}d</span>`;
        } else if (totSelGb < 0) {
          totSelGbHtml = `<span style="color: #b91c1c; font-weight: 800;">${totSelGb.toFixed(0)}d</span>`;
        }

        const skuSub = totSku > 0 ? `<div style="font-size: 10px; color: #334155; margin-top: 2px; font-weight: 700;">(${totSku} SKU)</div>` : '';
        const bgStyle = isCons ? 'background: #bae6fd; font-weight: 800;' : 'background: #e0f2fe; font-weight: 800;';

        return `
          <td style="text-align: right; ${bgStyle}">
            <div>${totSelGbHtml}</div>
            ${skuSub}
          </td>
        `;
      }).join('');

      const totalRowHtml = `
        <tr style="border-top: 2px solid #93c5fd; background: #e0f2fe;">
          <td style="font-weight: 800; white-space: nowrap; color: #0369a1; padding-top: 10px; padding-bottom: 10px;">
            📊 TOTAL NET SELISIH GB
          </td>
          ${totalCellsHtml}
        </tr>
      `;

      tableBody.innerHTML = rowsHtml + totalRowHtml;
    }

    renderTable() {
      const tableBody = document.getElementById('tableBody');
      if (!tableBody || !this.doiData) return;

      const currentStockUnit = this.filters.detailStockUnit || 'value';
      const currentSelisihUnit = this.filters.detailSelisihUnit || 'value';

      document.querySelectorAll('#detailStockUnitToggleContainer [data-detail-stock-unit]').forEach(b => {
        if (b.getAttribute('data-detail-stock-unit') === currentStockUnit) b.classList.add('active');
        else b.classList.remove('active');
      });

      document.querySelectorAll('#detailSelisihUnitToggleContainer [data-detail-selisih-unit]').forEach(b => {
        if (b.getAttribute('data-detail-selisih-unit') === currentSelisihUnit) b.classList.add('active');
        else b.classList.remove('active');
      });

      const detailBadge = document.getElementById('detailPeriodBadge');
      if (detailBadge) {
        detailBadge.innerText = `Periode: ${formatPeriodFullLabel(this.filters.period)}`;
      }

      const activeTab = this.filters.activeTab || 'combined';
      const thDetailStokMnj = document.getElementById('detailThStokMnj');
      const thDetailStokKx = document.getElementById('detailThStokKx');
      const thDetailComb = document.getElementById('detailThComb');
      const thDetailDoiMnj = document.getElementById('detailThDoiMnj');
      const thDetailDoiKx = document.getElementById('detailThDoiKx');
      const thDetailDoiTotal = document.getElementById('detailThDoiTotal');
      const thDetailMax = document.getElementById('detailThDoiMax');
      const thDetailSelDoi = document.getElementById('detailThSelDoi');
      const thDetailSelStok = document.getElementById('detailThSelStok');
      const thDetailStatus = document.getElementById('detailThStatus');

      if (thDetailStokMnj) thDetailStokMnj.style.display = (activeTab === 'kx') ? 'none' : '';
      if (thDetailStokKx) thDetailStokKx.style.display = (activeTab === 'mnj') ? 'none' : '';
      if (thDetailComb) thDetailComb.style.display = (activeTab === 'mnj' || activeTab === 'kx') ? 'none' : '';
      if (thDetailDoiMnj) thDetailDoiMnj.style.display = (activeTab === 'kx') ? 'none' : '';
      if (thDetailDoiKx) thDetailDoiKx.style.display = (activeTab === 'mnj') ? 'none' : '';
      if (thDetailDoiTotal) thDetailDoiTotal.style.display = (activeTab === 'mnj' || activeTab === 'kx') ? 'none' : '';

      if (activeTab === 'mnj') {
        if (thDetailMax) thDetailMax.innerText = 'Max DOI MNJ';
        if (thDetailSelDoi) thDetailSelDoi.innerText = 'Sel. DOI MNJ';
        if (thDetailSelStok) thDetailSelStok.innerText = 'Sel. Stok MNJ';
        if (thDetailStatus) thDetailStatus.innerText = 'Status MNJ';
      } else if (activeTab === 'kx') {
        if (thDetailMax) thDetailMax.innerText = 'Max DOI KX';
        if (thDetailSelDoi) thDetailSelDoi.innerText = 'Sel. DOI KX';
        if (thDetailSelStok) thDetailSelStok.innerText = 'Sel. Stok KX';
        if (thDetailStatus) thDetailStatus.innerText = 'Status KX';
      } else {
        if (thDetailMax) thDetailMax.innerText = 'DOI Max';
        if (thDetailSelDoi) thDetailSelDoi.innerText = 'Sel. DOI';
        if (thDetailSelStok) thDetailSelStok.innerText = 'Sel. Stok';
        if (thDetailStatus) thDetailStatus.innerText = 'Status';
      }

      const thSelGB = document.getElementById('thSelGB');
      if (thSelGB) {
        const isSingleGB = Boolean(this.filters.selectedGBs && this.filters.selectedGBs.length === 1);
        thSelGB.innerText = isSingleGB ? 'Sel. GB' : 'Sel. Nas';
        thSelGB.title = isSingleGB ? 'Selisih DOI item relatif terhadap DOI Total GB' : 'Selisih DOI item relatif terhadap DOI Total Konsolidasi Nasional';
      }

      if (this.doiData.data.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="18" style="text-align: center; padding: 30px; color: var(--text-muted);">
              Tidak ada produk yang memenuhi kriteria filter.
            </td>
          </tr>
        `;
        return;
      }

      const isStockVal = (this.filters.detailStockUnit ? this.filters.detailStockUnit === 'value' : true);
      const isSelisihVal = (this.filters.detailSelisihUnit ? this.filters.detailSelisihUnit === 'value' : true);
      const stokMnjColStyle = (activeTab === 'kx') ? 'display:none;' : '';
      const stokKxColStyle = (activeTab === 'mnj') ? 'display:none;' : '';
      const combColStyle = (activeTab === 'mnj' || activeTab === 'kx') ? 'display:none;' : '';
      const doiMnjColStyle = (activeTab === 'kx') ? 'display:none;' : '';
      const doiKxColStyle = (activeTab === 'mnj') ? 'display:none;' : '';
      const doiTotalColStyle = (activeTab === 'mnj' || activeTab === 'kx') ? 'display:none;' : '';

      // Sort by entity-specific selisih stock descending (Qty or Value depending on detailSelisihUnit)
      this.doiData.data.sort((a, b) => {
        const ketA = (a.keterangan_produk || '').toLowerCase();
        const ketB = (b.keterangan_produk || '').toLowerCase();
        let valA, valB;
        if (isSelisihVal) {
          if (activeTab === 'mnj') {
            valA = (ketA === 'streamline' || ketA === 'festive') ? (a.stok_mnj_value || 0) : (a.selisih_value_mnj !== undefined ? a.selisih_value_mnj : (a.selisih_value || 0));
            valB = (ketB === 'streamline' || ketB === 'festive') ? (b.stok_mnj_value || 0) : (b.selisih_value_mnj !== undefined ? b.selisih_value_mnj : (b.selisih_value || 0));
          } else if (activeTab === 'kx') {
            valA = (ketA === 'streamline' || ketA === 'festive') ? (a.stok_kx_value || 0) : (a.selisih_value_kx !== undefined ? a.selisih_value_kx : (a.selisih_value || 0));
            valB = (ketB === 'streamline' || ketB === 'festive') ? (b.stok_kx_value || 0) : (b.selisih_value_kx !== undefined ? b.selisih_value_kx : (b.selisih_value || 0));
          } else {
            valA = (ketA === 'streamline' || ketA === 'festive') ? (a.stok_total_value || 0) : (a.selisih_value || 0);
            valB = (ketB === 'streamline' || ketB === 'festive') ? (b.stok_total_value || 0) : (b.selisih_value || 0);
          }
        } else {
          if (activeTab === 'mnj') {
            valA = (ketA === 'streamline' || ketA === 'festive') ? (a.stok_mnj_qty || 0) : (a.selisih_qty_mnj !== undefined ? a.selisih_qty_mnj : (a.selisih_qty || 0));
            valB = (ketB === 'streamline' || ketB === 'festive') ? (b.stok_mnj_qty || 0) : (b.selisih_qty_mnj !== undefined ? b.selisih_qty_mnj : (b.selisih_qty || 0));
          } else if (activeTab === 'kx') {
            valA = (ketA === 'streamline' || ketA === 'festive') ? (a.stok_kx_qty || 0) : (a.selisih_qty_kx !== undefined ? a.selisih_qty_kx : (a.selisih_qty || 0));
            valB = (ketB === 'streamline' || ketB === 'festive') ? (b.stok_kx_qty || 0) : (b.selisih_qty_kx !== undefined ? b.selisih_qty_kx : (b.selisih_qty || 0));
          } else {
            valA = (ketA === 'streamline' || ketA === 'festive') ? (a.stok_total_qty || 0) : (a.selisih_qty || 0);
            valB = (ketB === 'streamline' || ketB === 'festive') ? (b.stok_total_qty || 0) : (b.selisih_qty || 0);
          }
        }
        return valB - valA;
      });

      tableBody.innerHTML = this.doiData.data.map(item => {
        const stokMNJ = isStockVal ? item.stok_mnj_value : item.stok_mnj_qty;
        const stokKX = isStockVal ? item.stok_kx_value : item.stok_kx_qty;
        const stokTotal = isStockVal ? item.stok_total_value : item.stok_total_qty;
        const avgSales = isStockVal ? item.avg_sales_value : item.avg_sales_qty;

        const doiMNJ = item.doi_mnj_days;
        const doiKX = item.doi_kx_days;
        const doiTotal = item.doi_total_days;
        let doiMax = (item.doi_max_days !== undefined && item.doi_max_days !== null) ? item.doi_max_days : (item.target_doi_days !== undefined && item.target_doi_days !== null ? item.target_doi_days : 90);
        let selDoi = item.selisih_doi_days !== undefined ? item.selisih_doi_days : 0.0;
        let selStok = isSelisihVal ? (item.selisih_value !== undefined ? item.selisih_value : 0.0) : (item.selisih_qty !== undefined ? item.selisih_qty : 0.0);
        let targetStatus = item.health_status_total;

        let actualDoi = doiTotal;
        if (activeTab === 'mnj') {
          doiMax = (item.doi_max_mnj !== undefined && item.doi_max_mnj !== null) ? item.doi_max_mnj : doiMax;
          actualDoi = doiMNJ;
          selDoi = item.selisih_doi_mnj !== undefined ? item.selisih_doi_mnj : 0.0;
          selStok = isVal ? (item.selisih_value_mnj !== undefined ? item.selisih_value_mnj : 0.0) : (item.selisih_qty_mnj !== undefined ? item.selisih_qty_mnj : 0.0);
          targetStatus = item.health_status_mnj || item.health_status_total;
        } else if (activeTab === 'kx') {
          doiMax = (item.doi_max_kx !== undefined && item.doi_max_kx !== null) ? item.doi_max_kx : doiMax;
          actualDoi = doiKX;
          selDoi = item.selisih_doi_kx !== undefined ? item.selisih_doi_kx : 0.0;
          selStok = isVal ? (item.selisih_value_kx !== undefined ? item.selisih_value_kx : 0.0) : (item.selisih_qty_kx !== undefined ? item.selisih_qty_kx : 0.0);
          targetStatus = item.health_status_kx || item.health_status_total;
        }

        // Streamline & Festive check: items marked Streamline or Festive hide selisih DOI, selisih stok, and DOI Net
        const ketLower = (item.keterangan_produk || '').toLowerCase();
        const isSpecialHide = (ketLower === 'streamline' || ketLower === 'festive');

        const doiAfterSelisih = item.doi_after_selisih !== undefined ? item.doi_after_selisih : (doiTotal - selDoi);

        let selDoiHtml = '<span style="color: #64748b;">-</span>';
        let selStokHtml = '<span style="color: #64748b;">-</span>';
        let doiNetHtml = '<span style="color: #64748b;">-</span>';

        if (!isSpecialHide) {
          selDoiHtml = '<span style="color: #64748b;">0d</span>';
          selStokHtml = `<span style="color: #64748b;">${this.formatDisplayValue(0, isSelisihVal)}</span>`;
          if (targetStatus === 'Overstock') {
            selDoiHtml = `<span style="color: #b45309; font-weight: 800;">+${selDoi.toFixed(0)}d</span>`;
            selStokHtml = `<span style="color: #b45309; font-weight: 800;">+${this.formatDisplayValue(selStok, isSelisihVal)}</span>`;
          } else if (targetStatus === 'Understock') {
            selDoiHtml = `<span style="color: #b91c1c; font-weight: 800;">${selDoi.toFixed(0)}d</span>`;
            selStokHtml = `<span style="color: #b91c1c; font-weight: 800;">${this.formatDisplayValue(selStok, isSelisihVal)}</span>`;
          }

          doiNetHtml = `${doiAfterSelisih >= 999 ? '>999' : doiAfterSelisih.toFixed(0)}d`;
        }

        // 2. Selisih GB (Always rendered, including Streamline)
        const selDoiGB = item.selisih_doi_gb !== undefined ? item.selisih_doi_gb : 0.0;
        let selGbHtml = '<span style="color: #64748b;">0d</span>';
        if (selDoiGB > 0) {
          selGbHtml = `<span style="color: #0284c7; font-weight: 700;">+${selDoiGB.toFixed(0)}d</span>`;
        } else if (selDoiGB < 0) {
          selGbHtml = `<span style="color: #b91c1c; font-weight: 700;">${selDoiGB.toFixed(0)}d</span>`;
        }

        let ketBadgeStyle = 'background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;';
        if (item.keterangan_produk === 'Festive') {
          ketBadgeStyle = 'background: #fce7f3; color: #be185d; border: 1px solid #fbcfe8;';
        } else if (item.keterangan_produk === 'Produk Baru') {
          ketBadgeStyle = 'background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;';
        } else if (item.keterangan_produk === 'Aktif') {
          ketBadgeStyle = 'background: #dcfce7; color: #15803d; border: 1px solid #86efac;';
        } else if (item.keterangan_produk === 'Streamline') {
          ketBadgeStyle = 'background: #fef3c7; color: #b45309; border: 1px solid #fde68a;';
        }

        return `
          <tr data-pcode="${item.product_code}" style="cursor: pointer;">
            <td>
              <div style="font-weight: 700; color: #0f172a;">${item.product_code}</div>
              <div style="font-size: 9.5px; color: #64748b;">${item.principal_product_code || '-'}</div>
            </td>
            <td style="font-weight: 700; color: #0f172a;">${item.product_name}</td>
            <td><span style="font-size: 10.5px; color: #334155; font-weight: 700;">${item.gb}</span></td>
            <td><span class="badge" style="${ketBadgeStyle}">${item.keterangan_produk}</span></td>
            <td style="${stokMnjColStyle} text-align: right; font-weight: 600; color: #b91c1c;">${this.formatDisplayValue(stokMNJ, isStockVal)}</td>
            <td style="${stokKxColStyle} text-align: right; font-weight: 600; color: #0369a1;">${this.formatDisplayValue(stokKX, isStockVal)}</td>
            <td style="${combColStyle} text-align: right; font-weight: 800; color: #0f172a;">${this.formatDisplayValue(stokTotal, isStockVal)}</td>
            <td style="text-align: right; font-weight: 600; color: #334155;">${this.formatDisplayValue(avgSales, isStockVal)}</td>
            <td style="${doiMnjColStyle} text-align: right; font-weight: 700; color: #b91c1c;">${doiMNJ >= 999 ? '>999' : doiMNJ.toFixed(0)}d</td>
            <td style="${doiKxColStyle} text-align: right; font-weight: 700; color: #0369a1;">${doiKX >= 999 ? '>999' : doiKX.toFixed(0)}d</td>
            <td style="${doiTotalColStyle} text-align: right; font-weight: 800; color: #1d4ed8;">
              ${doiTotal >= 999 ? '>999' : doiTotal.toFixed(0)}d
            </td>
            <td style="text-align: right; font-weight: 700; color: #047857;">
              ${doiMax >= 999 ? '>999' : doiMax ? doiMax.toFixed(0) : '0'}d
            </td>
            <td style="text-align: right;">${selDoiHtml}</td>
            <td style="text-align: right;">${selStokHtml}</td>
            <td style="text-align: right;">${selGbHtml}</td>
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
      const modalOverlay = document.getElementById('modalOverlay') || document.getElementById('detailModalOverlay');
      const modalBody = document.getElementById('detailModalBody') || modalContent;
      if (!modalOverlay || !modalBody) return;

      const formatCurr = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
      const formatNum = (val) => new Intl.NumberFormat('id-ID').format(val);
      const doiMax = item.doi_max_days !== undefined ? item.doi_max_days : (item.target_doi_days || 90);

      modalBody.innerHTML = `
        <div style="margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
            <span class="badge" style="background: #e0f2fe; color: #0284c7; border: 1px solid #bae6fd;">${item.gb}</span>
            <span class="badge" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">${item.keterangan_produk}</span>
            ${renderHealthBadge(item.health_status_total)}
          </div>
          <h2 style="font-size: 20px; font-weight: 800; color: #0f172a;">${item.product_name}</h2>
          <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Kode Produk: <strong style="color: var(--accent-cyan);">${item.product_code}</strong> | Principal Code: <strong>${item.principal_product_code || '-'}</strong></p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Harga Dasar Unit</div>
            <div style="font-size: 18px; font-weight: 800; color: var(--accent-cyan); margin-top: 4px;">${formatCurr(item.harga_dasar)}</div>
          </div>
          <div style="background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);">
            <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Avg Sales Bulanan</div>
            <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">${formatNum(item.avg_sales_qty)} Unit</div>
            <div style="font-size: 12px; color: var(--text-muted);">${formatCurr(item.avg_sales_value)}</div>
          </div>
        </div>

        <h3 style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Komparasi Persediaan &amp; Realisasi DOI (${item.period})</h3>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <!-- MNJ Row -->
          <div style="background: #f8fafc; padding: 14px 18px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px;">🏢 Distributor (MNJ)</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${formatNum(item.stok_mnj_qty)} Unit (${formatCurr(item.stok_mnj_value)})</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: 800; color: #7c3aed;">${item.doi_mnj_days.toFixed(0)} Hari</div>
              ${renderHealthBadge(item.health_status_mnj)}
            </div>
          </div>

          <!-- KX Row -->
          <div style="background: #f8fafc; padding: 14px 18px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 6px;">🏭 Principal (KX)</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${formatNum(item.stok_kx_qty)} Unit (${formatCurr(item.stok_kx_value)})</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: 800; color: #e11d48;">${item.doi_kx_days.toFixed(0)} Hari</div>
              ${renderHealthBadge(item.health_status_kx || item.health_status_total)}
            </div>
          </div>

          <!-- Total Row -->
          <div style="background: #e0f2fe; border: 1px solid #bae6fd; padding: 16px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 800; color: #0f172a; font-size: 15px;">🔗 Total Combined (MNJ + KX)</div>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${formatNum(item.stok_total_qty)} Unit (${formatCurr(item.stok_total_value)})</div>
              <div style="font-size: 11px; color: #059669; margin-top: 4px;">Master Min/Max DOI: ${item.doi_min_days ? item.doi_min_days.toFixed(0) : '30'} - ${doiMax.toFixed(0)} Hari</div>
              ${item.health_status_total === 'Overstock' ? `<div style="font-size: 12px; color: #d97706; margin-top: 6px; font-weight: 700;">🟡 Kelebihan Overstock: +${(item.selisih_doi_days || 0).toFixed(0)} Hari (+${formatCurr(item.value_overstock || 0)})</div>` : ''}
              ${item.health_status_total === 'Understock' ? `<div style="font-size: 12px; color: #dc2626; margin-top: 6px; font-weight: 700;">🔴 Kekurangan Understock: ${(item.selisih_doi_days || 0).toFixed(0)} Hari (-${formatCurr(item.value_understock || 0)})</div>` : ''}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 22px; font-weight: 800; color: var(--accent-cyan);">${item.doi_total_days.toFixed(0)} Hari</div>
              ${renderHealthBadge(item.health_status_total)}
            </div>
          </div>
        </div>
      `;

      modalOverlay.classList.add('active');
    }

    updateApiStatus(online, msg) {
      const pill = document.querySelector('.status-pill');
      if (!pill) return;
      const dot = pill.querySelector('.pulse-dot');
      const textSpan = pill.querySelector('span:last-child');
      
      if (online) {
        pill.style.background = '#dcfce7';
        pill.style.borderColor = '#86efac';
        pill.style.color = '#15803d';
        if (dot) dot.style.background = '#16a34a';
        if (textSpan) textSpan.innerText = msg || 'API Live Connected';
      } else {
        pill.style.background = '#fee2e2';
        pill.style.borderColor = '#fca5a5';
        pill.style.color = '#b91c1c';
        if (dot) dot.style.background = '#dc2626';
        if (textSpan) textSpan.innerText = msg || 'API Disconnected';
      }
    }

    showError(msg) {
      const tableBody = document.getElementById('tableBody');
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="17" style="text-align: center; padding: 40px; color: #f87171; background: rgba(239, 68, 68, 0.05);">
              <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">⚠️ ${msg}</div>
              <div style="font-size: 13px; color: var(--text-secondary);">
                Jalankan perintah berikut di terminal: <code style="background: rgba(15, 23, 42, 0.8); padding: 4px 8px; border-radius: 4px; color: var(--accent-cyan);">python backend/main.py</code>
                lalu buka <a href="http://localhost:8000" style="color: var(--accent-cyan); font-weight: bold; text-decoration: underline;">http://localhost:8000</a>
              </div>
            </td>
          </tr>
        `;
      }
    }
  }

  function startApp() {
    if (!window.__doi_app_initialized) {
      window.__doi_app_initialized = true;
      new DashboardApp();
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    startApp();
  } else {
    document.addEventListener('DOMContentLoaded', startApp);
    window.addEventListener('load', startApp);
    setTimeout(startApp, 100);
  }
})();
