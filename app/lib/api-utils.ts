import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

export function handleApiError(error: unknown, defaultMessage = 'Error interno del servidor') {
  console.error('API Error:', error);
  
  // Si es un error de Supabase
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.code === 'P2002' ? 409 : 500 }
    );
  }

  // Si es un error estándar
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Error genérico
  return NextResponse.json(
    { error: defaultMessage },
    { status: 500 }
  );
}

export function createServiceClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required environment variables for Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  });
}
