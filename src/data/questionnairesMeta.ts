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
    title: 'Estructura Psíquica Adolescente (OPD-CA2-SQ)',
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
  },
  'BR-WAI': {
    code: 'BR-WAI',
    title: 'Alianza Terapéutica (BR-WAI)',
    shortTitle: 'BR-WAI',
    chartType: 'line-multi' as const,
    thresholds: {
      warning: 48, // Alianza frágil / riesgo de ruptura
      danger: undefined
    },
    // Extended metadata for UI/UX
    dominio: 'Alianza Terapéutica',
    descripcion: 'Cuestionario de 16 ítems que evalúa la calidad de la alianza terapéutica en sus dos componentes fundamentales: el vínculo emocional y el acuerdo sobre tareas y objetivos del tratamiento.',
    poblacion: 'Pacientes en psicoterapia (adolescentes y adultos)',
    tiempoMin: 3,
    frecuenciaRecomendada: 'Cada 4 semanas',
    autores: 'Horvath & Greenberg (1989), adaptación español rioplatense',
    añoPublicacion: 1989,
    dimensiones: [
      {
        nombre: 'Vínculo',
        descripcion: 'Relación de confianza y afecto mutuo entre terapeuta y paciente',
        items: [1, 3, 5, 7, 9, 11, 13, 15]
      },
      {
        nombre: 'Tareas-Objetivos', 
        descripcion: 'Acuerdo sobre los objetivos del tratamiento y las tareas necesarias para alcanzarlos',
        items: [2, 4, 6, 8, 10, 12, 14, 16]
      }
    ],
    items: [
      { orden: 1, texto: 'Mi terapeuta y yo nos entendemos mutuamente.', subescala: 'Vínculo' },
      { orden: 2, texto: 'Hemos logrado una buena comprensión de los cambios que serían buenos para mí.', subescala: 'Tareas-Objetivos' },
      { orden: 3, texto: 'Siento que mi terapeuta me valora.', subescala: 'Vínculo' },
      { orden: 4, texto: 'Creo que el tiempo que mi terapeuta y yo pasamos juntos no se aprovecha de forma eficiente.', subescala: 'Tareas-Objetivos', inverso: true },
      { orden: 5, texto: 'Creo que mi terapeuta me aprecia.', subescala: 'Vínculo' },
      { orden: 6, texto: 'Lo que hago en terapia me brinda nuevas maneras de mirar mi problema.', subescala: 'Tareas-Objetivos' },
      { orden: 7, texto: 'Siento que mi terapeuta se preocupa por mí aun cuando hago cosas que no aprueba.', subescala: 'Vínculo' },
      { orden: 8, texto: 'Mi terapeuta no entiende lo que intento lograr en la terapia.', subescala: 'Tareas-Objetivos', inverso: true },
      { orden: 9, texto: 'Confío en la capacidad de mi terapeuta para ayudarme.', subescala: 'Vínculo' },
      { orden: 10, texto: 'Siento que lo que hago en terapia me ayudará a conseguir los cambios que deseo.', subescala: 'Tareas-Objetivos' },
      { orden: 11, texto: 'Mi terapeuta y yo confiamos el uno en el otro.', subescala: 'Vínculo' },
      { orden: 12, texto: 'No estoy de acuerdo con mi terapeuta sobre qué debería obtener de la terapia.', subescala: 'Tareas-Objetivos', inverso: true },
      { orden: 13, texto: 'Creo que mi terapeuta se preocupa genuinamente por mi bienestar.', subescala: 'Vínculo' },
      { orden: 14, texto: 'Coincidimos en lo que es importante que trabaje.', subescala: 'Tareas-Objetivos' },
      { orden: 15, texto: 'Mi terapeuta y yo nos respetamos mutuamente.', subescala: 'Vínculo' },
      { orden: 16, texto: 'Las cosas que mi terapeuta me pide que haga no tienen sentido.', subescala: 'Tareas-Objetivos', inverso: true }
    ],
    respuestaTipo: 'Likert 1-5 (1=Totalmente en desacuerdo, 5=Totalmente de acuerdo)',
    scoring: {
      rango: [1, 5], // Raw scores per item
      sentido: 'mayor = mejor alianza',
      tipo: 'Puntuación total + 2 subescalas',
      itemsInversos: [4, 8, 12, 16],
      formulaFrontEnd: 'Suma de ítems (con inversión 4,8,12,16: 5→1, 4→2, 3→3, 2→4, 1→5)',
      puntosDeCorte: [
        {
          umbral: 48,
          label: 'Alianza frágil / riesgo de ruptura (≤48)'
        },
        {
          umbral: 59,
          label: 'Alianza moderada (49-59)'
        },
        {
          umbral: 60,
          label: 'Alianza sólida (≥60)'
        }
      ],
      subescalas: {
        vinculo: {
          items: [1, 3, 5, 7, 9, 11, 13, 15],
          rango: [8, 40],
          interpretacion: {
            fragil: 24,
            aceptable: 29,
            solida: 30
          }
        },
        tareasObjetivos: {
          items: [2, 4, 6, 8, 10, 12, 14, 16],
          itemsInversos: [4, 8, 12, 16],
          rango: [8, 40],
          interpretacion: {
            fragil: 24,
            aceptable: 29,
            solida: 30
          }
        }
      },
      interpretacion: {
        direccion: 'Las puntuaciones altas indican una alianza terapéutica más sólida',
        escalas: 'Puntuación total (16-80) y dos subescalas (8-40 cada una)',
        precision: 'Fiabilidad óptima con puntuaciones ≥60 (total) y ≥30 (subescalas)'
      }
    },
    validez: {
      fiabilidad: 'α de Cronbach: .93 (total), .85 (Vínculo), .87 (Tareas-Objetivos)',
      validezConstructo: 'Estructura bifactorial confirmada en múltiples estudios',
      estudiosClave: [
        {
          cita: 'Horvath, A. O., & Greenberg, L. S. (1989). Development and validation of the Working Alliance Inventory',
          doi: '10.1037/0022-0167.36.2.223'
        },
        {
          cita: 'Tracey, T. J., & Kokotovic, A. M. (1989). Factor structure of the Working Alliance Inventory',
          doi: '10.1037/0033-2909.105.3.323'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Teoría de la Alianza Terapéutica (Bordin, 1979)',
      enfoque: 'Evaluación de la calidad de la relación terapéutica',
      objetivo: 'Monitoreo y mejora de la alianza terapéutica durante el tratamiento',
      baseConceptual: 'Tres componentes: vínculo emocional, acuerdo sobre objetivos y acuerdo sobre tareas'
    },
    aplicacionClinica: {
      usoRecomendado: 'Aplicación cada 4 semanas durante el proceso terapéutico',
      requiere: 'Relación terapéutica establecida (no en primeras sesiones)',
      complementar: 'Discusión clínica de resultados con el paciente',
      advertencia: 'Herramienta de proceso, no de resultado terapéutico'
    }
  },

  'PHQ-9': {
    code: 'PHQ-9',
    title: 'Cuestionario de Salud del Paciente (PHQ-9)',
    shortTitle: 'PHQ-9',
    chartType: 'line' as const,
    thresholds: {
      warning: 10, // Total score ≥ 10 indicates moderate depression
      danger: 15 // Total score ≥ 15 indicates severe depression
    },
    // Extended metadata for UI/UX
    dominio: 'Depresión',
    descripcion: 'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?',
    poblacion: 'Adultos (≥18 años)',
    tiempoMin: 3,
    items: [
      { orden: 1, texto: 'Poco interés o placer en hacer cosas' },
      { orden: 2, texto: 'Sentirse decaído/a, deprimido/a o sin esperanzas' },
      { orden: 3, texto: 'Dificultad para dormir, permanecer dormido/a o dormir demasiado' },
      { orden: 4, texto: 'Sentirse cansado/a o con poca energía' },
      { orden: 5, texto: 'Falta de apetito o comer en exceso' },
      { orden: 6, texto: 'Sentirse mal consigo mismo/a (p. ej., sentirse fracasado/a o haber defraudado a otros)' },
      { orden: 7, texto: 'Dificultad para concentrarse (leer, ver TV, etc.)' },
      { orden: 8, texto: 'Haberse movido o hablado más lento de lo habitual — o lo contrario, más inquieto/a e intranquilo/a' },
      { orden: 9, texto: 'Pensamientos de que estaría mejor muerto/a o de hacerse daño' }
    ],
    respuestaTipo: 'Escala Likert 0-3',
    autores: 'Kroenke, Spitzer & Williams',
    añoPublicacion: 2001,
    dimensiones: [
      {
        nombre: 'Síntomas Nucleares de Depresión',
        descripcion: 'Evaluación de los 9 criterios diagnósticos del episodio depresivo mayor según DSM-5',
        subdimensiones: [
          'Anhedonia (ítem 1)',
          'Estado de ánimo deprimido (ítem 2)',
          'Alteraciones del sueño (ítem 3)',
          'Fatiga/pérdida de energía (ítem 4)',
          'Alteraciones del apetito (ítem 5)',
          'Sentimientos de inutilidad/culpa (ítem 6)',
          'Dificultades de concentración (ítem 7)',
          'Agitación/enlentecimiento psicomotor (ítem 8)',
          'Ideación suicida (ítem 9)'
        ]
      },
      {
        nombre: 'Impacto Funcional',
        descripcion: 'Evaluación del deterioro en el funcionamiento laboral, doméstico y social (ítem 10 - no puntuable)'
      }
    ],
    scoring: {
      rango: [0, 27] as const,
      sentido: 'A mayor puntuación, mayor severidad depresiva',
      tipo: 'Suma directa de ítems 1-9 (rango 0-3 cada uno)',
      puntosDeCorte: [
        { umbral: 5, label: 'Depresión leve' },
        { umbral: 10, label: 'Depresión moderada' },
        { umbral: 15, label: 'Depresión moderada-grave' },
        { umbral: 20, label: 'Depresión grave' }
      ] as const,
      interpretacion: {
        direccion: 'Puntuaciones más altas indican mayor severidad de síntomas depresivos',
        escalas: '0-4: Ninguna-mínima | 5-9: Leve | 10-14: Moderada | 15-19: Moderada-grave | 20-27: Grave',
        puntuacionTotal: 'Suma de ítems 1-9. Ítem 10 no se puntúa (solo evaluación funcional)'
      },
      alertas: {
        riesgoSuicida: {
          item: 9,
          umbral: 0,
          descripcion: 'Cualquier puntuación > 0 en ítem 9 requiere evaluación inmediata de riesgo suicida'
        },
        riesgoGeneral: {
          umbral: 10,
          descripcion: 'Puntuación total ≥ 10 indica necesidad de intervención clínica'
        }
      } as const
    },
    validez: {
      fiabilidad: 'Consistencia interna α = 0.89. Test-retest r = 0.84',
      muestra: 'Validado en atención primaria y poblaciones clínicas diversas',
      validezClinica: 'Sensibilidad 88% y especificidad 88% para depresión mayor (punto de corte ≥10)',
      estudiosClave: [
        {
          cita: 'Kroenke, K., Spitzer, R. L., & Williams, J. B. (2001). The PHQ-9: validity of a brief depression severity measure. Journal of General Internal Medicine, 16(9), 606-613.',
          doi: '10.1046/j.1525-1497.2001.016009606.x'
        },
        {
          cita: 'Manea, L., Gilbody, S., & McMillan, D. (2012). Optimal cut-off score for diagnosing depression with the Patient Health Questionnaire (PHQ-9): a meta-analysis. CMAJ, 184(3), E191-E196.',
          doi: '10.1503/cmaj.110829'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Criterios diagnósticos DSM-5 para episodio depresivo mayor',
      enfoque: 'Modelo biomédico de la depresión con énfasis en síntomas observables',
      objetivo: 'Cribado, diagnóstico y monitoreo de la severidad de síntomas depresivos',
      baseConceptual: 'Correspondencia directa con los 9 criterios del DSM-5 para episodio depresivo mayor'
    },
    aplicacionClinica: {
      usoRecomendado: 'Cribado en atención primaria, seguimiento en tratamiento, investigación clínica. Aplicación sugerida cada 2 semanas durante tratamiento activo',
      requiere: 'Capacitación básica en salud mental. Evaluación clínica complementaria para diagnóstico definitivo',
      complementar: 'Entrevista clínica estructurada, evaluación de riesgo suicida, escalas de ansiedad (GAD-7)',
      advertencia: '⚠️ CRÍTICO: Cualquier puntuación > 0 en ítem 9 requiere evaluación inmediata de riesgo suicida. No es sustituto del juicio clínico profesional.'
    }
  },
  'GAD-7': {
    code: 'GAD-7',
    title: 'Ansiedad Generalizada (GAD-7)',
    shortTitle: 'GAD-7',
    chartType: 'line' as const,
    thresholds: {
      warning: 10, // Ansiedad moderada - requiere intervención
      danger: 15 // Ansiedad severa - tratamiento activo
    },
    // Extended metadata for UI/UX
    dominio: 'Ansiedad',
    descripcion: 'Durante las últimas 2 semanas, ¿con qué frecuencia ha tenido molestias debido a los siguientes problemas? Seleccione la opción que mejor describa su experiencia.',
    poblacion: 'Adolescentes y adultos',
    tiempoMin: 2,
    autores: 'Spitzer, Kroenke, Williams & Löwe (2006)',
    añoPublicacion: 2006,
    items: [
      { orden: 1, texto: 'Sentirse nervioso/a, ansioso/a o tenso/a' },
      { orden: 2, texto: 'No poder parar ni controlar la preocupación' },
      { orden: 3, texto: 'Preocuparse demasiado por diferentes cosas' },
      { orden: 4, texto: 'Dificultad para relajarse' },
      { orden: 5, texto: 'Estar tan inquieto/a que le cuesta quedarse quieto/a' },
      { orden: 6, texto: 'Irritable o fácilmente enfadado/a' },
      { orden: 7, texto: 'Sentir miedo como si algo terrible pudiera pasar' }
    ],
    respuestaTipo: 'Likert 0-3 (0=Nunca, 1=Varios días, 2=Más de la mitad de los días, 3=Casi todos los días)',
    scoring: {
      rango: [0, 21] as const,
      sentido: 'A mayor puntuación, mayor severidad de ansiedad',
      tipo: 'Suma directa de ítems 1-7 (rango 0-3 cada uno)',
      puntosDeCorte: [
        { umbral: 5, label: 'Ansiedad leve' },
        { umbral: 10, label: 'Ansiedad moderada' },
        { umbral: 15, label: 'Ansiedad severa' }
      ] as const,
      interpretacion: {
        direccion: 'Puntuaciones más altas indican mayor severidad de síntomas de ansiedad',
        escalas: '0-4: Ninguna-mínima | 5-9: Leve | 10-14: Moderada | 15-21: Severa',
        puntuacionTotal: 'Suma de ítems 1-7'
      },
      alertas: {
        riesgoGeneral: {
          umbral: 10,
          descripcion: 'Puntuación total ≥ 10 indica necesidad de plan de tratamiento'
        }
      } as const
    },
    validez: {
      fiabilidad: 'Consistencia interna α = 0.92. Test-retest r = 0.83',
      muestra: 'Validado en atención primaria y poblaciones clínicas diversas',
      validezClinica: 'Sensibilidad 89% y especificidad 82% para trastorno de ansiedad generalizada (punto de corte ≥10)',
      estudiosClave: [
        {
          cita: 'Spitzer, R. L., Kroenke, K., Williams, J. B. W., & Löwe, B. (2006). A brief measure for assessing generalized anxiety disorder: the GAD-7. Archives of Internal Medicine, 166(10), 1092-1097.',
          doi: '10.1001/archinte.166.10.1092'
        },
        {
          cita: 'Löwe, B., Decker, O., Müller, S., et al. (2008). Validation and standardization of the Generalized Anxiety Disorder Screener (GAD-7) in the general population. Medical Care, 46(3), 266-274.',
          doi: '10.1097/MLR.0b013e318160d093'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Criterios diagnósticos DSM-5 para trastorno de ansiedad generalizada',
      enfoque: 'Modelo biomédico de la ansiedad con énfasis en síntomas observables',
      objetivo: 'Cribado, diagnóstico y monitoreo de la severidad de síntomas de ansiedad generalizada',
      baseConceptual: 'Correspondencia con criterios clínicos para trastorno de ansiedad generalizada'
    },
    aplicacionClinica: {
      usoRecomendado: 'Cribado en atención primaria, seguimiento en tratamiento, investigación clínica. Aplicación sugerida cada 2 semanas durante tratamiento activo',
      requiere: 'Capacitación básica en salud mental. Evaluación clínica complementaria para diagnóstico definitivo',
      complementar: 'Entrevista clínica estructurada, escalas de depresión (PHQ-9), evaluación de otros trastornos de ansiedad',
      advertencia: '⚠️ Puntuación ≥ 10 requiere consulta con profesional de salud mental. No es sustituto del juicio clínico profesional.'
    }
  }
} as const;

export type QuestionnaireCode = keyof typeof questionnairesMeta;
export type ChartType = 'line' | 'bar' | 'scatter' | 'bar-multidim' | 'line-multi';

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
