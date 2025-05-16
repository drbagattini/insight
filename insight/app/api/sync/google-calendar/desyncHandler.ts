import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

// Helper function to delete a Google Calendar event
async function deleteGoogleCalendarEvent(accessToken: string, eventId: string) {
  const googleApiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
  console.log('[DESYNC_HANDLER] Deleting Google Calendar event ID:', eventId);

  try {
    const response = await fetch(googleApiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.status === 204) { // 204 No Content indicates successful deletion
      console.log('[DESYNC_HANDLER] Successfully deleted Google Calendar event ID:', eventId);
      return true;
    } else if (response.status === 404 || response.status === 410) { // 404 Not Found or 410 Gone (already deleted)
      console.warn('[DESYNC_HANDLER] Google Calendar event ID not found or already deleted:', eventId, response.status);
      return true; // Treat as success for desync purposes
    } else {
      const errorData = await response.json().catch(() => null); // Try to parse error, but don't fail if no body
      console.error('[DESYNC_HANDLER] Error deleting Google Calendar event:', eventId, response.status, errorData);
      throw new Error(`Google API error: ${errorData?.error?.message || response.statusText}`);
    }
  } catch (error) {
    console.error('[DESYNC_HANDLER] Exception while deleting Google Calendar event:', eventId, error);
    return false; // Indicate failure
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.accessToken) {
    console.error('[POST /api/sync/google-calendar/desyncHandler] Unauthorized or missing access token.');
    return NextResponse.json({ error: 'Unauthorized or missing access token for Google Calendar desync.' }, { status: 401 });
  }

  const userId = session.user.id;
  const accessToken = session.accessToken as string;
  let eventsDesynced = 0;
  let eventsFailed = 0;
  let appointmentsProcessed = 0;

  try {
    console.log(`[DESYNC_HANDLER] Starting desynchronization for user ${userId}`);

    // 1. Fetch all appointments for the user that have a google_calendar_event_id
    const { data: appointmentsToDesync, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('id, google_calendar_event_id')
      .eq('user_id', userId)
      .not('google_calendar_event_id', 'is', null);

    if (fetchError) {
      console.error('[DESYNC_HANDLER] Error fetching appointments to desync from Supabase:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch appointments for desync', details: fetchError.message }, { status: 500 });
    }

    if (!appointmentsToDesync || appointmentsToDesync.length === 0) {
      console.log('[DESYNC_HANDLER] No appointments found with Google Calendar IDs for user, desync complete.');
      return NextResponse.json({ message: 'No appointments are currently synced with Google Calendar.' });
    }

    appointmentsProcessed = appointmentsToDesync.length;
    console.log(`[DESYNC_HANDLER] Found ${appointmentsProcessed} appointments to desynchronize for user ${userId}.`);

    for (const appt of appointmentsToDesync) {
      if (appt.google_calendar_event_id) {
        const success = await deleteGoogleCalendarEvent(accessToken, appt.google_calendar_event_id);
        if (success) {
          // Update Supabase to remove the google_calendar_event_id
          const { error: updateError } = await supabaseAdmin
            .from('appointments')
            .update({ google_calendar_event_id: null })
            .eq('id', appt.id);

          if (updateError) {
            console.error(`[DESYNC_HANDLER] Failed to update appointment ${appt.id} after deleting Google Event:`, updateError);
            eventsFailed++;
          } else {
            console.log(`[DESYNC_HANDLER] Successfully desynced appointment ${appt.id} and cleared Google Event ID.`);
            eventsDesynced++;
          }
        } else {
          console.warn(`[DESYNC_HANDLER] Failed to delete Google Event for appointment ${appt.id}. It might still be linked.`);
          eventsFailed++;
        }
      }
    }

    console.log(`[DESYNC_HANDLER] Desynchronization process completed for user ${userId}. Desynced: ${eventsDesynced}, Failed: ${eventsFailed}`);
    if (eventsFailed > 0 && eventsDesynced === 0) {
        return NextResponse.json({ 
            error: 'Failed to desynchronize some or all events from Google Calendar.', 
            details: `Could not desynchronize ${eventsFailed} out of ${appointmentsProcessed} synced appointments. Please check server logs.`,
            eventsDesynced, 
            eventsFailed, 
            totalProcessed: appointmentsProcessed 
        }, { status: 500 });
    } else if (eventsFailed > 0) {
        return NextResponse.json({ 
            message: 'Desynchronization process completed with some errors.', 
            details: `Successfully desynchronized ${eventsDesynced} appointments. Failed to desynchronize ${eventsFailed} appointments.`, 
            eventsDesynced, 
            eventsFailed, 
            totalProcessed: appointmentsProcessed 
        });
    } else {
        return NextResponse.json({
            message: 'Successfully desynchronized all events from Google Calendar.',
            eventsDesynced,
            eventsFailed,
            totalProcessed: appointmentsProcessed
        });
    }

  } catch (error: any) {
    console.error('[DESYNC_HANDLER] General error during Google Calendar desynchronization process:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during desynchronization.', details: error.message }, { status: 500 });
  }
}
