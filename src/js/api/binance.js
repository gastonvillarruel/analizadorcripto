/**
 * Cliente API REST para Binance USDT-M Futures (fapi.binance.com)
 */

const BASE_URL = 'https://fapi.binance.com';

export let lastBinanceError = null;

/**
 * Verfica la salud y latencia de la API de Binance Futures.
 */
export async function checkBinanceStatus() {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/fapi/v1/ping`);
    if (res.ok) {
      lastBinanceError = null;
      return { ok: true, ping: Date.now() - start, message: 'Binance Futures Online' };
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    const msg = err.message === 'Failed to fetch' ? 'Bloqueo de red / CORS' : err.message;
    lastBinanceError = msg;
    return { ok: false, ping: 0, message: `Binance: ${msg}` };
  }
}

let binanceExchangeInfoCache = null;

async function getBinanceExchangeInfoMap() {
  if (binanceExchangeInfoCache) return binanceExchangeInfoCache;
  try {
    const res = await fetch(`${BASE_URL}/fapi/v1/exchangeInfo`);
    if (res.ok) {
      const data = await res.json();
      const map = {};
      (data.symbols || []).forEach(s => {
        map[s.symbol] = s.underlyingType || 'COIN';
      });
      binanceExchangeInfoCache = map;
      return map;
    }
  } catch (e) {
    console.warn('No se pudo cargar exchangeInfo de Binance para metadatos:', e);
  }
  return {};
}

/**
 * Obtiene la lista de todos los pares de futuros perpetuos USDT ordenados por volumen 24h.
 * @returns {Promise<Array<{symbol: string, price: number, change24h: number, volume24h: number, exchange: string, underlyingType?: string}>>}
 */
export async function getBinanceSymbols() {
  try {
    const [res, infoMap] = await Promise.all([
      fetch(`${BASE_URL}/fapi/v1/ticker/24hr`),
      getBinanceExchangeInfoMap()
    ]);
    if (!res.ok) throw new Error(`Binance HTTP ${res.status}`);
    const data = await res.json();
    lastBinanceError = null;

    // Filtrar solo perpetuos terminados en USDT (excluir trimestrales con '_')
    const usdtPairs = data
      .filter(item => item.symbol.endsWith('USDT') && !item.symbol.includes('_'))
      .map(item => ({
        symbol: item.symbol,
        price: parseFloat(item.lastPrice),
        change24h: parseFloat(item.priceChangePercent),
        volume24h: parseFloat(item.quoteVolume),
        exchange: 'binance',
        underlyingType: infoMap[item.symbol] || 'COIN'
      }))
      .sort((a, b) => b.volume24h - a.volume24h);

    return usdtPairs;
  } catch (err) {
    const msg = err.message === 'Failed to fetch' ? 'Error de red / CORS al conectar con fapi.binance.com' : err.message;
    lastBinanceError = msg;
    console.error('Error al obtener pares de Binance:', msg);
    return [];
  }
}

/**
 * Obtiene las velas históricas (klines) para un par y temporalidad específicos.
 * @param {string} symbol - Ejemplo: 'BTCUSDT'
 * @param {string} interval - Ejemplo: '5m', '30m', '1h'
 * @param {number} limit - Número de velas (ej. 40)
 * @returns {Promise<number[]>} Array de precios de cierre (de más antiguo a más reciente)
 */
export async function getBinanceKlines(symbol, interval, limit = 50) {
  try {
    const res = await fetch(`${BASE_URL}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
    if (!res.ok) throw new Error(`Binance Klines error: ${res.status}`);
    const data = await res.json();
    // data structure: [ openTime, open, high, low, close, volume, ... ]
    const closes = data.map(candle => parseFloat(candle[4]));
    return closes;
  } catch (err) {
    console.error(`Error al obtener klines de Binance para ${symbol} (${interval}):`, err);
    return [];
  }
}
