/**
 * Manejador de controles de UI, barra de progreso y modal de ajustes.
 */

export class ControlsManager {
  constructor(screenerEngine) {
    this.engine = screenerEngine;
    this.initDOM();
    this.loadSavedSettings();
    this.bindEvents();
  }

  initDOM() {
    this.btnScan = document.getElementById('btn-scan');
    this.btnSettings = document.getElementById('btn-settings');
    this.modalSettings = document.getElementById('modal-settings');
    this.btnCloseModal = document.getElementById('btn-close-modal');
    this.btnSaveSettings = document.getElementById('btn-save-settings');

    this.scanProgressIndicator = document.getElementById('scan-progress-indicator');
    this.progressCircleFill = document.getElementById('progress-circle-fill');
    this.progressMiniText = document.getElementById('progress-mini-text');

    this.timerCountdown = document.getElementById('timer-countdown');
    this.badgeTotalAnalyzed = document.getElementById('stat-total-analyzed');
    this.badgeRsiCount = document.getElementById('stat-rsi-count');
    this.badgeEmaCount = document.getElementById('stat-ema-count');
    this.lastUpdatedText = document.getElementById('last-updated-text');

    // Elementos de estado de API y banners
    this.apiStatusDot = document.getElementById('api-status-dot');
    this.apiStatusText = document.getElementById('api-status-text');
    this.apiErrorBanner = document.getElementById('api-error-banner');
    this.apiErrorTitle = document.getElementById('api-error-title');
    this.apiErrorMessage = document.getElementById('api-error-message');
    this.btnRetryScan = document.getElementById('btn-retry-scan');

    // Elementos de formulario en modal
    this.inputRefresh = document.getElementById('setting-refresh');
    this.selectExchange = document.getElementById('setting-exchange');
    this.selectLimit = document.getElementById('setting-limit');
    this.inputRsiThreshold = document.getElementById('setting-rsi-threshold');
    this.selectRsiTimeframe = document.getElementById('setting-rsi-tf');
    this.inputEma3Threshold = document.getElementById('setting-ema3-threshold');
    this.selectEmaDirection = document.getElementById('filter-ema-direction');
    this.toggleEma10 = document.getElementById('setting-ema10-toggle');
    this.inputEma10Threshold = document.getElementById('setting-ema10-threshold');
    this.toggleExcludeStocks = document.getElementById('setting-exclude-stocks');
  }

