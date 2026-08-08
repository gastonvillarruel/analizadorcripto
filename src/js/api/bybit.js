/**
 * Cliente API REST para Bybit Linear Perpetuals (v5 API)
 */

const BASE_URL = 'https://api.bybit.com';

/**
 * Mapeo de intervalos de tiempo para Bybit V5 API
 */
const INTERVAL_MAP = {
  '1m': '1',
  '3m': '3',
  '5m': '5',
  '15m': '15',
  '30m': '30',
  '1h': '60',
  '4h': '240'
};

export let lastBybitError = null;

/**
 * Verifica la salud y latencia de la API de Bybit Linear V5.
 */
export async function checkBybitStatus() {
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/v5/market/time`);
    if (res.ok) {
      lastBybitError = null;
      return { ok: true, ping: Date.now() - start, message: 'Bybit Linear Online' };
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    const msg = err.message === 'Failed to fetch' ? 'Bloqueo de red / CORS' : err.message;
    lastBybitError = msg;
    return { ok: false, ping: 0, message: `Bybit: ${msg}` };
  }
}

/**
 * Obtiene los pares de futuros perpetuos USDT de Bybit ordenados por volumen 24h.
 * @returns {Promise<Array<{symbol: string, price: number, change24h: number, volume24h: number, exchange: string}>>}
 */
export async function getBybitSymbols() {
  try {
    const res = await fetch(`${BASE_URL}/v5/market/tickers?category=linear`);
    if (!res.ok) throw new Error(`Bybit HTTP error: ${res.status}`);
    const json = await res.json();

    if (json.retCode !== 0 || !json.result || !json.result.list) {
      throw new Error(`Bybit API Error Code: ${json.retCode}`);
    }

    lastBybitError = null;

    const usdtPairs = json.result.list
      .filter(item => item.symbol.endsWith('USDT'))
      .map(item => ({
        symbol: item.symbol,
        price: parseFloat(item.lastPrice),
        // price24hPcnt viene en decimal (ej. 0.035 -> 3.5%)
        change24h: parseFloat((parseFloat(item.price24hPcnt || 0) * 100).toFixed(2)),
        volume24h: parseFloat(item.turnover24h || 0),
        exchange: 'bybit'
      }))
      .sort((a, b) => b.volume24h - a.volume24h);

    return usdtPairs;
  } catch (err) {
    const msg = err.message === 'Failed to fetch' ? 'Error de red / CORS al conectar con api.bybit.com' : err.message;
    lastBybitError = msg;
    console.error('Error al obtener pares de Bybit:', msg);
    return [];
  }
}

/**
 * Obtiene velas históricas de Bybit en orden cronológico (antiguo -> reciente).
 * @param {string} symbol - Ejemplo: 'BTCUSDT'
 * @param {string} interval - Ejemplo: '5m', '30m', '1h'
 * @param {number} limit - Cantidad de velas (ej. 50)
 * @returns {Promise<number[]>} Array de precios de cierre
 */
export async function getBybitKlines(symbol, interval, limit = 50) {
  try {
    const bybitInterval = INTERVAL_MAP[interval] || '5';
    const res = await fetch(`${BASE_URL}/v5/market/kline?category=linear&symbol=${symbol}&interval=${bybitInterval}&limit=${limit}`);
    if (!res.ok) throw new Error(`Bybit Klines error: ${res.status}`);
    const json = await res.json();

    if (json.retCode !== 0 || !json.result || !json.result.list) {
      return [];
    }

    // Bybit retorna las velas en orden descendente (más reciente primero).
    // Revertimos para tener [antiguo ... reciente]
    const candlesDesc = json.result.list;
    const candlesAsc = [...candlesDesc].reverse();

    // Índice 4 es el precio de cierre 'close'
    const closes = candlesAsc.map(candle => parseFloat(candle[4]));
    return closes;
  } catch (err) {
    console.error(`Error al obtener klines de Bybit para ${symbol} (${interval}):`, err);
    return [];
  }
}
