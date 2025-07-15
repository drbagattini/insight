// Este archivo contiene las definiciones de tipos para los resultados de los cuestionarios.

/**
 * Define los nombres de las dimensiones y subdimensiones para el cuestionario OPD-CA2-SQ.
 * Usamos un enum para asegurar la consistencia de los nombres en todo el código.
 */
export const OpdCa2Subdimensions = {
  REGULACION_SELF: 'Regulación del Self',
  REGULACION_OBJETO: 'Regulación del Objeto',
  COMUNICACION_AFECTIVA: 'Comunicación Afectiva',
  COMUNICACION_CORPORAL: 'Comunicación Corporal',
  INTROSPECCION_SELF: 'Introspección del Self',
  INTROSPECCION_OBJETO: 'Introspección del Objeto',
  VINCULOS_INTERNOS: 'Vínculos Internos',
  VINCULOS_EXTERNOS: 'Vínculos Externos'
} as const;

export const OpdCa2Dimensions = {
  REGULACION: 'Regulación',
  COMUNICACION: 'Comunicación',
  INTROSPECCION: 'Introspección',
  VINCULACION: 'Vinculación'
} as const;

// Tipos para los valores de los enums
type OpdCa2SubdimensionKeys = keyof typeof OpdCa2Subdimensions;
export type OpdCa2Subdimension = typeof OpdCa2Subdimensions[OpdCa2SubdimensionKeys];

type OpdCa2DimensionKeys = keyof typeof OpdCa2Dimensions;
export type OpdCa2Dimension = typeof OpdCa2Dimensions[OpdCa2DimensionKeys];

/**
 * Estructura para el `score_detallado` del cuestionario OPD-CA2-SQ.
 */
export interface ScoreDetalladoOpdCa2 {
  total: number | null;
  control: number | null;
  identity: number | null;
  interpersonality: number | null;
  attachment: number | null;
  dimensionLabels: string[];
}

/**
 * Estructura genérica para el resultado de un cuestionario.
 * `score_detallado` es opcional y su tipo puede variar.
 */
export interface ResultadoCuestionario {
  id: string;
  fecha: string;
  codigo_cuestionario: string;
  score_total: number | null;
  score_detallado?: ScoreDetalladoOpdCa2 | any; // `any` para otros cuestionarios
  respuestas: any;
  meta?: any;
}
