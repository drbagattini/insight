/**
 * Test de integración para OPD-CA2-SQ
 * Verifica que el cuestionario esté correctamente integrado en el sistema
 */

import { scoreAnswers } from '../src/scoring/index.ts';
import questionnairesMeta from '../src/data/questionnairesMeta.ts';

describe('OPD-CA2-SQ Integration Tests', () => {
  test('OPD-CA2-SQ metadata should be properly configured', () => {
    const meta = questionnairesMeta['OPD-CA2-SQ'];
    
    expect(meta).toBeDefined();
    expect(meta.title).toBe('OPD-CA2-SQ - Cuestionario de Capacidades Operacionalizadas');
    expect(meta.chartType).toBe('bar-multidim');
    expect(meta.dominio).toBe('Capacidades Psicodinámicas');
  });

  test('OPD-CA2-SQ scoring should work with 81 answers', () => {
    // Crear respuestas de ejemplo (81 respuestas con valores 0-4)
    const sampleAnswers = Array.from({ length: 81 }, (_, i) => (i % 5));
    
    const result = scoreAnswers('OPD-CA2-SQ', sampleAnswers);
    
    expect(result).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    expect(result.control).toBeGreaterThan(0);
    expect(result.identity).toBeGreaterThan(0);
    expect(result.interpersonality).toBeGreaterThan(0);
    expect(result.attachment).toBeGreaterThan(0);
    expect(result.dimensionLabels).toEqual(['Control', 'Identidad', 'Interpersonalidad', 'Apego']);
  });

  test('OPD-CA2-SQ scoring should handle edge cases', () => {
    // Todas las respuestas en 0 (mínimo)
    const minAnswers = Array.from({ length: 81 }, () => 0);
    const minResult = scoreAnswers('OPD-CA2-SQ', minAnswers);
    
    expect(minResult).toBeDefined();
    expect(minResult.total).toBeGreaterThan(0); // T-score calculado
    expect(minResult.control).toBeGreaterThan(0);
    
    // Todas las respuestas en 4 (máximo)
    const maxAnswers = Array.from({ length: 81 }, () => 4);
    const maxResult = scoreAnswers('OPD-CA2-SQ', maxAnswers);
    
    expect(maxResult).toBeDefined();
    expect(maxResult.total).toBeGreaterThan(minResult.total); // Debe ser mayor que el mínimo
    expect(maxResult.control).toBeGreaterThan(minResult.control);
  });

  test('OPD-CA2-SQ scoring should reject invalid input', () => {
    // Número incorrecto de respuestas
    const invalidAnswers = Array.from({ length: 80 }, () => 2);
    const result = scoreAnswers('OPD-CA2-SQ', invalidAnswers);
    
    expect(result).toBeDefined();
    expect(result.control).toBeNull();
    expect(result.identity).toBeNull();
    expect(result.interpersonality).toBeNull();
    expect(result.attachment).toBeNull();
    expect(result.total).toBeNull();
  });

  test('Generic scoring system should handle unknown questionnaire codes', () => {
    const sampleAnswers = [1, 2, 3, 4, 5];
    const result = scoreAnswers('UNKNOWN-CODE', sampleAnswers);
    
    expect(result).toBeNull();
  });
});
