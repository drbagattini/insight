// scoring/index.ts
// Central registry of scoring functions keyed by questionnaire code.
// Add new questionnaires by importing their score function and adding an entry
// here. Keeping everything in one map allows us to look up scoring logic at
// runtime without `switch` statements scattered across the codebase.

import { ScoreFn } from "@/types/questionnaire";
import { scoreWho5 } from "./who5";

export const scores: Record<string, ScoreFn> = {
  "WHO-5": scoreWho5,
};

/**
 * Convenience helper that wraps lookup + invocation.
 * Falls back to `null` if no scoring function is registered or an error occurs.
 */
export const scoreAnswers = (
  code: string,
  answers: number[]
): ReturnType<ScoreFn> | null => {
  const fn = scores[code];
  if (!fn) {
    console.warn(`No scoring function registered for ${code}`);
    return null;
  }
  try {
    return fn(answers);
  } catch (err) {
    console.error(`Error scoring ${code}:`, err);
    return null;
  }
};
