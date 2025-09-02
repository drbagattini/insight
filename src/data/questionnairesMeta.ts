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
      'Por favor, responda a cada pregunta en relación a cómo se sintió en las últimas dos semanas.',
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
    descripcion:
      'Este cuestionario evalúa cómo te sientes respecto a la relación con tu terapeuta y el trabajo que están realizando juntos. Tus respuestas ayudarán a mejorar la calidad de tu tratamiento.',
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
      fiabilidad: 'Análisis IRT (2015): α = .87 (Vínculo), .91 (Tareas), .90 (Objetivos). Versión breve BAI: α = .93 (Vínculo), .89 (Tareas/Objetivos)',
      muestra: 'Análisis IRT 2015: 1,786 clientes de centros de asesoramiento universitario y clínicas comunitarias (70% mujeres, 81% blancos)',
      validezConstructo: 'Análisis IRT confirma problemas con escala de 7 puntos original. Estructura bifactorial (Vínculo + Tareas/Objetivos combinados) con mejor ajuste que modelo trifactorial',
      hallazgosIRT: 'Umbrales de categoría cruzados en escala 7 puntos. Recodificación 5/4 puntos mejora fiabilidad y reduce varianza de error (11-26%). Correlaciones superiores con proceso y resultado terapéutico',
      estudiosClave: [
        {
          cita: 'Mallinckrodt, B., & Tekie, Y. T. (2015). Item response theory analysis of Working Alliance Inventory, revised response format, and new Brief Alliance Inventory. Psychotherapy Research, 26(6), 694-718.',
          doi: '10.1080/10503307.2015.1061718'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Teoría de la Alianza Terapéutica (Bordin, 1979)',
      enfoque: 'Evaluación de la calidad de la relación terapéutica',
      objetivo: 'Monitoreo y mejora de la alianza terapéutica durante el tratamiento',
      baseConceptual: 'Modelo original trifactorial (vínculo, tareas, objetivos). Análisis IRT 2015 sugiere estructura bifactorial más robusta: Vínculo + Tareas/Objetivos combinados (r=.99 entre Tareas y Objetivos)',
      evidenciaEmpírica: 'Clientes no distinguen significativamente entre tareas y objetivos terapéuticos. Ambos constructos representan "actividades de asesoramiento" unificadas'
    },
    aplicacionClinica: {
      usoRecomendado: 'Aplicación cada 4 semanas durante el proceso terapéutico. Considerar formato de respuesta Likert 5 puntos (acuerdo) vs. frecuencia 7 puntos para mejor precisión',
      requiere: 'Relación terapéutica establecida (no en primeras sesiones)',
      complementar: 'Discusión clínica de resultados con el paciente. Monitoreo de subescalas por separado (Vínculo vs. Tareas/Objetivos)',
      advertencia: '⚠️ IMPORTANTE: Escala frecuencia 7 puntos presenta problemas psicométricos (umbrales cruzados). Recodificación 5/4 puntos mejora fiabilidad. Herramienta de proceso, no de resultado terapéutico',
      recomendacionesIRT: 'Combinar categorías bajas de respuesta (nunca/raramente/ocasionalmente) para mejorar discriminación. Considerar Brief Alliance Inventory (BAI) para aplicaciones de investigación'
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
      fiabilidad: 'Consistencia interna α = 0.78-0.90 (versión española). Test-retest r = 0.84 (versión original)',
      muestra: 'Meta-análisis 2023: 5,164 adultos hispanohablantes en 10 estudios (edad media 34.1-71.8 años). Validado principalmente en atención primaria (8/10 estudios)',
      validezClinica: 'Versión española: Sensibilidad 86% (IC 95%: 82-90%), especificidad 80% (IC 95%: 75-85%), AUC 0.88 (IC 95%: 0.87-0.90). Puntos de corte óptimos variables: 5-12 (vs. ≥10 estándar)',
      estudiosClave: [
        {
          cita: 'Martinez, A., Teklu, S. M., Tahir, P., & Garcia, M. E. (2023). Validity of the Spanish-Language Patient Health Questionnaires 2 and 9: A Systematic Review and Meta-Analysis. JAMA Network Open, 6(10), e2336529.',
          doi: '10.1001/jamanetworkopen.2023.36529'
        },
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
      baseConceptual: 'Correspondencia directa con los 9 criterios del DSM-5 para episodio depresivo mayor. Meta-análisis 2023 confirma validez en poblaciones hispanohablantes con variabilidad en puntos de corte óptimos (5-12) según contexto cultural y clínico'
    },
    aplicacionClinica: {
      usoRecomendado: 'Cribado en atención primaria, seguimiento en tratamiento, investigación clínica. Aplicación sugerida cada 2 semanas durante tratamiento activo',
      requiere: 'Capacitación básica en salud mental. Evaluación clínica complementaria para diagnóstico definitivo',
      complementar: 'Entrevista clínica estructurada, evaluación de riesgo suicida, escalas de ansiedad (GAD-7)',
      advertencia: '⚠️ CRÍTICO: Cualquier puntuación > 0 en ítem 9 requiere evaluación inmediata de riesgo suicida. ⚠️ IMPORTANTE: En poblaciones hispanohablantes, considerar depresión con puntuaciones menores (puntos de corte óptimos 5-12 vs. ≥10 estándar). No es sustituto del juicio clínico profesional.'
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
    descripcion: 'Durante las últimas 2 semanas, ¿con qué frecuencia ha tenido molestias debido a los siguientes problemas?',
    poblacion: 'Adolescentes y adultos (validado en España en población de 19-85 años)',
    tiempoMin: 2.5,
    autores: 'García-Campayo, Zamorano, Ruiz et al. (adaptación española, 2010)',
    autoresOriginales: 'Spitzer, Kroenke, Williams & Löwe (versión original, 2006)',
    añoPublicacion: 2010,
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
      fiabilidad: 'Consistencia interna α = 0.936. Test-retest r = 0.844. Correlación intraclase = 0.926',
      muestra: 'Validado en España: 212 sujetos (106 con TAG, 106 controles) en atención primaria de Madrid, Zaragoza y Barcelona',
      validezClinica: 'Sensibilidad 86.8% y especificidad 93.4% para TAG (punto de corte ≥10). AUC = 0.957',
      estudiosClave: [
        {
          cita: 'García-Campayo, J., Zamorano, E., Ruiz, M. A., Pardo, A., Pérez-Páramo, M., López-Gómez, V., Freire, O., & Rejas, J. (2010). Cultural adaptation into Spanish of the generalized anxiety disorder-7 (GAD-7) scale as a screening tool. Health and Quality of Life Outcomes, 8, 8.',
          doi: '10.1186/1477-7525-8-8'
        },
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
      modelo: 'Criterios diagnósticos DSM-IV para trastorno de ansiedad generalizada (adaptado a DSM-5)',
      enfoque: 'Modelo dimensional de la ansiedad basado en frecuencia de síntomas en las últimas 2 semanas',
      objetivo: 'Cribado, identificación de casos probables y monitoreo de severidad de TAG en atención primaria',
      baseConceptual: 'Estructura unidimensional validada que explica 72% de la varianza. Correlación alta con HAM-A (r=0.852) y HADS-A (r=0.903)'
    },
    aplicacionClinica: {
      usoRecomendado: 'Cribado en atención primaria española, seguimiento en tratamiento, estudios epidemiológicos. Tiempo de aplicación: 2.5 minutos',
      requiere: 'Autoadministrado. No requiere supervisión clínica para completar. Evaluación profesional para interpretación diagnóstica',
      complementar: 'HAM-A, HADS, WHO-DAS II para evaluación de discapacidad. Entrevista clínica para diagnóstico definitivo',
      advertencia: '⚠️ Punto de corte ≥ 10: Sensibilidad 86.8%, Especificidad 93.4%. Personas mayores pueden necesitar asistencia para completarlo'
    }
  },
  'OYS-PS-P-SF20': {
    code: 'OYS-PS-P-SF20',
    title: 'Ohio Youth Scales – Problemas (Padre/Tutor)',
    shortTitle: 'OYS Problemas (P)',
    chartType: 'line' as const,
    thresholds: {
      warning: 60,
      danger: 80
    },
    dominio: 'Problemas de Comportamiento',
    poblacion: 'Niños/as y adolescentes 5–18 años (informante: padre/tutor)',
    items: [
      { id: 1, texto: 'Discutir con otros' },
      { id: 2, texto: 'Meterse en peleas' },
      { id: 3, texto: 'Tener problemas con la policía' },
      { id: 4, texto: 'Mentir o hacer trampa' },
      { id: 5, texto: 'Robar' },
      { id: 6, texto: 'Tener rabietas' },
      { id: 7, texto: 'Desobedecer en casa' },
      { id: 8, texto: 'Desobedecer en la escuela' },
      { id: 9, texto: 'Estar triste o deprimido/a' },
      { id: 10, texto: 'Estar nervioso/a, tenso/a o preocupado/a' },
      { id: 11, texto: 'Tener miedos o fobias' },
      { id: 12, texto: 'Sentirse solo/a o no querido/a' },
      { id: 13, texto: 'Sentirse confundido/a o en un mundo de fantasía' },
      { id: 14, texto: 'Tener problemas de atención o concentración' },
      { id: 15, texto: 'Actuar demasiado joven para su edad' },
      { id: 16, texto: 'Culpar a otros por los problemas' },
      { id: 17, texto: 'Faltar o llegar tarde a la escuela' },
      { id: 18, texto: 'Hacer las cosas lentamente' },
      { id: 19, texto: 'Tener problemas con el uso de drogas o alcohol' },
      { id: 20, texto: 'Tener problemas para dormir' }
    ],
    descripcion: 'Frecuencia de problemas conductuales y emocionales en los últimos 30 días (informante: padre/tutor).',
    tiempoMin: 7,
    destinatario: 'padre_tutor',
    respuestaTipo: 'Likert 0-5 (0=Nada en absoluto, 1=Una o dos veces, 2=Varias veces, 3=A menudo, 4=La mayor parte del tiempo, 5=Todo el tiempo)',
    scoring: {
      rango: [0, 100] as const,
      sentido: 'A mayor puntuación, mayor severidad de problemas',
      tipo: 'Suma directa de ítems 1-20 (rango 0-5 cada uno)',
      puntosDeCorte: [
        { umbral: 20, label: 'Referencia comunitaria (+1SD)' },
        { umbral: 25, label: 'Corte clínico' },
        { umbral: 30, label: 'Referencia comunitaria (+2SD)' }
      ] as const,
      interpretacion: {
        direccion: 'Puntuaciones más altas indican mayor severidad de problemas',
        escalas: '0-19: Normal | 20-24: Atención | 25-29: Clínico | 30+: Severo',
        puntuacionTotal: 'Suma de ítems 1-20'
      },
      alertas: {
        tdah: { umbral: 3, item: 11, descripcion: 'TDAH screening: ítem 11 ≥ 3' },
        sustancias: { umbral: 2, item: 7, descripcion: 'Consumo sustancias: ítem 7 ≥ 2' },
        autolesion: { umbral: 1, items: [12, 13], descripcion: 'Riesgo autolesión: ítems 12 o 13 ≥ 1' }
      } as const
    },
    validez: {
      fiabilidad: 'α = 0.93-0.97 (comunitaria), α = 0.90-0.96 (clínica). Test-retest r = 0.88 (1 semana). Confiabilidad inter-evaluador r = 0.44-0.88 (según método)',
      muestra: 'N = 301 estudiantes (comunitaria), N = 225 K-6° grado, múltiples muestras clínicas (N = 59-66). Edades 5-18 años',
      estudiosClave: [
        {
          cita: 'Ogles, B. M., Melendez, G., Davis, D. C., & Lunnen, K. M. (2000). The Ohio Youth Problem, Functioning, and Satisfaction Scales Technical Manual. Ohio University.',
          doi: 'Manual técnico oficial'
        },
        {
          cita: 'Ogles, B. M., Lambert, M. J., & Masters, K. S. (1996). Assessing outcome in clinical practice. Boston: Allyn & Bacon.',
          doi: 'Fundamentos teóricos'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Modelo tripartito de Strupp & Hadley (1977): perspectivas de sociedad, consumidor y profesional. Esquema conceptual de Lambert & Hill (1994)',
      enfoque: 'Evaluación multifuente, multidominio basada en validación social de stakeholders. Análisis factorial: 3 factores (Externalizante, Internalizante, Conducta)',
      objetivo: 'Medición práctica y psicométricamente rigurosa de severidad de problemas para evaluación de resultados en servicios de salud mental infantil',
      baseConceptual: 'Integra criterios DSM-IV, problemas más comunes reportados por sistemas de salud mental, input de stakeholders y revisión de literatura'
    },
    aplicacionClinica: {
      usoRecomendado: 'Evaluación de resultados en servicios comunitarios de salud mental. Seguimiento cada 3 meses durante tratamiento. Cribado inicial y monitoreo de progreso',
      requiere: 'Padre/tutor como informante. Observación de comportamientos durante últimos 30 días. Mínima capacitación profesional para interpretación',
      complementar: 'Formas paralelas: OYS-Funcionamiento (W-form), OYS-Joven (Y-form), CBCL, Progress Evaluation Scales. Evaluación multidominio recomendada',
      advertencia: '⚠️ Cambio fiable: 10 puntos. Corte clínico: 25 puntos. Sensible al cambio durante tratamiento (r = -0.54 con PES)'
    }
  },

  'OYS-F-P-SF20': {
    code: 'OYS-F-P-SF20',
    title: 'Ohio Youth Scales – Funcionamiento (Padre/Tutor)',
    shortTitle: 'OYS Funcionamiento (P)',
    chartType: 'line' as const,
    thresholds: {
      warning: 52,
      danger: 40
    },
    dominio: 'Funcionamiento Global',
    descripcion: 'Nivel de funcionamiento en áreas de la vida diaria (informante: padre/tutor).',
    poblacion: 'Niños/as y adolescentes 5–18 años (informante: padre/tutor)',
    tiempoMin: 7,
    destinatario: 'padre_tutor',
    items: [
      { id: 1, texto: 'Llevarse bien con padres' },
      { id: 2, texto: 'Llevarse bien con otros adultos' },
      { id: 3, texto: 'Llevarse bien con hermanos/as' },
      { id: 4, texto: 'Llevarse bien con otros niños/as de su edad' },
      { id: 5, texto: 'Participar en actividades familiares' },
      { id: 6, texto: 'Hacer amigos' },
      { id: 7, texto: 'Disfrutar de actividades recreativas' },
      { id: 8, texto: 'Lidiar con el estrés' },
      { id: 9, texto: 'Lidiar con problemas y frustraciones' },
      { id: 10, texto: 'Lidiar con cosas que le dan miedo o le ponen nervioso/a' },
      { id: 11, texto: 'Mostrar interés en cosas' },
      { id: 12, texto: 'Completar tareas o proyectos' },
      { id: 13, texto: 'Completar tareas escolares' },
      { id: 14, texto: 'Asistir a la escuela' },
      { id: 15, texto: 'Aprender en la escuela' },
      { id: 16, texto: 'Pensar claramente y tomar buenas decisiones' },
      { id: 17, texto: 'Controlar su comportamiento' },
      { id: 18, texto: 'Controlar sus emociones' },
      { id: 19, texto: 'Cuidar de sí mismo/a (higiene, vestirse, etc.)' },
      { id: 20, texto: 'Dormir' }
    ],
    respuestaTipo: 'Likert 0-4 (0=Problemas extremos, 1=Bastantes problemas, 2=Algunos problemas, 3=Bien, 4=Muy bien)',
    scoring: {
      rango: [0, 80] as const,
      sentido: 'A mayor puntuación, mejor funcionamiento',
      tipo: 'Suma directa de ítems 1-20 (rango 0-4 cada uno)',
      puntosDeCorte: [
        { umbral: 40, label: 'Referencia comunitaria (-2SD)' },
        { umbral: 50, label: 'Corte clínico' },
        { umbral: 52, label: 'Referencia comunitaria (-1SD)' }
      ] as const,
      interpretacion: {
        direccion: 'Puntuaciones más altas indican mejor funcionamiento',
        escalas: '0-39: Severo | 40-49: Clínico | 50-51: Atención | 52+: Normal',
        puntuacionTotal: 'Suma de ítems 1-20'
      },
      alertas: {
        tdah: { umbral: 1, item: 16, descripcion: 'TDAH screening: ítem 16 ≤ 1' }
      } as const
    },
    validez: {
      fiabilidad: 'α = 0.89-0.95 (comunitaria), α = 0.91-0.94 (clínica). Test-retest r = 0.77 (1 semana). Confiabilidad inter-evaluador r = 0.22-0.88 (según método)',
      muestra: 'N = 301 estudiantes (comunitaria), N = 225 K-6° grado, múltiples muestras clínicas. Validez discriminante: diferencias significativas entre muestras comunitarias y clínicas',
      estudiosClave: [
        {
          cita: 'Ogles, B. M., Melendez, G., Davis, D. C., & Lunnen, K. M. (2000). The Ohio Youth Problem, Functioning, and Satisfaction Scales Technical Manual. Ohio University.',
          doi: 'Manual técnico oficial'
        },
        {
          cita: 'Ogles, B. M., Davis, D. C., & Lunnen, K. M. (1998). Inter-rater reliability of four measures of functioning. Journal of Clinical Psychology, 54(3), 341-349.',
          doi: '10.1002/(SICI)1097-4679(199803)54:3<341::AID-JCLP11>3.0.CO;2-P'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Modelo tripartito de Strupp & Hadley (1977) integrado con esquema conceptual de Lambert & Hill (1994). Enfoque en fortalezas y competencias',
      enfoque: 'Evaluación multifuente de funcionamiento adaptativo. Análisis factorial: 2 factores (Funcionamiento General + Áreas Transicionales)',
      objetivo: 'Medición práctica del funcionamiento juvenil para evaluación de resultados. Complementa escalas centradas en patología',
      baseConceptual: 'Funcionamiento social, académico, emocional, conductual y de autocuidado. Incluye áreas transicionales para adolescentes'
    },
    aplicacionClinica: {
      usoRecomendado: 'Evaluación de resultados en servicios comunitarios. Seguimiento cada 3 meses. Identificación de fortalezas para planificación individualizada',
      requiere: 'Padre/tutor observador. Referencia CGAS para interpretación de niveles. Ítems 3 y 13 requieren consideración del nivel de desarrollo',
      complementar: 'OYS Problemas, CAFAS, CGAS, Vanderbilt Functioning Index. Formas paralelas Y-form y W-form disponibles',
      advertencia: '⚠️ Cambio fiable: 8 puntos. Corte clínico: 50 puntos. Sensible al cambio (r = 0.56 con PES). Correlación con CAFAS r = -0.52'
    }
  },

  'OYS-PS-Y-SF20': {
    code: 'OYS-PS-Y-SF20',
    title: 'Ohio Youth Scales – Problemas (Joven)',
    shortTitle: 'OYS Problemas (J)',
    chartType: 'line' as const,
    thresholds: {
      warning: 33,
      danger: 48
    },
    dominio: 'Problemas de Comportamiento',
    descripcion: 'Frecuencia de problemas en los últimos 30 días (autorreporte del joven).',
    poblacion: 'Adolescentes 12–18 años (autorreporte)',
    tiempoMin: 7,
    destinatario: 'paciente',
    items: [
      { id: 1, texto: 'Discutir con otros' },
      { id: 2, texto: 'Meterme en peleas' },
      { id: 3, texto: 'Tener problemas con la policía' },
      { id: 4, texto: 'Mentir o hacer trampa' },
      { id: 5, texto: 'Robar' },
      { id: 6, texto: 'Tener rabietas' },
      { id: 7, texto: 'Desobedecer en casa' },
      { id: 8, texto: 'Desobedecer en la escuela' },
      { id: 9, texto: 'Estar triste o deprimido/a' },
      { id: 10, texto: 'Estar nervioso/a, tenso/a o preocupado/a' },
      { id: 11, texto: 'Tener miedos o fobias' },
      { id: 12, texto: 'Sentirme solo/a o no querido/a' },
      { id: 13, texto: 'Sentirme confundido/a o en un mundo de fantasía' },
      { id: 14, texto: 'Tener problemas de atención o concentración' },
      { id: 15, texto: 'Actuar demasiado joven para mi edad' },
      { id: 16, texto: 'Culpar a otros por mis problemas' },
      { id: 17, texto: 'Faltar o llegar tarde a la escuela' },
      { id: 18, texto: 'Hacer las cosas lentamente' },
      { id: 19, texto: 'Tener problemas con el uso de drogas o alcohol' },
      { id: 20, texto: 'Tener problemas para dormir' }
    ],
    respuestaTipo: 'Likert 0-5 (0=Nada en absoluto, 1=Una o dos veces, 2=Varias veces, 3=A menudo, 4=La mayor parte del tiempo, 5=Todo el tiempo)',
    scoring: {
      rango: [0, 100] as const,
      sentido: 'A mayor puntuación, mayor severidad de problemas',
      tipo: 'Suma directa de ítems 1-20 (rango 0-5 cada uno)',
      puntosDeCorte: [
        { umbral: 25, label: 'Corte clínico' },
        { umbral: 33, label: 'Referencia comunitaria (+1SD)' },
        { umbral: 48, label: 'Referencia comunitaria (+2SD)' }
      ] as const,
      interpretacion: {
        direccion: 'Puntuaciones más altas indican mayor severidad de problemas',
        escalas: '0-24: Normal | 25-32: Clínico | 33-47: Atención | 48+: Severo',
        puntuacionTotal: 'Suma de ítems 1-20'
      },
      alertas: {
        tdah: { umbral: 3, item: 11, descripcion: 'TDAH screening: ítem 11 ≥ 3' },
        sustancias: { umbral: 2, item: 7, descripcion: 'Consumo sustancias: ítem 7 ≥ 2' },
        autolesion: { umbral: 1, items: [12, 13], descripcion: 'Riesgo autolesión: ítems 12 o 13 ≥ 1' }
      } as const
    },
    validez: {
      fiabilidad: 'α = 0.90-0.95 (comunitaria), α = 0.90-0.93 (clínica). Test-retest r = 0.72 (1 semana). Correlación con YSR r = 0.82',
      muestra: 'N = 297 estudiantes grados 7-12 (comunitaria), múltiples muestras clínicas. Validez discriminante: diferencias significativas por historial de servicios de salud mental',
      estudiosClave: [
        {
          cita: 'Ogles, B. M., Melendez, G., Davis, D. C., & Lunnen, K. M. (2000). The Ohio Youth Problem, Functioning, and Satisfaction Scales Technical Manual. Ohio University.',
          doi: 'Manual técnico oficial'
        },
        {
          cita: 'Ogles, B. M., Lambert, M. J., & Masters, K. S. (1996). Assessing outcome in clinical practice. Boston: Allyn & Bacon.',
          doi: 'Fundamentos teóricos'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Modelo tripartito de Strupp & Hadley (1977) con perspectiva del joven. Esquema conceptual de Lambert & Hill (1994)',
      enfoque: 'Autorreporte de frecuencia de problemas. Validación social con stakeholders. Análisis factorial: 3 factores (Externalizante, Internalizante, Conducta)',
      objetivo: 'Capturar perspectiva única del adolescente sobre sus problemas. Medición práctica para evaluación de resultados en salud mental juvenil',
      baseConceptual: 'Integra criterios DSM-IV, problemas reportados por jóvenes en servicios, input de stakeholders adolescentes'
    },
    aplicacionClinica: {
      usoRecomendado: 'Evaluación de resultados en servicios adolescentes. Seguimiento cada 3 meses. Complementa perspectivas parentales y profesionales',
      requiere: 'Adolescente 12-18 años con capacidad de autorreporte. Evaluación de últimos 30 días',
      complementar: 'OYS Funcionamiento (Y-form), OYS Padres (P-form), YSR, evaluación clínica directa',
      advertencia: '⚠️ Cambio fiable: 10 puntos. Corte clínico: 25 puntos. Sensible al cambio durante tratamiento ambulatorio'
    }
  },

  'OYS-F-Y-SF20': {
    code: 'OYS-F-Y-SF20',
    title: 'Ohio Youth Scales – Funcionamiento (Joven)',
    shortTitle: 'OYS Funcionamiento (J)',
    chartType: 'line' as const,
    thresholds: {
      warning: 48,
      danger: 35
    },
    dominio: 'Funcionamiento Global',
    descripcion: 'Nivel de funcionamiento en áreas de la vida diaria (autorreporte del joven).',
    poblacion: 'Adolescentes 12–18 años (autorreporte)',
    tiempoMin: 7,
    destinatario: 'paciente',
    items: [
      { id: 1, texto: 'Llevarme bien con mis padres' },
      { id: 2, texto: 'Llevarme bien con otros adultos' },
      { id: 3, texto: 'Llevarme bien con mis hermanos/as' },
      { id: 4, texto: 'Llevarme bien con otros jóvenes de mi edad' },
      { id: 5, texto: 'Participar en actividades familiares' },
      { id: 6, texto: 'Hacer amigos' },
      { id: 7, texto: 'Disfrutar de actividades recreativas' },
      { id: 8, texto: 'Lidiar con el estrés' },
      { id: 9, texto: 'Lidiar con problemas y frustraciones' },
      { id: 10, texto: 'Lidiar con cosas que me dan miedo o me ponen nervioso/a' },
      { id: 11, texto: 'Mostrar interés en cosas' },
      { id: 12, texto: 'Completar tareas o proyectos' },
      { id: 13, texto: 'Completar tareas escolares' },
      { id: 14, texto: 'Asistir a la escuela' },
      { id: 15, texto: 'Aprender en la escuela' },
      { id: 16, texto: 'Pensar claramente y tomar buenas decisiones' },
      { id: 17, texto: 'Controlar mi comportamiento' },
      { id: 18, texto: 'Controlar mis emociones' },
      { id: 19, texto: 'Cuidar de mí mismo/a (higiene, vestirme, etc.)' },
      { id: 20, texto: 'Dormir' }
    ],
    respuestaTipo: 'Likert 0-4 (0=Problemas extremos, 1=Bastantes problemas, 2=Algunos problemas, 3=Bien, 4=Muy bien)',
    scoring: {
      rango: [0, 80] as const,
      sentido: 'A mayor puntuación, mejor funcionamiento',
      tipo: 'Suma directa de ítems 1-20 (rango 0-4 cada uno)',
      puntosDeCorte: [
        { umbral: 35, label: 'Referencia comunitaria (-2SD)' },
        { umbral: 48, label: 'Referencia comunitaria (-1SD)' },
        { umbral: 60, label: 'Corte clínico' }
      ] as const,
      interpretacion: {
        direccion: 'Puntuaciones más altas indican mejor funcionamiento',
        escalas: '0-34: Severo | 35-47: Atención | 48-59: Clínico | 60+: Normal',
        puntuacionTotal: 'Suma de ítems 1-20'
      },
      alertas: {
        tdah: { umbral: 1, item: 16, descripcion: 'TDAH screening: ítem 16 ≤ 1' }
      } as const
    },
    validez: {
      fiabilidad: 'α = 0.88-0.94 (comunitaria), α = 0.90-0.93 (clínica). Test-retest r = 0.69 (1 semana). Correlación con CAFAS r = -0.41',
      muestra: 'N = 297 estudiantes grados 7-12 (comunitaria), múltiples muestras clínicas. Validez discriminante: diferencias significativas por historial de servicios',
      estudiosClave: [
        {
          cita: 'Ogles, B. M., Melendez, G., Davis, D. C., & Lunnen, K. M. (2000). The Ohio Youth Problem, Functioning, and Satisfaction Scales Technical Manual. Ohio University.',
          doi: 'Manual técnico oficial'
        },
        {
          cita: 'Ogles, B. M., Davis, D. C., & Lunnen, K. M. (1998). Inter-rater reliability of four measures of functioning. Journal of Clinical Psychology, 54(3), 341-349.',
          doi: '10.1002/(SICI)1097-4679(199803)54:3<341::AID-JCLP11>3.0.CO;2-P'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Modelo tripartito de Strupp & Hadley (1977) con autorreporte juvenil. Esquema conceptual de Lambert & Hill (1994)',
      enfoque: 'Autorreporte de funcionamiento adaptativo. Análisis factorial: 2 factores (Funcionamiento General + Áreas Transicionales)',
      objetivo: 'Capturar perspectiva del adolescente sobre su funcionamiento. Complementa evaluaciones parentales y profesionales',
      baseConceptual: 'Funcionamiento social, académico, emocional, conductual y autocuidado desde perspectiva del joven'
    },
    aplicacionClinica: {
      usoRecomendado: 'Evaluación de resultados en servicios adolescentes. Seguimiento cada 3 meses. Identificación de fortalezas percibidas',
      requiere: 'Adolescente 12-18 años con capacidad de autorreporte. Consideración del nivel de desarrollo para ítems específicos',
      complementar: 'OYS Problemas (Y-form), OYS Padres (P-form), CAFAS, CGAS, evaluación clínica directa',
      advertencia: '⚠️ Cambio fiable: 8 puntos. Corte clínico: 48 puntos. Sensible al cambio (r = 0.42 con PES). Menor confiabilidad inter-evaluador que formas parentales'
    }
  },

  'OYS-PADRES-40': {
    code: 'OYS-PADRES-40',
    title: 'Ohio Youth Scales - Padres/Tutores',
    shortTitle: 'OYS-40 (P)',
    chartType: 'line' as const,
    thresholds: {
      warning: 60,
      danger: 80
    },
    dominio: 'Problemas de Comportamiento',
    poblacion: 'Niños/as y adolescentes 5–18 años (informante: padre/tutor)',
    descripcion: 'Cuestionario consolidado de 40 ítems que evalúa severidad de problemas (ítems 1-20) y funcionamiento (ítems 21-40) desde la perspectiva de padres/tutores.',
    tiempoMin: 10,
    destinatario: 'padre_tutor',
    respuestaTipo: 'Dual: Problemas 0-5 (Nada en absoluto → Todo el tiempo), Funcionamiento 0-4 (Problemas extremos → Muy bien)',
    items: [
      { id: 1, texto: 'Discutir con otros' },
      { id: 2, texto: 'Meterse en peleas (golpear, patear, empujar)' },
      { id: 3, texto: 'Gritar, insultar o gritar a otros' },
      { id: 4, texto: 'Ataques de enojo' },
      { id: 5, texto: 'Negarse a hacer lo que piden docentes o padres' },
      { id: 6, texto: 'Causar problemas sin razón' },
      { id: 7, texto: 'Consumir drogas o alcohol' },
      { id: 8, texto: 'Romper reglas o infringir la ley (quedarse fuera de horario, robar)' },
      { id: 9, texto: 'Faltar a la escuela o a clases' },
      { id: 10, texto: 'Mentir' },
      { id: 11, texto: 'No poder quedarse quieto/a, tener demasiada energía' },
      { id: 12, texto: 'Lastimarse a sí mismo/a (cortarse o rasguñarse, tomar pastillas)' },
      { id: 13, texto: 'Hablar o pensar sobre la muerte' },
      { id: 14, texto: 'Sentirse sin valor o inútil' },
      { id: 15, texto: 'Sentirse solo/a y sin amigos' },
      { id: 16, texto: 'Sentirse ansioso/a o temeroso/a' },
      { id: 17, texto: 'Preocuparse de que vaya a pasar algo malo' },
      { id: 18, texto: 'Sentirse triste o deprimido/a' },
      { id: 19, texto: 'Pesadillas' },
      { id: 20, texto: 'Problemas con la alimentación' },
      { id: 21, texto: 'Llevarse bien con los amigos' },
      { id: 22, texto: 'Llevarse bien con la familia' },
      { id: 23, texto: 'Desarrollar relaciones de pareja apropiadas para la edad' },
      { id: 24, texto: 'Llevarse bien con adultos fuera de la familia (docentes, dirección)' },
      { id: 25, texto: 'Completar las tareas escolares' },
      { id: 26, texto: 'Hacer bien las tareas escolares' },
      { id: 27, texto: 'Disfrutar de la escuela' },
      { id: 28, texto: 'Actuar apropiadamente en la escuela' },
      { id: 29, texto: 'Concentrarse en las tareas' },
      { id: 30, texto: 'Completar las tareas asignadas' },
      { id: 31, texto: 'Dormir bien' },
      { id: 32, texto: 'Comer apropiadamente' },
      { id: 33, texto: 'Expresar sentimientos apropiadamente' },
      { id: 34, texto: 'Responder apropiadamente cuando está molesto/a' },
      { id: 35, texto: 'Controlar su temperamento' },
      { id: 36, texto: 'Responder apropiadamente a las bromas' },
      { id: 37, texto: 'Pensar antes de actuar' },
      { id: 38, texto: 'Resolver problemas sin ayuda' },
      { id: 39, texto: 'Usar el tiempo libre apropiadamente' },
      { id: 40, texto: 'Actuar de manera apropiada para su edad' }
    ],
    scoring: {
      rango: [0, 180] as const,
      sentido: 'Dual: Problemas (mayor=peor), Funcionamiento (mayor=mejor)',
      tipo: 'Suma ítems 1-20 (Problemas, 0-5 cada uno) + Suma ítems 21-40 (Funcionamiento, 0-4 cada uno)',
      puntosDeCorte: [
        { umbral: 25, label: 'Corte clínico Problemas' },
        { umbral: 50, label: 'Corte clínico Funcionamiento' }
      ] as const,
      interpretacion: {
        direccion: 'Problemas: mayor puntuación = mayor severidad. Funcionamiento: mayor puntuación = mejor funcionamiento',
        escalas: 'Problemas: 0-19 Normal | 20-24 Atención | 25+ Clínico. Funcionamiento: 0-49 Clínico | 50+ Normal',
        puntuacionTotal: 'Suma dual de problemas y funcionamiento'
      }
    },
    validez: {
      fiabilidad: 'α = 0.93-0.97 (Problemas), α = 0.89-0.95 (Funcionamiento). Test-retest r = 0.88 (Problemas), r = 0.77 (Funcionamiento)',
      muestra: 'N = 301 estudiantes (comunitaria), N = 225 K-6° grado, múltiples muestras clínicas (N = 59-66). Edades 5-18 años',
      estudiosClave: [
        {
          cita: 'Ogles, B. M., Melendez, G., Davis, D. C., & Lunnen, K. M. (2000). The Ohio Youth Problem, Functioning, and Satisfaction Scales Technical Manual. Ohio University.',
          doi: 'Manual técnico oficial'
        },
        {
          cita: 'Ogles, B. M., Lambert, M. J., & Masters, K. S. (1996). Assessing outcome in clinical practice. Boston: Allyn & Bacon.',
          doi: 'Fundamentos teóricos'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Modelo tripartito de Strupp & Hadley (1977): perspectivas de sociedad, consumidor y profesional. Esquema conceptual de Lambert & Hill (1994)',
      enfoque: 'Evaluación multifuente, multidominio basada en validación social de stakeholders. Análisis factorial: 3 factores (Externalizante, Internalizante, Conducta) + 2 factores funcionamiento',
      objetivo: 'Medición práctica y psicométricamente rigurosa de severidad de problemas y funcionamiento para evaluación de resultados en servicios de salud mental infantil',
      baseConceptual: 'Integra criterios DSM-IV, problemas más comunes reportados por sistemas de salud mental, input de stakeholders y revisión de literatura'
    },
    aplicacionClinica: {
      usoRecomendado: 'Evaluación de resultados en servicios comunitarios de salud mental. Seguimiento cada 3 meses durante tratamiento. Cribado inicial y monitoreo de progreso integral',
      requiere: 'Padre/tutor como informante. Observación de comportamientos durante últimos 30 días. Mínima capacitación profesional para interpretación',
      complementar: 'Formas paralelas: OYS-Joven (Y-form), CBCL, Progress Evaluation Scales, CAFAS, CGAS. Evaluación multidominio recomendada',
      advertencia: '⚠️ Cambio fiable: 10 puntos (Problemas), 8 puntos (Funcionamiento). Cortes clínicos: 25 (Problemas), 50 (Funcionamiento). Sensible al cambio durante tratamiento'
    }
  },

  'OYS-JOVENES-40': {
    code: 'OYS-JOVENES-40', 
    title: 'Ohio Youth Scales - Jóvenes',
    shortTitle: 'OYS-40 (J)',
    chartType: 'line' as const,
    thresholds: {
      warning: 60,
      danger: 80
    },
    dominio: 'Problemas de Comportamiento',
    poblacion: 'Adolescentes 12–18 años (autorreporte)',
    descripcion: 'Cuestionario consolidado de 40 ítems que evalúa severidad de problemas (ítems 1-20) y funcionamiento (ítems 21-40) desde la perspectiva del joven.',
    tiempoMin: 10,
    destinatario: 'joven',
    respuestaTipo: 'Likert dual: 0-5 (Problemas), 0-4 (Funcionamiento)',
    items: [
      { id: 1, texto: 'Discutir con otros' },
      { id: 2, texto: 'Meterse en peleas' },
      { id: 3, texto: 'Tener problemas con la policía' },
      { id: 4, texto: 'Mentir o hacer trampa' },
      { id: 5, texto: 'Robar' },
      { id: 6, texto: 'Tener rabietas' },
      { id: 7, texto: 'Desobedecer en casa' },
      { id: 8, texto: 'Desobedecer en la escuela' },
      { id: 9, texto: 'Estar triste o deprimido/a' },
      { id: 10, texto: 'Estar nervioso/a, tenso/a o preocupado/a' },
      { id: 11, texto: 'Tener miedos o fobias' },
      { id: 12, texto: 'Sentirse solo/a o no querido/a' },
      { id: 13, texto: 'Sentirse confundido/a o en un mundo de fantasía' },
      { id: 14, texto: 'Tener problemas de atención o concentración' },
      { id: 15, texto: 'Actuar demasiado joven para su edad' },
      { id: 16, texto: 'Culpar a otros por los problemas' },
      { id: 17, texto: 'Faltar o llegar tarde a la escuela' },
      { id: 18, texto: 'Hacer las cosas lentamente' },
      { id: 19, texto: 'Tener problemas con el uso de drogas o alcohol' },
      { id: 20, texto: 'Tener problemas para dormir' },
      { id: 21, texto: 'Llevarse bien con otros niños/as' },
      { id: 22, texto: 'Llevarse bien con los padres' },
      { id: 23, texto: 'Participar en actividades familiares' },
      { id: 24, texto: 'Hacer amigos fácilmente' },
      { id: 25, texto: 'Completar las tareas escolares' },
      { id: 26, texto: 'Hacer bien las tareas escolares' },
      { id: 27, texto: 'Disfrutar de la escuela' },
      { id: 28, texto: 'Actuar apropiadamente en la escuela' },
      { id: 29, texto: 'Concentrarse en las tareas' },
      { id: 30, texto: 'Completar las tareas asignadas' },
      { id: 31, texto: 'Dormir bien' },
      { id: 32, texto: 'Comer apropiadamente' },
      { id: 33, texto: 'Expresar sentimientos apropiadamente' },
      { id: 34, texto: 'Responder apropiadamente cuando está molesto/a' },
      { id: 35, texto: 'Controlar su temperamento' },
      { id: 36, texto: 'Responder apropiadamente a las bromas' },
      { id: 37, texto: 'Pensar antes de actuar' },
      { id: 38, texto: 'Resolver problemas sin ayuda' },
      { id: 39, texto: 'Usar el tiempo libre apropiadamente' },
      { id: 40, texto: 'Actuar de manera apropiada para su edad' }
    ],
    scoring: {
      rango: [0, 180] as const,
      sentido: 'Dual: Problemas (mayor=peor), Funcionamiento (mayor=mejor)',
      tipo: 'Suma ítems 1-20 (Problemas, 0-5 cada uno) + Suma ítems 21-40 (Funcionamiento, 0-4 cada uno)',
      puntosDeCorte: [
        { umbral: 25, label: 'Corte clínico Problemas' },
        { umbral: 48, label: 'Corte clínico Funcionamiento' }
      ] as const,
      interpretacion: {
        direccion: 'Problemas: mayor puntuación = mayor severidad. Funcionamiento: mayor puntuación = mejor funcionamiento',
        escalas: 'Problemas: 0-24 Normal | 25+ Clínico. Funcionamiento: 0-47 Clínico | 48+ Normal',
        puntuacionTotal: 'Suma dual de problemas y funcionamiento'
      }
    },
    validez: {
      fiabilidad: 'α = 0.90-0.95 (Problemas), α = 0.88-0.94 (Funcionamiento). Test-retest r = 0.72 (Problemas), r = 0.69 (Funcionamiento). Correlación con YSR r = 0.82',
      muestra: 'N = 297 estudiantes grados 7-12 (comunitaria), múltiples muestras clínicas. Validez discriminante: diferencias significativas por historial de servicios',
      estudiosClave: [
        {
          cita: 'Ogles, B. M., Melendez, G., Davis, D. C., & Lunnen, K. M. (2000). The Ohio Youth Problem, Functioning, and Satisfaction Scales Technical Manual. Ohio University.',
          doi: 'Manual técnico oficial'
        },
        {
          cita: 'Ogles, B. M., Lambert, M. J., & Masters, K. S. (1996). Assessing outcome in clinical practice. Boston: Allyn & Bacon.',
          doi: 'Fundamentos teóricos'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Modelo tripartito de Strupp & Hadley (1977) con perspectiva del joven. Esquema conceptual de Lambert & Hill (1994)',
      enfoque: 'Autorreporte de frecuencia de problemas y funcionamiento. Validación social con stakeholders adolescentes. Análisis factorial: 3 factores (Externalizante, Internalizante, Conducta) + 2 factores funcionamiento',
      objetivo: 'Capturar perspectiva única del adolescente sobre sus problemas y funcionamiento. Medición práctica para evaluación de resultados en salud mental juvenil',
      baseConceptual: 'Integra criterios DSM-IV, problemas reportados por jóvenes en servicios, input de stakeholders adolescentes'
    },
    aplicacionClinica: {
      usoRecomendado: 'Evaluación de resultados en servicios adolescentes. Seguimiento cada 3 meses. Complementa perspectivas parentales y profesionales',
      requiere: 'Adolescente 12-18 años con capacidad de autorreporte. Evaluación de últimos 30 días. Consideración del nivel de desarrollo',
      complementar: 'OYS Padres (P-form), YSR, CAFAS, CGAS, evaluación clínica directa. Evaluación multidominio recomendada',
      advertencia: '⚠️ Cambio fiable: 10 puntos (Problemas), 8 puntos (Funcionamiento). Cortes clínicos: 25 (Problemas), 48 (Funcionamiento). Sensible al cambio durante tratamiento ambulatorio'
    }
  }
} as const;

export type QuestionnaireCode = keyof typeof questionnairesMeta;
export type ChartType = 'line' | 'bar' | 'scatter' | 'bar-multidim' | 'line-multi';

export interface QuestionnaireMetadata {
  code: string;
  title: string;
  shortTitle: string;
  chartType: 'line' | 'bar' | 'radar';
  thresholds: {
    warning?: number;
    danger?: number;
  };
  // Additional metadata fields can be added as needed
}

export default questionnairesMeta;
