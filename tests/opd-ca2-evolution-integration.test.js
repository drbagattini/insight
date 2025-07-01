/**
 * Integration test for OPD-CA2-SQ Evolution Selector and Chart Visualization
 * Tests the patient dashboard evolution selector and chart rendering
 */

import questionnairesMeta from '../src/data/questionnairesMeta.ts';
import { scoreAnswers } from '../src/scoring/index.ts';

describe('OPD-CA2-SQ Evolution Integration', () => {
  
  test('questionnairesMeta contains both WHO-5 and OPD-CA2-SQ with correct titles', () => {
    expect(questionnairesMeta['WHO-5']).toBeDefined();
    expect(questionnairesMeta['OPD-CA2-SQ']).toBeDefined();
    
    expect(questionnairesMeta['WHO-5'].title).toBe('Índice de bienestar (WHO-5)');
    expect(questionnairesMeta['OPD-CA2-SQ'].title).toBe('Estructura psíquica adolescente (OPD-CA2-SQ)');
    
    expect(questionnairesMeta['WHO-5'].chartType).toBe('line');
    expect(questionnairesMeta['OPD-CA2-SQ'].chartType).toBe('bar-multidim');
  });

  test('WHO-5 scoring works correctly', () => {
    const who5Answers = [3, 2, 4, 1, 3]; // 5 answers, scale 0-5
    const result = scoreAnswers('WHO-5', who5Answers);
    
    expect(result).not.toBeNull();
    expect(typeof result).toBe('number');
    expect(result).toBe((3 + 2 + 4 + 1 + 3) * 4); // WHO-5 formula: sum * 4
  });

  test('OPD-CA2-SQ scoring works correctly', () => {
    // Create 81 answers for OPD-CA2-SQ (scale 0-4)
    const opdAnswers = Array(81).fill(0).map((_, i) => i % 5); // Mix of 0-4 values
    const result = scoreAnswers('OPD-CA2-SQ', opdAnswers);
    
    expect(result).not.toBeNull();
    expect(typeof result.total).toBe('number');
    expect(result.control).toBeDefined();
    expect(result.identity).toBeDefined();
    expect(result.interpersonality).toBeDefined();
    expect(result.attachment).toBeDefined();
    expect(result.dimensionLabels).toEqual(['Control', 'Identidad', 'Interpersonalidad', 'Apego']);
  });

  test('OPD-CA2-SQ scoring handles invalid input gracefully', () => {
    // Test with wrong number of answers
    const invalidAnswers = [1, 2, 3]; // Only 3 answers instead of 81
    const result = scoreAnswers('OPD-CA2-SQ', invalidAnswers);
    
    // OPD-CA2-SQ returns object with null values for invalid input, not null itself
    expect(result.control).toBeNull();
    expect(result.identity).toBeNull();
    expect(result.interpersonality).toBeNull();
    expect(result.attachment).toBeNull();
  });

  test('Unknown questionnaire code returns null', () => {
    const result = scoreAnswers('UNKNOWN-CODE', [1, 2, 3]);
    expect(result).toBeNull();
  });

  test('Chart type configuration is correct for both questionnaires', () => {
    // WHO-5 should use line chart
    expect(questionnairesMeta['WHO-5'].chartType).toBe('line');
    expect(questionnairesMeta['WHO-5'].thresholds.warning).toBeDefined();
    
    // OPD-CA2-SQ should use multidimensional bar chart
    expect(questionnairesMeta['OPD-CA2-SQ'].chartType).toBe('bar-multidim');
    expect(questionnairesMeta['OPD-CA2-SQ'].dominio).toBe('Capacidades Psicodinámicas');
    expect(questionnairesMeta['OPD-CA2-SQ'].poblacion).toBe('Adolescentes y adultos');
  });

  test('Metadata includes all required fields', () => {
    const requiredFields = ['title', 'chartType', 'dominio', 'descripcion', 'poblacion'];
    
    Object.keys(questionnairesMeta).forEach(code => {
      const meta = questionnairesMeta[code];
      requiredFields.forEach(field => {
        expect(meta[field]).toBeDefined();
        expect(typeof meta[field]).toBe('string');
      });
    });
  });

  test('Evolution selector options match metadata titles', () => {
    // This test simulates the dropdown options in the patient dashboard
    const expectedOptions = [
      { value: 'WHO-5', label: questionnairesMeta['WHO-5'].title },
      { value: 'OPD-CA2-SQ', label: questionnairesMeta['OPD-CA2-SQ'].title }
    ];
    
    expectedOptions.forEach(option => {
      expect(questionnairesMeta[option.value]).toBeDefined();
      expect(questionnairesMeta[option.value].title).toBe(option.label);
    });
  });

  test('T-score ranges are appropriate for OPD-CA2-SQ', () => {
    // Generate sample OPD-CA2-SQ data
    const sampleAnswers = Array(81).fill(2); // All moderate responses
    const result = scoreAnswers('OPD-CA2-SQ', sampleAnswers);
    
    expect(result).not.toBeNull();
    
    // T-scores should typically be in range 20-80
    expect(result.control).toBeGreaterThanOrEqual(20);
    expect(result.control).toBeLessThanOrEqual(80);
    expect(result.identity).toBeGreaterThanOrEqual(20);
    expect(result.identity).toBeLessThanOrEqual(80);
    expect(result.interpersonality).toBeGreaterThanOrEqual(20);
    expect(result.interpersonality).toBeLessThanOrEqual(80);
    expect(result.attachment).toBeGreaterThanOrEqual(20);
    expect(result.attachment).toBeLessThanOrEqual(80);
  });

});
