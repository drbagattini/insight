// app/api/credits/sse/route.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { registerConnection, removeConnection } from '@/lib/sse-utils';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // Crear stream SSE
    const stream = new ReadableStream({
      start(controller) {
        // Almacenar conexión
        registerConnection(userId, controller);

        // Enviar evento inicial
        const data = `data: ${JSON.stringify({ 
          type: 'connected', 
          message: 'Conectado a actualizaciones de créditos' 
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));

        // Configurar heartbeat cada 30 segundos
        const heartbeat = setInterval(() => {
          try {
            const heartbeatData = `data: ${JSON.stringify({ 
              type: 'heartbeat', 
              timestamp: Date.now() 
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(heartbeatData));
          } catch (error) {
            clearInterval(heartbeat);
            removeConnection(userId);
          }
        }, 30000);

        // Cleanup cuando se cierra la conexión
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
          removeConnection(userId);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error) {
    console.error('Error in SSE endpoint:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}


