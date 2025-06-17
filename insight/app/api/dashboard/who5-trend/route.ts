import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { startOfDay, addDays, parseISO } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or service role key is missing for WHO-5 trend API.');
}

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function GET(request: NextRequest) {
  console.log('[API WHO5-TREND] GET function invoked - v2');
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const psychologistId = session.user.id;
  console.log(`[API WHO5-TREND] Psychologist ID: ${psychologistId}`);

  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  let effectiveStartDate: Date;
  let effectiveEndDate: Date;

  if (endDateParam) {
    effectiveEndDate = parseISO(endDateParam);
  } else {
    effectiveEndDate = new Date(); // Default to today
  }

  if (startDateParam) {
    effectiveStartDate = parseISO(startDateParam);
  } else {
    // Default to 6 months before the effectiveEndDate
    effectiveStartDate = new Date(effectiveEndDate);
    effectiveStartDate.setMonth(effectiveEndDate.getMonth() - 6);
  }

  // Ensure queryStartDate is the start of the day for the .gte comparison
  const queryStartDate = startOfDay(effectiveStartDate);
  // Ensure queryEndDate is the start of the day *after* effectiveEndDate, for an exclusive upper bound (.lt comparison)
  const queryEndDate = startOfDay(addDays(effectiveEndDate, 1));

  console.log(`[API WHO5-TREND] Input Start: ${startDateParam}, Input End: ${endDateParam}`);
  console.log(`[API WHO5-TREND] Effective Start (used for queryStartDate): ${effectiveStartDate.toISOString()}, Effective End (used for queryEndDate): ${effectiveEndDate.toISOString()}`);
  console.log(`[API WHO5-TREND] Query StartDate (inclusive): ${queryStartDate.toISOString()}, Query EndDate (exclusive): ${queryEndDate.toISOString()}`);

  try {
    // 1. Get the ID of the WHO-5 questionnaire
    const { data: who5Cuestionario, error: who5Error } = await supabase
      .from('cuestionarios')
      .select('id')
      .eq('codigo', 'WHO-5')
      .single();

    if (who5Error || !who5Cuestionario) {
      console.error('[API WHO5-TREND] Error fetching WHO-5 questionnaire ID:', who5Error);
      return NextResponse.json({ error: 'WHO-5 questionnaire not found.' }, { status: 404 });
    }
    const who5CuestionarioId = who5Cuestionario.id;

    // 2. Fetch responses for WHO-5 within the date range for the psychologist's patients
    const { data: respuestasData, error: respuestasError } = await supabase
      .from('respuestas')
      .select(`
        creado_en,
        puntuacion,
        patient:paciente_id!inner ( name, psychologist_id )
      `)
      .eq('cuestionario_id', who5CuestionarioId)
      .eq('patient.psychologist_id', psychologistId) // Filter by psychologist via patient table
      .not('puntuacion', 'is', null) // Ensure score exists
      .gte('creado_en', queryStartDate.toISOString())
      .lt('creado_en', queryEndDate.toISOString()) // Use .lt with the start of the next day
      .order('creado_en', { ascending: true });

    console.log('[API WHO5-TREND] psychologistId:', psychologistId);
    console.log('[API WHO5-TREND] who5CuestionarioId:', who5CuestionarioId);
    console.log('[API WHO5-TREND] Querying ALL responses (date filters temporarily removed).');
    console.log('[API WHO5-TREND] Raw respuestasData:', JSON.stringify(respuestasData, null, 2));
    console.log('[API WHO5-TREND] respuestasError:', JSON.stringify(respuestasError, null, 2));

    if (respuestasError) {
      console.error('[API WHO5-TREND] Error fetching WHO-5 responses:', respuestasError);
      return NextResponse.json({ error: 'Failed to fetch WHO-5 responses.' }, { status: 500 });
    }

    // 3. Format data for scatter plot
    const scatterData = respuestasData.map((r: any) => ({
      x: r.creado_en, // Date for X-axis
      y: r.puntuacion, // Score for Y-axis
      patientName: r.patient ? (r.patient.name || '').trim() : 'Paciente Desconocido',
    }));

    console.log('[API WHO5-TREND] Mapped scatterData:', JSON.stringify(scatterData, null, 2));

    return NextResponse.json(scatterData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('[API WHO5-TREND] General error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
