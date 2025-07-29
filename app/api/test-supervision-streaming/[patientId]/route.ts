import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import questionnairesMeta from '@/src/data/questionnairesMeta';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Prompt de supervisión clínica
const SUPERVISOR_SYSTEM_PROMPT = `Eres un supervisor clínico experto especializado en psicoterapia psicodinámica y análisis de datos psicométricos. Tu rol es guiar a psicólogos en formación a través de un diálogo socrático reflexivo.

ESTILO DE COMUNICACIÓN:
- Usa un enfoque conversacional "ping-pong"
- Haz preguntas reflexivas que guíen el descubrimiento
- Evita dar respuestas directas; facilita que el psicólogo llegue a sus propias conclusiones
- Mantén un tono cálido pero profesional
- Usa los datos cuantitativos de forma cualitativa para enriquecer la comprensión clínica

ESTRUCTURA DE RESPUESTA:
1. Saluda al psicólogo por su nombre
2. Integra datos específicos del paciente de forma natural
3. Haz observaciones clínicas contextualizadas
4. Termina con una pregunta reflexiva que invite a profundizar

DATOS DISPONIBLES:
Tienes acceso completo a:
- Datos demográficos del paciente
- Respuestas detalladas de cuestionarios psicométricos
- Puntuaciones e interpretaciones clínicas
- Entrevista inicial estructurada
- Evolución clínica registrada
- Preguntas específicas de cada cuestionario

Usa estos datos para crear un diálogo supervisivo rico y contextualizado.`;

// Función para obtener datos reales del psicólogo
async function getPsychologistData(token: any) {
  try {
    // Usar el email del token para buscar en la tabla users
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('email', token.email)
      .single();
    
    if (error || !user) {
      console.warn('[SUPERVISION STREAMING] ⚠️ Psicólogo no encontrado, usando datos del token');
      return {
        id: token.sub || token.id || 'unknown',
        name: token.name || 'Psicólogo',
        email: token.email || 'unknown@example.com'
      };
    }
    
    return {
      id: user.id,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Psicólogo',
      email: user.email,
      role: user.role
    };
  } catch (error) {
    console.error('[SUPERVISION STREAMING] ❌ Error obteniendo datos del psicólogo:', error);
    return {
      id: 'temp-id',
      name: 'Psicólogo Temporal',
      email: 'temp@example.com'
    };
  }
}

