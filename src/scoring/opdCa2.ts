/**
 * OPD-CA2-SQ Scoring Functions
 * 
 * Based on SPSS syntax from Swiss normative sample (N=353)
 * Four main dimensions: Control, Identity, Interpersonality, Attachment
 */

// Items that need to be reverse-coded (0→4, 1→3, 2→2, 3→1, 4→0)
const REVERSE_ITEMS = [81, 55, 61, 1, 29, 71, 28, 63, 79];

import { ScoreDetalladoOpdCa2, OpdCa2Dimensions, OpdCa2Subdimensions } from '../types/cuestionarios';

// Mapeo detallado de 18 subdimensiones (ver sintaxis SPSS)
const SUBDIMENSION_ITEMS = {
  // Control / Regulación
  ctr_impulse: [3, 67, 26, 42],
  ctr_affect: [80, 5, 36, 72],
  ctr_consc: [9, 20, 11, 73],
  ctr_selfworth: [77, 68, 17, 37],

  // Identity / Introspección
  id_coherence: [76, 50, 54, 60],
  id_selfexp: [81, 55, 74, 49, 6],
  id_sodiff: [51, 22, 2, 21, 43],
  id_objectexp: [52, 25, 33, 65, 53],
  id_belong: [61, 75, 56, 45, 34],

  // Interpersonality / Comunicación
  int_fantasies: [23, 7, 1, 39, 44],
  int_emotcontact: [14, 29, 38, 46, 27],
  int_reciprocity: [12, 32, 66],
  int_affectexp: [57, 48, 64, 78, 19],
  int_empathy: [58, 35, 30, 13],
  int_ability_detach: [24, 8, 15],

  // Attachment / Vinculación
  att_representation: [47, 18, 71, 4],
  att_internalbasis: [62, 40, 70, 31],
  att_capacity_alone: [59, 69, 10, 28],
  att_use_relations: [63, 41, 16, 79],
} as const;

const DIMENSION_ITEMS = {
  [OpdCa2Dimensions.REGULACION]: [3, 67, 26, 42, 80, 5, 36, 72, 9, 20, 11, 73, 77, 68, 17, 37],
  [OpdCa2Dimensions.INTROSPECCION]: [76, 50, 54, 60, 81, 55, 74, 49, 6, 51, 22, 2, 21, 43, 52, 25, 33, 65, 53, 61, 75, 56, 45, 34],
  [OpdCa2Dimensions.COMUNICACION]: [23, 7, 1, 39, 44, 14, 29, 38, 46, 27, 12, 32, 66, 57, 48, 64, 78, 19, 58, 35, 30, 13, 24, 8, 15],
  [OpdCa2Dimensions.VINCULACION]: [47, 18, 71, 4, 62, 40, 70, 31, 59, 69, 10, 28, 63, 41, 16, 79]
};

// T-score conversion parameters (mean, SD from Swiss sample N=353)
const T_SCORE_PARAMS = {
  // Dimensiones principales
  [OpdCa2Dimensions.REGULACION]: { mean: 23.1, sd: 12.6 },
  [OpdCa2Dimensions.INTROSPECCION]: { mean: 33.6, sd: 17.0 },
  [OpdCa2Dimensions.COMUNICACION]: { mean: 37.6, sd: 17.5 },
  [OpdCa2Dimensions.VINCULACION]: { mean: 21.5, sd: 10.4 },

  // Subdimensiones
  ctr_impulse: { mean: 6.6, sd: 4.3 },
  ctr_affect: { mean: 6.2, sd: 4.1 },
  ctr_consc: { mean: 5.6, sd: 3.4 },
  ctr_selfworth: { mean: 4.7, sd: 4.0 },

  id_coherence: { mean: 5.6, sd: 4.2 },
  id_selfexp: { mean: 6.9, sd: 4.4 },
  id_sodiff: { mean: 6.5, sd: 4.4 },
  id_objectexp: { mean: 9.1, sd: 4.5 },
  id_belong: { mean: 5.5, sd: 4.5 },

  int_fantasies: { mean: 5.4, sd: 4.6 },
  int_emotcontact: { mean: 6.7, sd: 4.6 },
  int_reciprocity: { mean: 5.6, sd: 3.0 },
  int_affectexp: { mean: 8.2, sd: 4.8 },
  int_empathy: { mean: 7.1, sd: 3.9 },
  int_ability_detach: { mean: 4.6, sd: 3.0 },

  att_representation: { mean: 6.0, sd: 3.7 },
  att_internalbasis: { mean: 6.4, sd: 4.0 },
  att_capacity_alone: { mean: 3.8, sd: 3.6 },
  att_use_relations: { mean: 5.4, sd: 3.4 }
} as const;

