import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

/**
 * ENDPOINT DE TEST DIRECTO PARA SUPERVISIÓN CLÍNICA
 * 
 * Simula el flujo completo sin autenticación para debugging
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[TEST SUPERVISION] 🧪 Iniciando test directo...');

  try {
    // 1. BUSCAR PACIENTE DE PRUEBA
    console.log('[TEST SUPERVISION] 1️⃣ Buscando paciente...');
    const { data: patients, error: patientsError } = await (supabaseAdmin as any)
      .from('patients')
      .select('*')
      .limit(1);

    if (patientsError || !patients || patients.length === 0) {
      return NextResponse.json({
        error: 'No se encontraron pacientes',
        details: patientsError?.message
      }, { status: 404 });
    }

    const testPatient = patients[0];
    const patientId = testPatient.id;
    console.log(`[TEST SUPERVISION] ✓ Paciente encontrado: ${testPatient.name || 'Sin nombre'} (${patientId})`);

    // 2. CARGAR DATOS DEL PACIENTE (MISMA LÓGICA QUE EL ENDPOINT CORREGIDO)
    console.log('[TEST SUPERVISION] 2️⃣ Cargando datos del paciente...');
    const dataStartTime = Date.now();

    const { data: patientData, error: patientError } = await (supabaseAdmin as any)
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();
    
    const { data: questionnaires, error: questionnairesError } = await (supabaseAdmin as any)
      .from('respuestas')
      .select(`
        *,
        cuestionarios!inner(codigo, titulo)
      `)
      .eq('paciente_id', patientId)
      .order('creado_en', { ascending: false });
    
    const { data: evolutions, error: evolutionsError } = await (supabaseAdmin as any)
      .from('primeras_entrevistas')
      .select('*')
      .eq('paciente_id', patientId)
      .order('created_at', { ascending: false });

    const dataLoadTime = Date.now() - dataStartTime;
    console.log(`[TEST SUPERVISION] ✓ Datos cargados en: ${dataLoadTime}ms`);

    // Estructura de datos como en el endpoint real
    const fullPatientData = {
      patient: patientData,
      intake: { datos: {} },
      cuestionarios: questionnaires || [],
      questionnaires: questionnaires || [],
      evoluciones: evolutions || []
    };

    // 3. CONSTRUIR PROMPT (VERSIÓN SIMPLIFICADA)
    console.log('[TEST SUPERVISION] 3️⃣ Construyendo prompt...');
    const promptStartTime = Date.now();

    const systemPrompt = `Eres un supervisor clínico experto. Responde de manera profesional y empática.`;
    const patientContext = JSON.stringify(fullPatientData, null, 2);
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

    const promptTime = Date.now() - promptStartTime;
    console.log(`[TEST SUPERVISION] ✓ Prompt construido en: ${promptTime}ms`);
    console.log(`[TEST SUPERVISION] ✓ Tamaño del prompt: ${fullPrompt.length} caracteres`);

    // 4. LLAMAR A GEMINI
    console.log('[TEST SUPERVISION] 4️⃣ Llamando a Gemini...');
    const geminiStartTime = Date.now();

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY no configurada'
      }, { status: 500 });
    }

    const geminiRequest = {
      contents: [{
        parts: [{
          text: fullPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.5,
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

    const geminiTime = Date.now() - geminiStartTime;
    console.log(`[TEST SUPERVISION] ✓ Gemini respondió en: ${geminiTime}ms`);
    console.log(`[TEST SUPERVISION] ✓ Status: ${geminiResponse.status}`);

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      return NextResponse.json({
        error: 'Error de Gemini API',
        status: geminiResponse.status,
        details: errorText
      }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    console.log(`[TEST SUPERVISION] ✓ Respuesta de Gemini recibida`);

    // 5. PROCESAR RESPUESTA
    console.log('[TEST SUPERVISION] 5️⃣ Procesando respuesta...');
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      return NextResponse.json({
        error: 'No se generaron candidatos de respuesta',
        geminiData: geminiData
      }, { status: 500 });
    }

    const candidate = geminiData.candidates[0];
    const parts = candidate.content?.parts;
    
    if (!parts || parts.length === 0) {
      return NextResponse.json({
        error: 'No se encontraron partes en la respuesta',
        candidate: candidate
      }, { status: 500 });
    }

    const textParts = parts.filter((part: any) => 'text' in part);
    if (textParts.length === 0) {
      return NextResponse.json({
        error: 'No se encontró texto en la respuesta',
        parts: parts
      }, { status: 500 });
    }

    const response = textParts[0].text;
    
    if (!response || response.trim().length === 0) {
      return NextResponse.json({
        error: 'Respuesta vacía de Gemini',
        rawResponse: response
      }, { status: 500 });
    }

    const totalTime = Date.now() - startTime;

    // 6. RESULTADO EXITOSO
    console.log(`[TEST SUPERVISION] 🎉 Test completado exitosamente en: ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      message: "🧪 TEST DIRECTO DE SUPERVISIÓN EXITOSO",
      
      patient_info: {
        id: patientId,
        name: patientData?.name || 'Sin nombre',
        questionnaires_count: questionnaires?.length || 0,
        evolutions_count: evolutions?.length || 0
      },

      performance: {
        total_time: `${totalTime}ms`,
        data_load_time: `${dataLoadTime}ms`,
        prompt_construction_time: `${promptTime}ms`,
        gemini_api_time: `${geminiTime}ms`
      },

      prompt_analysis: {
        size: `${fullPrompt.length} caracteres`,
        estimated_tokens: Math.ceil(fullPrompt.length / 4),
        within_limits: fullPrompt.length <= 50000
      },

      gemini_response: {
        length: response.length,
        preview: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
        finish_reason: candidate.finishReason
      },

      diagnosis: {
        data_loading: dataLoadTime < 1000 ? '✅ Rápido' : '⚠️ Lento',
        prompt_size: fullPrompt.length < 30000 ? '✅ Óptimo' : '⚠️ Grande',
        gemini_speed: geminiTime < 5000 ? '✅ Rápido' : '⚠️ Lento',
        response_quality: response.length > 100 ? '✅ Completa' : '⚠️ Corta'
      },

      full_response: response
    });

  } catch (error) {
    console.error('[TEST SUPERVISION] ❌ Error:', error);
    return NextResponse.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Unknown error',
      total_time: `${Date.now() - startTime}ms`
    }, { status: 500 });
  }
}
