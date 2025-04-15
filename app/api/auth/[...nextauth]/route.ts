import NextAuth, { DefaultSession, DefaultUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      role?: string;
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role?: string;
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

        if (error || !user || !credentials) return null;
        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        return isValid ? { id: user.id, email: user.email, role: user.role } : null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      session.user.role = token.role;
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
