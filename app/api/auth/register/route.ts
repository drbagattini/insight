import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  console.log('AUTH API: POST /api/auth/register function started.');
  console.log('AUTH API: ENV Check - URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Loaded' : 'MISSING');
  console.log('AUTH API: ENV Check - Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Loaded (First 5 chars: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 5) + '...)' : 'MISSING');

  try {
    console.log('AUTH API: Attempting to get ENV vars inside POST...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('AUTH API: ENV Check inside POST - URL:', supabaseUrl ? 'Loaded' : 'MISSING');
    console.log('AUTH API: ENV Check inside POST - Service Key:', supabaseServiceKey ? 'Loaded' : 'MISSING'); 

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('AUTH API: Missing Supabase configuration inside POST!');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Crear el cliente Supabase aquí dentro
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('AUTH API: Supabase client created successfully inside POST.');
    console.log('AUTH API: Using service key (first 10 chars):', supabaseServiceKey.substring(0, 10));

    console.log('AUTH API: Register endpoint called (after client init)');
    
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
    
    // Preparar datos para inserciu00f3n (forzando rol paciente)
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
