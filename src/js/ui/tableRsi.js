import { formatPercent, getExchangeUrl, getTradingViewUrl } from '../utils/formatters.js';

export class TableRsiManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = [];
    this.searchQuery = '';
    this.sortField = 'rsi';
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

  getFilteredData() {
    let result = [...this.data];

    if (this.searchQuery) {
      result = result.filter(item => item.symbol.toLowerCase().includes(this.searchQuery));
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
          <i data-lucide="shield-alert" class="empty-icon"></i>
          <p>No se encontraron pares en sobrecompra que coincidan con el filtro actual.</p>
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
              <th class="sortable" id="sort-rsi-symbol">Par ${sortIcon('symbol')}</th>
              <th class="sortable" id="sort-rsi-change1h">Cambio 1h ${sortIcon('change1h')}</th>
              <th class="sortable" id="sort-rsi-change24h">Cambio 24h ${sortIcon('change24h')}</th>
              <th class="sortable" id="sort-rsi-val">RSI (${filtered[0]?.rsiTimeframe || '5m'}) ${sortIcon('rsi')}</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;

    filtered.forEach(item => {
      const exchangeBadge = item.exchange === 'binance' 
        ? `<span class="badge badge-binance"><i data-lucide="box"></i> Binance</span>`
        : `<span class="badge badge-bybit"><i data-lucide="zap"></i> Bybit</span>`;

      const change1hClass = (item.change1h || 0) >= 0 ? 'text-green' : 'text-red';
      const change24hClass = item.change24h >= 0 ? 'text-green' : 'text-red';
      const rsiClass = item.rsi >= 80 ? 'badge-rsi-extreme' : 'badge-rsi-high';

      html += `
        <tr>
          <td>${exchangeBadge}</td>
          <td>
            <div class="symbol-cell">
              <span class="symbol-name">${item.symbol}</span>
              <span class="badge-sub">PERP</span>
            </div>
          </td>
          <td class="font-mono font-bold ${change1hClass}">${formatPercent(item.change1h)}</td>
          <td class="font-mono ${change24hClass}">${formatPercent(item.change24h)}</td>
          <td>
            <span class="badge ${rsiClass} font-mono font-bold">
              🔥 ${item.rsi}
            </span>
          </td>
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

    // Listeners de ordenamiento
    const bindSort = (id, field) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => this.handleSort(field));
    };

    bindSort('sort-rsi-symbol', 'symbol');
    bindSort('sort-rsi-change1h', 'change1h');
    bindSort('sort-rsi-change24h', 'change24h');
    bindSort('sort-rsi-val', 'rsi');

    if (window.lucide) window.lucide.createIcons();
  }
}
