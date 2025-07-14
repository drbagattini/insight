/**
 * OPD-CA2-SQ Scoring Functions
 * 
 * Based on SPSS syntax from Swiss normative sample (N=353)
 * Four main dimensions: Control, Identity, Interpersonality, Attachment
 */

// Items that need to be reverse-coded (0→4, 1→3, 2→2, 3→1, 4→0)
const REVERSE_ITEMS = [81, 55, 61, 1, 29, 71, 28, 63, 79];

// Dimension item mappings (1-based item numbers)
const DIMENSION_ITEMS = {
  control: [3, 67, 26, 42, 80, 5, 36, 72, 9, 20, 11, 73, 77, 68, 17, 37],
  identity: [76, 50, 54, 60, 81, 55, 74, 49, 6, 51, 22, 2, 21, 43, 52, 25, 33, 65, 53, 61, 75, 56, 45, 34],
  interpersonality: [23, 7, 1, 39, 44, 14, 29, 38, 46, 27, 12, 32, 66, 57, 48, 64, 78, 19, 58, 35, 30, 13, 24, 8, 15],
  attachment: [47, 18, 71, 4, 62, 40, 70, 31, 59, 69, 10, 28, 63, 41, 16, 79]
};

// T-score conversion parameters (mean, SD from Swiss sample N=353)
const T_SCORE_PARAMS = {
  control: { mean: 23.1, sd: 12.6 },
  identity: { mean: 33.6, sd: 17.0 },
  interpersonality: { mean: 37.6, sd: 17.5 },
  attachment: { mean: 21.5, sd: 10.4 }
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
  answers: number[], 
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
  
  // Require at least 75% of items to be valid (following SPSS mean.XX logic)
  const requiredItems = Math.ceil(dimensionItems.length * 0.75);
  if (validAnswers.length < requiredItems) {
    return null;
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
 * @returns Object with T-scores for each dimension and total
 */
export function scoreOpdCa2(answers: number[]): {
  control: number | null;
  identity: number | null;
  interpersonality: number | null;
  attachment: number | null;
  total: number | null;
  dimensionLabels: string[];
} {
  if (!answers) {
    // Si no hay array de respuestas, no se puede puntuar.
    return {
      control: null,
      identity: null,
      interpersonality: null,
      attachment: null,
      total: null,
      dimensionLabels: ['Control', 'Identidad', 'Interpersonalidad', 'Apego']
    };
  }

  // Calculate raw scores for each dimension
  const controlRaw = calculateDimensionRawScore(answers, DIMENSION_ITEMS.control);
  const identityRaw = calculateDimensionRawScore(answers, DIMENSION_ITEMS.identity);
  const interpersonalityRaw = calculateDimensionRawScore(answers, DIMENSION_ITEMS.interpersonality);
  const attachmentRaw = calculateDimensionRawScore(answers, DIMENSION_ITEMS.attachment);

  // Convert to T-scores
  const control = controlRaw !== null ? rawToTScore(controlRaw, T_SCORE_PARAMS.control.mean, T_SCORE_PARAMS.control.sd) : null;
  const identity = identityRaw !== null ? rawToTScore(identityRaw, T_SCORE_PARAMS.identity.mean, T_SCORE_PARAMS.identity.sd) : null;
  const interpersonality = interpersonalityRaw !== null ? rawToTScore(interpersonalityRaw, T_SCORE_PARAMS.interpersonality.mean, T_SCORE_PARAMS.interpersonality.sd) : null;
  const attachment = attachmentRaw !== null ? rawToTScore(attachmentRaw, T_SCORE_PARAMS.attachment.mean, T_SCORE_PARAMS.attachment.sd) : null;

  // Calculate total T-score (average of valid dimensions)
  const validScores = [control, identity, interpersonality, attachment].filter(score => score !== null) as number[];
  const total = validScores.length > 0 ? Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length) : null;

  return {
    control,
    identity,
    interpersonality,
    attachment,
    total,
    dimensionLabels: ['Control', 'Identidad', 'Interpersonalidad', 'Apego']
  };
}

// Export dimension mapping for reference
export { DIMENSION_ITEMS, REVERSE_ITEMS };
