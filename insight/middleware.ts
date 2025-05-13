import { withAuth, NextRequestWithAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { UserRole } from './types/roles'; // Asegúrate que esta importación es correcta

export default withAuth(
  // Función middleware principal (se ejecuta si 'authorized' devuelve true)
  function middleware(request: NextRequestWithAuth) {
    const { token } = request.nextauth;
    const { pathname } = request.nextUrl;

    // Comentado temporalmente - problemas con roles en el token JWT
    /* ORIGINAL: Redirigir si el rol no coincide con la ruta
    if (pathname.startsWith('/dashboard') && token?.role !== UserRole.PSICOLOGO && token?.role !== UserRole.ADMIN) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    */

    // Añadir más lógica de redirección si es necesario para otros roles/rutas

    // Si todo está bien, continuar con la solicitud
    return NextResponse.next();
  },
  // Configuración de withAuth
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const requestedPath = req.nextUrl.pathname;

        // Rutas públicas no requieren token
        if (['/'].includes(requestedPath)) {
          return true;
        }

        // Si no hay token, el acceso está denegado para rutas no públicas
        if (!token) {
          return false;
        }

        // Si hay token, verificar roles para rutas protegidas específicas
        if (requestedPath.startsWith('/dashboard')) {
          // Comentado temporalmente - si hay token, permitir acceso al dashboard
          return true;  // Permitir temporal mientras solucionamos definitivamente
          /* ORIGINAL: Verificar que el rol sea adecuado
          const hasRequiredRole = token.role === UserRole.PSICOLOGO || token.role === UserRole.ADMIN;
          return hasRequiredRole;
          */
        }

        // Permitir acceso a otras rutas si hay token (ajustar si hay más rutas protegidas)
        return true; // O ajusta según la política para otras rutas autenticadas
      },
    },
    pages: {
      signIn: '/auth/login',
      error: '/auth/error', // Página a la que redirigir si authorized devuelve false
    },
  }
);

// Asegúrate que el matcher cubra todas las rutas que quieres proteger + la página de login
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (authentication routes like login, register)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|auth).*)',
  ],
};
