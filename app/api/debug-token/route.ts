import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG-TOKEN] 🔍 Analizando token NextAuth...');
    
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    if (!token) {
      return NextResponse.json({
        authenticated: false,
        message: 'No hay token de autenticación'
      });
    }

    // Buscar usuario en tabla users si hay email
    let userFromDB = null;
    if (token.email) {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', token.email)
        .single();
      
      if (!error && user) {
        userFromDB = user;
      }
    }
    
    return NextResponse.json({
      authenticated: true,
      token_info: {
        has_id: !!token.id,
        has_sub: !!token.sub,
        has_name: !!token.name,
        has_email: !!token.email,
        has_picture: !!token.picture,
        id_value: token.id || 'undefined',
        sub_value: token.sub || 'undefined',
        name_value: token.name || 'undefined',
        email_value: token.email || 'undefined',
        iat: token.iat,
        exp: token.exp
      },
      user_in_database: {
        found: !!userFromDB,
        id: userFromDB?.id,
        email: userFromDB?.email,
        first_name: userFromDB?.first_name,
        last_name: userFromDB?.last_name,
        role: userFromDB?.role,
        is_active: userFromDB?.is_active
      },
      diagnosis: {
        token_has_email: !!token.email,
        user_exists_in_db: !!userFromDB,
        can_get_real_name: !!(userFromDB?.first_name || userFromDB?.last_name),
        problem_identified: !userFromDB ? 'Usuario no existe en BD' : 
                           !token.email ? 'Token no tiene email' :
                           'Función getPsychologistData() puede tener error'
      }
    });
  } catch (error) {
    console.error('[DEBUG-TOKEN] ❌ Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      authenticated: false 
    }, { status: 500 });
  }
}
