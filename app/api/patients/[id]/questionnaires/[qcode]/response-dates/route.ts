import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { type Session } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

interface Params {
  id: string;
  qcode: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params | Promise<Params> }
) {
  const { id, qcode } = await params;
  console.log(`[API /response-dates] Called for id: ${id}, qcode: ${qcode}`);

  const session = await getServerSession(authOptions) as Session;

  if (!session?.user?.id) {
    console.log('[API /response-dates] Unauthorized: No session or user ID.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const psychologistId = session.user.id;

  try {
    // 1. Verify patient ownership
    const { data: patientData, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', id)
      .eq('psychologist_id', psychologistId)
      .single();

    if (patientError || !patientData) {
      console.error(`[API /response-dates] Error verifying patient ownership or patient not found. ID: ${id}, PsychologistID: ${psychologistId}`, patientError);
      return NextResponse.json({ error: 'Patient not found or access denied.' }, { status: 404 });
    }
    console.log(`[API /response-dates] Patient ownership verified for id: ${id}`);

    // 2. Get cuestionario_id for the given qcode
    const { data: qData, error: qError } = await supabaseAdmin
        .from('cuestionarios')
        .select('id')
        .eq('codigo', qcode)
        .single();

    if (qError || !qData) {
        console.error(`[API /response-dates] Questionnaire with code ${qcode} not found.`, qError);
        return NextResponse.json({ error: `Questionnaire with code ${qcode} not found.` }, { status: 404 });
    }
    const cuestionarioId = qData.id;
    console.log(`[API /response-dates] Found questionnaire_id: ${cuestionarioId} for qcode: ${qcode}`);

    // 3. Fetch response timestamps for the patient and questionnaire
    const { data: rawResponses, error: datesError } = await supabaseAdmin
      .from('respuestas')
      .select('enviado_en')
      .eq('paciente_id', id)
      .eq('cuestionario_id', cuestionarioId)
      .order('enviado_en', { ascending: false });

    if (datesError) {
      console.error(`[API /response-dates] Error fetching response timestamps for id ${id}, qcode ${qcode}:`, datesError);
      return NextResponse.json({ error: 'Failed to fetch response dates', details: datesError.message }, { status: 500 });
    }

    // 4. Process in JavaScript to get distinct YYYY-MM-DD dates, sorted descending
    const distinctDates = Array.from(
      new Set(
        rawResponses?.map((r: { enviado_en: string | null }) => {
          if (!r.enviado_en) return null;
          try {
            const date = new Date(r.enviado_en);
            if (isNaN(date.getTime())) {
                console.warn(`[API /response-dates] Invalid date encountered: ${r.enviado_en}`);
                return null;
            }
            return date.toISOString().split('T')[0]; // Extracts YYYY-MM-DD
          } catch (e) {
            console.warn(`[API /response-dates] Error parsing date: ${r.enviado_en}`, e);
            return null;
          }
        }).filter(date => date !== null) as string[]
      )
    );
    // The Set provides uniqueness. The `order('enviado_en', { ascending: false })` from the DB query
    // should mean that when we create the Set and then Array.from, the order of first appearance is preserved,
    // effectively giving us dates sorted from most recent to oldest unique date.

    console.log(`[API /response-dates] Successfully fetched and processed response dates for id ${id}, qcode ${qcode}:`, distinctDates);
    return NextResponse.json(distinctDates);

  } catch (error: any) {
    console.error(`[API /response-dates] Unexpected error for id ${id}, qcode ${qcode}:`, error);
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}
