import { formatPercent, getExchangeUrl, getTradingViewUrl, renderExchangeLogo } from '../utils/formatters.js';

export class TableRsiManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = [];
    this.highlightSymbols = new Set();
    this.searchQuery = '';
    this.sortField = 'change24h';
    this.sortAsc = false;
  }

  setData(data, highlightSymbols = new Set()) {
    this.data = data || [];
    this.highlightSymbols = highlightSymbols;
    this.render();
  }

  setSearchQuery(query) {
    this.searchQuery = (query || '').trim().toLowerCase();
    this.render();
  }

  getFilteredData() {
    let result = this.data.filter(item => item.rsi < 100);

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

    const badgeRsi = document.getElementById('stat-rsi-count');
    if (badgeRsi) {
      badgeRsi.innerText = filtered.length;
    }

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
              <th class="col-exchange">Exc</th>
              <th class="sortable" id="sort-rsi-symbol">Par ${sortIcon('symbol')}</th>
              <th class="sortable col-change1h" id="sort-rsi-change1h">1h ${sortIcon('change1h')}</th>
              <th class="sortable" id="sort-rsi-change24h">24h ${sortIcon('change24h')}</th>
              <th class="sortable col-rsi" id="sort-rsi-val">RSI (${filtered[0]?.rsiTimeframe || '5m'}) ${sortIcon('rsi')}</th>
              <th class="text-right">Ver</th>
            </tr>
          </thead>
          <tbody>
    `;

    filtered.forEach(item => {
      const exchangeBadge = renderExchangeLogo(item.exchange);
      const cleanSymbol = item.symbol.replace('USDT', '');

      const change1hClass = (item.change1h || 0) >= 0 ? 'text-green' : 'text-red';
      const change24hClass = item.change24h >= 0 ? 'text-green' : 'text-red';
      const rsiClass = item.rsi >= 80 ? 'badge-rsi-extreme' : 'badge-rsi-high';

      const symbolKey = `${item.symbol}_${item.exchange}`;
      const isConfluence = this.highlightSymbols.has(symbolKey) || this.highlightSymbols.has(item.symbol);
      const rowClass = isConfluence ? 'row-confluence' : '';
      const confluenceBadge = isConfluence 
        ? `<span class="badge badge-confluence" title="¡Par presente en RSI y EMA!"><i data-lucide="zap"></i></span>` 
        : '';

      html += `
        <tr class="${rowClass}">
          <td class="col-exchange">${exchangeBadge}</td>
          <td>
            <div class="symbol-wrapper">
              <span class="symbol-name">${cleanSymbol}</span>
              ${confluenceBadge}
            </div>
          </td>
          <td class="font-mono font-bold ${change1hClass} col-change1h">${formatPercent(item.change1h)}</td>
          <td class="font-mono font-bold ${change24hClass}">${formatPercent(item.change24h)}</td>
          <td class="col-rsi">
            <span class="badge ${rsiClass} font-mono font-bold">
              🔥 ${item.rsi}
            </span>
          </td>
          <td class="text-right">
            <div class="action-buttons">
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
