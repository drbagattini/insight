import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { refreshAccessTokenIfNeeded } from '@/services/googleCalendar';

// Helper function to create a Google Calendar event (adapt as needed)
async function createGoogleCalendarEvent(accessToken: string, appointment: any, patientName: string | null) {
  const event = {
    summary: patientName ? `Cita: ${patientName}` : 'Cita Insight', // Generic title for sync
    description: appointment.notes || `Consulta para ${patientName || 'paciente'} (Sincronizado desde Insight)`, 
    start: {
      dateTime: new Date(appointment.date + 'T' + appointment.time).toISOString(),
      timeZone: 'America/Montevideo', // TODO: Consider user's timezone
    },
    end: {
      dateTime: new Date(new Date(appointment.date + 'T' + appointment.time).getTime() + (appointment.duration || 60) * 60000).toISOString(),
      timeZone: 'America/Montevideo', // TODO: Consider user's timezone
    },
    // Link back to the Insight appointment if possible, or use extendedProperties
    // source: {
    //   title: 'Insight Appointment',
    //   url: `your-app-url/appointments/${appointment.id}` 
    // },
    extendedProperties: {
      private: {
        insightAppointmentId: appointment.id
      }
    }
  };

  const googleApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
  console.log('[SYNC] Creating Google Calendar event for appointment ID:', appointment.id, 'Event details:', event);

  try {
    const response = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[SYNC] Error creating Google Calendar event:', response.status, errorData);
      throw new Error(`Google API error: ${errorData.error?.message || response.statusText}`);
    }
    const createdEvent = await response.json();
    console.log('[SYNC] Successfully created Google Calendar event:', createdEvent.id);
    return createdEvent;
  } catch (error) {
    console.error('[SYNC] Exception while creating Google Calendar event:', error);
    return null; // Indicate failure
  }
}

// Función centralizada para manejar la sincronización con Google Calendar
async function handleGoogleSync(userId: string, accessToken: string, mode: string = 'both') {
  let eventsCreated = 0;
  let eventsFailed = 0;

  try {
    console.log(`[SYNC] Starting ${mode} sync for user ${userId}`);
    
    // 1. Fetch all appointments for the user from Supabase
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patient:patients (id, name)
      `)
      .eq('user_id', userId);

    if (appointmentsError) {
      console.error('[SYNC] Error fetching appointments from Supabase:', appointmentsError);
      return NextResponse.json({ error: 'Failed to fetch appointments', details: appointmentsError.message }, { status: 500 });
    }

    if (!appointments || appointments.length === 0) {
      console.log('[SYNC] No appointments found for user, sync complete.');
      return NextResponse.json({ message: 'No appointments to sync.' });
    }

    console.log(`[SYNC] Found ${appointments.length} appointments to process for user ${userId}.`);

    // Procesar citas según el modo seleccionado
    if (mode === 'pull' || mode === 'both') {
      for (const appt of appointments) {
        // Type assertion for patient, as it's a joined relation
        const patientName = (appt.patient as { id: string; name: string } | null)?.name || null;

        // Validar datos de la cita antes de procesar
        if (!appt.date || !appt.time) {
          console.warn(`[SYNC] Appointment ${appt.id} is missing date or time. Skipping.`);
          eventsFailed++;
          continue;
        }

        // Validación basic de formato
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
        if (!dateRegex.test(appt.date) || !timeRegex.test(appt.time)) {
          console.warn(`[SYNC] Appointment ${appt.id} has malformed date/time. Skipping.`);
          eventsFailed++;
          continue;
        }

        // Si no tiene ID de evento de Google Calendar, crear uno nuevo
        if (!appt.google_calendar_event_id) {
          console.log(`[SYNC] Appointment ${appt.id} missing google_calendar_event_id. Creating.`);
          const googleEvent = await createGoogleCalendarEvent(accessToken, appt, patientName);
          
          if (googleEvent && googleEvent.id) {
            const { error: updateError } = await supabaseAdmin
              .from('appointments')
              .update({ google_calendar_event_id: googleEvent.id })
              .eq('id', appt.id);
              
            if (updateError) {
              console.error(`[SYNC] Failed to update appointment with Google Event ID:`, updateError);
              eventsFailed++;
            } else {
              eventsCreated++;
            }
          } else {
            console.warn(`[SYNC] Failed to create Google Event for appointment ${appt.id}.`);
            eventsFailed++;
          }
        }
        // Si ya tiene ID, verificar que sigue existiendo (se podría implementar en futuras versiones)
      }
    }
    
    console.log(`[SYNC] Sync process completed for user ${userId}. Mode: ${mode}, Created: ${eventsCreated}, Failed: ${eventsFailed}`);
    return NextResponse.json({
      message: 'Google Calendar sync process completed.',
      mode,
      eventsCreated,
      eventsFailed,
      totalProcessed: appointments.length
    });

  } catch (error: any) {
    console.error('[SYNC] General error during Google Calendar sync process:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during sync.', details: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('[GET /api/sync/google-calendar] Unauthorized or missing session.');
    return NextResponse.json({ error: 'Unauthorized. Sign in required.' }, { status: 401 });
  }
  
  // Modo de sincronización (pull desde Google Calendar o ambos)
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'both'; // valor por defecto: sincronización bidireccional
  
  // Actualizar el token de acceso si es necesario
  const validToken = await refreshAccessTokenIfNeeded();
  if (!validToken) {
    return NextResponse.json({ 
      error: 'No se pudo obtener un token de acceso válido para Google Calendar',
      action: 'reconnect' 
    }, { status: 401 });
  }
  
  // Lógica similar a POST pero adaptada para GET y para soportar mode=pull
  return handleGoogleSync(session.user.id, validToken, mode);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.error('[POST /api/sync/google-calendar] Unauthorized or missing session.');
    return NextResponse.json({ error: 'Unauthorized. Sign in required.' }, { status: 401 });
  }
  
  // Extraer el modo de la URL o del cuerpo de la solicitud
  const { searchParams } = new URL(request.url);
  let mode = searchParams.get('mode');
  
  if (!mode) {
    // Si no está en la URL, intentar extracerlo del cuerpo
    try {
      const body = await request.json();
      mode = body.mode || 'both';
    } catch (error) {
      mode = 'both'; // valor por defecto si no se especifica
    }
  }
  
  // Actualizar el token de acceso si es necesario
  const validToken = await refreshAccessTokenIfNeeded();
  if (!validToken) {
    return NextResponse.json({ 
      error: 'No se pudo obtener un token de acceso válido para Google Calendar',
      action: 'reconnect' 
    }, { status: 401 });
  }

  // Usar el token válido y el ID de usuario para la sincronización
  return handleGoogleSync(session.user.id, validToken, mode || 'both');
}
