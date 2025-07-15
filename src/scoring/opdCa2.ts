/**
 * OPD-CA2-SQ Scoring Functions
 * 
 * Based on SPSS syntax from Swiss normative sample (N=353)
 * Four main dimensions: Control, Identity, Interpersonality, Attachment
 */

import { ScoreDetalladoOpdCa2, OpdCa2Dimensions } from '../types/cuestionarios';

// Items that need to be reverse-coded (0→4, 1→3, 2→2, 3→1, 4→0)
// Matching SPSS: er81 er55 er61 er1 er29 er71 er28 er63 er79
const REVERSE_ITEMS = [81, 55, 61, 1, 29, 71, 28, 63, 79];

// Mapeo detallado de subdimensiones y dimensiones según SPSS
const ALL_ITEMS = Array.from({ length: 81 }, (_, i) => i + 1);

const SUBDIMENSION_ITEMS = {
  // Control / Regulación
  ctr_impulse: [3, 67, 26, 42],
  ctr_affect: [80, 5, 36, 72],
  ctr_consc: [9, 20, 11, 73],
  ctr_selfworth: [77, 68, 17, 37],
  // Identity / Identidad
  id_coherence: [76, 50, 54, 60],
  id_selfexp: [81, 55, 74, 49, 6],
  id_sodiff: [51, 22, 2, 21, 43],
  id_objectexp: [52, 25, 33, 65, 53],
  id_belong: [61, 75, 56, 45, 34],
  // Interpersonality / Interpersonalidad
  int_fantasies: [23, 7, 1, 39, 44],
  int_emotcontact: [14, 29, 38, 46, 27],
  int_reciprocity: [12, 32, 66],
  int_affectexp: [57, 48, 64, 78, 19],
  int_empathy: [58, 35, 30, 13],
  int_ability_detach: [24, 8, 15],
  // Attachment / Apego
  att_representation: [47, 18, 71, 4],
  att_internalbasis: [62, 40, 70, 31],
  att_capacity_alone: [59, 69, 10, 28],
  att_use_relations: [63, 41, 16, 79],
} as const;

const DIMENSION_ITEMS = {
  [OpdCa2Dimensions.REGULACION]: [...SUBDIMENSION_ITEMS.ctr_impulse, ...SUBDIMENSION_ITEMS.ctr_affect, ...SUBDIMENSION_ITEMS.ctr_consc, ...SUBDIMENSION_ITEMS.ctr_selfworth],
  [OpdCa2Dimensions.INTROSPECCION]: [...SUBDIMENSION_ITEMS.id_coherence, ...SUBDIMENSION_ITEMS.id_selfexp, ...SUBDIMENSION_ITEMS.id_sodiff, ...SUBDIMENSION_ITEMS.id_objectexp, ...SUBDIMENSION_ITEMS.id_belong],
  [OpdCa2Dimensions.COMUNICACION]: [...SUBDIMENSION_ITEMS.int_fantasies, ...SUBDIMENSION_ITEMS.int_emotcontact, ...SUBDIMENSION_ITEMS.int_reciprocity, ...SUBDIMENSION_ITEMS.int_affectexp, ...SUBDIMENSION_ITEMS.int_empathy, ...SUBDIMENSION_ITEMS.int_ability_detach],
  [OpdCa2Dimensions.VINCULACION]: [...SUBDIMENSION_ITEMS.att_representation, ...SUBDIMENSION_ITEMS.att_internalbasis, ...SUBDIMENSION_ITEMS.att_capacity_alone, ...SUBDIMENSION_ITEMS.att_use_relations],
};

// T-score conversion parameters from Swiss sample (N=353)
const T_SCORE_PARAMS = {
  total: { mean: 115.8, sd: 53.0 },
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
  att_use_relations: { mean: 5.4, sd: 3.4 },
} as const;

function reverseCodeItem(itemNumber: number, value: number): number {
  return REVERSE_ITEMS.includes(itemNumber) ? 4 - value : value;
}

function calculateRawScore(answers: (number | null)[], itemNumbers: ReadonlyArray<number>, minValid?: number): number | null {
  const validAnswers: number[] = [];
  for (const itemNumber of itemNumbers) {
    const rawValue = answers[itemNumber - 1];
    if (rawValue !== null && rawValue !== undefined && rawValue >= 0 && rawValue <= 4) {
      validAnswers.push(reverseCodeItem(itemNumber, rawValue));
    }
  }

  if (minValid && validAnswers.length < minValid) {
    return null;
  }
  if (validAnswers.length === 0) {
    return null;
  }

  const mean = validAnswers.reduce((sum, val) => sum + val, 0) / validAnswers.length;
  return mean * itemNumbers.length;
}

