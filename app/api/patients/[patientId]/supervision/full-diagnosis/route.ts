import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

/**
 * DIAGNÓSTICO COMPLETO DEL CICLO DE SUPERVISIÓN CLÍNICA
 * 
 * Investiga todo el flujo desde el frontend hasta Gemini API:
 * 1. Autenticación y sesión
 * 2. Carga de datos del paciente
 * 3. Construcción del prompt
 * 4. Configuración de Gemini
 * 5. Llamada a API
 * 6. Procesamiento de respuesta
 * 7. Identificación de cuellos de botella
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  const startTime = Date.now();
  console.log('[FULL DIAGNOSIS] 🔍 Iniciando diagnóstico completo...');

  try {
    // 1. VERIFICAR AUTENTICACIÓN
    console.log('[FULL DIAGNOSIS] 1️⃣ Verificando autenticación...');
    const authStart = Date.now();
    const session = await getServerSession(authOptions);
    const authTime = Date.now() - authStart;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { patientId } = params;

    // 2. VERIFICAR CONFIGURACIÓN DE GEMINI
    console.log('[FULL DIAGNOSIS] 2️⃣ Verificando configuración de Gemini...');
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const hasGeminiKey = !!geminiApiKey;
    const geminiKeyLength = geminiApiKey?.length || 0;

    // 3. CARGAR DATOS DEL PACIENTE
    console.log('[FULL DIAGNOSIS] 3️⃣ Cargando datos del paciente...');
    const dataStart = Date.now();
    
    const baseUrl = request.url.replace(`/api/patients/${patientId}/supervision/full-diagnosis`, '');
    
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    const dataTime = Date.now() - dataStart;
    const dataOk = dataResponse.ok;
    const dataStatus = dataResponse.status;

    let patientData = null;
    let dataAnalysis = null;

    if (dataOk) {
      patientData = await dataResponse.json();
      
      // Analizar estructura de datos
      dataAnalysis = {
        hasPatient: !!patientData.patient,
        hasIntake: !!patientData.intake,
        hasQuestionnaires: !!patientData.cuestionarios,
        questionnaireCount: patientData.cuestionarios?.length || 0,
        hasEvolutions: !!patientData.evoluciones,
        evolutionCount: patientData.evoluciones?.length || 0,
        totalDataSize: JSON.stringify(patientData).length,
        
        questionnaires: patientData.cuestionarios?.map((q: any) => ({
          codigo: q.codigo,
          titulo: q.titulo,
          hasDetailedData: !!(q.score_detallado || q.respuestas || q.metadata),
          dataSize: JSON.stringify(q).length,
          itemCount: q.metadata?.items?.length || 0,
          hasResponses: !!q.respuestas,
          responseCount: q.respuestas?.length || 0
        })) || []
      };
    }

    // 4. SIMULAR CONSTRUCCIÓN DEL PROMPT
    console.log('[FULL DIAGNOSIS] 4️⃣ Simulando construcción del prompt...');
    const promptStart = Date.now();
    
    let promptAnalysis = null;
    if (patientData) {
      // Simular el prompt que se construiría
      const systemPrompt = `**1. ROL Y OBJETIVO PRINCIPAL**

Eres un Supervisor Clínico Colaborativo. Tu persona es la de un psicólogo senior, experimentado y cálido...`; // Prompt base truncado

      const patientContext = JSON.stringify(patientData, null, 2);
      const testMessage = "Hola, me gustaría explorar la contratransferencia con este paciente";
      
      const fullPrompt = [
        systemPrompt,
        '',
        `**DATOS DEL PACIENTE:**`,
        patientContext,
        '',
        `**CONVERSACIÓN:**`,
        `Usuario: ${testMessage}`
      ].join('\n\n');

      promptAnalysis = {
        systemPromptLength: systemPrompt.length,
        patientContextLength: patientContext.length,
        fullPromptLength: fullPrompt.length,
        wouldBeTruncated: fullPrompt.length > 50000,
        truncatedLength: fullPrompt.length > 50000 ? 50000 : fullPrompt.length,
        estimatedTokens: Math.ceil(fullPrompt.length / 4), // Aproximación: 4 chars = 1 token
        isWithinLimits: fullPrompt.length <= 50000
      };
    }
    
    const promptTime = Date.now() - promptStart;

    // 5. PROBAR CONECTIVIDAD CON GEMINI (sin hacer llamada real)
    console.log('[FULL DIAGNOSIS] 5️⃣ Verificando conectividad con Gemini...');
    const connectivityStart = Date.now();
    
    let geminiConnectivity = null;
    if (hasGeminiKey) {
      try {
        // Hacer una llamada mínima para verificar conectividad
        const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: "Responde solo: 'OK'"
              }]
            }],
            generationConfig: {
              temperature: 0.5,
              topK: 40,
              topP: 0.8,
              maxOutputTokens: 10
            }
          })
        });

        geminiConnectivity = {
          canConnect: testResponse.ok,
          status: testResponse.status,
          statusText: testResponse.statusText,
          responseTime: Date.now() - connectivityStart
        };

        if (testResponse.ok) {
          const testData = await testResponse.json();
          geminiConnectivity.hasValidResponse = !!(testData.candidates && testData.candidates.length > 0);
          geminiConnectivity.testResponse = testData.candidates?.[0]?.content?.parts?.[0]?.text || 'No text';
        } else {
          const errorText = await testResponse.text();
          geminiConnectivity.error = errorText;
        }

      } catch (error) {
        geminiConnectivity = {
          canConnect: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - connectivityStart
        };
      }
    }

    const connectivityTime = Date.now() - connectivityStart;

    // 6. IDENTIFICAR CUELLOS DE BOTELLA
    console.log('[FULL DIAGNOSIS] 6️⃣ Identificando cuellos de botella...');
    
    const bottlenecks = [];
    
    if (authTime > 500) {
      bottlenecks.push({
        type: 'AUTH_SLOW',
        severity: 'MEDIUM',
        time: `${authTime}ms`,
        message: 'Autenticación lenta',
        recommendation: 'Verificar configuración de NextAuth'
      });
    }

    if (dataTime > 2000) {
      bottlenecks.push({
        type: 'DATA_LOAD_SLOW',
        severity: 'HIGH',
        time: `${dataTime}ms`,
        message: 'Carga de datos muy lenta',
        recommendation: 'Optimizar consultas de base de datos, agregar índices'
      });
    }

    if (!dataOk) {
      bottlenecks.push({
        type: 'DATA_LOAD_FAILED',
        severity: 'CRITICAL',
        status: dataStatus,
        message: 'Fallo en carga de datos del paciente',
        recommendation: 'Verificar endpoint /api/informes/datos/[patientId]'
      });
    }

    if (promptAnalysis?.fullPromptLength > 40000) {
      bottlenecks.push({
        type: 'PROMPT_TOO_LARGE',
        severity: 'HIGH',
        size: `${promptAnalysis.fullPromptLength} chars`,
        message: 'Prompt muy grande, puede causar lentitud',
        recommendation: 'Filtrar datos menos relevantes del paciente'
      });
    }

    if (!hasGeminiKey) {
      bottlenecks.push({
        type: 'NO_GEMINI_KEY',
        severity: 'CRITICAL',
        message: 'No se encontró GEMINI_API_KEY',
        recommendation: 'Configurar variable de entorno GEMINI_API_KEY'
      });
    }

    if (geminiConnectivity && !geminiConnectivity.canConnect) {
      bottlenecks.push({
        type: 'GEMINI_CONNECTIVITY_FAILED',
        severity: 'CRITICAL',
        error: geminiConnectivity.error,
        message: 'No se puede conectar con Gemini API',
        recommendation: 'Verificar API key y conectividad de red'
      });
    }

    if (geminiConnectivity && geminiConnectivity.responseTime > 5000) {
      bottlenecks.push({
        type: 'GEMINI_SLOW_RESPONSE',
        severity: 'HIGH',
        time: `${geminiConnectivity.responseTime}ms`,
        message: 'Gemini API responde muy lento',
        recommendation: 'Problema puede ser de Google, intentar más tarde'
      });
    }

    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "🔍 DIAGNÓSTICO COMPLETO - SUPERVISIÓN CLÍNICA",
      timestamp: new Date().toISOString(),
      
      performance_breakdown: {
        total_diagnosis_time: `${totalTime}ms`,
        auth_time: `${authTime}ms`,
        data_load_time: `${dataTime}ms`,
        prompt_construction_time: `${promptTime}ms`,
        connectivity_test_time: `${connectivityTime}ms`
      },

      authentication: {
        is_authenticated: !!session?.user?.email,
        user_email: session?.user?.email,
        auth_time: `${authTime}ms`
      },

      gemini_config: {
        has_api_key: hasGeminiKey,
        api_key_length: geminiKeyLength,
        connectivity: geminiConnectivity,
        current_config: {
          temperature: 0.5,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 2048,
          model: 'gemini-2.0-flash-exp'
        }
      },

      patient_data: {
        load_successful: dataOk,
        load_time: `${dataTime}ms`,
        status: dataStatus,
        analysis: dataAnalysis
      },

      prompt_analysis: promptAnalysis,

      bottlenecks: bottlenecks,

      recommendations: [
        bottlenecks.length === 0 ? 
          "✅ No se detectaron cuellos de botella críticos" :
          `⚠️ ${bottlenecks.length} cuellos de botella detectados`,
        
        dataTime > 1000 ? 
          "🔧 PRIORIDAD: Optimizar carga de datos del paciente" :
          "✅ Carga de datos dentro de tiempos normales",
          
        promptAnalysis?.fullPromptLength > 35000 ?
          "🔧 Considerar reducir datos incluidos en el prompt" :
          "✅ Tamaño de prompt aceptable",
          
        geminiConnectivity?.responseTime > 3000 ?
          "🔧 Gemini API lento - puede ser problema temporal de Google" :
          "✅ Gemini API respondiendo en tiempos normales",
          
        "💡 Para debugging: revisar logs del servidor durante llamadas reales",
        "💡 Considerar implementar caché de datos del paciente",
        "💡 Monitorear tiempos de respuesta en producción"
      ],

      next_steps: bottlenecks.length > 0 ? [
        "1. Resolver cuellos de botella críticos identificados",
        "2. Probar nuevamente con datos reales",
        "3. Monitorear logs durante llamadas de supervisión",
        "4. Implementar optimizaciones sugeridas"
      ] : [
        "1. Sistema parece estar funcionando correctamente",
        "2. Probar con llamada real de supervisión",
        "3. Monitorear logs para identificar lentitud específica",
        "4. Verificar si el problema es intermitente"
      ]
    });

  } catch (error) {
    console.error('[FULL DIAGNOSIS] Error:', error);
    return NextResponse.json(
      { 
        error: 'Error en diagnóstico completo', 
        details: error instanceof Error ? error.message : 'Unknown error',
        total_time: `${Date.now() - startTime}ms`
      },
      { status: 500 }
    );
  }
}
