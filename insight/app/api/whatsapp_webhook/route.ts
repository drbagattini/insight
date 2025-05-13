import { NextResponse } from 'next/server';

// Este es el token que DEBES configurar en tu .env.local
// y luego usar en la configuración del Webhook en Meta Developer Portal
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('Webhook GET request received:');
  console.log('Mode:', mode);
  console.log('Token:', token);
  console.log('Challenge:', challenge);
  console.log('Expected VERIFY_TOKEN:', VERIFY_TOKEN); // Log para depuración

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook GET verification successful, responding with challenge.');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('Webhook GET verification failed. Mode or token mismatch.');
    console.error(`Received token: ${token}, Expected token: ${VERIFY_TOKEN}`); // Log adicional
    return new NextResponse('Forbidden', { status: 403 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  console.log('-------------------------------------------');
  console.log('Webhook POST request received (event from WhatsApp):');
  console.log(JSON.stringify(body, null, 2));
  console.log('-------------------------------------------');

  // Aquí procesarías el evento.
  // Por ejemplo, verificar el tipo de evento, el estado del mensaje, etc.
  // Y luego podrías actualizar tu base de datos, notificar a un usuario, etc.

  // Meta espera una respuesta 200 OK para confirmar la recepción del evento.
  return NextResponse.json({ status: 'received' }, { status: 200 });
}