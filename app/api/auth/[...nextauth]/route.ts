import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { JWT } from 'next-auth/jwt';
import { UserRole, UserRoleType } from '@/types/roles';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      role?: UserRoleType;
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role?: UserRoleType;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials?.email)
          .single();

        if (error || !user || !credentials) {
          console.error('Auth error:', error || 'User or credentials missing');
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        
        if (!isValid) {
          console.warn('Invalid password for user:', credentials.email);
          return null;
        }

        // Validar que el rol sea uno de los permitidos
        if (!Object.values(UserRole).includes(user.role)) {
          console.error('Invalid role for user:', user.email, user.role);
          return null;
        }

        return { 
          id: user.id, 
          email: user.email, 
          role: user.role as UserRoleType 
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user?.role) {
        token.role = user.role as UserRoleType;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (token.role) {
        session.user.role = token.role as UserRoleType;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export default handler;
