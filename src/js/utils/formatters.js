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
 * Genera la URL del gráfico en TradingView.
 * @param {'binance'|'bybit'} exchange 
 * @param {string} symbol 
 * @returns {string}
 */
export function getTradingViewUrl(exchange, symbol) {
  const prefix = exchange === 'binance' ? 'BINANCE' : 'BYBIT';
  // En TradingView los futuros de Binance llevan suffix .P (ej. BTCUSDT.P)
  const tvSymbol = exchange === 'binance' ? `${symbol}.P` : symbol;
  return `https://www.tradingview.com/chart/?symbol=${prefix}:${tvSymbol}`;
}
