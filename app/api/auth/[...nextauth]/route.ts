/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth, { type Session as NextAuthSessionBase, type User as NextAuthUserBase } from 'next-auth';
import { type JWT as NextAuthJWTBase } from 'next-auth/jwt';
import { UserRoleType } from '@/types/roles';
import { authOptions } from '@/app/lib/auth';

declare module 'next-auth' {
  interface User {
    id: string; // Sobrescribe o asegura que id siempre es string
    role?: UserRoleType;
    // name, email, image son opcionales y vienen de NextAuthUserBase
  }

  interface Session {
    user: User; // Usa nuestra interfaz User extendida
    accessToken?: string;
    error?: string; // Para errores (ej. de refresco de token)
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string; // ID del usuario (de Supabase)
    role?: UserRoleType;
    name?: string | null;
    email?: string | null;
    
    // Nuevos campos para Google OAuth tokens (y potencialmente otros providers)
    accessToken?: string;
    refreshToken?: string; 
    accessTokenExpires?: number; // Timestamp de expiración en milisegundos
    error?: string; // Para manejar errores, ej. durante el refresh del token
    // picture puede venir de NextAuthJWTBase, no es necesario re-declarar si se extiende
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };