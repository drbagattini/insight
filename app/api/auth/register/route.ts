import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase con la service role key para bypass de RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('AUTH API: Missing Supabase configuration at module level!');
  throw new Error('Missing Supabase configuration at module level!');
}

// Cliente de Supabase con service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  console.log('AUTH API: POST /api/auth/register function started.');

  try {
    console.log('AUTH API: Register endpoint called');

    // Parsear el cuerpo de la solicitud
    const userData = await request.json();
    console.log('AUTH API: Registration request for:', userData.email);
    
    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('AUTH API: Error checking for existing user:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (existingUser) {
      console.log('AUTH API: User already exists');
      return NextResponse.json({ error: 'Email ya registrado' }, { status: 400 });
    }
    
    // Preparar datos para inserción (forzando rol paciente)
    const userToInsert = {
      email: userData.email,
      password_hash: userData.password_hash,
      role: 'paciente', // Rol forzado a paciente
      first_name: userData.first_name,
      last_name: userData.last_name,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insertar usuario usando service role (bypass RLS)
    const { data, error } = await supabase
      .from('users')
      .insert([userToInsert])
      .select()
      .single();
    
    if (error) {
      console.error('AUTH API: Error inserting user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('AUTH API: User created successfully with ID:', data.id);
    return NextResponse.json({ user: data });
    
  } catch (err) {
    console.error('AUTH API: Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error inesperado' },
      { status: 500 }
    );
  }
}
