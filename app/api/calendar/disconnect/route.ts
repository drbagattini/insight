import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

/**
 * API endpoint para desconectar Google Calendar
 * Revoca los tokens de acceso y actualiza la sesión
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!session.googleCalendarAccessToken) {
      return NextResponse.json({ 
        error: 'No hay conexión con Google Calendar para desconectar' 
      }, { status: 400 });
    }

    // Revocar el token de acceso en Google
    try {
      const revokeResponse = await fetch(
        `https://oauth2.googleapis.com/revoke?token=${session.googleCalendarAccessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!revokeResponse.ok) {
        console.warn('Error al revocar token en Google:', await revokeResponse.text());
        // Continuamos con la desconexión local aunque falle la revocación en Google
      } else {
        console.log('Token de Google Calendar revocado exitosamente');
      }
    } catch (error) {
      console.warn('Error al comunicarse con Google para revocar token:', error);
      // Continuamos con la desconexión local
    }

    // La limpieza de tokens se manejará en el callback JWT de NextAuth
    // cuando se actualice la sesión
    return NextResponse.json({ 
      success: true, 
      message: 'Google Calendar desconectado exitosamente' 
    });

  } catch (error) {
    console.error('Error al desconectar Google Calendar:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
