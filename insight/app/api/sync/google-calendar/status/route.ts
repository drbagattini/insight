import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';

export async function GET() {
  try {
    // Obtener sesión del usuario
    const session = await getServerSession(authOptions);

    // Si no hay sesión o no hay usuario autenticado
    if (!session?.user?.id) {
      return NextResponse.json({ status: 'disconnected', reason: 'no-session' }, { status: 401 });
    }

    // Verificar si hay accessToken (lo que indica que está conectado a Google)
    if (session.accessToken) {
      return NextResponse.json({ 
        status: 'connected',
        connectedSince: session.tokenCreatedAt || new Date().toISOString(),
        provider: 'google-calendar' 
      });
    } else {
      return NextResponse.json({ status: 'disconnected', reason: 'no-token' });
    }
  } catch (error: any) {
    console.error('[GOOGLE_SYNC_STATUS] Error checking status:', error);
    return NextResponse.json(
      { status: 'error', message: 'Error al verificar estado de sincronización' },
      { status: 500 }
    );
  }
}
