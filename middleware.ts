import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from './types/roles'; // Asegúrate que esta importación es correcta

export default withAuth(
  // Función middleware principal (se ejecuta si 'authorized' devuelve true)
  function middleware(request: NextRequestWithAuth) {
    const { token } = request.nextauth;
    const { pathname } = request.nextUrl;

    console.log('[Middleware] Running middleware function. Path:', pathname);
    console.log('[Middleware] Token in middleware function:', token);

    // Redirigir si el rol no coincide con la ruta
    // TEMPORALMENTE COMENTADO PARA DEBUG
    // if (pathname.startsWith('/dashboard') && token?.role !== UserRole.PSICOLOGO) {
    //   console.log(`[Middleware] Role mismatch for /dashboard. Redirecting. Role: ${token?.role}`);
    //   // Podrías redirigir a una página de error o a la home
    //   return NextResponse.redirect(new URL('/', request.url));
    // }

    // Añadir más lógica de redirección si es necesario para otros roles/rutas

    // Si todo está bien, continuar con la solicitud
    return NextResponse.next();
  },
  // Configuración de withAuth
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const requestedPath = req.nextUrl.pathname;
        // Log MUY visible para asegurarnos de que se ejecuta
        console.log(`\n\n[!!!] Middleware AUTHORIZED Callback Triggered for path: ${requestedPath}\n\n`);
        console.log(`[!!!] Token received:`, JSON.stringify(token, null, 2));

        // TEMPORAL: Siempre autorizar para diagnosticar
        console.log(`[!!!] TEMPORARILY AUTHORIZING ALL REQUESTS within authorized callback.\n\n`);
        return true;
      },
    },
    pages: {
      signIn: '/auth/login',
      // error: '/auth/error', // Opcional
    },
  }
);

// Asegúrate que el matcher cubra todas las rutas que quieres proteger + la página de login
export const config = {
  matcher: [
    // Intenta aplicar a casi todo excepto assets y llamadas recursivas de sesión
    '/((?!_next/static|_next/image|favicon.ico|api/auth/session).*)'
  ],
}
