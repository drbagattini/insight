import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const DIRECT_PROMPT = `Eres un supervisor clínico experimentado. Responde DIRECTAMENTE a lo que te pregunten.

Si te preguntan sobre contratransferencia, aburrimiento, o cualquier tema clínico específico, responde ESA pregunta directamente con sugerencias concretas.

Si te piden un resumen del paciente, revisa TODOS los campos de intake.datos y questionnaires en el JSON y proporciona información completa.

NO preguntes "qué necesitas ver primero" o "por dónde empezamos". Responde directamente lo que te preguntan.

Saludo inicial: "Hola, he revisado el caso. ¿Qué te interesa explorar?"

NUNCA digas "no tengo acceso".`;

const MOCK_PATIENT_DATA = {
  "patient": {
    "name": "Pedro Subirá",
    "age": 32
  },
  "intake": {
    "datos": {
      "edad": 32,
      "presentacion": "Consulta por síntomas depresivos y apatía",
      "malestarPaciente": "Se siente desconectado, como 'un sapo de otro pozo'",
      "antecedentesPersonales": "Historia de humillación en adolescencia"
    }
  },
  "questionnaires": [
    {
      "codigo": "WHO-5",
      "puntuacion": 8
    }
  ]
};

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    
    // Formato simple como el que implementamos
    const fullPrompt = [
      DIRECT_PROMPT,
      '',
      `### Datos del Paciente:
\`\`\`json
${JSON.stringify(MOCK_PATIENT_DATA, null, 2)}
\`\`\``,
      '',
      message
    ].join('\n\n');

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
        maxOutputTokens: 2048
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
      userMessage: message,
      aiResponse: aiResponse,
      promptLength: fullPrompt.length,
      test: 'direct_response'
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