/**
 * Reverse code an item value if it's in the reverse items list
 */
function reverseCodeItem(itemNumber: number, value: number): number {
  if (REVERSE_ITEMS.includes(itemNumber)) {
    return 4 - value; // 0→4, 1→3, 2→2, 3→1, 4→0
  }
  return value;
}

/**
 * Calculate raw score for a dimension
 */
function calculateDimensionRawScore(
  answers: (number | null)[],
  dimensionItems: ReadonlyArray<number>
): number | null {
  const validAnswers: number[] = [];
  
  for (const itemNumber of dimensionItems) {
    const itemIndex = itemNumber - 1; // Convert to 0-based index
    const rawValue = answers[itemIndex];
    
    if (rawValue !== undefined && rawValue !== null && rawValue >= 0 && rawValue <= 4) {
      const processedValue = reverseCodeItem(itemNumber, rawValue);
      validAnswers.push(processedValue);
    }
  }
  
  // Si no hay respuestas válidas para una dimensión, su puntuación es 0.
  if (validAnswers.length === 0) {
    return 0;
  }
  
  // Calculate mean and scale to dimension length
  const mean = validAnswers.reduce((sum, val) => sum + val, 0) / validAnswers.length;
  return mean * dimensionItems.length;
}

/**
 * Convert raw score to T-score
 */
function rawToTScore(rawScore: number, mean: number, sd: number): number {
  const tScore = Math.round(((rawScore - mean) / sd) * 10) + 50;
  // Clamp to valid T-score range [20, 80]
  return Math.max(20, Math.min(80, tScore));
}

/**
 * Main scoring function for OPD-CA2-SQ
 * @param answers Array of 81 answers (0-4 scale)
 * @returns Object with T-scores for each dimension and total, conforming to ScoreDetalladoOpdCa2
 */
