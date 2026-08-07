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

    this.progressBar = document.getElementById('progress-bar');
    this.progressFill = document.getElementById('progress-fill');
    this.progressText = document.getElementById('progress-text');
    this.progressPair = document.getElementById('progress-pair');

    this.timerCountdown = document.getElementById('timer-countdown');
    this.badgeTotalAnalyzed = document.getElementById('stat-total-analyzed');
    this.badgeRsiCount = document.getElementById('stat-rsi-count');
    this.badgeEmaCount = document.getElementById('stat-ema-count');
    this.lastUpdatedText = document.getElementById('last-updated-text');

    // Elementos de formulario en modal
    this.inputRefresh = document.getElementById('setting-refresh');
    this.selectExchange = document.getElementById('setting-exchange');
    this.selectLimit = document.getElementById('setting-limit');
    this.inputRsiThreshold = document.getElementById('setting-rsi-threshold');
    this.selectRsiTimeframe = document.getElementById('setting-rsi-tf');
    this.inputEma3Threshold = document.getElementById('setting-ema3-threshold');
    this.toggleEma10 = document.getElementById('setting-ema10-toggle');
    this.inputEma10Threshold = document.getElementById('setting-ema10-threshold');
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
    if (this.toggleEma10) this.toggleEma10.checked = s.ema10FilterActive;
    if (this.inputEma10Threshold) this.inputEma10Threshold.value = s.ema10DistanceThreshold;
  }

  bindEvents() {
    // Botón de escaneo manual
    if (this.btnScan) {
      this.btnScan.addEventListener('click', () => {
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
          soundAlerts: false
        };

        localStorage.setItem('crypto_screener_settings', JSON.stringify(newSettings));
        this.engine.updateSettings(newSettings);
        this.modalSettings.classList.remove('active');

        // Reiniciar escaneo con los nuevos parámetros
        this.engine.runScan();
      });
    }

    // Eventos del Screener Engine
    this.engine.on('onProgress', (p) => {
      this.updateProgress(p.processed, p.total, p.pair);
    });

    this.engine.on('onComplete', (res) => {
      this.finishProgress();
      this.updateStats(res);
    });

    this.engine.on('onCountdown', (seconds) => {
      if (this.timerCountdown) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        this.timerCountdown.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    });
  }

  updateProgress(processed, total, currentPair) {
    if (!this.progressBar) return;
    this.progressBar.style.display = 'block';

    const pct = Math.round((processed / total) * 100);
    this.progressFill.style.width = `${pct}%`;
    this.progressText.innerText = `Analizando mercado: ${processed}/${total} pares (${pct}%)`;
    this.progressPair.innerText = currentPair || '';

    if (this.btnScan) {
      this.btnScan.disabled = true;
      this.btnScan.innerHTML = `<i data-lucide="loader-2" class="spin"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  finishProgress() {
    if (this.progressBar) {
      setTimeout(() => {
        this.progressBar.style.display = 'none';
      }, 800);
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
