import NextAuth, { type Session, type User } from 'next-auth';
import { UserRoleType } from '@/types/roles';
import { authOptions } from '@/app/lib/auth';

// Tipos extendidos para NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role?: UserRoleType;
    };
  }

  interface User {
    id: string;
    role?: UserRoleType; // Necesario para que el callback jwt pueda añadirlo
  }
}

// La definición de authOptions se ha movido a @/app/lib/auth.ts

const handler = NextAuth({ ...authOptions, debug: true }); // Usamos las opciones importadas

export { handler as GET, handler as POST };