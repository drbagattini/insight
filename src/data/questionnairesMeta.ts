// Static meta-data for questionnaires. This file is user-maintained – DO NOT modify automatically.
// When adding new questionnaires, follow the structure shown for WHO-5 and commit the changes.

const questionnairesMeta = {
  'WHO-5': {
    code: 'WHO-5',
    title: 'Índice de Bienestar (WHO-5)',
    shortTitle: 'WHO-5',
    chartType: 'line' as const,
    thresholds: {
      warning: 13, // Raw score < 13 indicates possible depression
      danger: undefined // Optional danger threshold
    },
    // Extended metadata for UI/UX
    dominio: 'Bienestar',
    descripcion:
      'Cuestionario de 5 ítems que evalúa el bienestar subjetivo durante las últimas dos semanas. Traducción española oficial (WHO-5, versión 1998).',
    poblacion: 'Adolescentes y adultos',
    tiempoMin: 1,
    items: [
      { orden: 1, texto: 'Me he sentido alegre y de buen humor' },
      { orden: 2, texto: 'Me he sentido tranquilo y relajado' },
      { orden: 3, texto: 'Me he sentido activo y enérgico' },
      { orden: 4, texto: 'Me he despertado fresco y descansado' },
      {
        orden: 5,
        texto: 'Mi vida cotidiana ha estado llena de cosas que me interesan'
      }
    ],
    respuestaTipo:
      'Likert 0-5 (0=Nunca, 5=Todo el tiempo). Sumar y multiplicar ×4 para escalar 0-100',
    scoring: {
      rango: [0, 100],
      sentido: 'mayor = mejor',
      puntosDeCorte: [
        {
          umbral: 52,
          label:
            'Posible depresión (<13 crudo). Sugerir Inventario ICD-10 de Depresión'
        }
      ],
      formulaFrontEnd: '(Σ ítems) * 4'
    },
    validez: {
      fiabilidad: 'α = 0.86 (Topp 2015)',
      estudiosClave: [
        {
          cita: 'Topp et al., 2015, Clin Psych',
          doi: '10.1016/j.cpr.2015.01.001'
        }
      ]
    }
  },
  'OPD-CA2-SQ': {
    code: 'OPD-CA2-SQ',
    title: 'Estructura psíquica adolescente (OPD-CA2-SQ)',
    shortTitle: 'OPD-CA2-SQ',
    chartType: 'bar-multidim' as const,
    thresholds: {
      warning: undefined, // T-scores will be used instead
      danger: undefined
    },
    // Extended metadata for UI/UX
    dominio: 'Capacidades Psicodinámicas',
    descripcion: 'Cuestionario de 81 ítems que evalúa cuatro dimensiones de capacidades psicodinámicas según el modelo OPD.',
    poblacion: 'Adolescentes y adultos',
    tiempoMin: 15,
    dimensiones: [
      { nombre: 'Regulación', descripcion: 'Capacidad de regulación emocional' },
      { nombre: 'Comunicación', descripcion: 'Capacidad de comunicación interpersonal' },
      { nombre: 'Vinculación', descripcion: 'Capacidad de establecer vínculos' },
      { nombre: 'Introspección', descripcion: 'Capacidad de introspección y autoconocimiento' }
    ],
    respuestaTipo: 'Likert 0-4 (0=Nunca, 1=Raramente, 2=A veces, 3=A menudo, 4=Siempre)',
    scoring: {
      rango: [20, 80], // T-scores range
      sentido: 'mayor = mejor',
      tipo: 'T-scores por dimensión',
      formulaFrontEnd: 'Conversión a T-scores según tablas normativas'
    },
    validez: {
      fiabilidad: 'Pendiente de documentar',
      estudiosClave: [
        {
          cita: 'OPD Task Force, 2008',
          doi: 'Pendiente'
        }
      ]
    }
  }
} as const;

export type QuestionnaireCode = keyof typeof questionnairesMeta;
export type ChartType = 'line' | 'bar' | 'scatter' | 'bar-multidim';

export interface QuestionnaireMetadata {
  title: string;
  chartType: ChartType;
  thresholds: {
    warning?: number;
    danger?: number;
  };
  // Additional metadata fields can be added as needed
}

export default questionnairesMeta;
