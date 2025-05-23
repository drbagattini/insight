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
  adapter: SupabaseAdapter({ url: supabaseUrl, secret: serviceKey }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
          return null;
        }
        try {
          // 1. Autenticar contra Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password
          });

          if (authError) {
            console.error(`AuthOptions: Error de Supabase Auth:`, authError.message);
            // Determinar si el email no existe o la contraseña es inválida
            // Esta lógica puede necesitar ajustes basados en cómo quieres manejar los errores
            let errorCode = 'AuthenticationFailed';
            if (authError.message.toLowerCase().includes('invalid login credentials')) {
              // Intentar verificar si el email existe para diferenciar entre email no encontrado y contraseña incorrecta
              const { data: userExistsData, error: checkError } = await supabaseAdmin
                .from('users') // Asume que esta es tu tabla pública de usuarios
                .select('id')
                .eq('email', credentials.email)
                .maybeSingle(); // Usa maybeSingle para no fallar si no hay resultados

              if (checkError && checkError.code !== 'PGRST116') { // PGRST116 es 'Fetched rowcount is not one'
                console.error('AuthOptions: Error verificando existencia de email:', checkError);
              } else if (userExistsData) {
                errorCode = 'InvalidPassword';
              } else {
                errorCode = 'EmailNotFound';
              }
            } else if (authError.message.toLowerCase().includes('email not confirmed')) {
              errorCode = 'EmailNotConfirmed';
            }
            const errorToThrow = new Error(errorCode);
            (errorToThrow as any).type = errorCode;
            throw errorToThrow;
          }

          if (!authData?.user) {
            console.error(`AuthOptions: No se encontró el usuario en Supabase Auth.`);
            return null;
          }

          // 2. Obtener el usuario de la tabla pública `users` (la que usa el SupabaseAdapter)
          // Esto asegura que usamos el mismo ID de usuario que usaría el login con Google.
          const { data: publicUser, error: publicUserError } = await supabaseAdmin
            .from('users') // Asegúrate que 'users' es el nombre correcto de tu tabla pública
            .select('id, name, email, role') // Selecciona los campos necesarios
            .eq('email', authData.user.email) // Busca por el email del usuario autenticado
            .single(); // Esperamos un solo usuario

          if (publicUserError) {
            console.error(`AuthOptions: Error buscando usuario en tabla pública 'users' para email ${authData.user.email}:`, publicUserError);
            // Si el usuario existe en Supabase Auth pero no en la tabla pública 'users',
            // esto podría indicar un problema de sincronización o que el SupabaseAdapter no lo ha creado aún.
            // Por ahora, retornamos null, pero podrías considerar crearlo aquí si es necesario.
            const errorToThrow = new Error('UserNotFoundInPublicTable');
            (errorToThrow as any).type = 'UserNotFoundInPublicTable';
            throw errorToThrow;
          }

          if (!publicUser) {
            console.error(`AuthOptions: No se encontró el usuario en la tabla pública 'users' para email ${authData.user.email}.`);
            const errorToThrow = new Error('UserNotFoundInPublicTable');
            (errorToThrow as any).type = 'UserNotFoundInPublicTable';
            throw errorToThrow;
          }

          // 3. Devolver el objeto usuario para NextAuth usando los datos de la tabla pública `users`
          return {
            id: publicUser.id, // ID de la tabla public.users
            email: publicUser.email,
            name: publicUser.name,
            role: (publicUser.role || 'paciente') as UserRoleType
          };

        } catch (err: any) {
            // Si el error ya tiene un 'type', es uno que hemos construido nosotros, así que lo relanzamos
            if (err.type) {
                throw err;
            }
            // Para errores inesperados
            console.error('AuthOptions: Error inesperado durante la autenticación con credenciales:', err);
            const authError = new Error("AuthenticationFailed");
            (authError as any).type = "AuthenticationFailed";
            throw authError;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: NextAuthUser | undefined; account?: Account | null }): Promise<JWT> {
      // Al iniciar sesión o conectar una cuenta por primera vez
      if (account && user) {
        token.id = user.id; 
        token.email = user.email;
        token.name = user.name;
        token.role = (user.role ?? 'paciente') as UserRoleType;

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
      if (token.name) session.user.name = token.name;
      
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
