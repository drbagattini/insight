export interface Phq9Result {
  total: number;
  item9: number; // Ítem de ideación suicida
  severidad: string;
  accionClinica: string;
  riesgoSuicida: boolean;
  alertaGeneral: boolean;
}

/**
 * Calcula la puntuación del PHQ-9 (Patient Health Questionnaire-9)
 * 
 * @param answers Array de 9 respuestas (0-3 cada una)
 * @returns Objeto con puntuación total, severidad, alertas y recomendaciones clínicas
 */
export function scorePhq9(answers: number[]): Phq9Result {
  // Validar número de respuestas (9 ítems puntuables)
  if (answers.length !== 9) {
    throw new Error('PHQ-9 requires exactly 9 answers');
  }

  // Validar rango de respuestas (0-3 para ítems 1-9)
  for (let i = 0; i < 9; i++) {
    if (answers[i] < 0 || answers[i] > 3) {
      throw new Error(`Answer ${i + 1} must be between 0 and 3, got ${answers[i]}`);
    }
  }



  // Calcular puntuación total (solo ítems 1-9)
  const total = answers.slice(0, 9).reduce((sum, answer) => sum + answer, 0);
  
  // Extraer ítem 9 (ideación suicida)
  const item9 = answers[8]; // Índice 8 = ítem 9

  // Determinar severidad según puntuación total
  const getSeveridad = (score: number): string => {
    if (score <= 4) return 'Ninguna - mínima';
    if (score <= 9) return 'Leve';
    if (score <= 14) return 'Moderada';
    if (score <= 19) return 'Moderada-grave';
    return 'Grave';
  };

  // Determinar acción clínica recomendada
  const getAccionClinica = (score: number): string => {
    if (score <= 4) return 'Sin intervención formal';
    if (score <= 9) return '"Observación activa": repetir PHQ-9 en el siguiente control';
    if (score <= 14) return 'Elaborar plan de tratamiento; considerar psicoterapia y/o fármacos';
    if (score <= 19) return 'Tratamiento activo con psicoterapia ± farmacoterapia';
    return 'Iniciar farmacoterapia; si respuesta pobre o riesgo alto, derivar a especialista';
  };



  // Determinar alertas
  const riesgoSuicida = item9 > 0; // Cualquier puntuación > 0 en ítem 9
  const alertaGeneral = total >= 10; // Puntuación total ≥ 10

  const severidad = getSeveridad(total);
  const accionClinica = getAccionClinica(total);


  return {
    total,
    item9,
    severidad,
    accionClinica,
    riesgoSuicida,
    alertaGeneral
  };
}
