import { UserRoleType } from '@/types/roles'; // Importar UserRoleType

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: User; // Usa nuestra interfaz User extendida
    accessToken?: string; // Google's login access token
    sbAccessToken?: string; // Supabase access token
    sbRefreshToken?: string; // Supabase refresh token
    googleLoginAccessToken?: string; // OAuth login token
    googleCalendarAccessToken?: string; // OAuth calendar token
    googleCalendarScopeGranted?: boolean; // Calendar scope grant flag
    error?: string; // Para errores (ej. de refresco de token)
  }

  interface User {
    id: string; // Sobrescribe o asegura que id siempre es string
    role?: UserRoleType;
    firstName?: string | null;
    lastName?: string | null;
    image_url?: string | null; // Para la foto de perfil
    // name y email son opcionales y vienen de NextAuthUserBase, pero es bueno ser explícito
    name?: string | null; 
    email?: string | null;
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    id: string; // ID del usuario (de Supabase)
    role?: UserRoleType;
    name?: string | null; 
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    image_url?: string | null; // Para la foto de perfil
    
    // Tokens de OAuth (ej. Google)
    accessToken?: string;
    refreshToken?: string; 
    accessTokenExpires?: number; // Timestamp de expiración en milisegundos
    error?: string; // Para manejar errores, ej. durante el refresh del token
  }
}
