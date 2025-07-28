import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const SIMPLE_PROMPT = `Eres un supervisor clínico. Responde de forma natural y directa.

Tienes acceso completo a todos los datos del paciente en el JSON al final. Cuando te pregunten sobre el paciente, revisa TODOS los campos de la entrevista inicial (intake.datos) y proporciona un resumen completo que incluya todos los aspectos relevantes.

Si te pregunten sobre cuestionarios específicos, busca en el array "questionnaires" y analiza los puntajes y respuestas.

Para el saludo inicial, usa simplemente: "Hola, he revisado el caso. ¿Qué te interesa explorar?"

No uses frases repetitivas o formales. Varía tu lenguaje y sé directo.

NUNCA digas "no tengo acceso".`;

const MOCK_PATIENT_DATA = {
  "patient": {
    "name": "Pedro Subirá",
    "age": 32
  },
  "intake": {
    "datos": {
      "edad": 32,
      "presentacion": "Consulta por síntomas depresivos"
    }
  },
  "questionnaires": [
    {
      "codigo": "WHO-5",
      "puntuacion": 8
    }
  ]
};

export async function GET() {
  try {
    const fullPrompt = `${SIMPLE_PROMPT}

### Datos del Paciente:
\`\`\`json
${JSON.stringify(MOCK_PATIENT_DATA, null, 2)}
\`\`\`

Terapeuta: Hola`;

    const geminiRequest = {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 1024
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
      originalMessage: "###Hola Dr. Nicolás Bagattini,\n\nEstoy aquí para ayudarte a supervisar el caso de Pedro Subiria. Veo que cuentas con la entrevista inicial y 17 cuestionarios completados, lo cual nos proporciona una base sólida para la supervisión.\n\nPodemos explorar cualquier aspecto del caso que consideres relevante. Al final de nuestra conversación, podremos generar una síntesis de supervisión que quedará registrada en el área de evolución clínica.\n\n¿Por qué área te gustaría empezar?\n03:57 p. m.##",
      newResponse: aiResponse,
      comparison: {
        original_length: 547,
        new_length: aiResponse.length,
        reduction: `${Math.round((1 - aiResponse.length / 547) * 100)}%`
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
