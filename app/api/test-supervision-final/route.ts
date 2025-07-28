import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// Configuración de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

const SUPERVISOR_SYSTEM_PROMPT = `# Prompt: Supervisor Clínico Interactivo

## 1. ROL Y OBJETIVO PRINCIPAL
Eres un Supervisor Clínico Interactivo. Tu persona es la de un psicólogo senior, empático y reflexivo. Tu objetivo principal no es extraer información, sino actuar como un "sparring" intelectual para tu colega (el usuario). Le ayudarás a profundizar en su propio entendimiento del caso, a conectar ideas y a descubrir nuevos insights a través de un diálogo socrático y colaborativo.

## 2. CONTEXTO Y BASE DE CONOCIMIENTO
Este es un punto crítico. Tienes acceso COMPLETO a todos los datos del paciente:

**DATOS DISPONIBLES SIEMPRE**: Tienes acceso completo a:
- Datos demográficos y básicos del paciente
- Entrevista inicial completa con todos los campos estructurados
- TODOS los cuestionarios completados (WHO-5, PHQ-9, GAD-7, Beck, OPD-CA2-SQ, etc.) con puntajes y respuestas detalladas
- Evoluciones clínicas de todas las sesiones
- Informes de síntesis previos

**INSTRUCCIONES CRÍTICAS SOBRE EL USO DE DATOS**:
1. NUNCA digas "no tengo acceso" o "no puedo ver" - SIEMPRE tienes todos los datos
2. Cuando te pregunten por un cuestionario específico (ej. WHO-5), busca en los datos y proporciona información concreta
3. Usa los datos para hacer observaciones específicas y relevantes
4. Conecta los datos entre sí para generar insights profundos
5. Si no encuentras un dato específico, di "según los datos disponibles" pero nunca "no tengo acceso"

## INSTRUCCIONES IMPORTANTES PARA USO DE DATOS:
- Basa tu análisis ÚNICAMENTE en los datos provistos en el JSON al final de este prompt.
- Si un campo está vacío o no disponible, no lo menciones en tu respuesta.
- Mantén un tono profesional y clínico, pero accesible.
- Utiliza terminología técnica apropiada pero explica conceptos complejos cuando sea necesario.
- NUNCA digas "no tengo acceso" - siempre tienes los datos disponibles en el JSON.

RECUERDA: Mantén siempre el rol de colega supervisor, no de terapeuta directo.`;

interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
  generationConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST] Starting supervision test...');

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key de Gemini no configurada' }, 
        { status: 500 }
      );
    }

    // Obtener patientId de query params
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId') || 'cm3wd0aqf000008l7gqzx8n8b';
    const testMessage = searchParams.get('message') || '¿Qué sabes sobre el WHO-5 de este paciente?';

    console.log('[TEST] Testing with patientId:', patientId);
    console.log('[TEST] Test message:', testMessage);

    // Simular datos del paciente (estructura similar a la real)
    const mockPatientData = {
      patient: {
        id: patientId,
        name: "Pedro García",
        email: "pedro@example.com",
        age: 28,
        created_at: "2024-01-15T10:00:00Z"
      },
      psychologist: {
        id: "psy1",
        name: "Dr. María López",
        email: "maria@example.com"
      },
      intake: {
        id: "intake1",
        estado: "completado",
        datos: {
          edad: 28,
          sexo: "masculino",
          estadoCivil: "soltero",
          ocupacion: "ingeniero",
          presentacion: "Paciente presenta síntomas de ansiedad y depresión leve. Refiere dificultades para concentrarse en el trabajo y problemas de sueño desde hace 3 meses.",
          malestarPaciente: "Siente que no puede manejar el estrés laboral y tiene pensamientos negativos recurrentes",
          diagnosticoTexto: "Episodio depresivo leve con síntomas de ansiedad",
          etiologia: "Estrés laboral prolongado, cambios en el ambiente de trabajo, falta de apoyo social"
        },
        created_at: "2024-01-15T10:00:00Z"
      },
      questionnaires: [
        {
          id: "q1",
          codigo: "WHO-5",
          titulo: "WHO-5 Well-Being Index",
          puntuacion: 8,
          fecha_completado: "2024-01-20T10:00:00Z",
          respuestas: [
            { pregunta: "Me he sentido alegre y de buen humor", respuesta: 2, valor: 2 },
            { pregunta: "Me he sentido calmado y relajado", respuesta: 1, valor: 1 },
            { pregunta: "Me he sentido activo y vigoroso", respuesta: 2, valor: 2 },
            { pregunta: "Me desperté sintiéndome fresco y descansado", respuesta: 1, valor: 1 },
            { pregunta: "Mi vida diaria ha estado llena de cosas que me interesan", respuesta: 2, valor: 2 }
          ],
          metadata: {
            interpretacion: "Puntaje bajo que sugiere riesgo de depresión",
            punto_corte: 13
          }
        },
        {
          id: "q2",
          codigo: "PHQ-9",
          titulo: "Patient Health Questionnaire-9",
          puntuacion: 12,
          fecha_completado: "2024-01-20T10:00:00Z",
          respuestas: [
            { pregunta: "Poco interés o placer en hacer cosas", respuesta: 2, valor: 2 },
            { pregunta: "Se ha sentido decaído, deprimido o sin esperanzas", respuesta: 2, valor: 2 }
          ]
        }
      ],
      evolutions: [
        {
          id: "ev1",
          contenido: "Primera sesión: El paciente se muestra colaborativo pero con visible malestar. Refiere que los síntomas han empeorado en las últimas semanas.",
          fecha: "2024-01-22T10:00:00Z",
          tipo: "sesion",
          version: 1
        },
        {
          id: "ev2", 
          contenido: "Segunda sesión: Se observa ligera mejoría en el estado de ánimo. El paciente reporta mejor calidad de sueño después de implementar técnicas de higiene del sueño.",
          fecha: "2024-01-29T10:00:00Z",
          tipo: "sesion",
          version: 1
        }
      ],
      summary: {
        total_questionnaires: 2,
        questionnaire_types: ["WHO-5", "PHQ-9"],
        has_intake: true,
        date_range: {
          earliest: "2024-01-15T10:00:00Z",
          latest: "2024-01-29T10:00:00Z"
        }
      }
    };

    // Construir el prompt completo igual que en supervisión
    const fullPatientContext = `\n\n### Datos del Paciente:\n\`\`\`json\n${JSON.stringify(mockPatientData, null, 2)}\n\`\`\``;
    
    const finalPrompt = `${SUPERVISOR_SYSTEM_PROMPT}${fullPatientContext}\n\nTerapeuta: ${testMessage}`;

    console.log('[TEST] Prompt length:', finalPrompt.length);
    console.log('[TEST] Patient context length:', fullPatientContext.length);

    // Llamar a Gemini API
    const geminiRequest: GeminiRequest = {
      contents: [{
        parts: [{
          text: finalPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 16384
      }
    };

    console.log('[TEST] Calling Gemini API...');
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('[TEST] Error from Gemini API:', errorText);
      return NextResponse.json(
        { error: `Error de Gemini API: ${geminiResponse.status}` }, 
        { status: 500 }
      );
    }

    const geminiData: GeminiResponse = await geminiResponse.json();
    console.log('[TEST] Gemini response received');

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.log('[TEST] No candidates in response');
      return NextResponse.json(
        { error: 'No se pudo generar respuesta de supervisión' }, 
        { status: 500 }
      );
    }

    const candidate = geminiData.candidates[0];
    const parts = candidate.content.parts;
    
    const textParts = parts.filter(part => 'text' in part);
    if (textParts.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró respuesta de texto' }, 
        { status: 500 }
      );
    }
    
    const response = (textParts[0] as { text: string }).text;
    console.log('[TEST] Response generated successfully');
    console.log('[TEST] Response length:', response.length);
    console.log('[TEST] Response preview:', response.substring(0, 200));

    return NextResponse.json({
      success: true,
      testMessage,
      response,
      patientId,
      dataLoaded: {
        hasPatient: !!mockPatientData.patient,
        hasIntake: !!mockPatientData.intake,
        questionnairesCount: mockPatientData.questionnaires.length,
        evolutionsCount: mockPatientData.evolutions.length,
        who5Found: mockPatientData.questionnaires.some(q => q.codigo === 'WHO-5')
      },
      promptLength: finalPrompt.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TEST] Error:', error);
    return NextResponse.json(
      { error: `Error interno: ${error}` }, 
      { status: 500 }
    );
  }
}
