import { ScreenerEngine } from './js/engine/screener.js';
import { TableRsiManager } from './js/ui/tableRsi.js';
import { TableEmaManager } from './js/ui/tableEma.js';
import { ControlsManager } from './js/ui/controls.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar Motor y UI Managers
  const engine = new ScreenerEngine();
  const tableRsi = new TableRsiManager('container-rsi-table');
  const tableEma = new TableEmaManager('container-ema-table');
  const controls = new ControlsManager(engine);

  // 2. Vincular resultados del escáner a las tablas y calcular coincidencia (confluencia)
  engine.on('onComplete', (res) => {
    const rsiList = (res.rsiOverbought || []).filter(item => item.rsi !== null && item.rsi !== undefined && item.rsi < 99.99);
    const emaList = (res.emaDistance || []).filter(item => item.rsi !== null && item.rsi !== undefined && item.rsi < 99.99);

    const rsiKeys = new Set(rsiList.map(i => `${i.symbol}_${i.exchange}`));
    const emaKeys = new Set(emaList.map(i => `${i.symbol}_${i.exchange}`));

    const commonKeys = new Set([...rsiKeys].filter(key => emaKeys.has(key)));

    tableRsi.setData(rsiList, commonKeys);
    tableEma.setData(emaList, commonKeys);
  });

  // 3. Manejo de Pestañas (Tabs)
  const tabRsi = document.getElementById('tab-rsi');
  const tabEma = document.getElementById('tab-ema');
  const contentRsi = document.getElementById('content-rsi');
  const contentEma = document.getElementById('content-ema');

  tabRsi.addEventListener('click', () => {
    tabRsi.classList.add('active');
    tabEma.classList.remove('active');
    contentRsi.classList.add('active');
    contentEma.classList.remove('active');
  });

  tabEma.addEventListener('click', () => {
    tabEma.classList.add('active');
    tabRsi.classList.remove('active');
    contentEma.classList.add('active');
    contentRsi.classList.remove('active');
  });

  // 4. Búsqueda en tiempo real
  const searchInput = document.getElementById('search-symbol');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      tableRsi.setSearchQuery(query);
      tableEma.setSearchQuery(query);
    });
  }

  // 5. Filtro de dirección para la tabla EMA (desde Configuración)
  const filterEmaDir = document.getElementById('filter-ema-direction');
  if (filterEmaDir) {
    tableEma.setDirectionFilter(filterEmaDir.value);
    filterEmaDir.addEventListener('change', (e) => {
      tableEma.setDirectionFilter(e.target.value);
    });
  }

  // 6. Verificación de Salud de APIs y primer escaneo
  const refreshApiHealth = async () => {
    try {
      const health = await engine.checkApiHealth();
      controls.updateApiStatusBadge(health);
    } catch (e) {
      console.warn('Error al verificar APIs:', e);
    }
  };

  refreshApiHealth();

  engine.on('onComplete', () => {
    refreshApiHealth();
  });

  engine.on('onError', () => {
    refreshApiHealth();
  });

  engine.startAutoRefresh();
  engine.runScan();

  // 7. Renderizar iconos Lucide iniciales
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