  loadSavedSettings() {
    const saved = localStorage.getItem('crypto_screener_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.engine.updateSettings(parsed);
      } catch (e) {
        console.error('Error al cargar ajustes guardados:', e);
      }
    }
    this.syncFormValues();
  }

  syncFormValues() {
    const s = this.engine.settings;
    if (this.inputRefresh) this.inputRefresh.value = s.autoRefreshInterval;
    if (this.selectExchange) this.selectExchange.value = s.exchange;
    if (this.selectLimit) this.selectLimit.value = s.limitPairs;
    if (this.inputRsiThreshold) this.inputRsiThreshold.value = s.rsiThreshold;
    if (this.selectRsiTimeframe) this.selectRsiTimeframe.value = s.rsiTimeframe;
    if (this.inputEma3Threshold) this.inputEma3Threshold.value = s.ema3DistanceThreshold;
    if (this.selectEmaDirection && s.emaDirection) this.selectEmaDirection.value = s.emaDirection;
    if (this.toggleEma10) this.toggleEma10.checked = s.ema10FilterActive;
    if (this.inputEma10Threshold) this.inputEma10Threshold.value = s.ema10DistanceThreshold;
    if (this.toggleExcludeStocks) this.toggleExcludeStocks.checked = s.excludeTokenizedStocks !== false;
  }

  bindEvents() {
    // Botón de escaneo manual
    if (this.btnScan) {
      this.btnScan.addEventListener('click', () => {
        this.hideErrorBanner();
        this.engine.runScan();
      });
    }

    // Botón de reintento en banner de error
    if (this.btnRetryScan) {
      this.btnRetryScan.addEventListener('click', () => {
        this.hideErrorBanner();
        this.engine.runScan();
      });
    }

    // Modal de ajustes
    if (this.btnSettings) {
      this.btnSettings.addEventListener('click', () => {
        this.syncFormValues();
        this.modalSettings.classList.add('active');
      });
    }

    if (this.btnCloseModal) {
      this.btnCloseModal.addEventListener('click', () => {
        this.modalSettings.classList.remove('active');
      });
    }

    // Guardar ajustes
    if (this.btnSaveSettings) {
      this.btnSaveSettings.addEventListener('click', () => {
        const newSettings = {
          autoRefreshInterval: parseInt(this.inputRefresh.value) || 60,
          exchange: this.selectExchange.value,
          limitPairs: parseInt(this.selectLimit.value),
          rsiThreshold: parseFloat(this.inputRsiThreshold.value) || 70,
          rsiTimeframe: this.selectRsiTimeframe.value,
          ema3DistanceThreshold: parseFloat(this.inputEma3Threshold.value) || 2.0,
          ema10FilterActive: this.toggleEma10.checked,
          ema10DistanceThreshold: parseFloat(this.inputEma10Threshold.value) || 1.0,
          excludeTokenizedStocks: this.toggleExcludeStocks ? this.toggleExcludeStocks.checked : true,
          emaDirection: this.selectEmaDirection ? this.selectEmaDirection.value : 'above',
          soundAlerts: false
        };

        localStorage.setItem('crypto_screener_settings', JSON.stringify(newSettings));
        this.engine.updateSettings(newSettings);
        if (this.selectEmaDirection) {
          this.selectEmaDirection.dispatchEvent(new Event('change'));
        }
        this.modalSettings.classList.remove('active');

        // Reiniciar escaneo con los nuevos parámetros
        this.hideErrorBanner();
        this.engine.runScan();
      });
    }

    // Eventos del Screener Engine
    this.engine.on('onProgress', (p) => {
      this.hideErrorBanner();
      this.updateProgress(p.processed, p.total, p.pair);
    });

    this.engine.on('onComplete', (res) => {
      this.finishProgress();
      this.updateStats(res);
      this.hideErrorBanner();
    });

    this.engine.on('onError', (errMsg) => {
      this.finishProgress();
      this.showErrorBanner('Error durante el escaneo', errMsg);
      if (this.lastUpdatedText) {
        this.lastUpdatedText.innerHTML = `<span style="color: var(--accent-red)">❌ Error de red / API</span>`;
      }
    });

    this.engine.on('onCountdown', (seconds) => {
      if (this.timerCountdown) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        this.timerCountdown.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    });
  }

  showErrorBanner(title, message) {
    if (this.apiErrorBanner) {
      if (this.apiErrorTitle) this.apiErrorTitle.innerText = title;
      if (this.apiErrorMessage) this.apiErrorMessage.innerText = message;
      this.apiErrorBanner.style.display = 'flex';
      if (window.lucide) window.lucide.createIcons();
    }
  }

  hideErrorBanner() {
    if (this.apiErrorBanner) {
      this.apiErrorBanner.style.display = 'none';
    }
  }

  updateApiStatusBadge(health) {
    if (!this.apiStatusText || !this.apiStatusDot) return;

    const bOk = health.binance && health.binance.ok;
    const yOk = health.bybit && health.bybit.ok;

    if (bOk && yOk) {
      this.apiStatusDot.className = 'api-status-dot';
      this.apiStatusText.innerText = 'Binance & Bybit Online';
    } else if (bOk || yOk) {
      this.apiStatusDot.className = 'api-status-dot warning';
      const okName = bOk ? 'Binance' : 'Bybit';
      const errName = bOk ? 'Bybit' : 'Binance';
      this.apiStatusText.innerText = `${okName} OK (${errName} caído/CORS)`;
    } else {
      this.apiStatusDot.className = 'api-status-dot error';
      this.apiStatusText.innerText = 'Error de API / CORS';
    }
  }

  updateProgress(processed, total, currentPair) {
    if (!this.scanProgressIndicator) return;
    this.scanProgressIndicator.style.display = 'flex';

    const pct = Math.round((processed / total) * 100);
    const circumference = 56.55;
    const offset = circumference - (pct / 100) * circumference;

    if (this.progressCircleFill) {
      this.progressCircleFill.style.strokeDashoffset = offset;
    }
    if (this.progressMiniText) {
      this.progressMiniText.innerText = `${pct}%`;
    }
    this.scanProgressIndicator.title = `Analizando mercado: ${processed}/${total} ${currentPair ? `(${currentPair})` : ''}`;

    if (this.btnScan) {
      this.btnScan.disabled = true;
      this.btnScan.innerHTML = `<i data-lucide="loader-2" class="spin"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  finishProgress() {
    if (this.scanProgressIndicator) {
      setTimeout(() => {
        this.scanProgressIndicator.style.display = 'none';
      }, 600);
    }
    if (this.btnScan) {
      this.btnScan.disabled = false;
      this.btnScan.innerHTML = `<i data-lucide="refresh-cw"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  updateStats(res) {
    if (this.badgeTotalAnalyzed) this.badgeTotalAnalyzed.innerText = res.totalAnalyzed;
    if (this.badgeRsiCount) this.badgeRsiCount.innerText = res.rsiOverbought.length;
    if (this.badgeEmaCount) this.badgeEmaCount.innerText = res.emaDistance.length;

    if (this.lastUpdatedText && res.timestamp) {
      const timeStr = res.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      this.lastUpdatedText.innerText = `Última actualización: ${timeStr}`;
    }
  }
}
