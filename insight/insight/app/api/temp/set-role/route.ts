import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // *** CORRECCIÓN LINT: Mover inicialización y chequeo aquí ***
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('SET-ROLE API: Missing Supabase URL or Service Key inside GET!');
    return NextResponse.json({ error: 'Server configuration error for Supabase' }, { status: 500 });
  }

  // Crear cliente admin *dentro* del handler
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  // *** FIN CORRECCIÓN LINT ***

  const targetEmail = request.nextUrl.searchParams.get('email');

  if (!targetEmail) {
    return NextResponse.json({ error: 'Missing email query parameter' }, { status: 400 });
  }

  console.log(`SET-ROLE API: Attempting to find user: ${targetEmail}`);

  try {
    // 1. Listar usuarios para encontrar el ID por email
    // Nota: Esto podría ser ineficiente con muchos usuarios. Para pruebas está bien.
    // Podríamos necesitar paginación si hay más de 50 usuarios por defecto.
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 100, // Buscar en los primeros 100 usuarios
    });

    if (listError) {
      console.error(`SET-ROLE API: Error listing users:`, listError);
      return NextResponse.json({ error: 'Failed to list users', details: listError.message }, { status: 500 });
    }

    const targetUser = listData.users.find(user => user.email === targetEmail);

    if (!targetUser) {
      console.log(`SET-ROLE API: User not found: ${targetEmail}`);
      return NextResponse.json({ error: `User not found: ${targetEmail}` }, { status: 404 });
    }

    const userId = targetUser.id;
    console.log(`SET-ROLE API: Found user ID: ${userId} for ${targetEmail}. Current metadata:`, targetUser.user_metadata);

    // 2. Actualizar la metadata del usuario para incluir el rol 'PSYCHOLOGIST'
    const newMetadata = {
      ...targetUser.user_metadata, // Preservar metadata existente
      role: 'PSYCHOLOGIST'         // Añadir o actualizar el rol (MAYÚSCULAS)
    };

    console.log(`SET-ROLE API: Updating user ${userId} with metadata:`, newMetadata);

    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: newMetadata }
    );

    if (updateError) {
      console.error(`SET-ROLE API: Error updating user ${userId}:`, updateError);
      return NextResponse.json({ error: 'Failed to update user role', details: updateError.message }, { status: 500 });
    }

    console.log(`SET-ROLE API: Successfully updated role for user ${userId} (${targetEmail}) to 'PSYCHOLOGIST'`);
    return NextResponse.json({
      message: `Successfully updated role for ${targetEmail} to 'PSYCHOLOGIST'`, // Mensaje actualizado
      userId: userId,
      updatedUser: updateData.user // Devuelve el objeto de usuario actualizado
    });

  } catch (error) {
    console.error('SET-ROLE API: Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
