import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasWhatsAppToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
    hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    hasResendApiKey: !!process.env.RESEND_API_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
    tokenLength: process.env.WHATSAPP_ACCESS_TOKEN?.length || 0,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'configured' : 'missing'
  });
}
