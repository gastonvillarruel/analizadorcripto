import { formatPercent, getExchangeUrl, getTradingViewUrl, renderExchangeLogo } from '../utils/formatters.js';

export class TableEmaManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = [];
    this.searchQuery = '';
    this.directionFilter = 'above'; // 'above' (pump por defecto) | 'all' | 'below'
    this.sortField = 'change24h';
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

      if (valA === undefined || valA === null) valA = 0;
      if (valB === undefined || valB === null) valB = 0;

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
          <p>No se encontraron pares con distancia a la EMA 3 superior al umbral configurado.</p>
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
              <th class="col-exchange">Exchange</th>
              <th class="sortable" id="sort-ema-symbol">Par ${sortIcon('symbol')}</th>
              <th class="sortable" id="sort-ema-change24h">Cambio 24h ${sortIcon('change24h')}</th>
              <th class="sortable" id="sort-ema-max3">Dist. EMA 3 (30m) ${sortIcon('maxDist3')}</th>
              <th>Dist. EMA 3 (1h)</th>
              <th class="col-status">Tendencia / Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;

    filtered.forEach(item => {
      const exchangeBadge = renderExchangeLogo(item.exchange);
      const cleanSymbol = item.symbol.replace('USDT', '');
      const change24hClass = item.change24h >= 0 ? 'text-green' : 'text-red';

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
          <td class="col-exchange">${exchangeBadge}</td>
          <td>
            <span class="symbol-name">${cleanSymbol}</span>
          </td>
          <td class="font-mono font-bold ${change24hClass}">${formatPercent(item.change24h)}</td>
          <td>${renderDistBadge(item.distEma3_30m)}</td>
          <td>${renderDistBadge(item.distEma3_1h)}</td>
          <td class="col-status">${statusBadge}</td>
          <td class="text-right">
            <div class="action-buttons">
              <a href="${getExchangeUrl(item.exchange, item.symbol)}" target="_blank" class="btn-icon btn-exchange" title="Abrir en Exchange">
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
    bindSort('sort-ema-change24h', 'change24h');
    bindSort('sort-ema-max3', 'maxDist3');

    if (window.lucide) window.lucide.createIcons();
  }
}
