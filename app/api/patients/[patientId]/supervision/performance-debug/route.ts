import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

/**
 * ENDPOINT DE DIAGNÓSTICO DE RENDIMIENTO PARA SUPERVISIÓN CLÍNICA
 * 
 * Analiza las posibles causas de lentitud en el chat de supervisión:
 * 1. Tamaño del prompt
 * 2. Cantidad de datos del paciente
 * 3. Configuración de la API
 * 4. Tiempo de respuesta de componentes
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { patientId } = params;
    console.log('[PERFORMANCE DEBUG] Iniciando análisis para patientId:', patientId);

    const startTime = Date.now();

    // 1. ANÁLISIS DE DATOS DEL PACIENTE
    console.log('[PERFORMANCE DEBUG] 1. Midiendo tiempo de carga de datos...');
    const dataStartTime = Date.now();
    
    const baseUrl = request.url.replace('/api/patients/' + patientId + '/supervision/performance-debug', '');
    
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    const dataLoadTime = Date.now() - dataStartTime;

    if (!dataResponse.ok) {
      return NextResponse.json({ 
        error: 'No se pudo obtener datos del paciente', 
        status: dataResponse.status 
      }, { status: 500 });
    }

    const patientData = await dataResponse.json();

    // 2. ANÁLISIS DEL TAMAÑO DEL PROMPT
    console.log('[PERFORMANCE DEBUG] 2. Analizando tamaño del prompt...');
    
    // Simular construcción del prompt como en chat/route.ts
    const promptBase = `Eres un supervisor clínico experto especializado en psicoterapia...`; // Prompt base
    const patientInfo = JSON.stringify(patientData, null, 2);
    const estimatedPromptSize = promptBase.length + patientInfo.length;
    
    // 3. ANÁLISIS DE CUESTIONARIOS
    const questionnaires = patientData.cuestionarios || [];
    const questionnaireAnalysis = questionnaires.map((q: any) => ({
      codigo: q.codigo,
      titulo: q.titulo,
      hasDetailedData: !!(q.score_detallado || q.respuestas || q.metadata),
      dataSize: JSON.stringify(q).length,
      itemCount: q.metadata?.items?.length || 0
    }));

    const totalQuestionnaireData = questionnaires.reduce((total: number, q: any) => 
      total + JSON.stringify(q).length, 0
    );

    // 4. ANÁLISIS DE EVOLUCIONES CLÍNICAS
    const evolutions = patientData.evoluciones || [];
    const evolutionDataSize = JSON.stringify(evolutions).length;

    const totalTime = Date.now() - startTime;

    // 5. IDENTIFICAR POSIBLES CUELLOS DE BOTELLA
    const bottlenecks = [];
    
    if (estimatedPromptSize > 40000) {
      bottlenecks.push({
        type: 'PROMPT_SIZE',
        severity: 'HIGH',
        message: `Prompt muy grande (${estimatedPromptSize} chars). Puede causar lentitud en Gemini.`,
        recommendation: 'Considerar truncar datos menos relevantes'
      });
    }

    if (dataLoadTime > 2000) {
      bottlenecks.push({
        type: 'DATA_LOAD_SLOW',
        severity: 'MEDIUM',
        message: `Carga de datos lenta (${dataLoadTime}ms)`,
        recommendation: 'Verificar consultas de base de datos y índices'
      });
    }

    if (totalQuestionnaireData > 20000) {
      bottlenecks.push({
        type: 'QUESTIONNAIRE_DATA_LARGE',
        severity: 'MEDIUM',
        message: `Datos de cuestionarios muy grandes (${totalQuestionnaireData} chars)`,
        recommendation: 'Considerar incluir solo cuestionarios relevantes'
      });
    }

    if (questionnaires.length > 10) {
      bottlenecks.push({
        type: 'TOO_MANY_QUESTIONNAIRES',
        severity: 'LOW',
        message: `Muchos cuestionarios (${questionnaires.length})`,
        recommendation: 'Filtrar solo los más recientes o relevantes'
      });
    }

    // 6. CONFIGURACIÓN ACTUAL DE GEMINI
    const geminiConfig = {
      temperature: 0.5,
      topK: 40,
      topP: 0.8,
      maxOutputTokens: 4096,
      model: 'gemini-2.0-flash-exp' // Asumiendo el modelo actual
    };

    return NextResponse.json({
      success: true,
      message: "🔍 DIAGNÓSTICO DE RENDIMIENTO - SUPERVISIÓN CLÍNICA",
      analysis: {
        total_analysis_time: `${totalTime}ms`,
        data_load_time: `${dataLoadTime}ms`,
        estimated_prompt_size: `${estimatedPromptSize} caracteres`,
        prompt_size_status: estimatedPromptSize > 40000 ? '⚠️ GRANDE' : '✅ OK',
        
        patient_data_summary: {
          questionnaires_count: questionnaires.length,
          questionnaires_data_size: `${totalQuestionnaireData} chars`,
          evolutions_count: evolutions.length,
          evolutions_data_size: `${evolutionDataSize} chars`,
          total_patient_data_size: `${patientInfo.length} chars`
        },
        
        questionnaire_details: questionnaireAnalysis,
        
        gemini_config: geminiConfig,
        
        bottlenecks: bottlenecks,
        
        performance_recommendations: [
          bottlenecks.length === 0 ? 
            "✅ No se detectaron cuellos de botella obvios" :
            `⚠️ ${bottlenecks.length} posibles cuellos de botella detectados`,
          
          estimatedPromptSize > 30000 ? 
            "🔧 Considerar reducir maxOutputTokens a 2048 para respuestas más rápidas" :
            "✅ Tamaño de prompt dentro de rangos normales",
            
          "💡 Para mejorar velocidad: usar temperature=0.3 y topP=0.7",
          "💡 Considerar implementar caché de datos del paciente",
          "💡 Evaluar usar streaming de respuestas para mejor UX"
        ]
      }
    });

  } catch (error) {
    console.error('[PERFORMANCE DEBUG] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