function rawToTScore(rawScore: number, mean: number, sd: number): number {
  const tScore = Math.round(((rawScore - mean) / sd) * 10) + 50;
  return Math.max(20, Math.min(80, tScore)); // Clamp T-score [20, 80]
}

export function scoreOpdCa2(answers: (number | null)[]): ScoreDetalladoOpdCa2 {
  const validAnswerCount = answers.filter(a => a !== null && a >= 0 && a <= 4).length;
  if (validAnswerCount < 73) { // SPSS: NMISS < 9 -> at least 73 valid answers
    // Return all nulls if not enough answers
    const nullSubdimensions = {
      ctr_impulse: null, ctr_affect: null, ctr_consc: null, ctr_selfworth: null,
      id_coherence: null, id_selfexp: null, id_sodiff: null, id_objectexp: null, id_belong: null,
      int_fantasies: null, int_emotcontact: null, int_reciprocity: null, int_affectexp: null, int_empathy: null, int_ability_detach: null,
      att_representation: null, att_internalbasis: null, att_capacity_alone: null, att_use_relations: null,
    };
    return {
      total: null,
      control: null, 
      identity: null, 
      interpersonality: null, 
      attachment: null, 
      dimensionLabels: ['Control', 'Identidad', 'Interpersonalidad', 'Apego'],
      subDimensions: nullSubdimensions,
    };
  }

  // Calculate raw scores
  const totalRaw = calculateRawScore(answers, ALL_ITEMS, 73);
  const controlRaw = calculateRawScore(answers, DIMENSION_ITEMS[OpdCa2Dimensions.REGULACION], 12);
  const identityRaw = calculateRawScore(answers, DIMENSION_ITEMS[OpdCa2Dimensions.INTROSPECCION], 19);
  const interpersonalityRaw = calculateRawScore(answers, DIMENSION_ITEMS[OpdCa2Dimensions.COMUNICACION], 20);
  const attachmentRaw = calculateRawScore(answers, DIMENSION_ITEMS[OpdCa2Dimensions.VINCULACION], 12);

  // Calculate T-scores
  const total = totalRaw !== null ? rawToTScore(totalRaw, T_SCORE_PARAMS.total.mean, T_SCORE_PARAMS.total.sd) : null;
  const control = controlRaw !== null ? rawToTScore(controlRaw, T_SCORE_PARAMS[OpdCa2Dimensions.REGULACION].mean, T_SCORE_PARAMS[OpdCa2Dimensions.REGULACION].sd) : null;
  const identity = identityRaw !== null ? rawToTScore(identityRaw, T_SCORE_PARAMS[OpdCa2Dimensions.INTROSPECCION].mean, T_SCORE_PARAMS[OpdCa2Dimensions.INTROSPECCION].sd) : null;
  const interpersonality = interpersonalityRaw !== null ? rawToTScore(interpersonalityRaw, T_SCORE_PARAMS[OpdCa2Dimensions.COMUNICACION].mean, T_SCORE_PARAMS[OpdCa2Dimensions.COMUNICACION].sd) : null;
  const attachment = attachmentRaw !== null ? rawToTScore(attachmentRaw, T_SCORE_PARAMS[OpdCa2Dimensions.VINCULACION].mean, T_SCORE_PARAMS[OpdCa2Dimensions.VINCULACION].sd) : null;

  // Calculate subdimension T-scores
  const subDimensions: Record<string, number | null> = {};
  for (const [key, items] of Object.entries(SUBDIMENSION_ITEMS)) {
    const raw = calculateRawScore(answers, items);
    const params = (T_SCORE_PARAMS as any)[key];
    subDimensions[key] = raw !== null && params ? rawToTScore(raw, params.mean, params.sd) : null;
  }

  return {
    total,
    control,
    identity,
    interpersonality,
    attachment,
    dimensionLabels: ['Control', 'Identidad', 'Interpersonalidad', 'Apego'],
    subDimensions: subDimensions as any,
  };
}

// Export for reference
export { DIMENSION_ITEMS, REVERSE_ITEMS };
