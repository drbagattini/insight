import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Schema de validación para actualización de citas
const updateAppointmentSchema = z.object({
  title: z.string().optional(),
  start_time: z.string().min(1, 'Fecha de inicio requerida').optional(),
  end_time: z.string().min(1, 'Fecha de fin requerida').optional(),
  paciente_id: z.string().uuid('Patient ID debe ser un UUID válido').optional(),
  rrule: z.string().regex(/^RRULE:FREQ=(DAILY|WEEKLY|MONTHLY);INTERVAL=\d+$/, 'Formato de RRULE inválido').optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

// GET a single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
  }

  // Extract the base ID in case it's a recurring instance
  const baseId = id.includes('_') ? id.split('_')[0] : id;

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', baseId)
    .eq('user_id', session.user.id)
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: error.code === 'PGRST116' ? 404 : 500 });
  }

  return NextResponse.json(data);
}

// PATCH/PUT: update an appointment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
  }

  // Extract the base ID in case it's a recurring instance
  const baseId = id.includes('_') ? id.split('_')[0] : id;

  // Validate request body
  const body = await request.json();
  const parsed = updateAppointmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Update appointment
  const { data, error } = await supabase
    .from('appointments')
    .update(parsed.data)
    .eq('id', baseId)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE: remove an appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.accessToken) {
    console.error('DELETE /api/appointments/[id]: Unauthorized or missing access token. Session:', session);
    return NextResponse.json({ error: 'Unauthorized or missing access token for Google Calendar sync.' }, { status: 401 });
  }
  const accessToken = session.accessToken as string;
  if (!id) {
    return NextResponse.json({ error: 'Missing appointment ID' }, { status: 400 });
  }

  const baseId = id.includes('_') ? id.split('_')[0] : id;
  const isOccurrence = id.includes('_');

  // Check for "deleteAll" query param for recurring appointments (applies to the master event)
  const { searchParams } = new URL(request.url);
  const deleteAllSeries = searchParams.get('deleteAll') === 'true' && !isOccurrence;

  // 1. Fetch the appointment from Supabase
  const { data: appointmentData, error: fetchError } = await supabase
    .from('appointments')
    .select('id, user_id, google_calendar_event_id, rrule') // Select necessary fields
    .eq('id', baseId)
    .eq('user_id', session.user.id)
    .single();

  if (fetchError) {
    console.error(`Error fetching appointment ${baseId} for deletion:`, fetchError);
    return NextResponse.json(
      { error: fetchError.message },
      { status: fetchError.code === 'PGRST116' ? 404 : 500 }
    );
  }

  if (!appointmentData) {
    return NextResponse.json({ error: 'Appointment not found or not owned by user.' }, { status: 404 });
  }

  // 2. Attempt to delete from Google Calendar IF it's not an individual occurrence being deleted
  // and if a google_calendar_event_id exists.
  // For now, we only delete the master event from Google if the master event is deleted in Supabase.
  // Deleting individual occurrences from a series in Google Calendar is more complex and not handled here.
  let googleSyncStatus = 'not_attempted';
  let googleSyncError = null;

  if (appointmentData.google_calendar_event_id && (!isOccurrence || deleteAllSeries)) {
    try {
      const googleDeleteResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${appointmentData.google_calendar_event_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (googleDeleteResponse.status === 204) { // 204 No Content is success for DELETE
        console.log(`Successfully deleted Google Calendar event ${appointmentData.google_calendar_event_id} for Supabase appointment ${baseId}`);
        googleSyncStatus = 'deleted';
      } else if (googleDeleteResponse.status === 410) { // Gone - already deleted
        console.log(`Google Calendar event ${appointmentData.google_calendar_event_id} was already deleted. Proceeding with Supabase deletion.`);
        googleSyncStatus = 'already_deleted_in_google';
      } else if (googleDeleteResponse.status === 404) { // Not Found
        console.log(`Google Calendar event ${appointmentData.google_calendar_event_id} not found. Proceeding with Supabase deletion.`);
        googleSyncStatus = 'not_found_in_google';
      } else {
        const errorData = await googleDeleteResponse.json().catch(() => null);
        googleSyncStatus = 'failed_to_delete_in_google';
        googleSyncError = errorData?.error?.message || `Google API Error ${googleDeleteResponse.status}`;
        console.error(
          `Google Calendar API error (${googleDeleteResponse.status}): Failed to delete event ${appointmentData.google_calendar_event_id}. ` +
          `Details: ${JSON.stringify(errorData)}`
        );
        // Decide if we should stop or proceed with Supabase deletion. For now, we'll proceed.
      }
    } catch (e: any) {
      googleSyncStatus = 'failed_to_delete_in_google';
      googleSyncError = `Exception: ${e.message}`;
      console.error(
        `Exception during Google Calendar event deletion for ${appointmentData.google_calendar_event_id}: ${e.message}`
      );
    }
  }

  // 3. Delete the appointment from Supabase
  // Handle deletion based on whether it's a series or a specific rule for occurrences if needed.
  // Current logic deletes the master if baseId is provided.
  const { error: supabaseDeleteError } = await supabase
    .from('appointments')
    .delete()
    .eq('id', baseId) // Deletes the master event
    .eq('user_id', session.user.id);

  if (supabaseDeleteError) {
    console.error(`Supabase delete error for appointment ${baseId}:`, supabaseDeleteError);
    return NextResponse.json({ 
      error: supabaseDeleteError.message, 
      google_sync_status: googleSyncStatus, 
      google_sync_error: googleSyncError 
    }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted_supabase_id: baseId,
    google_sync_status: googleSyncStatus,
    google_sync_error: googleSyncError,
  });
}

// For compatibility with frameworks that use PUT
export const PUT = PATCH;
