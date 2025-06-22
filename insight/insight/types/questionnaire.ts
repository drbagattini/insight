// types/questionnaire.ts
// -----------------------------------------------------------------------------
// Generic type definitions for questionnaires across the application.
// -----------------------------------------------------------------------------
// By keeping these definitions small but extensible we can incrementally add
// properties without breaking existing questionnaires (e.g., WHO-5).
// -----------------------------------------------------------------------------

/**
 * A scoring function takes an array of numeric answers (usually 0-based or 1-based
 * depending on the questionnaire definition) and returns either a numeric score
 * or any richer structure the specific questionnaire requires.
 *
 * Note: We deliberately return `any` for now because some questionnaires may
 * return multi-dimensional objects (e.g., sub-scale scores). We can tighten this
 * later with generics once more use-cases are known.
 */
export type ScoreFn = (answers: number[]) => any;

/**
 * Basic definition of a questionnaire item/question.
 * This intentionally keeps only the fields that are shared by the public form
 * and the patient dashboard. Extra per-project attributes (e.g., response
 * options, help text, etc.) can be added as optional properties when needed.
 */
export interface QuestionnaireItem {
  /** Stable unique identifier of the question (can be a UUID, slug, etc.) */
  id: string;
  /** Human-readable text displayed to the patient. */
  text: string;
  /**
   * Optional maximum score for this item (needed for some scoring algorithms
   * such as percentage-based scales).
   */
  maxScore?: number;
  /** Any additional metadata specific to the questionnaire definition */
  [key: string]: unknown;
}

/**
 * Meta information that drives both UI and scoring for a questionnaire.
 */
export interface QuestionnaireMeta {
  /** Code used internally and in the DB (e.g., "WHO-5", "GAD-7"). */
  code: string;
  /** Localised human title (can be translated via i18n if needed). */
  title: string;
  /** Chart type preferred for visualising this questionnaire. */
  chartType: 'line' | 'bar' | 'bar-multi-dim' | string;
  /** Optional thresholds used for risk colouring, etc. */
  thresholds?: Record<string, number>;
  /** Optional long description / instructions. */
  description?: string;
  /** Array of items in their original order. */
  items?: QuestionnaireItem[];
  /** Any extra arbitrary meta per questionnaire. */
  [key: string]: unknown;
}

