import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const to = '+59899628774';

  if (!phoneNumberId || !accessToken) {
    return NextResponse.json(
      { error: 'Faltan variables de entorno WHATSAPP_PHONE_NUMBER_ID y/o WHATSAPP_ACCESS_TOKEN' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: 'Este es un mensaje de prueba desde Insight.' },
        }),
      }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
