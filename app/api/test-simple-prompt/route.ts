import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const SIMPLE_PROMPT = `Eres un supervisor clínico experimentado y empático. Tu trabajo es ayudar al terapeuta a explorar y entender mejor el caso del paciente a través de una conversación natural y reflexiva.

Tienes acceso completo a todos los datos del paciente: entrevista inicial, cuestionarios (WHO-5, PHQ-9, GAD-7, etc.), evoluciones clínicas y demás información disponible. Usa estos datos libremente para hacer observaciones, conexiones y sugerencias.

Comportáte de manera conversacional y natural. Si te preguntan sobre el paciente, proporciona información detallada. Si te preguntan sobre un cuestionario específico, analiza los datos concretos. Explora junto al terapeuta, haz preguntas reflexivas, y ayuda a descubrir insights.

No seas rígido ni estructurado. Responde como un colega experimentado que conoce bien el caso y quiere ayudar a explorarlo en profundidad.

NUNCA digas "no tengo acceso" - siempre tienes todos los datos disponibles.`;

const MOCK_PATIENT_DATA = {
  "patient": {
    "name": "Pedro Subirá",
    "age": 32,
    "email": "pedro@example.com"
  },
  "intake": {
    "datos": {
      "edad": 32,
      "sexo": "Masculino",
      "presentacion": "Consulta por síntomas depresivos y apatía",
      "malestarPaciente": "Se siente como 'un sapo de otro pozo', dificultades en relaciones interpersonales",
      "antecedentesPersonales": "Historia de humillación en la adolescencia"
    }
  },
  "questionnaires": [
    {
      "codigo": "WHO-5",
      "titulo": "WHO-5 Well-being Index",
      "puntuacion": 8,
      "respuestas": [
        {"pregunta": "Me he sentido alegre y de buen humor", "respuesta": 1},
        {"pregunta": "Me he sentido calmado y relajado", "respuesta": 2},
        {"pregunta": "Me he sentido activo y vigoroso", "respuesta": 1},
        {"pregunta": "Me desperté sintiéndome fresco y descansado", "respuesta": 2},
        {"pregunta": "Mi vida diaria ha estado llena de cosas que me interesan", "respuesta": 2}
      ]
    },
    {
      "codigo": "PHQ-9",
      "titulo": "Patient Health Questionnaire-9",
      "puntuacion": 12,
      "respuestas": [
        {"pregunta": "Poco interés o placer en hacer cosas", "respuesta": 2},
        {"pregunta": "Se ha sentido decaído, deprimido o sin esperanza", "respuesta": 2}
      ]
    }
  ],
  "evolutions": [
    {
      "contenido": "Primera sesión: El paciente se muestra colaborativo pero con afecto aplanado. Refiere sentirse desconectado de otros.",
      "fecha": "2025-07-20",
      "tipo": "Sesión inicial"
    }
  ]
};

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    const fullPrompt = `${SIMPLE_PROMPT}

### Datos del Paciente:
\`\`\`json
${JSON.stringify(MOCK_PATIENT_DATA, null, 2)}
\`\`\`

Terapeuta: ${message}`;

    const geminiRequest = {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096
      }
    };

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest)
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta';

    return NextResponse.json({
      response: aiResponse,
      prompt_length: fullPrompt.length,
      status: 'success'
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
