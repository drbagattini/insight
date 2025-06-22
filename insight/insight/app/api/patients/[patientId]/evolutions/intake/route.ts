import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { z } from 'zod';
import { logApiIntake } from '@/app/lib/logger';

/**
 * Zod schema for validating the JSON `data` payload corresponding to the 26 intake fields.
 * We explicitly validate the numeric / enum constrained fields and allow the rest as strings.
 * NOTE: The UI wizard must conform to this exact schema – keep keys in sync!
 */
export const intakeDataSchema = z.object({
  // READ-ONLY FIELDS (filled by backend / UI for display only)
  fechaEntrevista: z.string().datetime().optional(),
  nombrePaciente: z.string().optional(),

  // SOCIODEMOGRÁFICOS
  edad: z.number().int().min(0).max(120),
  sexo: z.enum(['Masculino', 'Femenino', 'Otro']),
  estadoCivil: z.string(),
  ocupacion: z.string(),

  // NÚCLEO FAMILIAR
  grupoFamiliar: z.string().optional(),
  conviveCon: z.string().optional(),

  // MOTIVO & CANAL
  motivoConsulta: z.string().optional(),
  derivante: z.string().optional(),

  // FORMULACIÓN INICIAL
  presentacion: z.string().optional(),
  diagnosticoTexto: z.string().optional(),
  diagnosticoCodigo: z.string().optional(),
  nivelPersonalidad: z.string().optional(),
  etiologia: z.string().optional(),

  // EVALUACIÓN ACTUAL
  malestarPaciente: z.number().min(1).max(5),
  atribucionPaciente: z.string().optional(),
  ayudaEsperada: z.array(z.string()).optional(),
  ayudaOtros: z.string().optional(),
  gravedadTerapeuta: z.enum(['Ausencia', 'Leve', 'Moderada', 'Grave', 'Extrema']),
  gaf: z.number().min(1).max(10),
  apoyoSocial: z.number().min(1).max(5),

  // ANTECEDENTES
  duracionTratPrevio: z.string().optional(),
  medicacionPrev: z.string().optional(),
  antecedentesSM: z.string().optional(),
  biologicos: z.string().optional(),

  // PLAN TERAPÉUTICO
  estrategia: z.string().optional(),
  posicionTerap: z.number().min(1).max(5),
}).strict();

// Helper to compute the `urgente` flag.
function computeUrgente(data: z.infer<typeof intakeDataSchema>): boolean {
  return (
    (data.gravedadTerapeuta === 'Grave' || data.gravedadTerapeuta === 'Extrema') &&
    data.apoyoSocial <= 2
  );
}

/**
 * Extract current user information ensuring they are authenticated and have a valid ID.
 */
async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  return { id: session.user.id, session } as const;
}

/**
 * GET  /api/patients/[pid]/evolutions/intake
 *      Returns the latest draft if present, otherwise the latest final version.
 */
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/");
  logApiIntake('%s %s', request.method, request.nextUrl.pathname);
  // Expected path: /api/patients/{pid}/evolutions/intake
  const patientId = segments[3];
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Look for a draft first
  const { data: draft, error: draftError } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('*')
    .eq('patient_id', patientId)
    .eq('tipo', 'intake')
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (draftError) {
    console.error('[GET intake] draftError', draftError);
    return NextResponse.json({ error: draftError.message }, { status: 500 });
  }
  if (draft) {
    return NextResponse.json(draft, { status: 200 });
  }

  // 2. Otherwise, fetch latest final
  const { data: latestFinal, error: finalError } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('*')
    .eq('patient_id', patientId)
    .eq('tipo', 'intake')
    .eq('status', 'final')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (finalError) {
    console.error('[GET intake] finalError', finalError);
    return NextResponse.json({ error: finalError.message }, { status: 500 });
  }

  if (!latestFinal) {
    return NextResponse.json({ message: 'No intake found' }, { status: 404 });
  }
  return NextResponse.json(latestFinal, { status: 200 });
}

/**
 * POST /api/patients/[pid]/evolutions/intake
 *     Creates a new draft evolution OR returns existing draft.
 * Body: { data: { ...26 fields... } }
 */
