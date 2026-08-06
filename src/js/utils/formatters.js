/**
 * Utilidades de formateo para precios, porcentajes y enlaces directos.
 */

/**
 * Formatea un precio con precisión inteligente según su magnitud.
 * @param {number} price 
 * @returns {string}
 */
export function formatPrice(price) {
  if (price === null || price === undefined || isNaN(price)) return '-';
  const num = Number(price);

  if (num >= 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (num >= 1) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  } else if (num >= 0.0001) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
  } else {
    return num.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
  }
}

/**
 * Formatea volumen de 24h a formato abreviado K, M, B.
 * @param {number} volume 
 * @returns {string}
 */
export function formatVolume(volume) {
  if (!volume) return '$0';
  const num = Number(volume);
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

/**
 * Formatea porcentajes con signo + o -.
 * @param {number} pct 
 * @returns {string}
 */
export function formatPercent(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return '0.00%';
  const num = Number(pct);
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

/**
 * Genera la URL oficial de trading según el Exchange.
 * @param {'binance'|'bybit'} exchange 
 * @param {string} symbol 
 * @returns {string}
 */
export function getExchangeUrl(exchange, symbol) {
  if (exchange === 'binance') {
    // Ejemplo: BTCUSDT -> https://www.binance.com/es/futures/BTCUSDT
    return `https://www.binance.com/es/futures/${symbol}`;
  } else {
    // Ejemplo: BTCUSDT -> https://www.bybit.com/trade/usdt/BTCUSDT
    return `https://www.bybit.com/trade/usdt/${symbol}`;
  }
}

/**
 * Genera la URL del gráfico en TradingView en español (es.tradingview.com).
 * @param {'binance'|'bybit'} exchange 
 * @param {string} symbol 
 * @returns {string}
 */
export function getTradingViewUrl(exchange, symbol) {
  const prefix = exchange === 'binance' ? 'BINANCE' : 'BYBIT';
  // En TradingView los futuros de Binance llevan suffix .P (ej. BTCUSDT.P)
  const tvSymbol = exchange === 'binance' ? `${symbol}.P` : symbol;
  return `https://es.tradingview.com/chart/?symbol=${prefix}:${tvSymbol}`;
}

/**
 * Genera el marcado HTML vectorial con el logo oficial del Exchange.
 * @param {'binance'|'bybit'} exchange 
 * @returns {string}
 */
export function renderExchangeLogo(exchange) {
  if (exchange === 'binance') {
    return `<span class="exchange-logo-badge binance-logo" title="Binance Futures">
      <svg viewBox="0 0 32 32" width="20" height="20">
        <circle cx="16" cy="16" r="16" fill="#F0B90B"/>
        <path fill="#000" d="M12.11 12.12l3.89-3.89 3.89 3.89 2.45-2.45L16 3.34l-6.34 6.33 2.45 2.45zM6.34 16l2.45-2.45L11.24 16l-2.45 2.45L6.34 16zm5.77 3.88l3.89 3.89 3.89-3.89 2.45 2.45L16 28.66l-6.34-6.33 2.45-2.45zm9.55-3.88l2.45-2.45L26.56 16l-2.45 2.45-2.45-2.45zm-5.66 0l2.45-2.45L16 11.1l-2.45 2.45 2.45 2.45z"/>
      </svg>
    </span>`;
  }
  return `<span class="exchange-logo-badge bybit-logo" title="Bybit Linear">
    <svg viewBox="0 0 32 32" width="20" height="20">
      <circle cx="16" cy="16" r="16" fill="#17181E"/>
      <path fill="#F7A600" d="M9 8h5.5c2.2 0 4 1.3 4 3.3 0 1.3-.7 2.3-1.8 2.8 1.4.4 2.3 1.6 2.3 3.1 0 2.2-1.8 3.8-4.2 3.8H9V8zm3.5 5.2h1.5c.9 0 1.5-.6 1.5-1.4s-.6-1.4-1.5-1.4h-1.5v2.8zm0 5.2h1.6c1 0 1.7-.7 1.7-1.5s-.7-1.5-1.7-1.5h-1.6v3z"/>
    </svg>
  </span>`;
}
