/**
 * Función de scoring para GAD-7 (Generalized Anxiety Disorder 7-item scale)
 * 
 * El GAD-7 es un cuestionario de 7 ítems que evalúa la severidad del trastorno
 * de ansiedad generalizada durante las últimas dos semanas.
 * 
 * Cada ítem se puntúa de 0-3:
 * 0 = Nunca
 * 1 = Varios días  
 * 2 = Más de la mitad de los días
 * 3 = Casi todos los días
 * 
 * Puntuación total: 0-21 (suma directa de todos los ítems)
 * 
 * Interpretación:
 * 0-4: Ninguna-mínima ansiedad
 * 5-9: Ansiedad leve
 * 10-14: Ansiedad moderada
 * 15-21: Ansiedad severa
 * 
 * @param answers Array de 7 respuestas (valores 0-3)
 * @returns Puntuación total y interpretación
 */

export interface ScoreDetalladoGad7 {
  total: number;
  severidad: 'Ninguna-mínima' | 'Leve' | 'Moderada' | 'Severa';
  recomendacion: string;
  alertFlag: boolean;
}

export function scoreGad7(answers: number[]): ScoreDetalladoGad7 {
  // Validación de entrada
  if (!Array.isArray(answers)) {
    throw new Error('Las respuestas deben ser un array');
  }
  
  if (answers.length !== 7) {
    throw new Error(`GAD-7 requiere exactamente 7 respuestas, se recibieron ${answers.length}`);
  }
  
  // Validar rango de cada respuesta (0-3)
  for (let i = 0; i < answers.length; i++) {
    const answer = answers[i];
    if (typeof answer !== 'number' || answer < 0 || answer > 3) {
      throw new Error(`Respuesta ${i + 1} debe estar entre 0 y 3, se recibió: ${answer}`);
    }
  }
  
  // Calcular puntuación total (suma directa)
  const total = answers.reduce((sum, answer) => sum + answer, 0);
  
  // Determinar severidad según puntos de corte
  let severidad: ScoreDetalladoGad7['severidad'];
  let recomendacion: string;
  let alertFlag: boolean;
  
  if (total <= 4) {
    severidad = 'Ninguna-mínima';
    recomendacion = 'Sin intervención formal necesaria';
    alertFlag = false;
  } else if (total <= 9) {
    severidad = 'Leve';
    recomendacion = 'Repetir GAD-7 en próximo control';
    alertFlag = false;
  } else if (total <= 14) {
    severidad = 'Moderada';
    recomendacion = 'Plan de tratamiento; considerar TCC ± fármacos';
    alertFlag = true;
  } else {
    severidad = 'Severa';
    recomendacion = 'Tratamiento activo; derivar si respuesta insuficiente';
    alertFlag = true;
  }
  
  return {
    total,
    severidad,
    recomendacion,
    alertFlag
  };
}
