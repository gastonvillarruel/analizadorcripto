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

  // 2. Vincular resultados del escáner a las tablas
  engine.on('onComplete', (res) => {
    tableRsi.setData(res.rsiOverbought);
    tableEma.setData(res.emaDistance);
  });

  // 3. Manejo de Pestañas (Tabs)
  const tabRsi = document.getElementById('tab-rsi');
  const tabEma = document.getElementById('tab-ema');
  const contentRsi = document.getElementById('content-rsi');
  const contentEma = document.getElementById('content-ema');
  const emaDirectionWrapper = document.getElementById('ema-direction-wrapper');

  tabRsi.addEventListener('click', () => {
    tabRsi.classList.add('active');
    tabEma.classList.remove('active');
    contentRsi.classList.add('active');
    contentEma.classList.remove('active');
    emaDirectionWrapper.style.display = 'none';
  });

  tabEma.addEventListener('click', () => {
    tabEma.classList.add('active');
    tabRsi.classList.remove('active');
    contentEma.classList.add('active');
    contentRsi.classList.remove('active');
    emaDirectionWrapper.style.display = 'block';
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

  // 5. Filtro de dirección para la tabla EMA
  const filterEmaDir = document.getElementById('filter-ema-direction');
  if (filterEmaDir) {
    filterEmaDir.addEventListener('change', (e) => {
      tableEma.setDirectionFilter(e.target.value);
    });
  }

  // 6. Iniciar primer escaneo automático y temporizador
  engine.startAutoRefresh();
  engine.runScan();

  // 7. Renderizar iconos Lucide iniciales
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
