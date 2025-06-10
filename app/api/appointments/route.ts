import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session as NextAuthSession } from 'next-auth'; // Import Session type
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { RRule } from 'rrule';
import { z } from 'zod';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Extend session type locally to include our custom Google Calendar fields
interface ExtendedSession extends NextAuthSession {
  googleCalendarScopeGranted?: boolean;
  googleCalendarAccessToken?: string;
  // Ensure other custom fields like sbAccessToken are also here if accessed directly from session
  sbAccessToken?: string;
  accessToken?: string; // This might be the old googleLoginAccessToken if still needed elsewhere, or can be removed if not
}

// Schema de validación para citas
const appointmentSchema = z.object({
  paciente_id: z.string().uuid('Patient ID debe ser un UUID válido'), // Made mandatory
  title: z.string().optional(),
  start_time: z.string().min(1, 'Fecha de inicio requerida'),
  end_time: z.string().min(1, 'Fecha de fin requerida'),
  rrule: z.string().regex(/^RRULE:FREQ=(DAILY|WEEKLY|MONTHLY);INTERVAL=\d+$/, 'Formato de RRULE inválido').optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
});

// GET: list appointments in a date range and expand recurring events
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  if (!start || !end) {
    return NextResponse.json({ error: 'Missing start or end' }, { status: 400 });
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  // Fetch non-recurring appointments with patient name
  const { data: nonRec, error: err1 } = await supabase
    .from('appointments')
    .select(`
      *,
      pacientes:paciente_id (
        id,
        name
      )
    `)
    .eq('user_id', session.user.id)
    .is('rrule', null)
    .gte('start_time', startDate.toISOString())
    .lte('end_time', endDate.toISOString());
  if (err1) {
    console.error(err1);
    return NextResponse.json({ error: err1.message }, { status: 500 });
  }

  // Fetch recurring master records with patient name
  const { data: recMasters, error: err2 } = await supabase
    .from('appointments')
    .select(`
      *,
      pacientes:paciente_id (
        id,
        name
      )
    `)
    .eq('user_id', session.user.id)
    .not('rrule', 'is', null);
  if (err2) {
    console.error(err2);
    return NextResponse.json({ error: err2.message }, { status: 500 });
  }

  // Transformar datos no recurrentes para incluir nombre de paciente como propiedad directa
  const processedNonRec = (nonRec || []).map((appt: any) => {
    // Extraer el nombre del paciente de la relación si existe
    const pacienteNombre = appt.pacientes?.name || '';
    
    // Crear una copia limpia del objeto sin la propiedad anidada
    const { pacientes, ...cleanAppt } = appt;
    
    // Devolver el objeto con el nombre del paciente como propiedad directa
    return {
      ...cleanAppt,
      patient_name: pacienteNombre
    };
  });

  const all = [...processedNonRec];
  
  // Procesar citas recurrentes de manera similar
  recMasters?.forEach((master: any) => {
    try {
      // Extraer el nombre del paciente
      const pacienteNombre = master.pacientes?.name || '';
      const { pacientes, ...cleanMaster } = master;
      
      // Parse RRULE y asignar dtstart correctamente
      const opts = RRule.parseString(cleanMaster.rrule!);
      opts.dtstart = new Date(cleanMaster.start_time);
      const rule = new RRule(opts);
      const dur = new Date(cleanMaster.end_time).getTime() - new Date(cleanMaster.start_time).getTime();
      
      rule.between(startDate, endDate, true).forEach((dt: Date) => {
        all.push({
          ...cleanMaster,
          patient_name: pacienteNombre,
          id: `${cleanMaster.id}_${dt.toISOString()}`,
          start_time: dt.toISOString(),
          end_time: new Date(dt.getTime() + dur).toISOString(),
          isOccurrence: true,
          original_master_id: cleanMaster.id,
        });
      });
    } catch (err) {
      console.error(`RRULE parse error for ${master.id}`, err);
    }
  });

  return NextResponse.json(all, { status: 200 });
}

