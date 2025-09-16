import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pass } = await request.json();
    
    if (pass === process.env.STAGING_PASS) {
      const response = NextResponse.redirect(new URL('/', request.url));
      
      // Set cookie with security options
      response.cookies.set('p_stg', '1', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60, // 1 day in seconds
      });
      
      return response;
    } else {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
