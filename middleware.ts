import { withAuth } from 'next-auth/middleware';

// Rutas públicas que no requieren autenticación
const PUBLIC_PATHS = [
  '/api/simple-test',
  '/api/v1/auth/register',
  '/api/test',
  '/api/auth',
  '/api/env-check',
  '/api/check-supabase',
  '/api/diagnostic'
];

// Rutas protegidas por rol
const ROLE_PROTECTED_PATHS = {
  '/dashboard': ['psicologo', 'admin'],
  '/api/patients': ['psicologo', 'admin']
};

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const path = req.nextUrl.pathname;

      // Verificar si la ruta es pública
      const isPublicPath = PUBLIC_PATHS.some(publicPath => 
        path.startsWith(publicPath)
      );

      // Si es una ruta pública, permitir acceso
      if (isPublicPath) return true;

      // Si no hay token, denegar acceso a rutas protegidas
      if (!token) return false;

      // Verificar acceso basado en rol
      for (const [protectedPath, allowedRoles] of Object.entries(ROLE_PROTECTED_PATHS)) {
        if (path.startsWith(protectedPath)) {
          return allowedRoles.includes(token.role as string);
        }
      }

      // Para rutas API no públicas, requerir token
      if (path.startsWith('/api')) {
        return !!token;
      }

      // Por defecto, permitir acceso a usuarios autenticados
      return true;
    }
  }
});

export const config = { 
  matcher: [
    '/dashboard/:path*',
    '/api/((?!simple-test|v1/auth|auth|env-check|check-supabase|diagnostic|test).*)'
  ]
};