// POST: create a single or recurring appointment
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // Detailed logging before the check
  console.log('--- DEBUG: POST /api/appointments session check ---');
  console.log('Session object raw:', JSON.stringify(session));
  const userId = session?.user?.id;
  const sbToken = session?.sbAccessToken;
  console.log(`Value of session?.user?.id: '${userId}' (type: ${typeof userId})`);
  console.log(`Value of session?.sbAccessToken: '${sbToken}' (type: ${typeof sbToken})`);
  const condition1_userIdFalsy = !userId;
  const condition2_sbTokenFalsy = !sbToken;
  console.log(`Is !userId true? ${condition1_userIdFalsy}`);
  console.log(`Is !sbToken true? ${condition2_sbTokenFalsy}`);
  console.log('--- END DEBUG ---');

  if (condition1_userIdFalsy || condition2_sbTokenFalsy || !session) { 
    console.error('POST /api/appointments: Unauthorized due to missing user ID, Supabase access token, or session. Detailed session logged above. Actual session object:', session);
    return NextResponse.json({ error: 'Unauthorized: Session data incomplete.' }, { status: 401 });
  }
  // Note: session.accessToken (the general Google login token) is no longer used for calendar operations.

  // Validación de datos de entrada
  const body = await request.json();
  const parsed = appointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { paciente_id, title: inputTitle, start_time, end_time, rrule, metadata } = parsed.data;

  // Fetch patient's name for Google Calendar title
  const { data: pacienteData, error: pacienteError } = await supabase
    .from('patients') // Corrected table name
    .select('name')
    .eq('id', paciente_id)
    .single();

  if (pacienteError || !pacienteData) {
    console.error(`Error fetching patient ${paciente_id} for Google Calendar title:`, pacienteError);
    // Not returning an error here, will proceed with a generic title for Google Calendar if patient not found
    // or handle as preferred. For now, we'll allow appointment creation but log this.
  }
  const pacienteNombre = pacienteData?.name || 'Paciente Desconocido';
  const googleEventSummary = `${pacienteNombre} (Consulta)`;

  // 1. Create appointment in Supabase first
  const supabaseAppointmentPayload: any = {
    user_id: session.user.id,
    paciente_id,
    title: inputTitle || `Cita con ${pacienteNombre}`, // Adjusted Supabase title for consistency, or keep as `Cita Paciente`
    start_time,
    end_time,
    metadata: metadata || {},
    // google_calendar_event_id will be updated later if Google sync is successful
  };

  if (rrule) {
    supabaseAppointmentPayload.rrule = rrule;
  }

  const { data: createdSupabaseAppointment, error: supabaseInsertError } = await supabase
    .from('appointments')
    .insert([supabaseAppointmentPayload])
    .select()
    .single();

  if (supabaseInsertError) {
    console.error('Supabase insert error:', JSON.stringify(supabaseInsertError, null, 2));
    return NextResponse.json({ 
      error: supabaseInsertError.message,
      details: {
        code: supabaseInsertError.code,
        details: supabaseInsertError.details,
        hint: supabaseInsertError.hint
      }
    }, { status: 500 });
  }

  if (!createdSupabaseAppointment) {
    console.error('Supabase insert did not return data.');
    return NextResponse.json({ error: 'Failed to create appointment in database.' }, { status: 500 });
  }

  // 2. Attempt to create event in Google Calendar IF permissions are granted
  if (session.googleCalendarScopeGranted && session.googleCalendarAccessToken) {
  const googleEventDetails = {
    summary: googleEventSummary, // Use the dynamically generated summary
    description: `Cita programada a través de Insight. Paciente ID: ${paciente_id}. Título original en Insight: ${createdSupabaseAppointment.title}`,
    start: {
      dateTime: createdSupabaseAppointment.start_time, // ISO string
      timeZone: 'America/Argentina/Buenos_Aires', // IMPORTANT: Consider making this user-configurable
    },
    end: {
      dateTime: createdSupabaseAppointment.end_time, // ISO string
      timeZone: 'America/Argentina/Buenos_Aires', // IMPORTANT: Consider making this user-configurable
    },
    // If rrule exists, add it to recurrence. Ensure format is compatible.
    // Google expects an array of RRULE strings.
    ...(createdSupabaseAppointment.rrule && { recurrence: [createdSupabaseAppointment.rrule] }),
  };

  try {
    const googleResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.googleCalendarAccessToken}`, // Use the specific calendar access token
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEventDetails),
      }
    );

    if (!googleResponse.ok) {
      const errorData = await googleResponse.json().catch(() => ({ message: 'Failed to parse Google API error JSON' }));
      console.error(
        `Google Calendar API error (${googleResponse.status}): Unable to create event. ` +
        `Details: ${JSON.stringify(errorData)}. ` +
        `Supabase appointment ${createdSupabaseAppointment.id} created but not synced.`
      );
      // Return the Supabase appointment but indicate sync failure (client might handle this)
      return NextResponse.json({
        ...createdSupabaseAppointment,
        google_sync_status: 'failed',
        google_sync_error: errorData?.error?.message || errorData.message || `Google API Error ${googleResponse.status}`,
      }, { status: 201 }); // 201 because primary resource (Supabase appt) was created
    }

    const googleEvent = await googleResponse.json();
    console.log(`Google Calendar event created: ${googleEvent.id} for Supabase appointment ${createdSupabaseAppointment.id}`);

    // 3. Update Supabase appointment with Google Calendar Event ID
    const { data: updatedSupabaseAppointment, error: supabaseUpdateError } = await supabase
      .from('appointments')
      .update({ google_calendar_event_id: googleEvent.id })
      .eq('id', createdSupabaseAppointment.id)
      .select()
      .single();

    if (supabaseUpdateError) {
      console.error(
        `Supabase update error: Failed to save google_calendar_event_id (${googleEvent.id}) ` +
        `for appointment ${createdSupabaseAppointment.id}. Error: ${supabaseUpdateError.message}`
      );
      // Supabase appt created, Google event created, but link failed. Return Google event ID for potential manual fix.
      return NextResponse.json({
        ...createdSupabaseAppointment,
        google_calendar_event_id_unlinked: googleEvent.id, // Indicate it's created in Google but not linked
        google_sync_status: 'partially_failed_to_link',
        google_sync_error: `Failed to link Google Event ID in Supabase: ${supabaseUpdateError.message}`,
      }, { status: 201 });
    }
    // Successfully created in Supabase, Google, and linked.
    // Successfully created in Supabase, Google, and linked.
    return NextResponse.json({...updatedSupabaseAppointment, google_sync_status: 'success'}, { status: 201 });

  } catch (e: any) {
    console.error(
        `Exception during Google Calendar sync process for Supabase appointment ${createdSupabaseAppointment.id}: ${e.message}`
    );
    return NextResponse.json({
        ...createdSupabaseAppointment,
        google_sync_status: 'failed',
        google_sync_error: `Exception: ${e.message}`,
    }, { status: 201 });
  }
} else {
    // Calendar scope not granted or token missing, skip Google Calendar sync
    console.log(`POST /api/appointments: Skipping Google Calendar sync for appointment ${createdSupabaseAppointment.id}. Scope granted: ${session.googleCalendarScopeGranted}, Token present: ${!!session.googleCalendarAccessToken}`);
    return NextResponse.json({
      ...createdSupabaseAppointment,
      google_sync_status: 'skipped_no_permission',
    }, { status: 201 });
  }
}