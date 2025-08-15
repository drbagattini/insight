import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Define types for the response
interface RiskPatient {
  id: string;
  name: string;
  score?: number;
  date: string; // ISO string for date
  questionnaire: string; // Código del cuestionario que generó la alerta
  riskType: 'suicide' | 'general' | 'tdah' | 'sustancias' | 'autolesion'; // Tipos de riesgo expandidos
  item9?: number; // Para PHQ-9, valor del ítem 9 (ideación suicida)
  // Campos para alertas OYS
  alertType?: 'score' | 'clinical'; // Tipo de alerta: por puntaje o clínica específica
  message?: string; // Mensaje específico de la alerta
  evidence?: Array<{ item: number; value: number; text: string }>; // Evidencia de alertas OYS
  recommendations?: string[]; // Recomendaciones clínicas
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

    // 4. Patients at Risk (WHO-5 score < 25, PHQ-9 ≥ 10 or item 9 > 0)
    let riskPatients: RiskPatient[] = [];
    
    // Fetch questionnaire IDs
    const { data: questionnaires, error: questionnairesError } = await supabase
      .from('cuestionarios')
      .select('id, codigo')
      .in('codigo', ['WHO-5', 'PHQ-9']);

    if (questionnairesError || !questionnaires) {
      console.error('[DashboardSummary] Error fetching questionnaire IDs:', questionnairesError?.message);
    } else {
      const who5Id = questionnaires.find(q => q.codigo === 'WHO-5')?.id;
      const phq9Id = questionnaires.find(q => q.codigo === 'PHQ-9')?.id;
      
      const allRiskPatients = new Map<string, RiskPatient>();

      // WHO-5 Risk Assessment (score < 25)
      if (who5Id) {
        const { data: who5Responses, error: who5ResponsesError } = await supabase
          .from('respuestas')
          .select('paciente_id, puntuacion, creado_en, patient:patients!inner (id, name, psychologist_id)')
          .eq('cuestionario_id', who5Id)
          .eq('patient.psychologist_id', psychologistId)
          .not('puntuacion', 'is', null)
          .order('creado_en', { ascending: false });

        if (!who5ResponsesError && who5Responses) {
          const latestWho5ByPatient = new Map<string, typeof who5Responses[0]>();
          for (const response of who5Responses) {
            if (response.patient && response.paciente_id && !latestWho5ByPatient.has(response.paciente_id)) {
              latestWho5ByPatient.set(response.paciente_id, response);
            }
          }

          for (const response of latestWho5ByPatient.values()) {
            if (response.puntuacion < 25 && response.patient) {
              const patient = Array.isArray(response.patient) ? response.patient[0] : response.patient;
              allRiskPatients.set(response.paciente_id, {
                id: patient!.id,
                name: (patient!.name || '').trim(),
                score: response.puntuacion,
                date: response.creado_en,
                questionnaire: 'WHO-5',
                riskType: 'general',
                alertType: 'score'
              });
            }
          }
        }
      }

      // PHQ-9 Risk Assessment (total ≥ 10 or item 9 > 0)
      if (phq9Id) {
        const { data: phq9Responses, error: phq9ResponsesError } = await supabase
          .from('respuestas')
          .select('paciente_id, puntuacion, score_detallado, creado_en, patient:patients!inner (id, name, psychologist_id)')
          .eq('cuestionario_id', phq9Id)
          .eq('patient.psychologist_id', psychologistId)
          .not('puntuacion', 'is', null)
          .order('creado_en', { ascending: false });

        if (!phq9ResponsesError && phq9Responses) {
          const latestPhq9ByPatient = new Map<string, typeof phq9Responses[0]>();
          for (const response of phq9Responses) {
            if (response.patient && response.paciente_id && !latestPhq9ByPatient.has(response.paciente_id)) {
              latestPhq9ByPatient.set(response.paciente_id, response);
            }
          }

          for (const response of latestPhq9ByPatient.values()) {
            if (response.patient) {
              const patient = Array.isArray(response.patient) ? response.patient[0] : response.patient;
              const scoreDetallado = response.score_detallado;
              const item9 = scoreDetallado?.item9 || 0;
              const isAtRisk = response.puntuacion >= 10 || item9 > 0;
              
              if (isAtRisk) {
                const riskType = item9 > 0 ? 'suicide' : 'general';
                
                // Si ya hay un paciente de WHO-5, mantener el más crítico (suicidio > general)
                const existingRisk = allRiskPatients.get(response.paciente_id);
                if (!existingRisk || (riskType === 'suicide' && existingRisk.riskType === 'general')) {
                  allRiskPatients.set(response.paciente_id, {
                    id: patient!.id,
                    name: (patient!.name || '').trim(),
                    score: response.puntuacion,
                    date: response.creado_en,
                    questionnaire: 'PHQ-9',
                    riskType,
                    item9,
                    alertType: 'score'
                  });
                }
              }
            }
          }
        }
      }

      // Agregar alertas clínicas de Ohio Youth Scales
      try {
        const { data: oysAlerts, error: oysAlertsError } = await supabase
          .from('alertas_clinicas')
          .select(`
            id,
            paciente_id,
            tipo,
            severidad,
            mensaje,
            evidencia,
            fecha_creacion,
            patients!inner(id, name, psychologist_id)
          `)
          .eq('patients.psychologist_id', psychologistId)
          .eq('activa', true)
          .order('fecha_creacion', { ascending: false });

        if (!oysAlertsError && oysAlerts) {
          // Agrupar alertas por paciente (tomar la más reciente de cada tipo)
          const latestAlertsByPatient = new Map<string, typeof oysAlerts[0]>();
          
          for (const alert of oysAlerts) {
            const key = `${alert.paciente_id}-${alert.tipo}`;
            if (!latestAlertsByPatient.has(key)) {
              latestAlertsByPatient.set(key, alert);
            }
          }

          // Convertir alertas OYS a formato RiskPatient
          for (const alert of latestAlertsByPatient.values()) {
            if (alert.patients) {
              const patient = Array.isArray(alert.patients) ? alert.patients[0] : alert.patients;
              
              // Determinar prioridad de la alerta (autolesión > sustancias > tdah)
              const alertPriority = {
                'autolesion': 3,
                'sustancias': 2,
                'tdah': 1
              };
              
              const existingRisk = allRiskPatients.get(alert.paciente_id);
              const currentPriority = alertPriority[alert.tipo as keyof typeof alertPriority] || 0;
              const existingPriority = existingRisk?.riskType === 'suicide' ? 4 : 
                                     existingRisk?.riskType === 'autolesion' ? 3 :
                                     existingRisk?.riskType === 'sustancias' ? 2 :
                                     existingRisk?.riskType === 'tdah' ? 1 : 0;

              // Solo agregar/reemplazar si la nueva alerta tiene mayor o igual prioridad
              if (currentPriority >= existingPriority) {
                allRiskPatients.set(alert.paciente_id, {
                  id: patient.id,
                  name: (patient.name || '').trim(),
                  date: alert.fecha_creacion,
                  questionnaire: 'Ohio Youth Scales',
                  riskType: alert.tipo as 'tdah' | 'sustancias' | 'autolesion',
                  alertType: 'clinical',
                  message: alert.mensaje,
                  evidence: alert.evidencia || []
                });
              }
            }
          }
        } else if (oysAlertsError && oysAlertsError.code !== '42P01') {
          // Log error only if it's not "table doesn't exist"
          console.error('[DashboardSummary] Error fetching OYS alerts:', oysAlertsError.message);
        }
      } catch (error) {
        console.error('[DashboardSummary] Error processing OYS alerts:', error);
      }

      riskPatients = Array.from(allRiskPatients.values());
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
