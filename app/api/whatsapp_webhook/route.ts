import { NextRequest, NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

// GET handler for webhook verification
export function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge);
  }
  return NextResponse.error();
}

// POST handler for webhook events
export async function POST(request: NextRequest) {
  const body = await request.json();
  console.log('WhatsApp Webhook payload:', JSON.stringify(body, null, 2));
  return NextResponse.json({ status: 'received' });
}
