/**
 * Módulo de detección y filtrado automático de acciones tokenizadas,
 * futuros pre-market de empresas y activos TradFi (índices, commodities).
 */

export const TOKENIZED_STOCKS = new Set([
  'AAL', 'AAOI', 'AAPL', 'ADBE', 'AEHR', 'ALAB', 'ALL', 'AMAT', 'AMC', 'AMD',
  'AMDSTOCK', 'AMGN', 'AMZN', 'ANTHROPIC', 'APLD', 'APP', 'APPSTOCK', 'ARKK',
  'ARM', 'ASML', 'ASTS', 'AVGO', 'AXTI', 'BABA', 'BAC', 'BBX', 'BE', 'BIIB',
  'BITO', 'BMNR', 'BNC', 'BOT', 'BRK', 'BRKB', 'BSP', 'BTCDOM', 'BX', 'BZ',
  'CAT', 'CATSTOCK', 'CBRS', 'CIEN', 'CIFR', 'CL', 'CLSK', 'COHR', 'COIN',
  'COPPER', 'COST', 'CRCL', 'CRDO', 'CRM', 'CRWD', 'CRWV', 'CSCO', 'CSOPSAMSUNG2L',
  'CSOPSKHYNIX2L', 'CXMT', 'DEFI', 'DELL', 'DIS', 'DKNG', 'DJI', 'DJT', 'DRAM',
  'EBAY', 'ENPH', 'EWJ', 'EWT', 'EWY', 'EWZ', 'FCEL', 'FLEX', 'FLNC', 'FLY',
  'FSLR', 'FWDI', 'GDX', 'GE', 'GEV', 'GIGADEV', 'GIGADEVICE', 'GILD', 'GLD',
  'GLW', 'GME', 'GMESTOCK', 'GOOG', 'GOOGL', 'GSPC', 'GS', 'HD', 'HIMS',
  'HK0700', 'HK1810', 'HOOD', 'HPE', 'HYUNDAI', 'IBM', 'INTC', 'INTW', 'IONQ',
  'IREN', 'IWM', 'IXIC', 'JNJ', 'JPM', 'KLAC', 'KO', 'KORU', 'KSTR', 'KUAISHOU',
  'LCID', 'LITE', 'LLY', 'LRCX', 'MA', 'MARA', 'MCD', 'MEITUAN', 'META',
  'MINIMAX', 'MO', 'MRNA', 'MRVL', 'MSFT', 'MSTR', 'MU', 'MUU', 'MVLL',
  'NATGAS', 'NBIS', 'NDX', 'NET', 'NFLX', 'NIO', 'NKE', 'NKLA', 'NOK', 'NOKIA',
  'NOW', 'NVDA', 'NVDL', 'NVO', 'ONDS', 'OPENAI', 'ORCL', 'PANW', 'PATH',
  'PAYP', 'PENG', 'PFE', 'PINS', 'PLTR', 'PLUG', 'PENN', 'POPMART', 'PYPL',
  'QCOM', 'QNTX', 'QQQ', 'QS', 'RBLX', 'RDDT', 'RGTI', 'RIVN', 'RKLB', 'RUN',
  'SAMSUNG', 'SBUX', 'SEDG', 'SHAZ', 'SHOP', 'SKHY', 'SKHYNIX', 'SLV', 'SMCI',
  'SMH', 'SNAP', 'SNDK', 'SNOW', 'SNXX', 'SOFI', 'SONY', 'SOXL', 'SOXS', 'SPCE',
  'SPCX', 'SPX', 'SPY', 'SQ', 'SQQQ', 'STRC', 'STXX', 'TBT', 'TENCENT', 'TER',
  'TLT', 'TMF', 'TQQQ', 'TSLA', 'TSM', 'TTWO', 'TXN', 'TYO', 'TZA', 'UBER',
  'UNH', 'UNG', 'UPST', 'URNM', 'USAR', 'USO', 'UVXY', 'V', 'VIX', 'VRT',
  'WDC', 'WEN', 'WFC', 'WMT', 'WULF', 'XAG', 'XAU', 'XBI', 'XLE', 'XOM', 'XPEV',
  'XPD', 'XPT', 'ZHIPU', 'ZM'
]);

/**
 * Determina si un símbolo corresponde a una acción tokenizada, índice o activo TradFi.
 * @param {string|{symbol: string, underlyingType?: string, symbolType?: string, isStock?: boolean}} symbolInput
 * @returns {boolean} true si es acción tokenizada / TradFi, false en caso contrario.
 */
export function isTokenizedStock(symbolInput) {
  if (!symbolInput) return false;

  let symbol = typeof symbolInput === 'string' ? symbolInput : symbolInput.symbol;
  if (!symbol || typeof symbol !== 'string') return false;

  const upperSymbol = symbol.toUpperCase();

  // 1. Verificación por metadatos directos del exchange (si se provee el objeto)
  if (typeof symbolInput === 'object') {
    if (symbolInput.isStock) return true;
    if (symbolInput.underlyingType && symbolInput.underlyingType !== 'COIN') return true;
    if (symbolInput.symbolType && (symbolInput.symbolType === 'stock' || symbolInput.symbolType === 'commodity')) return true;
  }

  // 2. Patrones claros en el nombre del símbolo (ej. AMDSTOCK, NBIS, etc.)
  if (upperSymbol.includes('STOCK')) return true;

  // 3. Extraer el activo base quitando sufijos comunes
  const baseAsset = upperSymbol
    .replace(/(USDT|USDC|PERP|_USDT)$/, '')
    .replace(/STOCK$/, '')
    .replace(/2L$/, '');

  return TOKENIZED_STOCKS.has(baseAsset);
}
