/**
 * Módulo de detección y filtrado de acciones tokenizadas y activos TradFi.
 */

export const TOKENIZED_STOCKS = new Set([
  'TSLA', 'PANW', 'AAPL', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOG', 'GOOGL',
  'NFLX', 'COIN', 'PLTR', 'AMD', 'INTC', 'BABA', 'DIS', 'HOOD', 'MSTR',
  'SPY', 'QQQ', 'TLT', 'GLD', 'SLV', 'USO', 'SPX', 'NDX', 'DJI', 'IXIC',
  'GSPC', 'BRK', 'BRKB', 'PYPL', 'SQ', 'UBER', 'LYFT', 'SNOW', 'CRWD',
  'NET', 'ZM', 'SHOP', 'RBLX', 'SNAP', 'PINS', 'TSM', 'NIO', 'XPEV',
  'LI', 'BAC', 'JPM', 'GS', 'MS', 'C', 'WFC', 'V', 'MA', 'BA', 'CAT',
  'DE', 'GE', 'GM', 'F', 'JNJ', 'PFE', 'MRNA', 'BNTX', 'LLY', 'UNH',
  'WMT', 'TGT', 'COST', 'HD', 'LOW', 'MCD', 'SBUX', 'KO', 'PEP', 'NKE',
  'XOM', 'CVX'
]);

/**
 * Determina si un símbolo corresponde a una acción tokenizada o activo TradFi.
 * @param {string} symbol - Ejemplo: 'TSLAUSDT', 'PANWUSDT', 'BTCUSDT'
 * @returns {boolean} true si es acción tokenizada / TradFi, false en caso contrario.
 */
export function isTokenizedStock(symbol) {
  if (!symbol || typeof symbol !== 'string') return false;

  const baseAsset = symbol
    .toUpperCase()
    .replace(/(USDT|USDC|PERP|_USDT)$/, '');

  return TOKENIZED_STOCKS.has(baseAsset);
}