// ENDPOINT DE STREAMING: Supervisión clínica con respuesta en tiempo real
export async function POST(request: NextRequest, { params }: any) {
  const requestStartTime = Date.now();
  console.log('[SUPERVISION STREAMING] 🚀 POST request received - Starting timer');
  
  try {
    // Verificar autenticación NextAuth
    const { getToken } = await import('next-auth/jwt');
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    // Verificar configuración de OpenAI
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API key de OpenAI no configurada' }, 
        { status: 500 }
      );
    }

    const { patientId } = await params;
    const body = await request.json();
    const { message: messageText, conversationHistory = [] } = body;

    console.log(`[SUPERVISION STREAMING] 📊 Loading patient data for: ${patientId}`);
    
    // 1. Obtener datos del paciente
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      console.error('[SUPERVISION STREAMING] ❌ Patient error:', patientError);
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // 2. Obtener datos de la entrevista inicial
    const { data: intakeData, error: intakeError } = await supabaseAdmin
      .from('primeras_entrevistas')
      .select('*')
      .eq('paciente_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1);

    // 3. Obtener respuestas de cuestionarios CON ítems completos
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('respuestas')
      .select(`
        *,
        cuestionarios!inner(codigo, titulo, items, descripcion)
      `)
      .eq('paciente_id', patientId)
      .order('creado_en', { ascending: false });

    if (responsesError) {
      console.error('[SUPERVISION STREAMING] ❌ Responses error:', responsesError);
      return NextResponse.json({ error: 'Error obteniendo respuestas' }, { status: 500 });
    }

    // 4. Procesar y estructurar los datos de cuestionarios
    const processedQuestionnaires = responses?.map(response => {
      const questionnaireCode = response.cuestionarios.codigo;
      const meta = questionnairesMeta[questionnaireCode as keyof typeof questionnairesMeta];
      
      return {
        id: response.id,
        codigo: questionnaireCode,
        titulo: response.cuestionarios.titulo,
        descripcion: response.cuestionarios.descripcion,
        fecha_completado: response.creado_en,
        puntuacion: response.puntuacion,
        score_detallado: response.score_detallado,
        respuestas: response.respuestas,
        items: response.cuestionarios.items,
        metadata: meta || null
      };
    }) || [];

    // 4.5. Obtener evolución clínica
    const { data: evolutionData, error: evolutionError } = await supabaseAdmin
      .from('evolucion_clinica')
      .select('*')
      .eq('paciente_id', patientId)
      .order('created_at', { ascending: false });
    
    if (evolutionError) {
      console.warn('[SUPERVISION STREAMING] ⚠️ Error obteniendo evolución clínica:', evolutionError);
    }

    // 5. Consolidar todos los datos
    const patientData = {
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        whatsapp: patient.whatsapp,
        created_at: patient.created_at,
        metadata: patient.metadata
      },
      psychologist: await getPsychologistData(token),
      intake: intakeData && intakeData.length > 0 ? {
        id: intakeData[0].id,
        estado: intakeData[0].estado,
        datos: intakeData[0].datos,
        fecha_inicio: intakeData[0].fecha_inicio,
        fecha_fin: intakeData[0].fecha_fin,
        created_at: intakeData[0].created_at
      } : null,
      questionnaires: processedQuestionnaires,
      evolucion_clinica: evolutionData?.map(entry => ({
        id: entry.id,
        entry_type: entry.entry_type,
        content: entry.content,
        tags: entry.tags,
        created_at: entry.created_at,
        author_id: entry.author_id,
        metadata: entry.metadata
      })) || [],
      summary: {
        total_questionnaires: processedQuestionnaires.length,
        questionnaire_types: [...new Set(processedQuestionnaires.map(q => q.codigo))],
        has_intake: !!(intakeData && intakeData.length > 0),
        evolution_entries: evolutionData?.length || 0
      }
    };

    console.log(`[SUPERVISION STREAMING] ✅ Patient data loaded: ${patientData.patient.name}, ${patientData.questionnaires.length} questionnaires`);

    // 6. Crear contexto completo para GPT-4o
    const fullPatientContext = JSON.stringify(patientData, null, 2);

    // 7. Construir mensajes para OpenAI
    const messages = [
      {
        role: 'system',
        content: `${SUPERVISOR_SYSTEM_PROMPT}\n\n### Datos del Paciente:\n\`\`\`json\n${fullPatientContext}\n\`\`\``
      },
      ...conversationHistory,
      {
        role: 'user',
        content: messageText
      }
    ];

    console.log('[SUPERVISION STREAMING] 🤖 Calling OpenAI GPT-4o with streaming...');
    const openaiStartTime = Date.now();

    // 8. Llamar a OpenAI GPT-4o CON STREAMING
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-2024-08-06',
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: true // HABILITAR STREAMING
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('[SUPERVISION STREAMING] ❌ OpenAI error:', errorData);
      return NextResponse.json(
        { error: 'Error en OpenAI API', details: errorData },
        { status: 500 }
      );
    }

    // 9. Crear respuesta de streaming usando ReadableStream
    const encoder = new TextEncoder();
    let fullResponse = '';
    let tokenCount = 0;

    const stream = new ReadableStream({
      async start(controller) {
        const reader = openaiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  const totalDuration = Date.now() - requestStartTime;
                  const openaiDuration = Date.now() - openaiStartTime;
                  
                  // Enviar evento final con metadata
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'done',
                    metadata: {
                      total_duration: totalDuration,
                      openai_duration: openaiDuration,
                      tokens_used: tokenCount,
                      full_response: fullResponse
                    }
                  })}\n\n`));
                  
                  console.log(`[SUPERVISION STREAMING] ✅ Streaming completed in ${totalDuration}ms (OpenAI: ${openaiDuration}ms)`);
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    fullResponse += content;
                    tokenCount++;
                    
                    // Enviar chunk de contenido
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'content',
                      content: content
                    })}\n\n`));
                  }
                } catch (e) {
                  // Ignorar errores de parsing de chunks individuales
                }
              }
            }
          }
        } catch (error) {
          console.error('[SUPERVISION STREAMING] ❌ Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: 'Error en streaming'
          })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('[SUPERVISION STREAMING] ❌ General error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
