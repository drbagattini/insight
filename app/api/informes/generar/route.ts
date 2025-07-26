import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { preparePromptWithData, generateReportTitle } from '@/lib/prompts';

export const dynamic = 'force-dynamic';

// Configuración de Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

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

// POST: Generar informe con IA
export async function POST(request: NextRequest) {
  console.log('[DEBUG] POST /api/informes/generar - Starting request');
  
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    console.log('[ERROR] No token found');
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  console.log('[DEBUG] GEMINI_API_KEY exists:', !!GEMINI_API_KEY);
  if (!GEMINI_API_KEY) {
    console.log('[ERROR] GEMINI_API_KEY not configured');
    return NextResponse.json(
      { error: 'API key de Gemini no configurada. Por favor, configure GEMINI_API_KEY en las variables de entorno.' }, 
      { status: 500 }
    );
  }

  try {
    const { pacienteId } = await request.json();
    console.log('[DEBUG] pacienteId received:', pacienteId);

    if (!pacienteId) {
      console.log('[ERROR] No pacienteId provided');
      return NextResponse.json(
        { error: 'ID del paciente es requerido' }, 
        { status: 400 }
      );
    }

    // 1. Obtener datos consolidados del paciente
    const baseUrl = request.url.replace('/api/informes/generar', '');
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${pacienteId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!dataResponse.ok) {
      const errorData = await dataResponse.json();
      return NextResponse.json(
        { error: `Error obteniendo datos: ${errorData.error}` }, 
        { status: dataResponse.status }
      );
    }

    const patientData = await dataResponse.json();

    // 2. Validar que hay datos suficientes para generar el informe
    if (!patientData.patient) {
      return NextResponse.json(
        { error: 'Datos del paciente no encontrados' }, 
        { status: 404 }
      );
    }

    if (!patientData.intake && (!patientData.questionnaires || patientData.questionnaires.length === 0)) {
      return NextResponse.json(
        { error: 'No hay suficientes datos para generar el informe. Se requiere al menos una entrevista inicial o cuestionarios completados.' }, 
        { status: 400 }
      );
    }

    // 3. Preparar el prompt para Gemini
    const reportDate = new Date().toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const prompt = preparePromptWithData(
      patientData,
      patientData.patient.name,
      patientData.psychologist.name,
      reportDate
    );

    // 4. Llamar a la API de Gemini
    const geminiRequest: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2, // Más determinístico para informes clínicos con Gemini 2.5 Pro
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 8192 // Suficiente para informes largos
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
      const errorText = await geminiResponse.text();
      console.error('Error from Gemini API:', errorText);
      return NextResponse.json(
        { error: 'Error generando informe con IA' }, 
        { status: 500 }
      );
    }

    const geminiData: GeminiResponse = await geminiResponse.json();

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return NextResponse.json(
        { error: 'No se pudo generar el informe' }, 
        { status: 500 }
      );
    }

    let generatedContent = geminiData.candidates[0].content.parts[0].text;
    
    // 4.1. Limpiar el contenido HTML de etiquetas de código markdown
    generatedContent = generatedContent
      .replace(/^\s*```html\s*/i, '') // Remover ```html del inicio
      .replace(/^\s*```\s*/i, '') // Remover ``` del inicio
      .replace(/\s*```\s*$/i, '') // Remover ``` del final
      .replace(/^\s*html\s*$/i, '') // Remover 'html' suelto al inicio
      .trim();
    
    console.log('[DEBUG] Cleaned content, starts with:', generatedContent.substring(0, 100));

    // 5. Generar título para el informe
    const titulo = generateReportTitle(patientData.patient.name, new Date());

    // 6. Preparar metadatos del informe
    const metadatos = {
      ai_model: 'gemini-2.5-pro',
      generation_date: new Date().toISOString(),
      prompt_version: '1.0',
      data_sources: {
        has_intake: !!patientData.intake,
        questionnaire_count: patientData.questionnaires.length,
        questionnaire_types: patientData.summary.questionnaire_types
      },
      generation_config: geminiRequest.generationConfig
    };

    return NextResponse.json({
      contenido: generatedContent,
      titulo,
      metadatos,
      paciente_id: pacienteId,
      psicologo_id: token.id
    });

  } catch (error) {
    console.error('[ERROR] Error generating report:', error);
    console.error('[ERROR] Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: `Error interno del servidor: ${errorMessage}` }, 
      { status: 500 }
    );
  }
}
