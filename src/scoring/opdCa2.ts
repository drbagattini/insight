/**
 * OPD-CA2-SQ Scoring Functions
 * 
 * Based on SPSS syntax from Swiss normative sample (N=353)
 * Four main dimensions: Control, Identity, Interpersonality, Attachment
 */

// Items that need to be reverse-coded (0→4, 1→3, 2→2, 3→1, 4→0)
const REVERSE_ITEMS = [81, 55, 61, 1, 29, 71, 28, 63, 79];

import { ScoreDetalladoOpdCa2, OpdCa2Dimensions, OpdCa2Subdimensions } from '../types/cuestionarios';

// Mapeo de subdimensiones con los nombres exactos de la interfaz
const SUBDIMENSION_ITEMS = {
  [OpdCa2Subdimensions.REGULACION_SELF]: [3, 67, 26, 42, 80, 5, 36, 72, 9, 20],
  [OpdCa2Subdimensions.REGULACION_OBJETO]: [11, 73, 77, 68, 17, 37],
  [OpdCa2Subdimensions.INTROSPECCION_SELF]: [76, 50, 54, 60, 81, 55, 74, 49, 6, 51, 22, 2],
  [OpdCa2Subdimensions.INTROSPECCION_OBJETO]: [21, 43, 52, 25, 33, 65, 53, 61, 75, 56, 45, 34],
  [OpdCa2Subdimensions.COMUNICACION_AFECTIVA]: [23, 7, 1, 39, 44, 14, 29, 38, 46, 27, 12, 32, 66, 57, 48, 64, 78, 19, 58],
  [OpdCa2Subdimensions.COMUNICACION_CORPORAL]: [35, 30, 13, 24, 8, 15],
  [OpdCa2Subdimensions.VINCULOS_INTERNOS]: [47, 18, 71, 4, 62, 40, 70, 31, 59, 69, 10, 28],
  [OpdCa2Subdimensions.VINCULOS_EXTERNOS]: [63, 41, 16, 79],
};

const DIMENSION_ITEMS = {
  [OpdCa2Dimensions.REGULACION]: [3, 67, 26, 42, 80, 5, 36, 72, 9, 20, 11, 73, 77, 68, 17, 37],
  [OpdCa2Dimensions.INTROSPECCION]: [76, 50, 54, 60, 81, 55, 74, 49, 6, 51, 22, 2, 21, 43, 52, 25, 33, 65, 53, 61, 75, 56, 45, 34],
  [OpdCa2Dimensions.COMUNICACION]: [23, 7, 1, 39, 44, 14, 29, 38, 46, 27, 12, 32, 66, 57, 48, 64, 78, 19, 58, 35, 30, 13, 24, 8, 15],
  [OpdCa2Dimensions.VINCULACION]: [47, 18, 71, 4, 62, 40, 70, 31, 59, 69, 10, 28, 63, 41, 16, 79]
};

// T-score conversion parameters (mean, SD from Swiss sample N=353)
const T_SCORE_PARAMS = {
  [OpdCa2Dimensions.REGULACION]: { mean: 23.1, sd: 12.6 },
  [OpdCa2Dimensions.INTROSPECCION]: { mean: 33.6, sd: 17.0 },
  [OpdCa2Dimensions.COMUNICACION]: { mean: 37.6, sd: 17.5 },
  [OpdCa2Dimensions.VINCULACION]: { mean: 21.5, sd: 10.4 }
};

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
  dimensionItems: number[]
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
    // Si no hay array de respuestas, no se puede puntuar.
    // Importante: Inicializar con la estructura completa esperada por el componente
    return {
      control: null,
      identity: null,
      interpersonality: null,
      attachment: null,
      total: null,
      dimensionLabels: ['Control', 'Identidad', 'Interpersonalidad', 'Apego'],
      // Inicializar con la estructura completa pero valores nulos
      dimensions: {
        control: { tScore: null },
        identity: { tScore: null },
        interpersonality: { tScore: null },
        attachment: { tScore: null }
      },
      // Inicializar todas las subdimensiones con valores nulos
      subDimensions: {
        // Control subdimensions
        ctr_impulse: null,
        ctr_affect: null,
        ctr_consc: null,
        ctr_selfworth: null,
        
        // Identity subdimensions
        id_coherence: null,
        id_selfexp: null,
        id_sodiff: null,
        id_objectexp: null,
        id_belong: null,
        
        // Interpersonality subdimensions
        int_fantasies: null,
        int_emotcontact: null,
        int_reciprocity: null,
        int_affectexp: null,
        int_empathy: null,
        int_ability_detach: null,
        
        // Attachment subdimensions
        att_representation: null,
        att_internalbasis: null,
        att_capacity_alone: null,
        att_use_relations: null
      }
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

  // Calculate total T-score (average of valid dimensions)
  const validScores = [control, identity, interpersonality, attachment].filter(score => score !== null) as number[];
  const total = validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : null;

  return {
    control: control,
    identity: identity,
    interpersonality: interpersonality,
    attachment: attachment,
    total: total,
    dimensionLabels: ['Control', 'Identidad', 'Interpersonalidad', 'Apego'],
  };
}

// Export dimension mapping for reference
export { DIMENSION_ITEMS, REVERSE_ITEMS };
