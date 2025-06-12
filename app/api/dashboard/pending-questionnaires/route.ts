import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

interface PendingPatient {
  id: string;
  name: string;
  pendingCount: number;
}

export async function GET() {
  // 1. Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const psychologistId = session.user.id;

  try {
    // 2. Get all patient ids of psychologist
    const { data: patientsData, error: patientsError } = await supabaseAdmin
      .from('patients')
      .select('id, name')
      .eq('psychologist_id', psychologistId);

    if (patientsError) {
      console.error('[PendingQuestionnaires] Error fetching patients:', patientsError.message);
      return NextResponse.json({ error: 'Error fetching patients' }, { status: 500 });
    }

    if (!patientsData || patientsData.length === 0) {
      return NextResponse.json([]); // No patients => no pending questionnaires
    }

    const patientIds = patientsData.map((p) => p.id);

    // 3. Fetch all active pending questionnaire links for these patients
    const { data: linksData, error: linksError } = await supabaseAdmin
      .from('links_cuestionario')
      .select('paciente_id')
      .in('paciente_id', patientIds)
      .eq('consumido', false)
      .gt('expira_en', new Date().toISOString());

    if (linksError) {
      console.error('[PendingQuestionnaires] Error fetching pending links:', linksError.message);
      return NextResponse.json({ error: 'Error fetching pending questionnaire links' }, { status: 500 });
    }

    if (!linksData || linksData.length === 0) {
      return NextResponse.json([]);
    }

    // 4. Compute counts per patient
    const counts = new Map<string, number>();
    for (const link of linksData) {
      const pid = link.paciente_id as string;
      counts.set(pid, (counts.get(pid) || 0) + 1);
    }

    const result: PendingPatient[] = patientsData
      .filter((p) => counts.has(p.id))
      .map((p) => ({ id: p.id, name: p.name?.trim() || 'Sin nombre', pendingCount: counts.get(p.id)! }))
      .sort((a, b) => b.pendingCount - a.pendingCount);

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err: any) {
    console.error('[PendingQuestionnaires] Unexpected error:', err.message);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
