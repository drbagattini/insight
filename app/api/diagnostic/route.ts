import { supabase } from '@/lib/supabase-client';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    return NextResponse.json({
      supabaseConnected: !error,
      tableExists: data !== null,
      error: error ? error.message : null,
      envVars: {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
