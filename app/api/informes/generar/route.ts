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
        maxOutputTokens: 16384 // Aumentado para informes largos con mega-prompt
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

    const candidate = geminiData.candidates[0];
    let generatedContent = candidate.content.parts[0].text;
    
    // 4.0. Logging para diagnosticar problemas de generación
    console.log('[DEBUG] Gemini finishReason:', candidate.finishReason);
    console.log('[DEBUG] Content length:', generatedContent.length);
    console.log('[DEBUG] Content ends with:', generatedContent.substring(generatedContent.length - 200));
    
    // Verificar si se cortó por límite de tokens
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.warn('[WARNING] Informe cortado por límite de tokens. Considerar aumentar maxOutputTokens.');
    } else if (candidate.finishReason !== 'STOP') {
      console.warn('[WARNING] Informe terminado por razón inesperada:', candidate.finishReason);
    }
    
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

    // Debitar créditos por el informe generado
    try {
      const debitResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/credits/debit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          type: 'report',
          quantity: 1,
          description: `Informe clínico generado para paciente ${patientData.patient.name}`,
          metadata: {
            patient_id: pacienteId,
            report_title: titulo,
            tokens_used: generatedContent.length // Aproximación de tokens
          }
        })
      });

      if (!debitResponse.ok) {
        const debitError = await debitResponse.json();
        console.error('[ERROR] Failed to debit credits:', debitError);
        
        // Si no hay créditos suficientes, retornar error específico
        if (debitResponse.status === 402) {
          return NextResponse.json(
            { 
              error: 'Créditos insuficientes para generar el informe',
              credits_needed: 8,
              current_balance: debitError.current_balance || 0
            },
            { status: 402 }
          );
        }
        
        // Si se superó el límite de fair-use, retornar error específico
        if (debitResponse.status === 429) {
          return NextResponse.json(
            {
              error: debitError.error || 'Límite mensual de informes superado',
              fair_use: debitError.fair_use
            },
            { status: 429 }
          );
        }
      }
      
      // Verificar si hay advertencia de fair-use
      const fairUseStatus = debitResponse.headers.get('X-Fair-Use-Status');
      if (fairUseStatus === 'warn') {
        const debitData = await debitResponse.json();
        console.warn('[WARN] Fair-use warning for report generation:', debitData.fair_use_warning);
      }
      
    } catch (debitError) {
      console.error('[ERROR] Error debiting credits:', debitError);
      // Continuar con la respuesta pero logear el error
    }

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
