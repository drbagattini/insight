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
  // Puntuaciones T globales
  total: number | null;
  control: number | null;
  identity: number | null;
  interpersonality: number | null;
  attachment: number | null;

  // Etiquetas de las cuatro dimensiones principales (ordenadas)
  dimensionLabels: string[];

  // Subdimensiones con sus T-scores. Se mantiene opcional por compatibilidad.
  subDimensions?: {
    // Control
    ctr_impulse: number | null;
    ctr_affect: number | null;
    ctr_consc: number | null;
    ctr_selfworth: number | null;

    // Identity
    id_coherence: number | null;
    id_selfexp: number | null;
    id_sodiff: number | null;
    id_objectexp: number | null;
    id_belong: number | null;

    // Interpersonality
    int_fantasies: number | null;
    int_emotcontact: number | null;
    int_reciprocity: number | null;
    int_affectexp: number | null;
    int_empathy: number | null;
    int_ability_detach: number | null;

    // Attachment
    att_representation: number | null;
    att_internalbasis: number | null;
    att_capacity_alone: number | null;
    att_use_relations: number | null;
  };
}

/**
 * Estructura para el `score_detallado` del cuestionario BR-WAI.
 */
export interface ScoreDetalladoBrWai {
  total: number;
  vinculo: number;
  tareasObjetivos: number;
  interpretacion: {
    total: string;
    vinculo: string;
    tareasObjetivos: string;
  };
}

/**
 * Estructura para el `score_detallado` del cuestionario PHQ-9.
 */
export interface ScoreDetalladoPhq9 {
  total: number;
  item9: number; // Ítem de ideación suicida
  severidad: string;
  accionClinica: string;
  riesgoSuicida: boolean;
  alertaGeneral: boolean;
  impactoFuncional?: string; // Ítem 10 (no puntuable)
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
  score_detallado?: ScoreDetalladoOpdCa2 | ScoreDetalladoBrWai | ScoreDetalladoPhq9 | any; // `any` para otros cuestionarios
  respuestas: any;
  meta?: any;
}
