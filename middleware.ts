import { withAuth } from 'next-auth/middleware';
import { UserRole, UserRoleType } from '@/types/roles';

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
const ROLE_PROTECTED_PATHS: Record<string, UserRoleType[]> = {
  '/dashboard': [UserRole.PSYCHOLOGIST, UserRole.ADMIN],
  '/api/patients': [UserRole.PSYCHOLOGIST, UserRole.ADMIN],
  '/admin': [UserRole.ADMIN],
  '/reports': [UserRole.PSYCHOLOGIST, UserRole.ADMIN]
};

export default withAuth({
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  },
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
          const userRole = token.role as UserRoleType;
          const hasAccess = allowedRoles.includes(userRole);
          
          if (!hasAccess) {
            console.warn(`Access denied to ${path} for user with role ${userRole}`);
          }
          
          return hasAccess;
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
    '/admin/:path*',
    '/reports/:path*',
    '/api/((?!simple-test|v1/auth|auth|env-check|check-supabase|diagnostic|test).*)'
  ]
};
