// Static meta-data for questionnaires. This file is user-maintained – DO NOT modify automatically.
// When adding new questionnaires, follow the structure shown for WHO-5 and commit the changes.

const questionnairesMeta = {
  'WHO-5': {
    nombre: 'Índice de Bienestar WHO-5',
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
  }
} as const;

export type QuestionnaireCode = keyof typeof questionnairesMeta;
export default questionnairesMeta;
