import { formatPrice, formatPercent, formatVolume, getExchangeUrl, getTradingViewUrl } from '../utils/formatters.js';

export class TableEmaManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = [];
    this.searchQuery = '';
    this.directionFilter = 'all'; // 'all' | 'above' | 'below'
    this.sortField = 'maxDist3';
    this.sortAsc = false;
  }

  setData(data) {
    this.data = data || [];
    this.render();
  }

  setSearchQuery(query) {
    this.searchQuery = (query || '').trim().toLowerCase();
    this.render();
  }

  setDirectionFilter(dir) {
    this.directionFilter = dir;
    this.render();
  }

  getFilteredData() {
    let result = [...this.data];

    if (this.searchQuery) {
      result = result.filter(item => item.symbol.toLowerCase().includes(this.searchQuery));
    }

    if (this.directionFilter !== 'all') {
      result = result.filter(item => {
        if (this.directionFilter === 'above') {
          return item.distEma3_30m.direction === 'above' || item.distEma3_1h.direction === 'above';
        } else if (this.directionFilter === 'below') {
          return item.distEma3_30m.direction === 'below' || item.distEma3_1h.direction === 'below';
        }
        return true;
      });
    }

    result.sort((a, b) => {
      let valA = a[this.sortField];
      let valB = b[this.sortField];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }

  handleSort(field) {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = false;
    }
    this.render();
  }

  render() {
    if (!this.container) return;

    const filtered = this.getFilteredData();

    if (filtered.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="trending-up" class="empty-icon"></i>
          <p>No se encontraron pares con distancia a la EMA 3/10 superior al umbral configurado.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const sortIcon = (field) => {
      if (this.sortField !== field) return '<i data-lucide="arrow-up-down" class="sort-icon-inactive"></i>';
      return this.sortAsc ? '<i data-lucide="arrow-up" class="sort-icon-active"></i>' : '<i data-lucide="arrow-down" class="sort-icon-active"></i>';
    };

    let html = `
      <div class="table-responsive">
        <table class="crypto-table">
          <thead>
            <tr>
              <th>Exchange</th>
              <th class="sortable" id="sort-ema-symbol">Par ${sortIcon('symbol')}</th>
              <th class="sortable" id="sort-ema-price">Precio Actual ${sortIcon('price')}</th>
              <th class="sortable" id="sort-ema-max3">Dist. EMA 3 (30m) ${sortIcon('maxDist3')}</th>
              <th>Dist. EMA 3 (1h)</th>
              <th class="sortable" id="sort-ema-max10">Dist. EMA 10 (30m) ${sortIcon('maxDist10')}</th>
              <th>Dist. EMA 10 (1h)</th>
              <th>Tendencia / Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;

    filtered.forEach(item => {
      const exchangeBadge = item.exchange === 'binance' 
        ? `<span class="badge badge-binance"><i data-lucide="box"></i> Binance</span>`
        : `<span class="badge badge-bybit"><i data-lucide="zap"></i> Bybit</span>`;

      // Helper para distintivo de distancia EMA
      const renderDistBadge = (distObj) => {
        if (!distObj) return '-';
        const isAbove = distObj.direction === 'above';
        const badgeClass = isAbove ? 'badge-ema-above' : 'badge-ema-below';
        const sign = isAbove ? '▲ +' : '▼ ';
        return `<span class="badge ${badgeClass} font-mono font-bold">${sign}${distObj.distancePct}%</span>`;
      };

      // Estado general: ¿Disparado por encima o descolgado por debajo?
      const primaryDir = item.distEma3_30m.direction === 'above' ? 'above' : 'below';
      const statusBadge = primaryDir === 'above'
        ? `<span class="badge badge-bullish"><i data-lucide="trending-up"></i> Sobre EMA (Pump)</span>`
        : `<span class="badge badge-bearish"><i data-lucide="trending-down"></i> Bajo EMA (Dump)</span>`;

      html += `
        <tr>
          <td>${exchangeBadge}</td>
          <td>
            <div class="symbol-cell">
              <span class="symbol-name">${item.symbol}</span>
              <span class="badge-sub">PERP</span>
            </div>
          </td>
          <td class="font-mono font-bold">$${formatPrice(item.price)}</td>
          <td>${renderDistBadge(item.distEma3_30m)}</td>
          <td>${renderDistBadge(item.distEma3_1h)}</td>
          <td>${renderDistBadge(item.distEma10_30m)}</td>
          <td>${renderDistBadge(item.distEma10_1h)}</td>
          <td>${statusBadge}</td>
          <td class="text-right">
            <div class="action-buttons">
              <a href="${getExchangeUrl(item.exchange, item.symbol)}" target="_blank" class="btn-icon" title="Abrir en Exchange">
                <i data-lucide="external-link"></i>
              </a>
              <a href="${getTradingViewUrl(item.exchange, item.symbol)}" target="_blank" class="btn-icon btn-tv" title="Gráfico en TradingView">
                <i data-lucide="line-chart"></i>
              </a>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    this.container.innerHTML = html;

    // Handlers de ordenamiento
    const bindSort = (id, field) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.handleSort(field));
    };

    bindSort('sort-ema-symbol', 'symbol');
    bindSort('sort-ema-price', 'price');
    bindSort('sort-ema-max3', 'maxDist3');
    bindSort('sort-ema-max10', 'maxDist10');

    if (window.lucide) window.lucide.createIcons();
  }
}
