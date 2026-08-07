import { getBinanceSymbols, getBinanceKlines } from '../api/binance.js';
import { getBybitSymbols, getBybitKlines } from '../api/bybit.js';
import { calculateRSI, calculateEMA, calculateEmaDistance } from '../utils/indicators.js';

export class ScreenerEngine {
  constructor() {
    this.settings = {
      exchange: 'binance',        // 'binance' | 'all' | 'bybit'
      rsiThreshold: 70,           // RSI mayor a este valor (ej. 70)
      rsiTimeframe: '5m',         // Temporalidad RSI (default 5m)
      ema3DistanceThreshold: 2.0, // Distancia % mayor a este valor (default 2%)
      ema10FilterActive: false,   // Filtro adicional opcional para EMA 10
      ema10DistanceThreshold: 1.0,// Umbral % para EMA 10
      limitPairs: 200,            // Top N por volumen en 24h (50, 100, 200, 0=todos)
      autoRefreshInterval: 60,    // Segundos (60 = 1 min)
      soundAlerts: false
    };

    this.isScanning = false;
    this.timerId = null;
    this.countdownSeconds = 60;
    this.countdownTimerId = null;

    this.listeners = {
      onProgress: [],
      onComplete: [],
      onCountdown: [],
      onError: []
    };

    this.lastResults = {
      timestamp: null,
      rsiOverbought: [],
      emaDistance: [],
      totalAnalyzed: 0
    };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    if (newSettings.autoRefreshInterval !== undefined) {
      this.resetAutoRefreshTimer();
    }
  }

  startAutoRefresh() {
    this.resetAutoRefreshTimer();
  }

  stopAutoRefresh() {
    if (this.timerId) clearInterval(this.timerId);
    if (this.countdownTimerId) clearInterval(this.countdownTimerId);
    this.timerId = null;
    this.countdownTimerId = null;
  }

  resetAutoRefreshTimer() {
    this.stopAutoRefresh();
    this.countdownSeconds = parseInt(this.settings.autoRefreshInterval) || 60;
    this.emit('onCountdown', this.countdownSeconds);

    this.countdownTimerId = setInterval(() => {
      if (this.isScanning) return;
      this.countdownSeconds--;
      this.emit('onCountdown', this.countdownSeconds);
      if (this.countdownSeconds <= 0) {
        this.runScan();
      }
    }, 1000);
  }

