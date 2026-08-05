/**
 * Indicadores cuantitativos de análisis técnico: RSI y EMA.
 */

/**
 * Calcula el RSI (Relative Strength Index) con el método de suavizado de Wilder.
 * @param {number[]} prices - Array de precios de cierre ordenados del más antiguo al más reciente.
 * @param {number} period - Período del RSI (por defecto 14).
 * @returns {number|null} Valor del RSI (0 - 100) o null si no hay suficientes datos.
 */
export function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  // Primer promedio simple para los primeros 'period' cambios
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Suavizado de Wilder para los períodos restantes
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return parseFloat(rsi.toFixed(2));
}

/**
 * Calcula la Media Móvil Exponencial (EMA).
 * @param {number[]} prices - Array de precios de cierre (de antiguo a reciente).
 * @param {number} period - Período de la EMA (ej. 3, 10).
 * @returns {number|null} Valor actual de la EMA o null si faltan datos.
 */
export function calculateEMA(prices, period) {
  if (!prices || prices.length < period) return null;

  const k = 2 / (period + 1);

  // EMA inicial = SMA del primer bloque
  let ema = 0;
  for (let i = 0; i < period; i++) {
    ema += prices[i];
  }
  ema = ema / period;

  // Iterar hasta el precio más reciente
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * k + ema;
  }

  return ema;
}

/**
 * Calcula la distancia porcentual entre el precio actual y la EMA.
 * @param {number} currentPrice 
 * @param {number} emaValue 
 * @returns {{ distancePct: number, absDistancePct: number, direction: 'above'|'below' }}
 */
export function calculateEmaDistance(currentPrice, emaValue) {
  if (!currentPrice || !emaValue || emaValue === 0) {
    return { distancePct: 0, absDistancePct: 0, direction: 'above' };
  }

  const distancePct = ((currentPrice - emaValue) / emaValue) * 100;
  const absDistancePct = Math.abs(distancePct);
  const direction = distancePct >= 0 ? 'above' : 'below';

  return {
    distancePct: parseFloat(distancePct.toFixed(2)),
    absDistancePct: parseFloat(absDistancePct.toFixed(2)),
    direction
  };
}
