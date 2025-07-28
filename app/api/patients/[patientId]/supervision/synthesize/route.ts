import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuración de Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SYNTHESIS_PROMPT = `Eres un Supervisor Clínico Interactivo. Tu tarea final es redactar un único párrafo de resumen cualitativo en prosa que integre la información inicial del perfil del paciente CON los nuevos insights y reflexiones surgidas durante la conversación de supervisión.

INSTRUCCIONES PARA LA SÍNTESIS:
1. Integra los datos originales del PAYLOAD_JSON con los insights de la conversación
2. Escribe en tercera persona, como si fueras un observador clínico
3. Usa un tono profesional pero accesible
4. Menciona conexiones específicas que se exploraron
5. Incluye hipótesis o conclusiones que surgieron del diálogo
6. Mantén un párrafo cohesivo de aproximadamente 150-200 palabras

EJEMPLO DE ESTILO:
"Durante la supervisión, se exploró la conexión entre la dinámica de evitación de vínculos del paciente y su historia de humillación en la adolescencia. Se discutió cómo su actual apatía podría funcionar como una defensa contra la herida narcisista, una hipótesis que surgió al triangular su relato sobre 'sentirse un sapo de otro pozo' con los bajos puntajes en la regulación de la autoestima del OPD-CA2-SQ. El terapeuta concluyó que el principal desafío será abordar la vergüenza subyacente para poder construir una alianza terapéutica más sólida, como lo indica la fragilidad reportada en el BR-WAI."

IMPORTANTE: 
- NO uses formato de lista o bullets
- NO incluyas recomendaciones de tratamiento específicas
- SÍ enfócate en los insights y conexiones descubiertas
- SÍ menciona datos específicos de cuestionarios si fueron discutidos`;

export async function POST(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar configuración de Gemini
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key de Gemini no configurada' }, 
        { status: 500 }
      );
    }

    const { patientId } = await params;
    const body = await request.json();
    const { conversationHistory } = body;

    if (!conversationHistory || conversationHistory.length < 2) {
      return NextResponse.json(
        { error: 'Historial de conversación insuficiente para generar síntesis' },
        { status: 400 }
      );
    }

    // Obtener datos consolidados del paciente
    const baseUrl = request.url.replace(`/api/patients/${patientId}/supervision/synthesize`, '');
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!dataResponse.ok) {
      return NextResponse.json(
        { error: 'Error obteniendo datos del paciente' }, 
        { status: dataResponse.status }
      );
    }

    const patientData = await dataResponse.json();

    // Preparar el contexto completo para la síntesis
    const fullContext = `
DATOS ORIGINALES DEL PACIENTE (PAYLOAD_JSON):
${JSON.stringify(patientData, null, 2)}

CONVERSACIÓN DE SUPERVISIÓN COMPLETA:
${conversationHistory.map((msg: any, index: number) => 
  `${msg.role === 'user' ? 'TERAPEUTA' : 'SUPERVISOR'}: ${msg.content}`
).join('\n\n')}

Basándote en toda esta información, redacta un párrafo de síntesis cualitativa que integre los datos originales del paciente con los insights y reflexiones que surgieron durante la conversación de supervisión.`;

    // Construir el mensaje para DeepSeek
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: SYNTHESIS_PROMPT
      },
      {
        role: 'user',
        content: fullContext
      }
    ];

    // Llamar a Gemini API
    const result = await model.generateContent(fullContext);
    const synthesisContent = result.response.text();

    // Guardar la síntesis en la tabla de evolución clínica
    const { data: evolutionEntry, error: evolutionError } = await supabaseAdmin
      .from('evolucion_clinica_entries')
      .insert({
        paciente_id: patientId,
        author_id: session.user.id,
        entry_type: 'supervision',
        content: synthesisContent,
        metadata: {
          conversation_length: conversationHistory.length,
          generated_at: new Date().toISOString(),
          ai_model: 'deepseek-chat',
          synthesis_type: 'supervision_chat'
        },
        tags: ['supervision', 'ia', 'sintesis'],
        is_draft: false
      })
      .select()
      .single();

    if (evolutionError) {
      console.error('Error saving synthesis to evolution:', evolutionError);
      return NextResponse.json(
        { error: 'Error guardando la síntesis en el historial clínico' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      synthesis: synthesisContent,
      evolutionEntryId: evolutionEntry.id,
      timestamp: new Date().toISOString(),
      model: 'gemini-1.5-flash',
      patientId
    });

  } catch (error) {
    console.error('Error generating synthesis:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
