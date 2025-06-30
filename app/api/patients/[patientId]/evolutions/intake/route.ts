import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { z } from 'zod';

/*
  NOTE:
  This file is a copy of the original implementation that was mistakenly left
  under `insight/insight/app/api/...`.  Without it, the path
  `/api/patients/[pid]/evolutions/intake` returned 404 and the UI showed
  "error creating interview".  We relocated it to the canonical directory so
  that Next.js can detect the route in production builds.

  For simplicity – and to avoid introducing a new `debug` runtime dependency –
  the specialised logger (`logApiIntake`) has been replaced with plain
  `console.debug` statements.
*/

/**
 * Zod schema for validating the JSON `data` payload corresponding to the 26
 * intake fields.
 * We explicitly validate the numeric / enum constrained fields and allow the
 * rest as strings.
 */
import { intakeDataSchema, type IntakeData } from '@/lib/validation/intakeDataSchema';

const computeUrgente = (d: IntakeData) =>
  (d.gravedadTerapeuta === 'Grave' || d.gravedadTerapeuta === 'Extrema') && (d.apoyoSocial ?? 3) <= 2;

const getAuthenticatedUser = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return { id: session.user.id } as const;
};

/* ------------------------------------------------------------------------- */
/* GET – returns latest draft (or final if none)                              */
/* ------------------------------------------------------------------------- */
export async function GET(request: NextRequest) {
  console.debug('[GET intake] %s', request.nextUrl.pathname);
  const patientId = request.nextUrl.pathname.split('/')[3]; // /api/patients/{pid}/...

  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Draft first
  const { data: draft, error: draftErr } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('*')
    .eq('patient_id', patientId)
    .eq('tipo', 'intake')
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (draftErr) {
    console.error('[GET intake] draftErr', draftErr);
    return NextResponse.json({ error: draftErr.message }, { status: 500 });
  }
  if (draft) return NextResponse.json(draft);

  // 2. Latest final
  const { data: lastFinal, error: finalErr } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('*')
    .eq('patient_id', patientId)
    .eq('tipo', 'intake')
    .eq('status', 'final')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (finalErr) {
    console.error('[GET intake] finalErr', finalErr);
    return NextResponse.json({ error: finalErr.message }, { status: 500 });
  }
  if (!lastFinal) {
    return NextResponse.json({ message: 'No intake found' }, { status: 404 });
  }
  return NextResponse.json(lastFinal);
}

/* ------------------------------------------------------------------------- */
/* POST – create new draft intake                                            */
/* ------------------------------------------------------------------------- */
export async function POST(request: NextRequest) {
  console.debug('[POST intake] %s', request.nextUrl.pathname);
  const patientId = request.nextUrl.pathname.split('/')[3];
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await request.json().catch(() => ({}));
  const bodyData: IntakeData | undefined = (json && json.data) || undefined;

  // Validate or use minimal defaults
  let dataToInsert: IntakeData;
  if (bodyData) {
    const parsed = intakeDataSchema.safeParse(bodyData);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid intake format', details: parsed.error.flatten() }, { status: 400 });
    }
    dataToInsert = parsed.data;
  } else {
    // Minimal defaults (client usually sends something)
    dataToInsert = {
      edad: 0,
      sexo: 'Otro',
      estadoCivil: '',
      ocupacion: '',
      malestarPaciente: 1,
      gravedadTerapeuta: 'Ausencia',
      gaf: 1,
      apoyoSocial: 1,
    } as IntakeData;
  }

  // Prevent duplicate draft
  const { data: existingDraft } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('id')
    .eq('patient_id', patientId)
    .eq('tipo', 'intake')
    .eq('status', 'draft')
    .maybeSingle();
  if (existingDraft) return NextResponse.json(existingDraft);

  // Calculate next version based on final versions count
  const { data: lastFinal } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('version')
    .eq('patient_id', patientId)
    .eq('tipo', 'intake')
    .eq('status', 'final')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (lastFinal?.version ?? 0) + 1;

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .insert({
      patient_id: patientId,
      tipo: 'intake',
      version: nextVersion,
      schema_version: 1,
      status: 'draft',
      urgente: computeUrgente(dataToInsert),
      data: dataToInsert,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertErr) {
    console.error('[POST intake] insertErr', insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }
  return NextResponse.json(inserted, { status: 201 });
}

/* ------------------------------------------------------------------------- */
/* PATCH – update draft or publish                                           */
/* ------------------------------------------------------------------------- */
export async function PATCH(request: NextRequest) {
  console.debug('[PATCH intake] %s', request.nextUrl.pathname);
  const patientId = request.nextUrl.pathname.split('/')[3];
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const json = await request.json().catch(() => ({}));
  const newData: IntakeData | undefined = json.data;
  const publish: boolean | undefined = json.publish;

  // Fetch existing draft
  const { data: draft, error: draftErr } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('*')
    .eq('patient_id', patientId)
    .eq('tipo', 'intake')
    .eq('status', 'draft')
    .maybeSingle();
  if (draftErr) {
    console.error('[PATCH intake] draftErr', draftErr);
    return NextResponse.json({ error: draftErr.message }, { status: 500 });
  }
  if (!draft) return NextResponse.json({ error: 'No draft exists to update' }, { status: 404 });

  // Merge & validate
  const merged: IntakeData = newData ? { ...draft.data, ...newData } : draft.data;
  const parsed = intakeDataSchema.safeParse(merged);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid intake format', details: parsed.error.flatten() }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    data: parsed.data,
    urgente: computeUrgente(parsed.data),
    updated_at: new Date().toISOString(),
  };
  if (publish) updatePayload.status = 'final';

  const { data: updated, error: updErr } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .update(updatePayload)
    .eq('id', draft.id)
    .select()
    .single();
  if (updErr) {
    console.error('[PATCH intake] updErr', updErr);
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  return NextResponse.json(updated);
}
