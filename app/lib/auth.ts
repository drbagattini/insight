import GoogleProvider      from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
// // // import { comrptjs'; // un// un// unusedusedused
import { createClient }    from '@supabase/supabase-js';
import { AuthOptions, User, Account, Profile } from 'next-auth'; 
import { UserRoleType } from '@/types/roles';
import { SupabaseAdapter } from "@next-auth/supabase-adapter";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase      = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken:false, persistSession:false }
});

export const authOptions: AuthOptions = {
  adapter: SupabaseAdapter({ url: supabaseUrl, secret: serviceKey }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: 'consent', access_type: 'offline', response_type:'code' }
      }
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email:    { label:'Email',    type:'text' },
        password: { label:'Password', type:'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('AuthOptions: Missing credentials');
          return null;
        }
        
        console.log(`AuthOptions: Intentando autenticar a ${credentials.email}`);
        
        try {
          // Usar el cliente normal que respeta RLS
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          });
          
          if (error) {
            console.error(`AuthOptions: Error de Supabase:`, error.message);
            // Diferenciar si el email existe o la contraseña es inválida
            let code = 'EmailNotFound';
            try {
              const { data: userExists, error: fetchErr } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('email', credentials.email)
                .single();
              if (fetchErr && fetchErr.code === 'PGRST116') {
                // Email no registrado
                code = 'EmailNotFound';
              } else {
                // Usuario existe, contraseña incorrecta
                code = 'InvalidPassword';
              }
            } catch (err) {
              console.error('AuthOptions: Error verificando email:', err);
            }
            throw new Error(code);
          }
          
          if (!data?.user) {
            console.error(`AuthOptions: No se encontró el usuario`);
            return null;
          }
          
          console.log(`AuthOptions: ${credentials.email} autenticado correctamente`, { 
            id: data.user.id, 
            role: data.user.user_metadata?.role || 'paciente'
          });
          
          // Devolver el usuario en formato NextAuth
          return {
            id: data.user.id,
            email: credentials.email,
            name: data.user.user_metadata?.name,
            role: (data.user.user_metadata?.role || 'paciente') as UserRoleType
          };
        } catch (err) {
          console.error('AuthOptions: Error inesperado durante la autenticación:', err);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Upsert into public.users to satisfy appointments FK
      if (user) {
        try {
          await supabaseAdmin
            .from('users')
            .upsert(
              { id: user.id, email: user.email!, role: user.role || 'paciente' },
              { onConflict: 'id' }
            );
        } catch (err) {
          console.error('Error upserting public user:', err);
        }
        // Set token fields
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user.role ?? 'paciente') as UserRoleType;
      }
      return token;
    },
    async session({ session, token }) {
       console.log('[next-auth][session] START --------');
       console.log('[next-auth][session] Session In:', JSON.stringify(session));
       console.log('[next-auth][session] Token In:', JSON.stringify(token));
      session.user.id   = token.id  as string;
      session.user.role = token.role as UserRoleType;
      if (token.email) session.user.email = token.email;
      if (token.name) session.user.name = token.name;
      console.log('[next-auth][session] Session Out:', JSON.stringify(session));
      console.log('[next-auth][session] END ----------');
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error:  '/auth/error'
  },
  session: {
      strategy: "jwt", 
  },
};
