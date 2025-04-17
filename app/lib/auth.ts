import GoogleProvider      from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare }         from 'bcryptjs'; 
import { createClient }    from '@supabase/supabase-js';
import { AuthOptions, User, Account, Profile } from 'next-auth'; 
import { UserRoleType } from '@/types/roles';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase      = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken:false, persistSession:false }
});

export const authOptions: AuthOptions = {
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
            return null;
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
    async jwt({ token, user, account }) {
       console.log('[next-auth][jwt] START --------');
       console.log('[next-auth][jwt] Token In:', JSON.stringify(token));
       console.log('[next-auth][jwt] User In:', JSON.stringify(user));
       console.log('[next-auth][jwt] Account In:', JSON.stringify(account));
      if (account && user) {
          console.log('[next-auth][jwt] Account & User present (OAuth Flow or initial Credentials)');
        if (account.provider !== 'credentials') { 
          console.log(`[next-auth][jwt] OAuth Provider: ${account.provider}`);
           try {
              console.log(`[next-auth][jwt] Looking for user ${user.email} in DB`);
              const { data: existing, error: fetchErr } = await supabaseAdmin
                .from('users')
                .select('id, role')
                .eq('email', user.email!)
                .single();
              
              if (fetchErr && fetchErr.code !== 'PGRST116') { 
                   console.error('[next-auth][jwt] Error fetching user:', fetchErr);
                   throw fetchErr;
              }

              let uid  = existing?.id;
              let role = existing?.role;
              console.log(`[next-auth][jwt] Existing user found?`, existing ? 'Yes' : 'No');

              if (!existing) {
                console.log(`[next-auth][jwt] Creating user ${user.email} in DB`);
                const { data: created, error: insertErr } = await supabaseAdmin
                  .from('users')
                  .insert({ email: user.email!, role:'psicologo' }) 
                  .select('id, role')
                  .single();
                
                if (insertErr) {
                    console.error('[next-auth][jwt] Error inserting user:', insertErr);
                    if (insertErr.code === '23505') { 
                       console.log('[next-auth][jwt] Duplicate user detected, re-fetching...');
                       const { data: refetched, error: refetchErr } = await supabaseAdmin
                          .from('users')
                          .select('id, role')
                          .eq('email', user.email!)
                          .single();
                       if(refetchErr) {
                           console.error('[next-auth][jwt] Error re-fetching user:', refetchErr);
                           throw refetchErr;
                       }
                       uid = refetched?.id;
                       role = refetched?.role;
                    } else {
                       throw insertErr;
                    }
                } else {
                    uid  = created?.id;
                    role = created?.role;
                    console.log(`[next-auth][jwt] User created:`, {uid, role});
                }
              }
              token.id   = uid;
              token.role = role?.toLowerCase() || 'psicologo'; // Asegurar que siempre haya un rol
              token.email = user.email; 
              token.name = user.name; 
              console.log(`[next-auth][jwt] Token updated from DB:`, {id: token.id, role: token.role});

            } catch(err) { 
                console.error("[next-auth][jwt] Error during DB check/insert:", err);
                token.id = user.id; 
                token.email = user.email;
                token.name = user.name;
                token.role = 'psicologo'; // Rol predeterminado en caso de error
            }
        } else { 
           console.log('[next-auth][jwt] Credentials Provider: Using user object from authorize');
           token.id = user.id;
           // Garantizar que el rol esté presente en el token
           token.role = ((user as any).role?.toLowerCase() || 'psicologo'); 
           token.email = user.email;
           token.name = user.name; 
           console.log(`[next-auth][jwt] Token updated from authorize:`, {id: token.id, role: token.role});
        }
      } else if (token) {
          console.log('[next-auth][jwt] Only token present (Session refresh?)');
          // Asegurar que el token siempre tenga un rol incluso en las actualizaciones
          if (!token.role) {
              token.role = 'psicologo';
              console.log('[next-auth][jwt] Added missing role to token during refresh');
          }
      }
      console.log('[next-auth][jwt] Token Out:', JSON.stringify(token));
      console.log('[next-auth][jwt] END ----------');
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
