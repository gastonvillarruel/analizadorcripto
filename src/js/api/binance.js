/**
 * Cliente API REST para Binance USDT-M Futures (fapi.binance.com)
 */

const BASE_URL = 'https://fapi.binance.com';

/**
 * Obtiene la lista de todos los pares de futuros perpetuos USDT ordenados por volumen 24h.
 * @returns {Promise<Array<{symbol: string, price: number, change24h: number, volume24h: number, exchange: string}>>}
 */
export async function getBinanceSymbols() {
  try {
    const res = await fetch(`${BASE_URL}/fapi/v1/ticker/24hr`);
    if (!res.ok) throw new Error(`Binance HTTP error: ${res.status}`);
    const data = await res.json();

    // Filtrar solo perpetuos terminados en USDT (excluir trimestrales con '_')
    const usdtPairs = data
      .filter(item => item.symbol.endsWith('USDT') && !item.symbol.includes('_'))
      .map(item => ({
        symbol: item.symbol,
        price: parseFloat(item.lastPrice),
        change24h: parseFloat(item.priceChangePercent),
        volume24h: parseFloat(item.quoteVolume),
        exchange: 'binance'
      }))
      .sort((a, b) => b.volume24h - a.volume24h);

    return usdtPairs;
  } catch (err) {
    console.error('Error al obtener pares de Binance:', err);
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
