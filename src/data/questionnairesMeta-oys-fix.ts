// Fixed OYS metadata with correct items from database
export const oysMetadataFix = {
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
    respuestaTipo: 'Likert 0-5: Nada en absoluto → Todo el tiempo',
    items: [
      // Problemas (1-20) - Escala 0-5: Nada en absoluto → Todo el tiempo
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
      // Funcionamiento (21-40) - Escala 0-5: Nada en absoluto → Todo el tiempo
      { id: 21, texto: 'Llevarse bien con los amigos' },
      { id: 22, texto: 'Llevarse bien con la familia' },
      { id: 23, texto: 'Desarrollar relaciones de pareja apropiadas para la edad' },
      { id: 24, texto: 'Llevarse bien con adultos fuera de la familia (docentes, dirección)' },
      { id: 25, texto: 'Mantenerse aseado/a y con buena apariencia' },
      { id: 26, texto: 'Atender necesidades de salud y mantener buenos hábitos (tomar medicación o cepillarse los dientes)' },
      { id: 27, texto: 'Controlar las emociones y mantenerse fuera de problemas' },
      { id: 28, texto: 'Estar motivado/a y terminar proyectos' },
      { id: 29, texto: 'Participar en pasatiempos (colecciones, música, videojuegos, arte)' },
      { id: 30, texto: 'Participar en actividades recreativas (deportes, natación, bicicleta)' },
      { id: 31, texto: 'Completar tareas del hogar (ordenar la habitación, otros quehaceres)' },
      { id: 32, texto: 'Asistir a la escuela y obtener calificaciones aprobatorias' },
      { id: 33, texto: 'Aprender habilidades que serán útiles para futuros trabajos' },
      { id: 34, texto: 'Sentirse bien consigo mismo/a' },
      { id: 35, texto: 'Pensar con claridad y tomar buenas decisiones' },
      { id: 36, texto: 'Concentrarse, prestar atención y completar tareas' },
      { id: 37, texto: 'Ganar dinero y aprender a usarlo sabiamente en formas apropiadas para la edad' },
      { id: 38, texto: 'Hacer cosas sin supervisión o restricciones' },
      { id: 39, texto: 'Aceptar responsabilidad por las propias acciones' },
      { id: 40, texto: 'Capacidad para expresar sentimientos' }
    ],
    scoring: {
      rango: [0, 200] as const,
      sentido: 'Dual: Problemas (mayor=peor), Funcionamiento (mayor=mejor)',
      tipo: 'Suma ítems 1-20 (Problemas, 0-5 cada uno) + Suma ítems 21-40 (Funcionamiento, 0-5 cada uno)',
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
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Modelo tripartito de Strupp & Hadley (1977): perspectivas de sociedad, consumidor y profesional',
      enfoque: 'Evaluación multifuente, multidominio basada en validación social de stakeholders',
      objetivo: 'Medición práctica y psicométricamente rigurosa de severidad de problemas y funcionamiento para evaluación de resultados',
      baseConceptual: 'Integra criterios DSM-IV, problemas más comunes reportados por sistemas de salud mental'
    },
    aplicacionClinica: {
      usoRecomendado: 'Evaluación de resultados en servicios comunitarios de salud mental. Seguimiento cada 3 meses durante tratamiento',
      requiere: 'Padre/tutor como informante. Observación de comportamientos durante últimos 30 días',
      complementar: 'Formas paralelas: OYS-Joven (Y-form), CBCL, Progress Evaluation Scales, CAFAS, CGAS',
      advertencia: '⚠️ Cambio fiable: 10 puntos (Problemas), 8 puntos (Funcionamiento). Cortes clínicos: 25 (Problemas), 50 (Funcionamiento)'
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
    respuestaTipo: 'Likert 0-5: Nada en absoluto → Todo el tiempo',
    items: [
      // Problemas (1-20) - Escala 0-5: Nada en absoluto → Todo el tiempo
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
      // Funcionamiento (21-40) - Escala 0-5: Nada en absoluto → Todo el tiempo
      { id: 21, texto: 'Llevarse bien con los amigos' },
      { id: 22, texto: 'Llevarse bien con la familia' },
      { id: 23, texto: 'Desarrollar relaciones de pareja apropiadas para la edad' },
      { id: 24, texto: 'Llevarse bien con adultos fuera de la familia (docentes, dirección)' },
      { id: 25, texto: 'Mantenerse aseado/a y con buena apariencia' },
      { id: 26, texto: 'Atender necesidades de salud y mantener buenos hábitos (tomar medicación o cepillarse los dientes)' },
      { id: 27, texto: 'Controlar las emociones y mantenerse fuera de problemas' },
      { id: 28, texto: 'Estar motivado/a y terminar proyectos' },
      { id: 29, texto: 'Participar en pasatiempos (colecciones, música, videojuegos, arte)' },
      { id: 30, texto: 'Participar en actividades recreativas (deportes, natación, bicicleta)' },
      { id: 31, texto: 'Completar tareas del hogar (ordenar la habitación, otros quehaceres)' },
      { id: 32, texto: 'Asistir a la escuela y obtener calificaciones aprobatorias' },
      { id: 33, texto: 'Aprender habilidades que serán útiles para futuros trabajos' },
      { id: 34, texto: 'Sentirse bien consigo mismo/a' },
      { id: 35, texto: 'Pensar con claridad y tomar buenas decisiones' },
      { id: 36, texto: 'Concentrarse, prestar atención y completar tareas' },
      { id: 37, texto: 'Ganar dinero y aprender a usarlo sabiamente en formas apropiadas para la edad' },
      { id: 38, texto: 'Hacer cosas sin supervisión o restricciones' },
      { id: 39, texto: 'Aceptar responsabilidad por las propias acciones' },
      { id: 40, texto: 'Capacidad para expresar sentimientos' }
    ],
    scoring: {
      rango: [0, 200] as const,
      sentido: 'Dual: Problemas (mayor=peor), Funcionamiento (mayor=mejor)',
      tipo: 'Suma ítems 1-20 (Problemas, 0-5 cada uno) + Suma ítems 21-40 (Funcionamiento, 0-5 cada uno)',
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
      fiabilidad: 'α = 0.90-0.95 (Problemas), α = 0.88-0.94 (Funcionamiento). Test-retest r = 0.72 (Problemas), r = 0.69 (Funcionamiento)',
      muestra: 'N = 297 estudiantes grados 7-12 (comunitaria), múltiples muestras clínicas',
      estudiosClave: [
        {
          cita: 'Ogles, B. M., Melendez, G., Davis, D. C., & Lunnen, K. M. (2000). The Ohio Youth Problem, Functioning, and Satisfaction Scales Technical Manual. Ohio University.',
          doi: 'Manual técnico oficial'
        }
      ]
    },
    fundamentoTeorico: {
      modelo: 'Modelo tripartito de Strupp & Hadley (1977) con perspectiva del joven',
      enfoque: 'Autorreporte de frecuencia de problemas y funcionamiento. Validación social con stakeholders adolescentes',
      objetivo: 'Capturar perspectiva única del adolescente sobre sus problemas y funcionamiento',
      baseConceptual: 'Integra criterios DSM-IV, problemas reportados por jóvenes en servicios'
    },
    aplicacionClinica: {
      usoRecomendado: 'Evaluación de resultados en servicios adolescentes. Seguimiento cada 3 meses. Complementa perspectivas parentales',
      requiere: 'Adolescente 12-18 años con capacidad de autorreporte. Evaluación de últimos 30 días',
      complementar: 'OYS Padres (P-form), YSR, CAFAS, CGAS, evaluación clínica directa',
      advertencia: '⚠️ Cambio fiable: 10 puntos (Problemas), 8 puntos (Funcionamiento). Cortes clínicos: 25 (Problemas), 48 (Funcionamiento)'
    }
  }
};
