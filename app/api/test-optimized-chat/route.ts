import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

const OPTIMIZED_PROMPT = `Eres un supervisor clínico experimentado. Tu trabajo es responder DIRECTAMENTE y de forma útil a cada pregunta.

REGLAS ESTRICTAS:
1. Si te preguntan sobre contratransferencia, aburrimiento, o cualquier tema clínico: responde ESA pregunta con sugerencias concretas y prácticas.
2. Si te piden un resumen: proporciona información específica del paciente basada en los datos disponibles.
3. Si te preguntan sobre un cuestionario específico: analiza ese cuestionario y sus resultados.
4. NUNCA respondas con "Hola, he revisado el caso" si ya estás en medio de una conversación.
5. NUNCA preguntes "qué necesitas ver primero" o "por dónde empezamos".
6. Responde de forma conversacional y natural, como un colega experimentado.

Si no tienes datos específicos disponibles en este momento, dilo claramente y sugiere qué información necesitarías.

Saludo inicial SOLO para el primer mensaje: "Hola, he revisado el caso. ¿Qué te interesa explorar?"`;

export async function POST(request: NextRequest) {
  try {
    const { message, isFirstMessage = false } = await request.json();
    
    // Simular la lógica optimizada
    let patientContext = '';
    const messageText = message.toLowerCase();
    const needsPatientData = isFirstMessage || 
      messageText.includes('resumen') || 
      messageText.includes('who-5') || 
      messageText.includes('contratransferencia');
    
    if (needsPatientData) {
      // Datos compactos solo cuando se necesitan
      const compactData = {
        patient: { name: "Pedro Subirá", age: 32 },
        intake: { 
          presentacion: "Consulta por síntomas depresivos y apatía",
          malestarPaciente: "Se siente desconectado, como 'un sapo de otro pozo'"
        },
        questionnaires: [
          { codigo: "WHO-5", puntuacion: 8, fecha: "2024-01-15" }
        ]
      };
      
      patientContext = `\n\n### Datos del Paciente:\n\`\`\`json\n${JSON.stringify(compactData, null, 2)}\n\`\`\``;
    } else {
      patientContext = '\n\n[DATOS DEL PACIENTE: Disponibles - pide información específica si necesitas]';
    }

    const fullPrompt = [
      OPTIMIZED_PROMPT,
      patientContext,
      '',
      message
    ].join('\n\n');

    console.log(`[TEST] Message: "${message}"`);
    console.log(`[TEST] Needs patient data: ${needsPatientData}`);
    console.log(`[TEST] Prompt length: ${fullPrompt.length}`);

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
      optimization: {
        needsPatientData,
        promptLength: fullPrompt.length,
        dataLoaded: needsPatientData ? 'compact' : 'none'
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
