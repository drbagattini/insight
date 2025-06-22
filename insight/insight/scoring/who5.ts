// scoring/who5.ts
import { ScoreFn } from "@/types/questionnaire";

/**
 * WHO-5 Well-Being Index
 *
 * Scoring rules (WHO-5): Each of the 5 items is answered on a 0-5 Likert scale.
 * The raw score (0-25) is multiplied by 4 to yield a 0-100 score, where higher
 * values indicate better well-being.
 */
export const scoreWho5: ScoreFn = (answers: number[]) => {
  if (answers.length !== 5) {
    // We only log a warning; returning null keeps the UX functional while
    // allowing the API / caller to decide how to handle inconsistent data.
    console.warn(
      `WHO-5 scoring expected 5 answers, received ${answers.length}. Returning null.`
    );
    return null;
  }

  const raw = answers.reduce((sum, v) => sum + Number(v || 0), 0);
  return raw * 4;
};
