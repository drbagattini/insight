/**
 * Ohio Youth Scales (OYS) Scoring Functions
 * Implementación según especificación oficial
 */

export type OYSCode = 'OYS-PS-P-SF20' | 'OYS-F-P-SF20' | 'OYS-PS-Y-SF20' | 'OYS-F-Y-SF20';
export type Resp = number | null; // 0..5 en PS; 0..4 en F; null = omitido

export interface ScoreResult {
  total: number | null;
  valido: boolean;
}

export interface OutcomeResult {
  delta: number | null;
  cambio_fiable: boolean;
  meta_post: boolean;
}

export interface OYSFlags {
  consumo?: boolean;
  autolesion?: boolean;
  muerte?: boolean;
  tdah?: boolean;
}

// Labels oficiales
export const PS_LABELS = [
  "Nada en absoluto",
  "Una o dos veces", 
  "Varias veces",
  "A menudo",
  "La mayor parte del tiempo",
  "Todo el tiempo"
];

export const F_LABELS = [
  "Problemas extremos",
  "Bastantes problemas", 
  "Algunas dificultades",
  "OK",
  "Muy bien"
];

// Utilidades de código
export const isPS = (c: OYSCode) => c.startsWith('OYS-PS');
export const isF = (c: OYSCode) => c.startsWith('OYS-F');
export const isPadre = (c: OYSCode) => c.includes('-P-');
export const isJoven = (c: OYSCode) => c.includes('-Y-');

/**
 * Función principal de scoring según especificación
 */
export function scoreOYS(codigo: OYSCode, r: Resp[]): ScoreResult {
  if (r.length !== 20) {
    throw new Error('Se requieren 20 ítems');
  }
  
  const missing = r.filter(v => v === null).length;

  if (isPS(codigo)) {
    // Problem Severity: si ≥5 faltan → invalidar
    if (missing >= 5) return { total: null, valido: false };
    
    // Imputar media individual de los ítems contestados
    const answered = r.filter((v): v is number => v !== null);
    const mean = answered.reduce((a, b) => a + b, 0) / Math.max(1, answered.length);
    const filled = r.map(v => v === null ? Math.round(mean) : v) as number[];
    const total = Math.round(filled.reduce((a, b) => a + b, 0));
    
    return { total, valido: true };
  }

  // Functioning: si ≥5 faltan → invalidar
  if (missing >= 5) return { total: null, valido: false };
  
  // Imputar 3 (OK) para faltantes
  const filled = r.map(v => v === null ? 3 : v) as number[];
  const total = Math.round(filled.reduce((a, b) => a + b, 0));
  
  return { total, valido: true };
}

/**
 * Cálculo de outcomes clínicos
 */
export function outcomes(codigo: OYSCode, totalNow: number, totalPrev?: number | null): OutcomeResult {
  const delta = (totalPrev == null) ? null : totalNow - totalPrev;
  
  // Cambio fiable (RCI): PS ≥ 10 puntos, F ≥ 8 puntos
  const rci = (delta == null) ? false : (isPS(codigo) ? Math.abs(delta) >= 10 : Math.abs(delta) >= 8);
  
  // Meta post-tratamiento
  const meta = isPS(codigo)
    ? (totalNow < 25)  // PS: < 25
    : (isPadre(codigo) ? totalNow >= 50 : totalNow >= 60); // F: Padre ≥50, Joven ≥60
  
  return { delta, cambio_fiable: rci, meta_post: meta };
}

/**
 * Flags clínicos según ítems específicos
 */
export function buildFlags(codigo: OYSCode, rPS?: Resp[], rF?: Resp[]): OYSFlags {
  const flags: OYSFlags = {};
  
  if (codigo.includes('PS') && rPS) {
    // Índices en array (0-based): ítem papel - 1
    flags.consumo = (rPS[6] ?? 0) >= 1;      // Ítem 7
    flags.autolesion = (rPS[11] ?? 0) >= 1;  // Ítem 12
    flags.muerte = (rPS[12] ?? 0) >= 1;      // Ítem 13
    flags.tdah = (rPS[10] ?? 0) >= 3 || ((rF?.[15] ?? 2) <= 1); // Ítem 11 PS o ítem 16 F
  }
  
  return flags;
}

/**
 * Bandas de warning/danger para UI
 */
export function getThresholds(codigo: OYSCode) {
  if (isPS(codigo)) {
    return isPadre(codigo) 
      ? { warning: 20, danger: 30 }
      : { warning: 33, danger: 48 };
  } else {
    return isPadre(codigo)
      ? { warning: 52, danger: 40 }  // F: lower is worse
      : { warning: 48, danger: 35 };
  }
}

/**
 * Validación de rangos por ítem
 */
export function validateResponse(codigo: OYSCode, response: number): boolean {
  if (isPS(codigo)) {
    return Number.isInteger(response) && response >= 0 && response <= 5;
  } else {
    return Number.isInteger(response) && response >= 0 && response <= 4;
  }
}

/**
 * Obtener rango máximo según código
 */
export function getMaxScore(codigo: OYSCode): number {
  return isPS(codigo) ? 100 : 80;
}

/**
 * Obtener dirección de la escala
 */
export function getDirection(codigo: OYSCode): 'higher_worse' | 'higher_better' {
  return isPS(codigo) ? 'higher_worse' : 'higher_better';
}