  async runScan() {
    if (this.isScanning) return;
    this.isScanning = true;
    this.countdownSeconds = parseInt(this.settings.autoRefreshInterval) || 60;

    try {
      // 1. Obtener lista de símbolos según el exchange configurado
      let symbols = [];
      if (this.settings.exchange === 'all' || this.settings.exchange === 'binance') {
        const binanceList = await getBinanceSymbols();
        const limit = this.settings.limitPairs > 0 ? this.settings.limitPairs : binanceList.length;
        symbols.push(...binanceList.slice(0, limit));
      }
      if (this.settings.exchange === 'all' || this.settings.exchange === 'bybit') {
        const bybitList = await getBybitSymbols();
        const limit = this.settings.limitPairs > 0 ? this.settings.limitPairs : bybitList.length;
        symbols.push(...bybitList.slice(0, limit));
      }

      const totalSymbols = symbols.length;
      if (totalSymbols === 0) {
        throw new Error('No se pudieron obtener pares de futuros.');
      }

      this.emit('onProgress', { processed: 0, total: totalSymbols, pair: 'Iniciando escaneo...' });

      const rsiOverboughtResults = [];
      const emaDistanceResults = [];

      let processedCount = 0;
      const CONCURRENCY = 8; // Máximo 8 descargas simultáneas para evitar rate limits

      const processPair = async (pairObj) => {
        try {
          const fetchKlines = pairObj.exchange === 'binance' ? getBinanceKlines : getBybitKlines;

          // Descargar klines requeridos en paralelo
          const [rsiKlines, klines30m, klines1h] = await Promise.all([
            fetchKlines(pairObj.symbol, this.settings.rsiTimeframe, 40),
            fetchKlines(pairObj.symbol, '30m', 40),
            fetchKlines(pairObj.symbol, '1h', 40)
          ]);

          const currentPrice = pairObj.price;

          // Cambio de precio 1h (%)
          let change1h = 0;
          if (klines1h && klines1h.length >= 2) {
            const price1hAgo = klines1h[klines1h.length - 2];
            if (price1hAgo > 0) {
              change1h = parseFloat((((currentPrice - price1hAgo) / price1hAgo) * 100).toFixed(2));
            }
          }

          // A) Cálculo RSI
          const rsiVal = calculateRSI(rsiKlines, 14);

          if (rsiVal !== null && rsiVal >= this.settings.rsiThreshold && rsiVal < 100) {
            rsiOverboughtResults.push({
              ...pairObj,
              change1h,
              rsi: rsiVal,
              rsiTimeframe: this.settings.rsiTimeframe
            });
          }

          // B) Cálculo EMA 3 y EMA 10 en 30m y 1h
          const ema3_30m = calculateEMA(klines30m, 3);
          const ema10_30m = calculateEMA(klines30m, 10);

          const ema3_1h = calculateEMA(klines1h, 3);
          const ema10_1h = calculateEMA(klines1h, 10);

          const distEma3_30m = calculateEmaDistance(currentPrice, ema3_30m);
          const distEma10_30m = calculateEmaDistance(currentPrice, ema10_30m);

          const distEma3_1h = calculateEmaDistance(currentPrice, ema3_1h);
          const distEma10_1h = calculateEmaDistance(currentPrice, ema10_1h);

          // Verificar si cumple la condición de Distancia a EMA 3 (> threshold en 30m O 1h)
          const meetsEma3Condition =
            distEma3_30m.absDistancePct >= this.settings.ema3DistanceThreshold ||
            distEma3_1h.absDistancePct >= this.settings.ema3DistanceThreshold;

          // Verificar filtro opcional de EMA 10 si está activo
          let meetsEma10Condition = true;
          if (this.settings.ema10FilterActive) {
            meetsEma10Condition =
              distEma10_30m.absDistancePct >= this.settings.ema10DistanceThreshold ||
              distEma10_1h.absDistancePct >= this.settings.ema10DistanceThreshold;
          }

          if (meetsEma3Condition && meetsEma10Condition && (rsiVal === null || rsiVal < 100)) {
            emaDistanceResults.push({
              ...pairObj,
              rsi: rsiVal,
              ema3_30m,
              distEma3_30m,
              ema10_30m,
              distEma10_30m,
              ema3_1h,
              distEma3_1h,
              ema10_1h,
              distEma10_1h,
              targetEma3Threshold: this.settings.ema3DistanceThreshold,
              // Distancia máxima encontrada para ordenamiento rápido
              maxDist3: Math.max(distEma3_30m.absDistancePct, distEma3_1h.absDistancePct),
              maxDist10: Math.max(distEma10_30m.absDistancePct, distEma10_1h.absDistancePct)
            });
          }
        } catch (err) {
          console.warn(`Error al analizar par ${pairObj.symbol}:`, err);
        } finally {
          processedCount++;
          this.emit('onProgress', {
            processed: processedCount,
            total: totalSymbols,
            pair: pairObj.symbol
          });
        }
      };

      // Throttling pool
      const queue = [...symbols];
      const workers = Array(CONCURRENCY).fill(null).map(async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (item) await processPair(item);
        }
      });

      await Promise.all(workers);

      // Ordenar resultados por defecto según el cambio en 24h (de mayor a menor):
      rsiOverboughtResults.sort((a, b) => b.change24h - a.change24h);
      emaDistanceResults.sort((a, b) => b.change24h - a.change24h);

      this.lastResults = {
        timestamp: new Date(),
        rsiOverbought: rsiOverboughtResults,
        emaDistance: emaDistanceResults,
        totalAnalyzed: totalSymbols
      };

      this.emit('onComplete', this.lastResults);
    } catch (err) {
      console.error('Error durante el escaneo:', err);
      this.emit('onError', err.message);
    } finally {
      this.isScanning = false;
      this.resetAutoRefreshTimer();
    }
  }
}
