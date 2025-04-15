import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    status: 'checking',
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not set',
      hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
      serviceKeyLength: process.env.SUPABASE_SERVICE_KEY?.length || 0
    }
  };

  console.log('Environment check:', envVars);

  return NextResponse.json(envVars);
}
