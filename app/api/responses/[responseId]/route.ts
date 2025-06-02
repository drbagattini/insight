import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import type { Session as NextAuthSession } from 'next-auth';
import { NextResponse, NextRequest } from 'next/server'; // Import NextRequest
import type { Database } from '@/types/supabase';
import type { ResponseDetail, ResponseItemDetail } from '@/types/patient-responses';

export const dynamic = 'force-dynamic';

interface CustomSession extends NextAuthSession { 
  sbAccessToken?: string;
  sbRefreshToken?: string;
}

export async function GET(
  request: NextRequest,
  context: { params: { responseId: string } | Promise<{ responseId: string }> }
) {
  const { responseId } = await context.params;
  if (!responseId) {
    return NextResponse.json({ error: 'Response ID is required' }, { status: 400 });
  }

  const nextAuthSession = await getServerSession(authOptions) as CustomSession | null;

  if (!nextAuthSession) {
    console.log('[API /responses/[responseId]] No NextAuth session found.');
    return NextResponse.json({ error: 'Unauthorized: No NextAuth session' }, { status: 401 });
  }

  if (!nextAuthSession.user || !nextAuthSession.user.id) { 
    console.log('[API /responses/[responseId]] NextAuth session found, but user or user ID is missing.');
    return NextResponse.json({ error: 'Unauthorized: User or User ID missing in NextAuth session' }, { status: 401 });
  }
  const psychologistId = nextAuthSession.user.id; 
  console.log('[API /responses/[responseId]] NextAuth session found. User ID (Psychologist ID):', psychologistId);

  const supabaseAccessToken = nextAuthSession.sbAccessToken;
  const supabaseRefreshToken = nextAuthSession.sbRefreshToken; 

  if (!supabaseAccessToken) {
    console.error('[API /responses/[responseId]] Supabase access token not found in NextAuth session.');
    return NextResponse.json({ error: 'Server configuration error: Supabase token missing' }, { status: 500 });
  }
  console.log('[API /responses/[responseId]] Supabase access token found in NextAuth session.');

  let supabase;
  try {
    supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) { 
            const cookieStore = await cookies(); 
            return cookieStore.get(name)?.value;
          },
          async set(name: string, value: string, options: CookieOptions) {
            try {
              const cookieStore = await cookies();
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.warn(`[API /responses/[responseId]] Error setting cookie (set: ${name}):`, error);
            }
          },
          async remove(name: string, options: CookieOptions) {
            try {
              const cookieStore = await cookies();
              cookieStore.set({ name, value: '', ...options, maxAge: 0 });
            } catch (error) {
              // The `delete` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
              console.warn(`[API /responses/[responseId]] Error removing cookie (remove: ${name}):`, error);
            }
          },
        },
      }
    );
  } catch (e: any) {
    console.error('[API /responses/[responseId]] Error creating Supabase client:', e.message);
    return NextResponse.json({ error: 'Failed to initialize Supabase client', details: e.message }, { status: 500 });
  }

  console.log('[API /responses/[responseId]] Attempting to set Supabase session manually with token...');
  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: supabaseAccessToken,
    refresh_token: supabaseRefreshToken || '', 
  });

  if (setSessionError) {
    console.error('[API /responses/[responseId]] Error setting Supabase session:', setSessionError.message);
    // It's important to check the type of error. If it's 'invalid_grant', the refresh token might be bad.
    // If it's 'user_not_found', there's a sync issue.
    return NextResponse.json({ error: 'Failed to set Supabase session', details: setSessionError.message }, { status: 500 });
  }
  console.log('[API /responses/[responseId]] Supabase session presumably set. Verifying user...');

  const { data: { user: supabaseUser }, error: getUserError } = await supabase.auth.getUser();

  if (getUserError || !supabaseUser) {
    console.error('[API /responses/[responseId]] Error verifying Supabase user or no user found after setSession:', getUserError?.message);
    return NextResponse.json({ error: 'Unauthorized: Failed to verify Supabase user', details: getUserError?.message }, { status: 401 });
  }

  console.log('[API /responses/[responseId]] Supabase user verified:', supabaseUser.id);
  if (supabaseUser.id !== psychologistId) {
    console.error(`[API /responses/[responseId]] Mismatch between NextAuth user ID (${psychologistId}) and Supabase user ID (${supabaseUser.id}) after setSession.`);
    // This is a critical error indicating a desynchronization or an issue with token handling.
    return NextResponse.json({ error: 'User ID mismatch after session synchronization' }, { status: 500 });
  }

  try {
    // 2. Fetch response details and verify ownership (using the initialized supabase client)
    const { data: responseData, error: responseError } = await supabase
      .from('respuestas')
      .select(`
        id,
        paciente_id,
        enviado_en,
        puntuacion,
        respuestas,
        cuestionarios (
          id,
          codigo,
          titulo,
          items
        )
      `)
      .eq('id', responseId)
      .single();
      
    // Definimos tipos para facilitar el manejo de datos
    type ItemCuestionario = {
      id: number;
      texto: string;
    };
    
    type Cuestionario = {
      id: string;
      codigo: string;
      titulo: string;
      items: ItemCuestionario[];
    };

    // Loguear los datos recibidos para depuración
    if (responseData) {
      // Determinar si cuestionarios es un array o un objeto individual
      console.log(`[API /responses/${responseId}] Response data type:`, {
        cuestionarios_is_array: Array.isArray(responseData.cuestionarios),
        cuestionarios_type: typeof responseData.cuestionarios
      });
      
      // Acceder al primer elemento si es un array, o directamente si es un objeto
      const cuestionario = Array.isArray(responseData.cuestionarios) 
        ? responseData.cuestionarios[0] as Cuestionario 
        : responseData.cuestionarios as unknown as Cuestionario;
      
      console.log(`[API /responses/${responseId}] Response data:`, {
        id: responseData.id,
        paciente_id: responseData.paciente_id,
        cuestionario: cuestionario ? {
          id: cuestionario.id,
          codigo: cuestionario.codigo,
          titulo: cuestionario.titulo,
          items_count: Array.isArray(cuestionario.items) ? cuestionario.items.length : 'not an array'
        } : null
      });
    }

    if (responseError) {
      console.error(`[API /responses/${responseId}] Error fetching response ${responseId}:`, responseError);
      if (responseError.code === 'PGRST116') { 
        return NextResponse.json({ error: 'Response not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Error fetching response details', details: responseError.message }, { status: 500 });
    }

    if (!responseData) { 
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }
    
    // Verificar que tenemos un paciente_id válido
    if (!responseData.paciente_id) {
      console.error(`[API /responses/${responseId}] Response ${responseId} is missing paciente_id`);
      return NextResponse.json({ error: 'Response data is missing patient information' }, { status: 500 });
    }

    // Consulta explícita a la tabla 'patients' para obtener el psychologist_id
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('psychologist_id')
      .eq('id', responseData.paciente_id)
      .single();

    if (patientError || !patientData) {
      console.error(`[API /responses/${responseId}] Error fetching patient data for paciente_id ${responseData.paciente_id}:`, patientError);
      return NextResponse.json({ 
        error: 'Could not verify patient ownership', 
        details: patientError?.message || 'Patient data not found' 
      }, { status: patientError?.code === 'PGRST116' ? 404 : 500 });
    }

    const patientPsychologistId = patientData.psychologist_id;

    // Verificar que el psicólogo del paciente coincida con el de la sesión
    if (patientPsychologistId !== psychologistId) {
      console.warn(`[API /responses/${responseId}] Unauthorized access attempt. ` +
        `Session psychologist ID: ${psychologistId}, ` +
        `Patient's psychologist ID: ${patientPsychologistId}`);
      return NextResponse.json({ 
        error: 'Forbidden: You do not have access to this response.' 
      }, { status: 403 });
    }
    
    interface RawAnswerItem {
      pregunta_id: number; 
      valor: number;       
    }

    interface QuestionDefinitionDB {
      id: number; 
      texto: string; 
    }

    // Acceder al cuestionario (como primer elemento del array o directamente)
    const cuestionario = Array.isArray(responseData.cuestionarios) 
      ? responseData.cuestionarios[0] as unknown as Cuestionario 
      : responseData.cuestionarios as unknown as Cuestionario;
    
    const questionDefinitions = cuestionario?.items as QuestionDefinitionDB[] | undefined;
    const rawAnswers = responseData.respuestas as RawAnswerItem[] | undefined;
    let enrichedItems: ResponseItemDetail[] = [];

    if (questionDefinitions && Array.isArray(questionDefinitions) && rawAnswers && Array.isArray(rawAnswers)) {
      console.log(`[API /responses/${responseId}] Processing ${questionDefinitions.length} question definitions and ${rawAnswers.length} answers`);
      
      const questionsMap = new Map<number, QuestionDefinitionDB>(); 
      questionDefinitions.forEach(qDef => {
        if (qDef.id !== undefined && qDef.id !== null) { 
          questionsMap.set(qDef.id, qDef);
        }
      });

      enrichedItems = rawAnswers.map((rawAnswer): ResponseItemDetail | null => {
        if (rawAnswer.pregunta_id === undefined || rawAnswer.pregunta_id === null) { 
          console.warn(`[API /responses/${responseId}] Raw answer item missing or invalid pregunta_id:`, rawAnswer);
          return null; 
        }
        const qDef = questionsMap.get(rawAnswer.pregunta_id);
        
        if (!qDef) {
          console.warn(`[API /responses/${responseId}] Question definition not found for pregunta_id: ${rawAnswer.pregunta_id}`);
          return {
            questionId: String(rawAnswer.pregunta_id),
            questionText: `Unknown Question (ID: ${rawAnswer.pregunta_id})`,
            answerValue: rawAnswer.valor,
            answerText: typeof rawAnswer.valor === 'number' ? String(rawAnswer.valor) : undefined,
          };
        }

        const answerText = typeof rawAnswer.valor === 'number' ? String(rawAnswer.valor) : undefined;

        return {
          questionId: String(rawAnswer.pregunta_id),
          questionText: qDef.texto,
          answerValue: rawAnswer.valor,
          answerText: answerText,
        };
      }).filter(item => item !== null) as ResponseItemDetail[];
    } else {
      if (!questionDefinitions || !Array.isArray(questionDefinitions)) {
        console.warn(`[API /responses/${responseId}] Questionnaire items (cuestionarios.items) is missing or not an array.`);
      }
      if (!rawAnswers || !Array.isArray(rawAnswers)) {
        console.warn(`[API /responses/${responseId}] Patient answers (respuestas.respuestas) is missing or not an array.`);
      }
    }

    const detailedResponse: ResponseDetail = {
      id: responseData.id,
      patient_id: responseData.paciente_id,
      questionnaire_code: cuestionario?.codigo || 'N/A',
      questionnaire_name: cuestionario?.titulo || 'Unknown Questionnaire',
      date: responseData.enviado_en as string,
      score: responseData.puntuacion,
      items: enrichedItems, 
    };

    console.log('[API /responses/[responseId]] Detailed Response:', JSON.stringify(detailedResponse, null, 2));

    return NextResponse.json(detailedResponse, { status: 200 });

  } catch (error: any) {
    console.error(`[API /responses/${responseId}] Unexpected error in main processing block:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
