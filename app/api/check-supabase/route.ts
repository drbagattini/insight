import { NextResponse } from 'next/server';
import { checkSupabaseConnection } from '@/lib/supabase-client';

export async function GET() {
  try {
    const isConnected = await checkSupabaseConnection();
    
    return NextResponse.json({
      status: isConnected ? 'connected' : 'error',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return NextResponse.json({ 
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
