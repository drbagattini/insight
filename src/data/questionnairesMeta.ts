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
    title: 'OPD-CA2-SQ - Cuestionario de Capacidades Operacionalizadas',
    shortTitle: 'OPD-CA2-SQ',
    chartType: 'bar-multidim' as const,
    thresholds: {
      warning: 60, // T-scores > 60 suggest possible personality disorder
      danger: undefined
    },
    // Extended metadata for UI/UX
    dominio: 'Estructura de Personalidad',
    descripcion: 'Diagnóstico Psicodinámico Operacionalizado para niños y adolescentes. Cuestionario de autoreporte de 81 ítems que evalúa el nivel de estructura de la personalidad en cuatro dimensiones principales para la detección temprana de trastornos de personalidad en desarrollo.',
    poblacion: 'Adolescentes de 12 a 18 años (+/- 2 años según nivel de desarrollo)',
    tiempoMin: 15,
    autores: 'Moises Kassin & Jan Hackradt (versión española)',
    autoresOriginales: 'Goth K & Schmeck K (versión alemana original)',
    añoPublicacion: 2020,
    dimensiones: [
      { 
        nombre: 'Regulación', 
        descripcion: 'Control de impulsos, tolerancia afectiva, formación de conciencia, regulación de autoestima',
        subdimensiones: [
          'Regulación de impulsos',
          'Tolerancia afectiva', 
          'Instancias de regulación/Formación de conciencia',
          'Regulación de autoestima'
        ]
      },
      { 
        nombre: 'Identidad', 
        descripcion: 'Coherencia, percepción de sí mismo, diferenciación yo-objetos, percepción de objetos, pertenencia',
        subdimensiones: [
          'Coherencia',
          'Percepción de sí mismo',
          'Diferenciación Yo-objetos',
          'Percepción de objetos',
          'Pertenencia'
        ]
      },
      { 
        nombre: 'Interpersonalidad', 
        descripcion: 'Fantasías, contacto emocional, reciprocidad, percepción afectiva, empatía, capacidad de separarse',
        subdimensiones: [
          'Fantasías',
          'Toma de contactos emocional',
          'Reciprocidad',
          'Percepción de afectos',
          'Empatía',
          'Capacidad de separarse'
        ]
      },
      { 
        nombre: 'Apego', 
        descripcion: 'Acceso a representaciones de apego, base segura interna, capacidad de estar solo, uso de relaciones de apego',
        subdimensiones: [
          'Acceso a representaciones de apego',
          'Base segura interna',
          'Capacidad de estar solo',
          'Uso de relaciones de apego'
        ]
      }
    ],
    respuestaTipo: 'Likert 0-4 (0=No, 1=Más no, 2=Parte/parte, 3=Más sí, 4=Sí)',
    scoring: {
      rango: [0, 4], // Raw scores per item
      sentido: 'mayor = mayor patología',
      tipo: 'T-scores por dimensión y puntuación total',
      formulaFrontEnd: 'Puntuaciones brutas convertidas a T-scores según normas poblacionales',
      puntosDeCorte: [
        {
          umbral: 60,
          label: 'T-scores > 60 sugieren posible trastorno de personalidad en desarrollo o existente'
        }
      ],
      interpretacion: {
        direccion: 'Las puntuaciones altas indican mayor alteración estructural',
        escalas: 'Cuatro escalas primarias con 4-6 subescalas cada una',
        puntuacionTotal: 'Puntuación total de todos los ítems disponible'
      }
    },
    validez: {
      fiabilidad: 'α de Cronbach: .96 total, .85 (Regulación), .87 (Identidad), .87 (Interpersonalidad), .75 (Apego)',
      muestra: 'N=1393 estudiantes + N=31 pacientes (México)',
      validezClinica: 'Diferencias significativas entre estudiantes y pacientes con TP (d=1.7, p<.000)',
      estudiosClave: [
        {
          cita: 'Kassin M, Hackradt J (2020). Adaptación cultural de la versión al Español del cuestionario OPD-CA2-SQ',
          doi: 'academic-tests.com'
        },
        {
          cita: 'Goth K & Schmeck K (versión alemana original). OPD-KJ2-SF',
          doi: 'academic-tests.com'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Diagnóstico Psicodinámico Operacionalizado (OPD-KJ-2)',
      enfoque: 'Evaluación dimensional de la estructura psicológica',
      objetivo: 'Detección temprana de trastornos de personalidad en desarrollo',
      baseConceptual: 'Integra ideas de múltiples escuelas psicológicas: investigación infantil, del apego, emocional, del temperamento, psicopatología del desarrollo, psicología del self y teoría de relaciones objetales'
    },
    aplicacionClinica: {
      usoRecomendado: 'Elemento valioso pero no base suficiente para diagnóstico',
      requiere: 'Proceso diagnóstico cuidadoso, exhaustivo y responsable',
      complementar: 'Evaluación clínica, autoreporte e informe ajeno',
      advertencia: 'Especialmente importante para adolescentes - no usar como herramienta diagnóstica única'
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
