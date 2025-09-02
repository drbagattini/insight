import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import type { Session as NextAuthSession } from 'next-auth';
import { NextResponse, NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';
import type { ResponseDetail, ResponseItemDetail } from '@/types/patient-responses';

export const dynamic = 'force-dynamic';

interface RouteHandlerParams {
  responseId: string;
}

interface CustomSession extends NextAuthSession {
  sbAccessToken?: string;
  sbRefreshToken?: string;
}

// Type definitions for data structures used in this route
interface RawAnswerItem {
  pregunta_id: number | string;
  valor: number;
}

interface AnswerOption {
  valor: number | string;
  texto: string;
}

interface QuestionDefinitionDB {
  id: number | string;
  texto: string;
  opciones_respuesta?: AnswerOption[];
}

type ItemCuestionario = {
  id: number;
  texto: string;
  opciones_respuesta?: AnswerOption[];
};

type Cuestionario = {
  id: string;
  codigo: string;
  titulo: string;
  descripcion_escala?: string;
  items: ItemCuestionario[] | string[] | { items: ItemCuestionario[] | string[] }; // Flexible items structure
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ responseId: string }> }
) {
  const { responseId } = await params;
  if (!responseId) {
    return NextResponse.json({ error: 'Response ID is required' }, { status: 400 });
  }

  try {
    const nextAuthSession = await getServerSession(authOptions) as CustomSession | null;
    if (!nextAuthSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized: No session or user ID found' }, { status: 401 });
    }
    const psychologistId = nextAuthSession.user.id;

    const supabase = supabaseAdmin;

    const { data: responseData, error: responseError } = await supabase
      .from('respuestas')
      .select('*, cuestionarios(*)')
      .eq('id', responseId)
      .single();

    if (responseError) {
      console.error(`[API /responses/${responseId}] Error fetching response:`, responseError);
      return NextResponse.json({ error: 'Error fetching response', details: responseError.message }, { status: 500 });
    }

    if (!responseData) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    if (!responseData.paciente_id) {
      return NextResponse.json({ error: 'Response is missing patient information' }, { status: 500 });
    }

    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('psychologist_id')
      .eq('id', responseData.paciente_id)
      .single();

    if (patientError || !patientData) {
      console.error(`[API /responses/${responseId}] Error fetching patient ownership:`, patientError);
      return NextResponse.json({ error: 'Could not verify patient ownership' }, { status: 500 });
    }

    if (patientData.psychologist_id !== psychologistId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cuestionario = responseData.cuestionarios as unknown as Cuestionario;
    
    let actualQuestionDefinitions: (QuestionDefinitionDB | string)[] | undefined;
    if (cuestionario?.items) {
      if (Array.isArray(cuestionario.items)) {
        actualQuestionDefinitions = cuestionario.items;
      } else if (typeof cuestionario.items === 'object' && (cuestionario.items as any).items && Array.isArray((cuestionario.items as any).items)) {
        actualQuestionDefinitions = (cuestionario.items as any).items;
      }
    }

    let rawAnswers: RawAnswerItem[] | undefined;
    if (Array.isArray(responseData.respuestas)) {
      rawAnswers = responseData.respuestas as RawAnswerItem[];
    } else if (responseData.respuestas && typeof responseData.respuestas === 'object' && Array.isArray((responseData.respuestas as any).respuestas)) {
      rawAnswers = (responseData.respuestas as any).respuestas as RawAnswerItem[];
    }

    let enrichedItems: ResponseItemDetail[] = [];

    if (actualQuestionDefinitions && rawAnswers) {
      const questionsMap = new Map<string, QuestionDefinitionDB>();
      const defaultLikertOptions: AnswerOption[] = [
        { valor: 0, texto: 'No' },
        { valor: 1, texto: 'Más bien no' },
        { valor: 2, texto: 'Más o menos' },
        { valor: 3, texto: 'Más bien sí' },
        { valor: 4, texto: 'Sí' },
      ];

      actualQuestionDefinitions.forEach((qDefRaw, idx) => {
        let processed: QuestionDefinitionDB;
        if (typeof qDefRaw === 'string') {
          processed = { id: idx + 1, texto: qDefRaw, opciones_respuesta: defaultLikertOptions };
        } else {
          processed = { ...qDefRaw };
          if (processed.id === undefined || processed.id === null) processed.id = idx + 1;
          if (!processed.opciones_respuesta || processed.opciones_respuesta.length === 0) {
            processed.opciones_respuesta = defaultLikertOptions;
          }
        }
        
        // Map both numeric ID and potential string ID patterns
        questionsMap.set(String(processed.id), processed);
        
        // For OYS consolidated questionnaires, also map the item-X-Y pattern
        if (cuestionario?.codigo?.includes('OYS') && cuestionario.codigo.includes('40')) {
          const stringId = `item-${idx}-${processed.id}`;
          questionsMap.set(stringId, processed);
        }
      });

      enrichedItems = rawAnswers.map((rawAnswer): ResponseItemDetail | null => {
        if (rawAnswer.pregunta_id === undefined || rawAnswer.pregunta_id === null) return null;
        
        const lookupKey = String(rawAnswer.pregunta_id);
        const qDef = questionsMap.get(lookupKey);

        if (!qDef) {
          return { questionId: lookupKey, questionText: `Unknown Question (ID: ${lookupKey})`, answerValue: rawAnswer.valor, answerText: String(rawAnswer.valor) };
        }

        let answerTextToShow = String(rawAnswer.valor);
        if (qDef.opciones_respuesta) {
          const matchingOption = qDef.opciones_respuesta.find(opt => opt.valor === rawAnswer.valor);
          if (matchingOption) answerTextToShow = matchingOption.texto;
        }

        return { questionId: lookupKey, questionText: qDef.texto, answerValue: rawAnswer.valor, answerText: answerTextToShow };
      }).filter((item): item is ResponseItemDetail => item !== null);
    }

    const detailedResponse: ResponseDetail = {
      id: responseData.id,
      patient_id: responseData.paciente_id,
      questionnaire_code: cuestionario?.codigo || 'N/A',
      questionnaire_name: cuestionario?.titulo || 'Unknown Questionnaire',
      questionnaire_scale_description: cuestionario?.descripcion_escala || 'Escala: 0 (No), 1 (Más bien no), 2 (Más o menos), 3 (Más bien sí), 4 (Sí)',
      date: responseData.enviado_en as string,
      score: responseData.puntuacion,
      items: enrichedItems,
    };

    return NextResponse.json(detailedResponse, { status: 200 });

  } catch (error: any) {
    console.error(`[API /responses/${responseId}] Unexpected error:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
