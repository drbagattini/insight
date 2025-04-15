import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Verificar si el email ya está registrado
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error al verificar usuario:', checkError);
      return NextResponse.json(
        { error: 'Error al verificar disponibilidad del email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      available: !existingUser,
      user: existingUser ? {
        email: existingUser.email,
        role: existingUser.role
      } : null
    });
  } catch (err) {
    console.error('Error en verificación de registro:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
