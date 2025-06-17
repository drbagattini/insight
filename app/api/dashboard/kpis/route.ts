import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { KPIs } from '@/types/dashboard';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or service role key is missing.');
}

// Cliente Supabase Admin para dashboard KPIs
const supabase = createClient(
  supabaseUrl!,
  supabaseServiceRoleKey!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const psychologistId = session.user.id;
  console.log(`[KPIs] Iniciando cálculo de KPIs para psychologistId: ${psychologistId}`);

  // KPI: Pacientes Activos
  let activePatients = 0;
  try {
    const { error, count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
      .eq('psychologist_id', psychologistId);
    if (error) {
      console.error('[KPIs] Error en conteo de pacientes activos:', error);
    } else {
      activePatients = count ?? 0;
    }
  } catch (err) {
    console.error('[KPIs] Excepción en conteo de pacientes activos:', err);
  }

  // KPI: Enlaces pendientes
  let pendingLinks = 0;
  try {
    const { data: patientRows, error: patErr } = await supabase
      .from('patients')
      .select('id')
      .eq('psychologist_id', psychologistId);
    if (patErr) {
      console.error('[KPIs] Error al obtener IDs de pacientes:', patErr);
    } else if (patientRows) {
      const patientIds = patientRows.map(p => p.id);
      const { error: pendErr, count } = await supabase
        .from('links_cuestionario')
        .select('*', { count: 'exact', head: true })
        .eq('consumido', false)
        .gt('expira_en', new Date().toISOString())
        .in('paciente_id', patientIds);
      if (pendErr) {
        console.error('[KPIs] Error en conteo de enlaces pendientes:', pendErr);
      } else {
        pendingLinks = count ?? 0;
      }
    }
  } catch (err) {
    console.error('[KPIs] Excepción en conteo de enlaces pendientes:', err);
  }

  // KPI: Citas semanal y previa
  const now = new Date();
  const startOfWeek = getStartOfWeek(now);
  const endOfWeek = getEndOfWeek(now);
  const startOfPrevWeek = getStartOfPreviousWeek(now);
  const endOfPrevWeek = getEndOfPreviousWeek(now);
  console.log(`[KPIs] Fechas de consulta - Semana actual: ${startOfWeek.toISOString()} a ${endOfWeek.toISOString()}`);
  console.log(`[KPIs] Fechas de consulta - Semana pasada: ${startOfPrevWeek.toISOString()} a ${endOfPrevWeek.toISOString()}`);

  let weekAppointments = 0;
  try {
    const { error: weekErr, count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', psychologistId)
      .gte('start_time', startOfWeek.toISOString())
      .lte('start_time', endOfWeek.toISOString());
    if (weekErr) {
      console.error('[KPIs] Error en conteo de citas semana actual:', weekErr);
    } else {
      weekAppointments = count ?? 0;
    }
  } catch (err) {
    console.error('[KPIs] Excepción en conteo de citas semana actual:', err);
  }

  let previousWeekAppointments = 0;
  try {
    const { error: prevErr, count } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', psychologistId)
      .gte('start_time', startOfPrevWeek.toISOString())
      .lte('start_time', endOfPrevWeek.toISOString());
    if (prevErr) {
      console.error('[KPIs] Error en conteo de citas semana pasada:', prevErr);
    } else {
      previousWeekAppointments = count ?? 0;
    }
  } catch (err) {
    console.error('[KPIs] Excepción en conteo de citas semana pasada:', err);
  }

  const deltaAppointments = calculateDelta(weekAppointments, previousWeekAppointments);

  const kpis: KPIs = {
    activePatients,
    pendingLinks,
    weekAppointments,
    deltaActive: null,
    deltaPending: null,
    deltaAppointments,
  };

  return NextResponse.json(kpis, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  });
}

function getStartOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
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

function dateToSupabaseString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function calculateDelta(current: number | null, previous: number | null): number | null {
  // Si no hay datos previos pero sí actuales, retornar 100% de incremento
  if (previous === 0 || previous === null) return current && current > 0 ? 100 : 0;
  // Si no hay datos actuales, retornar null (sin cambio)
  if (current === null) return null;
  // Si son iguales, retornar 0% de cambio
  if (current === previous) return 0;
  // Calcular el porcentaje de cambio
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

/**
 * PostgreSQL function count_appointments_for_period:
 *
 * CREATE OR REPLACE FUNCTION count_appointments_for_period(
 *   uid UUID,
 *   from_date DATE,
 *   to_date DATE
 * ) RETURNS INTEGER
 * LANGUAGE sql STABLE AS $$
 *   SELECT COUNT(*)::INT
 *   FROM appointments
 *   WHERE user_id = uid
 *     AND start_time >= from_date
 *     AND start_time < to_date;
 * $$;
 */