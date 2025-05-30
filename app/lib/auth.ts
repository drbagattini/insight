import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import { AuthOptions, User as NextAuthUser, Account } from 'next-auth'; // Profile no se usa explícitamente aquí
import { JWT } from 'next-auth/jwt';
import { UserRoleType } from '@/types/roles';
import { SupabaseAdapter } from "@next-auth/supabase-adapter";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Log de variables de entorno críticas para depuración
console.log('AUTH CONFIG - Variables de entorno NextAuth:');
console.log(`- NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'NO CONFIGURADO'}`);
console.log(`- VERCEL_URL: ${process.env.VERCEL_URL || 'NO CONFIGURADO'}`);
console.log(`- VERCEL_ENV: ${process.env.VERCEL_ENV || 'NO CONFIGURADO'}`);

// Definir una URL base consistente para todos los entornos
const BASE_URL = 'https://insight-roan.vercel.app';

// Los logs de variables de entorno se mantienen para depuración.
// NEXTAUTH_URL debe ser configurado directamente en Vercel Project Settings.
console.log(`- URL de callback para Google (derivada de NEXTAUTH_URL) debería ser: ${process.env.NEXTAUTH_URL}/api/auth/callback/google`);
console.log('- ASEGÚRATE de que esta URL exacta esté agregada en Google Cloud Console y que NEXTAUTH_URL esté correctamente configurado en Vercel GUI.')