export function scoreOpdCa2(answers: (number | null)[]): ScoreDetalladoOpdCa2 {

  if (!answers) {
    // Si no hay array de respuestas, no se puede puntuar. Devolvemos estructura vacía.
    return {
      control: null,
      identity: null,
      interpersonality: null,
      attachment: null,
      total: null,
      dimensionLabels: ['Control', 'Identidad', 'Interpersonalidad', 'Apego'],
      subDimensions: {
        // Control
        ctr_impulse: null,
        ctr_affect: null,
        ctr_consc: null,
        ctr_selfworth: null,
        // Identity
        id_coherence: null,
        id_selfexp: null,
        id_sodiff: null,
        id_objectexp: null,
        id_belong: null,
        // Interpersonality
        int_fantasies: null,
        int_emotcontact: null,
        int_reciprocity: null,
        int_affectexp: null,
        int_empathy: null,
        int_ability_detach: null,
        // Attachment
        att_representation: null,
        att_internalbasis: null,
        att_capacity_alone: null,
        att_use_relations: null,
      },
    };
  }

  // Calculate raw scores for each dimension
  const controlRaw = calculateDimensionRawScore(answers, DIMENSION_ITEMS[OpdCa2Dimensions.REGULACION]);
  const identityRaw = calculateDimensionRawScore(answers, DIMENSION_ITEMS[OpdCa2Dimensions.INTROSPECCION]);
  const interpersonalityRaw = calculateDimensionRawScore(answers, DIMENSION_ITEMS[OpdCa2Dimensions.COMUNICACION]);
  const attachmentRaw = calculateDimensionRawScore(answers, DIMENSION_ITEMS[OpdCa2Dimensions.VINCULACION]);

  // Convert to T-scores
  const control = controlRaw !== null ? rawToTScore(controlRaw, T_SCORE_PARAMS[OpdCa2Dimensions.REGULACION].mean, T_SCORE_PARAMS[OpdCa2Dimensions.REGULACION].sd) : null;
  const identity = identityRaw !== null ? rawToTScore(identityRaw, T_SCORE_PARAMS[OpdCa2Dimensions.INTROSPECCION].mean, T_SCORE_PARAMS[OpdCa2Dimensions.INTROSPECCION].sd) : null;
  const interpersonality = interpersonalityRaw !== null ? rawToTScore(interpersonalityRaw, T_SCORE_PARAMS[OpdCa2Dimensions.COMUNICACION].mean, T_SCORE_PARAMS[OpdCa2Dimensions.COMUNICACION].sd) : null;
  const attachment = attachmentRaw !== null ? rawToTScore(attachmentRaw, T_SCORE_PARAMS[OpdCa2Dimensions.VINCULACION].mean, T_SCORE_PARAMS[OpdCa2Dimensions.VINCULACION].sd) : null;

  // === Calcular subdimensiones === //
  const subDimRaw: Record<string, number | null> = {};
  const subDimT: Record<string, number | null> = {};

  for (const [subKey, items] of Object.entries(SUBDIMENSION_ITEMS)) {
    const raw = calculateDimensionRawScore(answers, items);
    subDimRaw[subKey] = raw;
    const params = (T_SCORE_PARAMS as Record<string, { mean: number; sd: number }>)[subKey];
    subDimT[subKey] = raw !== null && params ? rawToTScore(raw, params.mean, params.sd) : null;
  }

  // Calculate total T-score (average of valid dimensions)
  const validScores = [control, identity, interpersonality, attachment].filter(score => score !== null) as number[];
  const total = validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : null;

  return {
    control,
    identity,
    interpersonality,
    attachment,
    total,
    dimensionLabels: ['Control', 'Identidad', 'Interpersonalidad', 'Apego'],
    subDimensions: {
      // Control
      ctr_impulse: subDimT['ctr_impulse'] ?? null,
      ctr_affect: subDimT['ctr_affect'] ?? null,
      ctr_consc: subDimT['ctr_consc'] ?? null,
      ctr_selfworth: subDimT['ctr_selfworth'] ?? null,
      // Identity
      id_coherence: subDimT['id_coherence'] ?? null,
      id_selfexp: subDimT['id_selfexp'] ?? null,
      id_sodiff: subDimT['id_sodiff'] ?? null,
      id_objectexp: subDimT['id_objectexp'] ?? null,
      id_belong: subDimT['id_belong'] ?? null,
      // Interpersonality
      int_fantasies: subDimT['int_fantasies'] ?? null,
      int_emotcontact: subDimT['int_emotcontact'] ?? null,
      int_reciprocity: subDimT['int_reciprocity'] ?? null,
      int_affectexp: subDimT['int_affectexp'] ?? null,
      int_empathy: subDimT['int_empathy'] ?? null,
      int_ability_detach: subDimT['int_ability_detach'] ?? null,
      // Attachment
      att_representation: subDimT['att_representation'] ?? null,
      att_internalbasis: subDimT['att_internalbasis'] ?? null,
      att_capacity_alone: subDimT['att_capacity_alone'] ?? null,
      att_use_relations: subDimT['att_use_relations'] ?? null,
    },
  };
}

// Export dimension mapping for reference
export { DIMENSION_ITEMS, REVERSE_ITEMS };
