import { describe, it, expect } from 'vitest';
import { scoreWho5 } from '@/src/scoring/who5';
import { scoreAnswers } from '@/src/scoring';

// -----------------------------------------------------------------------------
// Unit tests for questionnaire scoring helpers
// -----------------------------------------------------------------------------

describe('scoreWho5', () => {
  it('returns 0 for all-zero answers', () => {
    const result = scoreWho5([0, 0, 0, 0, 0]);
    expect(result).toBe(0);
  });

  it('returns 100 for all-5 answers', () => {
    const result = scoreWho5([5, 5, 5, 5, 5]);
    expect(result).toBe(100);
  });

  it('returns null and warns for invalid answer length', () => {
    const result = scoreWho5([1, 2, 3]);
    expect(result).toBeNull();
  });
});

describe('scoreAnswers wrapper', () => {
  it('delegates to registered scoring function', () => {
    const result = scoreAnswers('WHO-5', [1, 1, 1, 1, 1]);
    expect(result).toBe(20); // raw 5 * 4 = 20
  });

  it('returns null for unknown questionnaire code', () => {
    const result = scoreAnswers('UNKNOWN', [1, 2, 3]);
    expect(result).toBeNull();
  });
});
