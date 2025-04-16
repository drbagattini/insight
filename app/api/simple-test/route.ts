import { NextResponse } from 'next/server';
import { createServiceClient, handleApiError } from '@/app/lib/api-utils';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Crear cliente Supabase con service_role key para bypass de RLS
let supabase: SupabaseClient<Database> | undefined;
try {
  supabase = createServiceClient();
  console.log('API: Cliente Supabase inicializado correctamente');
} catch (error) {
  console.error('API: Error al inicializar cliente Supabase:', error);
  // No lanzar el error aquí, manejar en cada endpoint
}

export async function POST(request: Request) {
  console.log('API: simple-test hit with method: POST');
  
  if (!supabase) {
    return handleApiError(new Error('Supabase client not initialized'));
  }

  try {
    // Validar y parsear el cuerpo de la solicitud
    let userData;
    try {
      userData = await request.json();
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Validar campos requeridos
    if (!userData.email || !userData.password_hash) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

    if (checkError) {
      return handleApiError(checkError, 'Error al verificar email');
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email ya registrado' },
        { status: 409 }
      );
    }

    // Crear el usuario con rol 'paciente'
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: userData.email,
        password_hash: userData.password_hash,
        role: 'paciente',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return handleApiError(error, 'Error al crear usuario');
    }

    console.log('API: User created successfully with ID:', data.id);
    return NextResponse.json({ 
      success: true,
      user: {
        id: data.id,
        email: data.email,
        role: data.role,
        first_name: data.first_name,
        last_name: data.last_name
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  console.log('API: simple-test hit with method: GET');
  
  if (!supabase) {
    return handleApiError(new Error('Supabase client not initialized'));
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return handleApiError(error, 'Error al conectar con Supabase');
    }

    return NextResponse.json({
      success: true,
      message: 'API funcionando correctamente',
      timestamp: new Date().toISOString(),
      data
    });
  } catch (error) {
    return handleApiError(error);
  }
}
