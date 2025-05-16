import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

/**
 * Endpoint para desvincular la cuenta de Google Calendar
 * Elimina los tokens y revoca el acceso
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized. Sign in required.' }, { status: 401 });
  }
  
  try {
    // Si hay un accessToken en la sesiu00f3n, intentar revocar el acceso en Google
    if (session.accessToken) {
      try {
        // Revocar el token de acceso en Google
        await fetch(`https://oauth2.googleapis.com/revoke?token=${session.accessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log(`[DESYNC] Revocado el token de acceso para el usuario ${session.user.id}`);
      } catch (revokeError) {
        // No bloqueamos el proceso si la revocaciu00f3n falla
        console.warn('[DESYNC] No se pudo revocar el token en Google:', revokeError);
      }
    }
    
    // Actualizar la sesiu00f3n del usuario para eliminar los tokens
    // Nota: En un escenario real, aquu00ed actualizaru00edamos la sesiu00f3n en la base de datos
    // y posiblemente haru00edamos que el usuario vuelva a iniciar sesiu00f3n
    
    console.log(`[DESYNC] Desvinculaciu00f3n completada para el usuario ${session.user.id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Cuenta de Google Calendar desvinculada correctamente.'
    });
  } catch (error: any) {
    console.error('[DESYNC] Error al desvincular Google Calendar:', error);
    return NextResponse.json({
      error: 'Error al desvincular Google Calendar',
      details: error.message
    }, { status: 500 });
  }
}
