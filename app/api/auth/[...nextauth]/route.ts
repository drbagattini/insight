import NextAuth, { type AuthOptions, type User, type Account, type Profile, type Session } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import { compare } from 'bcryptjs';
import { UserRole, UserRoleType } from '@/types/roles';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Cliente normal para operaciones regulares (select, etc)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente admin con service role key para operaciones privilegiadas (insert)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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
    role?: UserRoleType;
  }
}

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
        if (!credentials?.email || !credentials?.password) {
          console.error('NextAuth Authorize: Missing credentials');
          return null;
        }

        console.log(`NextAuth Authorize: Attempting Supabase signIn for ${credentials.email}`);

        try {
          console.log('NextAuth Authorize: Credentials received - Email:', credentials?.email);
          console.log('NextAuth Authorize: Credentials received - Password:', credentials?.password ? '[PRESENT]' : '[MISSING or EMPTY]');

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            console.error(`NextAuth Authorize: Supabase signIn error for ${credentials.email}:`, error.message);
            return null;
          }

          if (!data || !data.user) {
            console.error(`NextAuth Authorize: Supabase signIn successful but no user data for ${credentials.email}`);
            return null;
          }

          const user = data.user;
          console.log(`NextAuth Authorize: Supabase signIn successful for ${user.email}`);

          return {
            id: user.id,
            email: user.email,
            role: user.user_metadata?.role || 'paciente',
          };
        } catch (err) {
          console.error('NextAuth Authorize: Unexpected error:', err);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }: {
      user: User;
      account: Account | null;
      profile?: Profile;
      email?: { verificationRequest?: boolean };
      credentials?: Record<string, unknown>;
    }) {
      console.log('[next-auth][debug][SIGNIN_CALLBACK] Start');
      console.log('[next-auth][debug][SIGNIN_CALLBACK] User:', JSON.stringify(user, null, 2));
      console.log('[next-auth][debug][SIGNIN_CALLBACK] Account:', JSON.stringify(account, null, 2));
      console.log('[next-auth][debug][SIGNIN_CALLBACK] Profile:', JSON.stringify(profile, null, 2));

      if (account?.provider === 'google' && profile) {
        const googleProfile = profile as any;
        const isAllowed = googleProfile.email_verified ?? false;
        console.log(`[next-auth][debug][SIGNIN_CALLBACK] Google sign-in attempt. Email verified: ${googleProfile.email_verified}. Allowed: ${isAllowed}`);
        return isAllowed;
      }
      if (account?.provider === 'credentials') {
        console.log('[next-auth][debug][SIGNIN_CALLBACK] Credentials sign-in allowed.');
        return true;
      }
      console.log('[next-auth][debug][SIGNIN_CALLBACK] Denying sign-in for unknown provider or condition.');
      return false;
    },
    async jwt({ token, user, account, profile }) {
      if (account && user) {
        try {
          const { data: existingUser, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('id, role')
            .eq('email', user.email)
            .single(); // Espera un solo resultado o null

          if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: No rows found
            console.error('[next-auth][error][JWT_CALLBACK] Error fetching user:', fetchError);
            return { ...token, id: user.id }; 
          }

          let userId = existingUser?.id;
          let userRole = existingUser?.role;

          if (!existingUser) {
            const { data: newUser, error: insertError } = await supabaseAdmin
              .from('users')
              .insert({
                email: user.email,
                role: 'psicologo' // Asignar rol 'psicologo' por defecto
              })
              .select('id, role') // Devolver el id y rol del nuevo usuario
              .single();

            if (insertError) {
              if (insertError.code === '23505') { 
                const { data: userAfterDuplicate, error: fetchAfterDuplicateError } = await supabaseAdmin
                  .from('users')
                  .select('id, role')
                  .eq('email', user.email)
                  .single();
                if (fetchAfterDuplicateError) {
                  console.error('[next-auth][error][JWT_CALLBACK] Error fetching user after duplicate key error:', fetchAfterDuplicateError);
                  return { ...token, id: user.id }; 
                }
                userId = userAfterDuplicate?.id;
                userRole = userAfterDuplicate?.role;
              } else {
                return { ...token, id: user.id }; 
              }
            } else {
              userId = newUser?.id;
              userRole = newUser?.role; 
            }
          }

          if (userId) token.id = userId as string;
          if (userRole) token.role = userRole.toLowerCase() as UserRoleType;
          else console.warn(`[next-auth][warn][JWT_CALLBACK] Could not determine role for user ${user.email}`);

        } catch (error) {
          console.error("[next-auth][error][JWT_CALLBACK] Unexpected error in JWT callback:", error);
          return { ...token, id: user.id };
        }
      } 
      // Si 'user' existe pero 'account' no, significa que viene del callback 'authorize' (Credentials)
      else if (user) {
        // console.log('[next-auth][debug][JWT_CALLBACK] Credentials sign-in detected.');
        // El objeto 'user' aquí es el que devolvió 'authorize'
        token.id = user.id;
        token.role = user.role as UserRoleType; // Asegúrate que el tipo coincida
        token.email = user.email; // Añadir email al token también puede ser útil
        // No necesitamos consultar la DB aquí porque 'authorize' ya validó y nos dio los datos
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRoleType;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
      }

      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error'
  }
};

const handler = NextAuth({ ...authOptions, debug: true });

export { handler as GET, handler as POST };
