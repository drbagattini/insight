import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simulamos las respuestas mejoradas
    const responses = {
      saludo_inicial: "Hola, he revisado el caso. ¿Qué aspecto te interesa explorar?",
      
      alerta_riesgo: "Qué complejo que es este paciente... Entiendo que es un caso muy difícil que, además de un supervisor de inteligencia artificial, necesita supervisión clínica de otro tipo. ¿Has pensado en consultar con colegas? Es importante que tengas apoyo adicional en casos como este.",
      
      resumen_cuando_se_pide: {
        pregunta: "¿Qué sabés del paciente?",
        respuesta_esperada: "Te cuento sobre Pedro: Es un hombre de 32 años que consulta por síntomas depresivos. En el WHO-5 obtuvo 8 puntos (bajo bienestar), en el PHQ-9 marcó 12 puntos indicando depresión moderada. Su motivo de consulta principal es apatía y dificultades en las relaciones interpersonales. En la entrevista inicial menciona sentirse 'como un sapo de otro pozo' y tiene antecedentes de humillación en la adolescencia. Las evoluciones clínicas muestran..."
      },
      
      comportamiento: "natural y conversacional, no rígido ni estructurado",
      
      cambios_realizados: [
        "Mensaje de bienvenida más breve",
        "Alerta de riesgo más empática y natural", 
        "Instrucciones para resúmenes completos cuando se pida",
        "Comportamiento conversacional como cualquier LLM",
        "Menos rigidez estructural"
      ]
    };

    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error en test:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
