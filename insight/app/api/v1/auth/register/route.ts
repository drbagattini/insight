import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Usar clave anu00f3nima para respetar las polu00edticas RLS en lugar de saltarlas con la service key
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Solo para operaciones administrativas se deberiau0301a usar la service key, en un cliente separado

export async function POST(request: Request) {
  console.log('API Route: Received registration request');
  try {
    console.log('API Route: Parsing request body...');
    const userData = await request.json();
    console.log('API Route: Received user data:', { ...userData, password_hash: '[REDACTED]' });
    
    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'Error al verificar email' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email ya registrado' },
        { status: 400 }
      );
    }

    // Insertar nuevo usuario
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        password_hash: userData.password_hash,
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    console.error('Unexpected error in register route:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
