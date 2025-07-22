/**
 * BR-WAI (Brief Revised Working Alliance Inventory) Scoring Function
 * 
 * Cuestionario de 16 ítems que evalúa la alianza terapéutica
 * - Escala Likert 1-5
 * - 4 ítems inversos: 4, 8, 12, 16
 * - 2 subescalas: Vínculo (8 ítems) y Tareas-Objetivos (8 ítems)
 * - Rango total: 16-80 puntos
 * - Rango por subescala: 8-40 puntos
 */

export interface BrWaiResult {
  total: number;
  vinculo: number;
  tareasObjetivos: number;
  interpretacion: {
    total: string;
    vinculo: string;
    tareasObjetivos: string;
  };
}

export function scoreBrWai(answers: number[]): BrWaiResult {
  if (answers.length !== 16) {
    throw new Error('BR-WAI requires exactly 16 answers');
  }

  // Verificar que todas las respuestas estén en el rango válido (1-5)
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] < 1 || answers[i] > 5) {
      throw new Error(`Answer ${i + 1} must be between 1 and 5, got ${answers[i]}`);
    }
  }

  // Ítems inversos (posiciones 4, 8, 12, 16 → índices 3, 7, 11, 15)
  const reverseItems = [3, 7, 11, 15];
  
  // Crear copia de respuestas e invertir los ítems necesarios
  const processedAnswers = answers.map((answer, index) => {
    if (reverseItems.includes(index)) {
      // Inversión: 1→5, 2→4, 3→3, 4→2, 5→1
      return 6 - answer;
    }
    return answer;
  });

  // Ítems por subescala (índices base 0)
  const vinculoItems = [0, 2, 4, 6, 8, 10, 12, 14]; // ítems 1, 3, 5, 7, 9, 11, 13, 15
  const tareasObjetivosItems = [1, 3, 5, 7, 9, 11, 13, 15]; // ítems 2, 4, 6, 8, 10, 12, 14, 16

  // Calcular puntuaciones
  const vinculo = vinculoItems.reduce((sum, index) => sum + processedAnswers[index], 0);
  const tareasObjetivos = tareasObjetivosItems.reduce((sum, index) => sum + processedAnswers[index], 0);
  const total = vinculo + tareasObjetivos;

  // Interpretaciones
  const getInterpretacionTotal = (score: number): string => {
    if (score <= 48) return 'Alianza frágil / riesgo de ruptura';
    if (score <= 59) return 'Alianza moderada';
    return 'Alianza sólida';
  };

  const getInterpretacionSubescala = (score: number): string => {
    if (score <= 24) return 'Frágil';
    if (score <= 29) return 'Aceptable';
    return 'Sólida';
  };

  return {
    total,
    vinculo,
    tareasObjetivos,
    interpretacion: {
      total: getInterpretacionTotal(total),
      vinculo: getInterpretacionSubescala(vinculo),
      tareasObjetivos: getInterpretacionSubescala(tareasObjetivos)
    }
  };
}
