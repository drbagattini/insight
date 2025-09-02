// scoring/index.ts
// Central registry of scoring functions keyed by questionnaire code.
// Add new questionnaires by importing their score function and adding an entry
// here. Keeping everything in one map allows us to look up scoring logic at
// runtime without `switch` statements scattered across the codebase.

import { ScoreFn } from "@/types/questionnaire";
import { scoreWho5 } from "./who5";
import { scoreOpdCa2 } from "./opdCa2";
import { scoreBrWai } from "./scoreBrWai";
import { scorePhq9 } from "./scorePhq9";
import { scoreGad7 } from "./scoreGad7";
import { scoreOYSPadres40, scoreOYSJovenes40 } from "./oysScoring";

export const scores: Record<string, ScoreFn> = {
  "WHO-5": scoreWho5,
  "OPD-CA2-SQ": scoreOpdCa2,
  "BR-WAI": scoreBrWai,
  "PHQ-9": scorePhq9,
  "GAD-7": scoreGad7,
  "OYS-PADRES-40": scoreOYSPadres40,
  "OYS-JOVENES-40": scoreOYSJovenes40,
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