export async function POST(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/");
  logApiIntake('%s %s', request.method, request.nextUrl.pathname);
  const patientId = segments[3];

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { data: requestBodyData } = body as { data?: z.infer<typeof intakeDataSchema> };

  logApiIntake('[POST intake] patientId=%s, userId=%s, requestBodyData exists? %s', patientId, user.id, !!requestBodyData);

  const defaultDataForApi: z.infer<typeof intakeDataSchema> = {
    edad: 0, 
    sexo: 'Otro',
    estadoCivil: '',
    ocupacion: 'Estudiante',
    motivoConsulta: '',
    derivante: '',
    presentacion: '',
    diagnosticoTexto: '',
    diagnosticoCodigo: '',
    nivelPersonalidad: '',
    etiologia: '',
    malestarPaciente: 1,
    atribucionPaciente: '',
    ayudaEsperada: [],
    ayudaOtros: '',
    gravedadTerapeuta: 'Ausencia',
    gaf: 1,
    apoyoSocial: 1,
    duracionTratPrevio: '',
    medicacionPrev: '',
    antecedentesSM: '',
    biologicos: '',
    estrategia: '',
    posicionTerap: 1,
    // Optional fields can be omitted if schema marks them .optional()
    // Ensure all non-optional fields have a value.
    // fechaEntrevista and nombrePaciente are typically backend-filled or for display, not part of initial draft creation by user.
  };

  const dataToProcess = requestBodyData || defaultDataForApi;

  // Validate the final data to be inserted/processed
  const validationResult = intakeDataSchema.safeParse(dataToProcess);
  if (!validationResult.success) {
    console.error('[POST intake] Zod validation error for dataToProcess', validationResult.error.flatten());
    return NextResponse.json({ error: 'Invalid data format for intake', details: validationResult.error.flatten() }, { status: 400 });
  }
  const validatedData = validationResult.data;

  // Check if a draft already exists for this patient
  const { data: existingDraft, error: existingError } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('*')
    .eq('patient_id', patientId)
    .eq('tipo', 'intake')
    .eq('status', 'draft')
    .maybeSingle();

  if (existingError) {
    console.error('[POST intake] existingError', existingError);
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existingDraft) {
    // Return current draft without modification – client can PATCH to update.
    return NextResponse.json(existingDraft, { status: 200 });
  }

  // Determine next version (max final version + 1, or 1 if none)
  const { data: maxFinalVersionRow, error: maxVersionError } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('version')
    .eq('patient_id', patientId)
    .eq('tipo', 'intake')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxVersionError) {
    console.error('[POST intake] maxVersionError', maxVersionError);
    return NextResponse.json({ error: maxVersionError.message }, { status: 500 });
  }
  const nextVersion = (maxFinalVersionRow?.version ?? 0) + 1;

  // Insert new draft
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .insert({
      patient_id: patientId,
      tipo: 'intake',
      version: nextVersion,
      schema_version: 1,
      status: 'draft',
      urgente: computeUrgente(validatedData),
      data: validatedData,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    console.error('[POST intake] insertError', insertError);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(inserted, { status: 201 });
}

/**
 * PATCH /api/patients/[pid]/evolutions/intake
 *     Updates the existing draft OR publishes it as final.
 * Body: { data?: {...}, publish?: boolean }
 */
export async function PATCH(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/");
  logApiIntake('%s %s', request.method, request.nextUrl.pathname);
  const patientId = segments[3];
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { data: newData, publish } = body as { data?: unknown; publish?: boolean };

  // Fetch existing draft – must exist to patch
  const { data: draft, error: draftError } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('*')
    .eq('patient_id', patientId)
    .eq('tipo', 'intake')
    .eq('status', 'draft')
    .maybeSingle();

  if (draftError) {
    console.error('[PATCH intake] draftError', draftError);
    return NextResponse.json({ error: draftError.message }, { status: 500 });
  }

  if (!draft) {
    return NextResponse.json({ error: 'No draft exists to update' }, { status: 404 });
  }

  // Merge data if provided
  let updatedData = draft.data as any;
  if (newData) {
    // Validate if provided
    const parse = intakeDataSchema.safeParse({ ...updatedData, ...newData });
    if (!parse.success) {
      return NextResponse.json({ error: parse.error.errors }, { status: 400 });
    }
    updatedData = parse.data;
  }

  // Build update payload
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    data: updatedData,
    urgente: computeUrgente(updatedData),
  };

  if (publish) {
    updatePayload.status = 'final';
    // status changing to final; no version change – draft already carries nextVersion
  }

  const { data: updatedRow, error: updateError } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .update(updatePayload)
    .eq('id', draft.id)
    .select()
    .single();

  if (updateError) {
    console.error('[PATCH intake] updateError', updateError);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updatedRow, { status: 200 });
}
