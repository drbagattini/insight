import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('API: Missing Supabase configuration. URL:', !!supabaseUrl, 'Key:', !!supabaseServiceKey);
}

// Cliente Supabase con la service key para bypass de RLS
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('API: Inicializando la ruta con cliente Supabase');

export async function POST(request: Request) {
  console.log('API: simple-test hit with method: POST');
  
  try {
    // Intentar parsear el cuerpo de la solicitud
    const userData = await request.json();
    console.log('API: Received data:', { ...userData, password_hash: '[REDACTED]' });
    
    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

    if (checkError) {
      console.error('API: Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'Error al verificar email' },
        { status: 500 }
      );
    }

    if (existingUser) {
      console.log('API: User already exists');
      return NextResponse.json(
        { error: 'Email ya registrado' },
        { status: 400 }
      );
    }

    // Crear el usuario
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
      console.error('API: Error creating user:', error);
      return NextResponse.json(
        { error: 'Error al crear usuario: ' + error.message },
        { status: 500 }
      );
    }

    console.log('API: User created successfully with ID:', data.id);
    return NextResponse.json({ user: data });
  } catch (error) {
    console.error('API: Error processing request:', error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}

// También manejar GET para pruebas manuales
export async function GET() {
  console.log('API: simple-test hit with method: GET');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    return NextResponse.json({
      message: 'API funcionando correctamente',
      supabaseConnected: !error,
      error: error ? error.message : null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Error al conectar con Supabase',
      error: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