const supabase = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Función para refrescar el token de acceso de Google
async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    console.error("No refresh token available for token:", token);
    return { ...token, error: "NoRefreshToken" };
  }
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("Error refreshing token, response not ok:", refreshedTokens);
      throw refreshedTokens;
    }
    console.log("Successfully refreshed token");
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined, // Clear previous errors on successful refresh
    };
  } catch (error) {
    console.error("Catch block: Error refreshing access token", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const authOptions: AuthOptions = {
    // Las URL de callback se derivan de NEXTAUTH_URL
  adapter: SupabaseAdapter({ url: supabaseUrl, secret: serviceKey }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Google Provider usa la configuración global de NextAuth para determinar las URLs

      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/calendar.events',
          ].join(' '),
        }
      }
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('AuthOptions: Missing credentials');
          const error = new Error('MissingCredentials');
          (error as any).type = 'MissingCredentials'; 
          throw error;
        }
        try {
          // 1. Autenticar contra Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          });

          if (authError) {
            console.error(`AuthOptions: Error de Supabase Auth:`, authError.message);
            let errorType = 'AuthenticationFailed'; // Default
      
            if (authError.message.toLowerCase().includes('email not confirmed')) {
              errorType = 'EmailNotConfirmed';
            } else if (authError.message.toLowerCase().includes('invalid login credentials')) {
              errorType = 'InvalidCredentials';
            }

            const errorToThrow = new Error(errorType); 
            (errorToThrow as any).type = errorType; 
            throw errorToThrow;
          }

          if (!authData?.user) {
            console.error(`AuthOptions: No se encontró el usuario en Supabase Auth (inesperado después de un no-error).`);
            const errorToThrow = new Error('UserNotFoundAfterAuth');
            (errorToThrow as any).type = 'UserNotFoundAfterAuth';
            throw errorToThrow;
          }

          // 2. Obtener el usuario de la tabla pública `users` (la que usa el SupabaseAdapter)
          console.log(`[AuthOptions-Credentials] Buscando en public.users con email: '${authData.user.email}' (ID de auth.users: ${authData.user.id})`);
          
          const { data: publicUser, error: publicUserError } = await supabaseAdmin
            .from('users') // Asegúrate que 'users' es el nombre correcto de tu tabla pública
            .select('id, first_name, last_name, email, role') // Seleccionar first_name y last_name
            .eq('email', authData.user.email) // Busca por el email del usuario autenticado
            .single(); // Esperamos un solo usuario

          if (publicUserError) {
            console.error(`[AuthOptions-Credentials] Error al consultar public.users con email '${authData.user.email}':`, JSON.stringify(publicUserError, null, 2));
            const errorToThrow = new Error('UserQueryFailedInPublicTable'); // Nuevo tipo de error
            (errorToThrow as any).type = 'UserQueryFailedInPublicTable';
            (errorToThrow as any).details = `Query error for email: ${authData.user.email}`;
            throw errorToThrow;
          }

          if (!publicUser) {
            // ANTES: intentaba crear el usuario.
            // AHORA: si no está, es un problema porque el trigger debería haberlo creado.
            console.error(`[AuthOptions-Credentials] CRITICAL: No se encontró usuario en public.users para email '${authData.user.email}' (ID: ${authData.user.id}). El trigger debería haberlo creado.`);
            const errorToThrow = new Error('UserNotFoundInPublicTablePostTrigger'); // Nuevo tipo de error
            (errorToThrow as any).type = 'UserNotFoundInPublicTablePostTrigger';
            (errorToThrow as any).details = `User with email ${authData.user.email} and ID ${authData.user.id} not found in public.users. Trigger issue?`;
            throw errorToThrow; 
          }

          console.log(`[AuthOptions-Credentials] Usuario encontrado en public.users:`, JSON.stringify(publicUser, null, 2));

          // 3. Devolver el objeto usuario para NextAuth usando los datos de la tabla pública `users`
          const fullName = [publicUser.first_name, publicUser.last_name].filter(Boolean).join(' ') || publicUser.email; // Fallback al email si no hay nombre
          return {
            id: publicUser.id, // Este es el ID de la tabla public.users
            name: fullName,
            email: publicUser.email,
            role: publicUser.role as UserRoleType, // Incluimos el rol y casteamos
            supabaseAccessToken: authData.session?.access_token,
            supabaseRefreshToken: authData.session?.refresh_token,
          };

        } catch (err: any) {
            // Si el error ya tiene un 'type' (porque lo lanzamos nosotros), lo relanzamos para que NextAuth lo use
            if (err.type) {
                throw err; 
            }
            // Para errores inesperados no categorizados por nosotros
            console.error('AuthOptions: Error inesperado durante la autenticación con credenciales:', err);
            const authError = new Error("UnhandledAuthenticationError");
            (authError as any).type = "UnhandledAuthenticationError";
            throw authError;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }: { user: NextAuthUser; account: Account | null; profile?: any }) {
      console.log('=== INICIO SIGNIN ===');
      console.log('Usuario entrante:', { 
        email: user.email, 
        id: user.id, 
        provider: account?.provider,
        name: user.name,
        roleFromUser: (user as any).role 
      });

      if (!user.id || !user.email) {
        console.error('[SignIn] Critical: Missing user.id or user.email from provider. Denying sign-in.');
        return false; 
      }

      try {
        const { data: publicProfile, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('id, email, first_name, last_name, role')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[SignIn] Error fetching user from public.users by ID:', user.id, fetchError);
          return false;
        }

        if (!publicProfile) {
          console.log(`[SignIn] No profile in public.users for ID ${user.id}. Checking for email conflict before creating...`);

          const { data: existingByEmail, error: emailCheckError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', user.email)
            .single();

          if (emailCheckError && emailCheckError.code !== 'PGRST116') {
            console.error('[SignIn] Error checking for existing user by email:', user.email, emailCheckError);
            return false;
          }

          if (existingByEmail && existingByEmail.id !== user.id) {
            console.warn(`[SignIn] INCONSISTENCY DETECTED: Email ${user.email} exists in public.users with ID ${existingByEmail.id}, but canonical auth.users.id is ${user.id}. Attempting to update...`);
            
            // Intentar actualizar el ID en public.users para que coincida con auth.users
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({ id: user.id })
              .eq('id', existingByEmail.id);
            
            if (updateError) {
              console.error('[SignIn] Failed to update user ID in public.users:', updateError);
              return false;
            }
            
            console.log(`[SignIn] Successfully updated user ID in public.users from ${existingByEmail.id} to ${user.id}`);
            return true;
          }
          
          console.log(`[SignIn] Creating new profile in public.users for ID ${user.id} and email ${user.email}.`);
          
          let firstName = '';
          let lastName = '';
          const userRole = (user as any).role || 'psicologo';

          if (account?.provider === 'google' && profile) {
            firstName = profile.given_name || profile.first_name || '';
            lastName = profile.family_name || profile.last_name || '';
            if (!firstName && profile.name) firstName = profile.name.split(' ')[0] || '';
            if (!lastName && profile.name) lastName = profile.name.split(' ').slice(1).join(' ') || '';
          } else if (user.name) {
            const nameParts = user.name.split(' ');
            firstName = nameParts[0] || '';
            lastName = nameParts.slice(1).join(' ') || '';
          }
          
          if (!firstName && user.email) {
              firstName = user.email.split('@')[0];
          }

          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              first_name: firstName,
              last_name: lastName,
              role: userRole, 
            });

          if (insertError) {
            console.error('[SignIn] Error inserting new user into public.users:', user.id, insertError);
            return false;
          }
          console.log(`[SignIn] Profile created in public.users for ID ${user.id}`);
          (user as any).role = userRole; 
          user.name = [firstName, lastName].filter(Boolean).join(' ');

        } else {
          console.log(`[SignIn] Profile found in public.users for ID ${user.id}. Email: ${publicProfile.email}.`);
          (user as any).role = publicProfile.role;
          user.name = [publicProfile.first_name, publicProfile.last_name].filter(Boolean).join(' ') || publicProfile.email;
          user.email = publicProfile.email;

          if (account?.provider === 'google' && profile) {
            const newFirstName = profile.given_name || profile.first_name || '';
            const newLastName = profile.family_name || profile.last_name || '';
            const nameChanged = (newFirstName && newFirstName !== publicProfile.first_name) || (newLastName && newLastName !== publicProfile.last_name);

            if (nameChanged) {
              console.log(`[SignIn] Updating name for user ${user.id} from Google profile.`);
              const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({ 
                  first_name: newFirstName || publicProfile.first_name,
                  last_name: newLastName || publicProfile.last_name
                })
                .eq('id', user.id);
              if (updateError) console.error('[SignIn] Error updating name in public.users:', user.id, updateError);
              else {
                console.log(`[SignIn] Name updated for user ${user.id}`);
                user.name = [newFirstName || publicProfile.first_name, newLastName || publicProfile.last_name].filter(Boolean).join(' ');
              }
            }
          }
        }
        console.log('=== FIN SIGNIN (permitido) ===');
        return true;
      } catch (e) {
        console.error('[SignIn] Unexpected top-level error:', e);
        return false;
      }
    },
    async jwt({ token, user, account }: { token: JWT; user?: NextAuthUser | undefined; account?: Account | null }): Promise<JWT> {
      // Al iniciar sesión o conectar una cuenta por primera vez
      if (account && user) {
        token.id = user.id; 
        token.email = user.email;
        // token.name = user.name; // We'll use firstName and lastName instead
        token.role = (user.role ?? 'paciente') as UserRoleType;

        // Fetch first_name, last_name, and image_url from public.users
        try {
          const { data: publicUser, error: publicUserError } = await supabaseAdmin
            .from('users')
            .select('first_name, last_name, image_url')
            .eq('id', user.id)
            .single();

          if (publicUserError) {
            console.error(`[JWT Callback] Error fetching user details from public.users for ID ${user.id}:`, publicUserError);
          } else if (publicUser) {
            token.firstName = publicUser.first_name;
            token.lastName = publicUser.last_name;
            token.image_url = publicUser.image_url;
            token.name = `${publicUser.first_name || ''} ${publicUser.last_name || ''}`.trim(); // Keep full name for compatibility
            console.log(`[JWT Callback] Fetched public.users details for ${user.id}:`, { firstName: token.firstName, lastName: token.lastName, imageUrl: token.image_url });
          } else {
            console.warn(`[JWT Callback] No user found in public.users for ID ${user.id}`);
          }
        } catch (e) {
          console.error(`[JWT Callback] Exception fetching user details from public.users for ID ${user.id}:`, e);
        }


        if (account.provider === 'google') {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
          delete token.error; 
          console.log("Google account linked, tokens stored in JWT:", { provider: account.provider, userId: user.id });
        }
      }

      // Esta lógica de upsert se ejecuta después del login/conexión inicial
      // y también en subsecuentes llamadas a getSession/useSession si el token JWT se usa.
      // Es importante asegurar que el `token.id` (que debe ser el Supabase user ID) esté disponible.
      // El SupabaseAdapter ya debería haber manejado la creación/actualización del usuario (id, email).
      // Este bloque es para asegurar que campos adicionales como 'role' estén sincronizados si es necesario.
      // Reemplazamos el upsert anterior que causaba conflictos de 'email' por un update más específico para 'role'.
      if (token.id && typeof token.role === 'string') { // Asegurarse que token.id existe y token.role es un string
        try {
          // console.log(`[JWT Callback] Attempting to update role for user ID: ${token.id} to role: ${token.role}`);
          const { error: updateError } = await supabaseAdmin
            .from('users') // Asumiendo que esta es tu tabla pública de usuarios
            .update({ role: token.role })
            .eq('id', token.id as string);

          if (updateError) {
            // Esto podría ocurrir si el usuario (token.id) no se encuentra, o hay un problema de RLS/permisos.
            console.error(`[JWT Callback] Error updating role for user ID ${token.id}:`, updateError);
          }
        } catch (err) {
          console.error(`[JWT Callback] Exception during role update for user ID ${token.id}:`, err);
        }
      }

      // Fetch fresh image_url on every JWT invocation (option A)
      if (!user && token.id) {
        try {
          const { data: publicUser, error: publicUserError } = await supabaseAdmin
            .from('users')
            .select('image_url')
            .eq('id', token.id as string)
            .single();
          if (!publicUserError && publicUser?.image_url) {
            token.image_url = publicUser.image_url;
            console.log(`[JWT Callback] Refreshed image_url for ${token.id}:`, token.image_url);
          }
        } catch (e) {
          console.error(`[JWT Callback] Error refreshing image_url for ${token.id}:`, e);
        }
      }

      // Si el token de acceso no ha expirado, devuélvelo
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires) {
        // console.log("Access token is valid");
        return token;
      }

      // Si no hay accessToken (ej. login con credenciales) o si ha expirado y no hay refreshToken, devolver token actual
      if (!token.accessToken || !token.refreshToken) {
        // console.log("No access token or refresh token available, returning current token");
        return token;
      }
      
      // Si el token de acceso ha expirado y tenemos un refreshToken, intenta refrescarlo
      console.log("Access token expired, attempting to refresh...");
      return refreshAccessToken(token);
    },
    async session({ session, token }: { session: any; token: JWT }): Promise<any> {
      if (!session.user) {
        session.user = {};
      }
      session.user.id = token.id as string;
      session.user.role = token.role as UserRoleType;
      if (token.email) session.user.email = token.email;
      if (token.name) session.user.name = token.name; // Full name
      if (token.firstName) session.user.firstName = token.firstName;
      if (token.lastName) session.user.lastName = token.lastName;
      if (token.image_url) session.user.image_url = token.image_url;
      
      session.accessToken = token.accessToken;
      session.error = token.error; // Propagate error from token refresh
      
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error' // Custom error page to handle auth errors
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
};
