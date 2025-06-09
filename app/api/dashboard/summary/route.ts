import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Define types for the response
interface RiskPatient {
  id: string;
  name: string;
  score: number;
  date: string; // ISO string for date
}

interface DashboardSummary {
  activePatients: number;
  weekAppointments: number;
  questionnairesPending: number;
  riskPatients: RiskPatient[];
  weekVariation: number | null;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or service role key is missing for dashboard summary API.');
}

// Supabase Admin Client
const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// --- Helper Functions (copied from kpis/route.ts) --- 
function getStartOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 (Sunday) - 6 (Saturday)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const res = new Date(date.setDate(diff));
  res.setHours(0, 0, 0, 0);
  return res;
}

function getEndOfWeek(d: Date): Date {
  const start = getStartOfWeek(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getStartOfPreviousWeek(d: Date): Date {
  const start = getStartOfWeek(d);
  const prev = new Date(start);
  prev.setDate(start.getDate() - 7);
  return prev;
}

function getEndOfPreviousWeek(d: Date): Date {
  const prevStart = getStartOfPreviousWeek(d);
  const end = new Date(prevStart);
  end.setDate(prevStart.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function calculateDelta(current: number | null, previous: number | null): number | null {
  if (previous === 0 || previous === null) return current && current > 0 ? 100 : (current === 0 ? 0 : null); // Handle previous is 0 or null
  if (current === null) return null;
  if (current === previous) return 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}
// --- End Helper Functions ---

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const psychologistId = session.user.id;
  console.log(`[DashboardSummary] Initiating summary for psychologistId: ${psychologistId}`);

  try {
    // 1. Active Patients
    let activePatients = 0;
    const { count: activePatientsCount, error: activePatientsError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', psychologistId)
      .eq('active', true);
    if (activePatientsError) console.error('[DashboardSummary] Error fetching active patients:', activePatientsError.message);
    else activePatients = activePatientsCount ?? 0;

    // 2. Questionnaires Pending
    let questionnairesPending = 0;
    const { data: patientIdsData, error: patientIdsError } = await supabase
      .from('patients')
      .select('id')
      .eq('psychologist_id', psychologistId);

    if (patientIdsError) {
      console.error('[DashboardSummary] Error fetching patient IDs for pending links:', patientIdsError.message);
    } else if (patientIdsData && patientIdsData.length > 0) {
      const patientIds = patientIdsData.map(p => p.id);
      const { count: pendingLinksCount, error: pendingLinksError } = await supabase
        .from('links_cuestionario')
        .select('*', { count: 'exact', head: true })
        .in('paciente_id', patientIds)
        .eq('consumido', false)
        .gt('expira_en', new Date().toISOString());
      if (pendingLinksError) console.error('[DashboardSummary] Error fetching pending links:', pendingLinksError.message);
      else questionnairesPending = pendingLinksCount ?? 0;
    }

    // 3. Week Appointments & Variation
    const now = new Date();
    const startOfWeek = getStartOfWeek(now);
    const endOfWeek = getEndOfWeek(now);
    const startOfPrevWeek = getStartOfPreviousWeek(now);
    const endOfPrevWeek = getEndOfPreviousWeek(now);

    let weekAppointments = 0;
    const { count: weekAppointmentsCount, error: weekAppointmentsError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', psychologistId)
      .gte('start_time', startOfWeek.toISOString())
      .lte('start_time', endOfWeek.toISOString());
    if (weekAppointmentsError) console.error('[DashboardSummary] Error fetching week appointments:', weekAppointmentsError.message);
    else weekAppointments = weekAppointmentsCount ?? 0;

    let previousWeekAppointments = 0;
    const { count: prevWeekAppointmentsCount, error: prevWeekAppointmentsError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', psychologistId)
      .gte('start_time', startOfPrevWeek.toISOString())
      .lte('start_time', endOfPrevWeek.toISOString());
    if (prevWeekAppointmentsError) console.error('[DashboardSummary] Error fetching previous week appointments:', prevWeekAppointmentsError.message);
    else previousWeekAppointments = prevWeekAppointmentsCount ?? 0;
    
    const weekVariation = calculateDelta(weekAppointments, previousWeekAppointments);

    // 4. Patients at Risk (WHO-5 score < 25)
    let riskPatients: RiskPatient[] = [];
    const { data: who5Cuestionario, error: who5Error } = await supabase
      .from('cuestionarios')
      .select('id')
      .eq('codigo', 'WHO-5')
      .single();

    if (who5Error || !who5Cuestionario) {
      console.error('[DashboardSummary] Error fetching WHO-5 questionnaire ID:', who5Error?.message);
    } else {
      const who5CuestionarioId = who5Cuestionario.id;
      // Fetch all WHO-5 responses for the psychologist's patients, then process
      const { data: allWho5Responses, error: responsesError } = await supabase
        .from('respuestas')
        .select('paciente_id, puntuacion, creado_en, patient:patients!inner (id, name, psychologist_id)')
        .eq('cuestionario_id', who5CuestionarioId)
        .eq('patient.psychologist_id', psychologistId) // Ensure patient belongs to the psychologist
        .not('puntuacion', 'is', null)
        .order('creado_en', { ascending: false }); // Get latest first overall

      if (responsesError) {
        console.error('[DashboardSummary] Error fetching WHO-5 responses for risk assessment:', responsesError.message);
      } else if (allWho5Responses) {
        const latestScoresByPatient = new Map<string, typeof allWho5Responses[0]>();
        for (const response of allWho5Responses) {
           // Ensure patient is not null before accessing its properties
          if (response.patient && response.paciente_id) { 
            if (!latestScoresByPatient.has(response.paciente_id)) {
              latestScoresByPatient.set(response.paciente_id, response);
            }
          }
        }

        riskPatients = Array.from(latestScoresByPatient.values())
          .filter(r => r.puntuacion < 25 && r.patient)
          .map(r => ({
            id: r.patient!.id,
            name: (r.patient!.name || '').trim(),
            score: r.puntuacion,
            date: r.creado_en,
          }));
      }
    }

    const summaryData: DashboardSummary = {
      activePatients,
      weekAppointments,
      questionnairesPending,
      riskPatients,
      weekVariation,
    };

    return NextResponse.json(summaryData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error: any) {
    console.error('[DashboardSummary] General error:', error.message);
    return NextResponse.json({ error: 'An unexpected error occurred processing dashboard summary.' }, { status: 500 });
  }
}
