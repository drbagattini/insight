// Sistema de alertas clínicas para Ohio Youth Scales
// Calcula alertas basadas en respuestas específicas según criterios oficiales

export interface OYSAlert {
  type: 'tdah' | 'sustancias' | 'autolesion';
  severity: 'warning' | 'danger';
  message: string;
  evidence: {
    item: number;
    value: number;
    text: string;
  }[];
  recommendations: string[];
}

export interface OYSAlertResult {
  hasAlerts: boolean;
  alerts: OYSAlert[];
  summary: string;
}

/**
 * Calcula alertas clínicas para Ohio Youth Scales
 * @param cuestionarioCodigo - Código del cuestionario (OYS-PS-P-SF20, OYS-F-P-SF20, etc.)
 * @param respuestas - Array de respuestas [valor1, valor2, ..., valor20]
 * @returns Resultado con alertas detectadas
 */
export function calculateOYSAlerts(
  cuestionarioCodigo: string, 
  respuestas: number[]
): OYSAlertResult {
  const alerts: OYSAlert[] = [];

  // Solo calcular alertas para cuestionarios de Problemas (PS)
  if (!cuestionarioCodigo.includes('PS')) {
    return { hasAlerts: false, alerts: [], summary: 'Sin alertas (cuestionario de funcionamiento)' };
  }

  // ALERTA TDAH - Ítem 11 ≥ 3 (A menudo o más)
  if (respuestas[10] >= 3) { // Ítem 11 (índice 10)
    alerts.push({
      type: 'tdah',
      severity: 'warning',
      message: 'Indicador de tamizaje TDAH positivo',
      evidence: [{
        item: 11,
        value: respuestas[10],
        text: 'No puede quedarse quieto/a, tiene demasiada energía'
      }],
      recommendations: [
        'Considerar evaluación especializada para TDAH',
        'Revisar historial académico y comportamental',
        'Evaluar necesidad de intervención psicopedagógica'
      ]
    });
  }

  // ALERTA CONSUMO DE SUSTANCIAS - Ítem 7 ≥ 2 (Varias veces o más)
  if (respuestas[6] >= 2) { // Ítem 7 (índice 6)
    alerts.push({
      type: 'sustancias',
      severity: 'danger',
      message: 'Consumo de drogas o alcohol detectado',
      evidence: [{
        item: 7,
        value: respuestas[6],
        text: 'Consumo de drogas o alcohol'
      }],
      recommendations: [
        'Evaluación inmediata del patrón de consumo',
        'Considerar derivación a especialista en adicciones',
        'Implementar plan de intervención familiar',
        'Monitoreo estrecho y seguimiento'
      ]
    });
  }

  // ALERTA RIESGO AUTOLESIÓN - Ítems 12 o 13 ≥ 1 (Cualquier frecuencia)
  const autolesionItems = [];
  if (respuestas[11] >= 1) { // Ítem 12 (índice 11)
    autolesionItems.push({
      item: 12,
      value: respuestas[11],
      text: 'Hacerse daño (cortarse o rasguñarse, tomar pastillas)'
    });
  }
  if (respuestas[12] >= 1) { // Ítem 13 (índice 12)
    autolesionItems.push({
      item: 13,
      value: respuestas[12],
      text: 'Hablar o pensar sobre la muerte'
    });
  }

  if (autolesionItems.length > 0) {
    alerts.push({
      type: 'autolesion',
      severity: 'danger',
      message: 'Riesgo de autolesión o ideación suicida detectado',
      evidence: autolesionItems,
      recommendations: [
        '🚨 EVALUACIÓN INMEDIATA DE RIESGO SUICIDA',
        'No dejar solo/a al paciente',
        'Contactar servicios de emergencia si es necesario',
        'Implementar plan de seguridad',
        'Derivación urgente a salud mental especializada'
      ]
    });
  }

  // Generar resumen
  let summary = '';
  if (alerts.length === 0) {
    summary = 'Sin alertas clínicas detectadas';
  } else {
    const alertTypes = alerts.map(a => {
      switch (a.type) {
        case 'tdah': return 'TDAH';
        case 'sustancias': return 'Sustancias';
        case 'autolesion': return 'Autolesión';
        default: return a.type;
      }
    });
    summary = `${alerts.length} alerta(s): ${alertTypes.join(', ')}`;
  }

  return {
    hasAlerts: alerts.length > 0,
    alerts,
    summary
  };
}

/**
 * Calcula alertas adicionales para cuestionarios de Funcionamiento
 * @param cuestionarioCodigo - Código del cuestionario de funcionamiento
 * @param respuestas - Array de respuestas
 * @returns Alertas específicas de funcionamiento
 */
export function calculateOYSFunctioningAlerts(
  cuestionarioCodigo: string,
  respuestas: number[]
): OYSAlertResult {
  const alerts: OYSAlert[] = [];

  // Solo para cuestionarios de Funcionamiento (F)
  if (!cuestionarioCodigo.includes('F')) {
    return { hasAlerts: false, alerts: [], summary: 'Sin alertas (cuestionario de problemas)' };
  }

  // ALERTA TDAH - Ítem 16 ≤ 1 (Bastantes problemas o extremos)
  if (respuestas[15] <= 1) { // Ítem 16 (índice 15)
    alerts.push({
      type: 'tdah',
      severity: 'warning',
      message: 'Indicador de tamizaje TDAH positivo (funcionamiento)',
      evidence: [{
        item: 16,
        value: respuestas[15],
        text: 'Concentrarse, prestar atención y completar tareas'
      }],
      recommendations: [
        'Considerar evaluación especializada para TDAH',
        'Revisar estrategias de concentración y atención',
        'Evaluar necesidad de apoyo académico'
      ]
    });
  }

  const summary = alerts.length > 0 
    ? `${alerts.length} alerta(s) de funcionamiento: TDAH`
    : 'Sin alertas de funcionamiento detectadas';

  return {
    hasAlerts: alerts.length > 0,
    alerts,
    summary
  };
}

/**
 * Combina alertas de Problemas y Funcionamiento para una evaluación completa
 */
export function combineOYSAlerts(
  problemsAlerts: OYSAlertResult,
  functioningAlerts: OYSAlertResult
): OYSAlertResult {
  const combinedAlerts = [...problemsAlerts.alerts, ...functioningAlerts.alerts];
  
  // Eliminar duplicados de TDAH si aparece en ambos
  const uniqueAlerts = combinedAlerts.filter((alert, index, arr) => {
    if (alert.type === 'tdah') {
      return arr.findIndex(a => a.type === 'tdah') === index;
    }
    return true;
  });

  const summary = uniqueAlerts.length > 0
    ? `${uniqueAlerts.length} alerta(s) clínica(s) detectada(s)`
    : 'Sin alertas clínicas detectadas';

  return {
    hasAlerts: uniqueAlerts.length > 0,
    alerts: uniqueAlerts,
    summary
  };
}
