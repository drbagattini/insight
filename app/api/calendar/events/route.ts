import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session as NextAuthSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { google } from 'googleapis';

// Extend session type locally if not using the augmented one directly from authOptions context
interface ExtendedSession extends NextAuthSession {
  googleCalendarScopeGranted?: boolean;
  googleCalendarAccessToken?: string;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions) as ExtendedSession | null; // Cast to allow checking custom props

  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!session.googleCalendarScopeGranted || !session.googleCalendarAccessToken) {
    return NextResponse.json(
      {
        message: 'Acceso a Google Calendar no concedido. Por favor, conecta tu calendario desde la configuración o la página de agenda.',
        needsCalendarConnection: true,
      },
      { status: 403 } // Forbidden, as the resource requires calendar access
    );
  }

  const calendarAccessToken = session.googleCalendarAccessToken;

  try {
    // Configurar el cliente OAuth2 con el token de acceso
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: calendarAccessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Parsear los parámetros de la URL para fechas de inicio y fin
    const url = new URL(request.url);
    const now = new Date();
    
    // Uso de parámetros de la URL o valores predeterminados para el rango de fechas
    const timeMin: string = url.searchParams.get('timeMin') || now.toISOString();
    
    // Por defecto, eventos para los próximos 7 días si no se especifica timeMax
    let timeMax: string;
    const timeMaxParam = url.searchParams.get('timeMax'); // string | null
    if (timeMaxParam) {
      timeMax = timeMaxParam;
    } else {
      const nextWeek = new Date();
      nextWeek.setDate(now.getDate() + 7);
      timeMax = nextWeek.toISOString();
    }

    // Consultar eventos dentro del rango de fechas
    const response = await calendar.events.list({
      calendarId: 'primary', // O un ID de calendario específico
      timeMin: timeMin,
      timeMax: timeMax,
      maxResults: 50,      // Incrementado para mostrar más eventos
      singleEvents: true,  // Expandir eventos recurrentes
      orderBy: 'startTime',
    });

    const events = response.data.items;
    return NextResponse.json({
      events,
      calendarConnected: true,
      timeRange: {
        start: timeMin,
        end: timeMax
      }
    });

  } catch (error: any) {
    console.error('Error fetching Google Calendar events:', error);
    // Comprobar si el error es debido a problemas con el token
    if (error.code === 401 || (error.response?.data?.error === 'invalid_grant' || error.response?.data?.error === 'invalid_token')) {
      return NextResponse.json(
        {
          error: 'Token de Google Calendar inválido o revocado. Por favor, reconecta tu calendario.',
          needsCalendarReconnection: true
        },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: 'Error al obtener eventos del calendario', details: error.message }, { status: 500 });
  }
}

// Endpoint para crear un evento en el calendario del usuario
export async function POST(request: Request) {
  const session = await getServerSession(authOptions) as ExtendedSession | null;

  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!session.googleCalendarScopeGranted || !session.googleCalendarAccessToken) {
    return NextResponse.json(
      {
        message: 'Acceso a Google Calendar no concedido. Por favor, conecta tu calendario.',
        needsCalendarConnection: true,
      },
      { status: 403 }
    );
  }

  const calendarAccessToken = session.googleCalendarAccessToken;

  try {
    // Obtener datos del evento del body
    const eventData = await request.json();

    // Validar datos básicos del evento
    if (!eventData.summary || !eventData.start || !eventData.end) {
      return NextResponse.json(
        { error: 'Datos del evento incompletos. Se requiere título, fecha inicio y fecha fin.' },
        { status: 400 }
      );
    }

    // Configurar el cliente OAuth2 con el token de acceso
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: calendarAccessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Asegurar que el evento tiene formato correcto para la API de Google Calendar
    // La API espera ciertos campos en formatos específicos
    const formattedEvent = {
      summary: eventData.summary,
      description: eventData.description || '',
      start: eventData.start,
      end: eventData.end,
      // Campos opcionales con valores predeterminados si no están presentes
      location: eventData.location || '',
      colorId: eventData.colorId || '1', // Color predeterminado (azul)
      status: 'confirmed',
      // Opcional: Configuración para recordatorios
      reminders: eventData.reminders || {
        useDefault: true
      }
    };

    // Crear el evento en Google Calendar
    const response = await calendar.events.insert({
      calendarId: 'primary', // Calendario principal del usuario
      requestBody: formattedEvent,
    });

    // Devolver los datos del evento creado
    return NextResponse.json({
      event: response.data,
      created: true,
      message: 'Evento creado correctamente en Google Calendar'
    });

  } catch (error: any) {
    console.error('Error creating Google Calendar event:', error);
    if (error.code === 401 || (error.response?.data?.error === 'invalid_grant' || error.response?.data?.error === 'invalid_token')) {
      return NextResponse.json(
        {
          error: 'Token de Google Calendar inválido o revocado. Por favor, reconecta tu calendario.',
          needsCalendarReconnection: true
        },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: 'Error al crear evento en el calendario', details: error.message }, { status: 500 });
  }
}