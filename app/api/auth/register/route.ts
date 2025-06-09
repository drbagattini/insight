import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { hash } from 'bcryptjs';
import { UserRole } from '@/types/roles';

// Configuración de Supabase con la service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('AUTH API: Missing Supabase configuration at module level!');
  throw new Error('Missing Supabase configuration at module level!');
}

// Cliente de Supabase con service role key - Renombrado para claridad
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  console.log('AUTH API: POST /api/auth/register function started.');

  try {
    console.log('AUTH API: Register endpoint called');

    // Parsear el cuerpo de la solicitud - Espera: email, password, first_name, last_name
    const userData = await request.json();
    console.log('AUTH API: Registration request for:', userData.email);

    // Validaciones básicas (pueden ser más robustas)
    if (!userData.email || !userData.password || !userData.first_name || !userData.last_name) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    // *** NUEVA LÓGICA DE CREACIÓN DE USUARIO ***
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email. Considerar tu flujo de confirmación.
      user_metadata: { 
        // El trigger 'handle_new_user' usará estos campos:
        first_name: userData.first_name, 
        last_name: userData.last_name
        // 'name' también podría ser una opción si el trigger lo usa como fallback principal
      },
      app_metadata: {
        // El trigger 'handle_new_user' espera 'userrole' para el rol:
        userrole: userData.role || UserRole.PSICOLOGO 
      }
    });

    if (createError) {
      console.error('AUTH API: Error creating user with Supabase Auth:', createError);
      // Verificar si el error es por email duplicado (esto puede variar según la versión de Supabase)
      if (createError.message.includes('already registered') || createError.message.includes('unique constraint')) {
        return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 }); // 409 Conflict es más apropiado
      }
      return NextResponse.json({ error: authError.message || 'Error al crear usuario en Supabase Auth' }, { status: 500 });
    }

    // Éxito - El usuario fue creado en auth.users
    const userId = authData.user.id; // Define userId here
    console.log('AUTH API: User created successfully in Supabase Auth with ID:', userId);

    // --- BEGIN WORKAROUND: Set email_confirmed_at ---
    console.log(`AUTH API: Attempting to mark email as confirmed for user ${userId}`);
    const { error: confirmationError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email_confirm: true } // This should set email_confirmed_at for the user
    );

    if (confirmationError) {
      console.error(`AUTH API: CRITICAL - Failed to mark email as confirmed for user ${userId}:`, confirmationError);
      // This is a critical failure because the user won't be able to log in.
      // Consider if you need to delete the partially created user, though that adds complexity.
      return NextResponse.json({ 
        error: `Usuario creado (ID: ${userId}) pero falló la confirmación automática del email. Por favor, contacte a soporte.`,
        details: confirmationError.message
      }, { status: 500 }); // Internal Server Error, as the registration process is incomplete.
    }
    console.log(`AUTH API: Email successfully marked as confirmed for user ${userId}.`);
    // --- END WORKAROUND ---

    // The on_auth_user_created trigger and public.handle_new_user() function
    // will now handle the creation/update of the corresponding public.users record.
    // No explicit insert into public.users is needed here anymore.

    console.log(`AUTH API: User ${userId} created in auth.users. Trigger will handle public.users.`);

    return NextResponse.json({ message: 'Usuario registrado y email confirmado. Perfil será procesado.', userId: userId }, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('AUTH API: Unexpected error in registration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
