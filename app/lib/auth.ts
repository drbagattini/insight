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
  // Usamos JWT para evitar problemas con las tablas y FK
  session: {
    strategy: "jwt", 
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  debug: process.env.NODE_ENV === 'development',
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // authorization block removed to rely entirely on signIn parameters for scope, prompt, etc.
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
            .select('id, first_name, last_name, email') // Seleccionar first_name y last_name
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
      });

      if (!user.email) {
        console.error('[SignIn] Critical: Missing user.email from provider. Denying sign-in.');
        return false;
      }

      try {
        if (account?.provider === 'google') {
          console.log('[SignIn] Google OAuth login detected');
          const { data: { users: foundAuthUsers }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
            filter: `email eq "${user.email}"`
          });

          if (listUsersError) {
            console.error('[SignIn] Error listando usuarios en auth.users:', listUsersError);
            return false;
          }

          let supabaseAuthUser: any = null;
          if (foundAuthUsers && foundAuthUsers.length > 0) {
            supabaseAuthUser = foundAuthUsers[0];
            console.log('[SignIn] Usuario encontrado en auth.users con ID', supabaseAuthUser.id);
            user.id = supabaseAuthUser.id;
          } else {
            console.log(`[SignIn] Usuario con email ${user.email} no encontrado en auth.users. Creando...`);
            const authMetadata = {
              name: user.name,
              given_name: profile?.given_name || profile?.first_name || user.name?.split(' ')[0] || '',
              family_name: profile?.family_name || profile?.last_name || user.name?.split(' ').slice(1).join(' ') || '',
              avatar_url: user.image || profile?.picture || ''
            };
            const { data: newAuthUserData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
              email: user.email,
              user_metadata: authMetadata,
              app_metadata: { userrole: 'psicologo' },
              email_confirm: true
            });
            if (createAuthError) {
              console.error('[SignIn] Error creando usuario en auth.users:', createAuthError);
              return false;
            }
            supabaseAuthUser = newAuthUserData.user;
            console.log('[SignIn] Usuario creado en auth.users con ID', supabaseAuthUser.id);
            user.id = supabaseAuthUser.id;
            await new Promise(resolve => setTimeout(resolve, 500)); // Allow trigger to run
          }

          if (account.id_token && user.id) {
            console.log('[SignIn-Google] Attempting Supabase signInWithIdToken with Google ID token.');
            const { data: supabaseSessionData, error: supabaseSessionError } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: account.id_token,
            });

            if (supabaseSessionError) {
              console.error('[SignIn-Google] Supabase signInWithIdToken error:', supabaseSessionError.message);
              return false;
            }

            if (supabaseSessionData && supabaseSessionData.session) {
              console.log('[SignIn-Google] Supabase session obtained successfully via signInWithIdToken.');
              (user as any).sbAccessToken = supabaseSessionData.session.access_token;
              (user as any).sbRefreshToken = supabaseSessionData.session.refresh_token;
              console.log('[SignIn-Google] sbAccessToken and sbRefreshToken attached to user object.');
            } else {
              console.warn('[SignIn-Google] Supabase signInWithIdToken did not return a session. This is unexpected.');
              return false;
            }
          } else {
            console.warn('[SignIn-Google] Google account id_token is missing or user.id not set. Cannot perform Supabase signInWithIdToken.');
            return false;
          }
        }

        const { data: publicProfile, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('id, email, first_name, last_name, role, image_url')
          .eq('id', user.id) // Use ID now that it's confirmed from auth.users
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('[SignIn] Error fetching user from public.users by ID:', user.id, fetchError);
          return false;
        }

        if (!publicProfile) {
          console.log(`[SignIn] No profile in public.users for ID ${user.id}. Creating new profile...`);
          let firstName = (user as any).firstName || '';
          let lastName = (user as any).lastName || '';
          const userRole = (user as any).role || 'psicologo';
          let imageUrl = (user as any).image_url || user.image || profile?.picture || '';

          if (account?.provider === 'google' && profile) {
            firstName = profile.given_name || profile.first_name || firstName;
            lastName = profile.family_name || profile.last_name || lastName;
            imageUrl = profile.picture || imageUrl;
          }
          if (!firstName && user.name) firstName = user.name.split(' ')[0] || '';
          if (!lastName && user.name) lastName = user.name.split(' ').slice(1).join(' ') || '';
          if (!firstName && user.email) firstName = user.email.split('@')[0];

          console.log(`[SignIn] Creating new profile in public.users for ID ${user.id}`);
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              first_name: firstName,
              last_name: lastName,
              role: userRole,
              image_url: imageUrl,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('[SignIn] Error inserting new user into public.users:', insertError);
            return false;
          }
          user.role = userRole;
          (user as any).firstName = firstName;
          (user as any).lastName = lastName;
          (user as any).image_url = imageUrl;
          user.name = [firstName, lastName].filter(Boolean).join(' ');
        } else {
          console.log(`[SignIn] Profile found in public.users for ID ${publicProfile.id}`);
          user.id = publicProfile.id;
          (user as any).firstName = publicProfile.first_name;
          (user as any).lastName = publicProfile.last_name;
          user.email = publicProfile.email;
          user.role = publicProfile.role;
          (user as any).image_url = publicProfile.image_url;
          user.name = [publicProfile.first_name, publicProfile.last_name].filter(Boolean).join(' ') || publicProfile.email;

          if (account?.provider === 'google' && profile) {
            const updates: any = {};
            const newFirstName = profile.given_name || profile.first_name || '';
            const newLastName = profile.family_name || profile.last_name || '';
            const newImageUrl = profile.picture;

            if (newFirstName && newFirstName !== publicProfile.first_name) updates.first_name = newFirstName;
            if (newLastName && newLastName !== publicProfile.last_name) updates.last_name = newLastName;
            if (newImageUrl && newImageUrl !== publicProfile.image_url) updates.image_url = newImageUrl;

            if (Object.keys(updates).length > 0) {
              updates.updated_at = new Date().toISOString();
              console.log(`[SignIn] Updating public.users for ${user.email} from Google profile:`, updates);
              const { error: updateError } = await supabaseAdmin.from('users').update(updates).eq('id', user.id);
              if (updateError) console.error('[SignIn] Error updating public.users from Google profile:', updateError);
              else {
                if (updates.first_name) (user as any).firstName = updates.first_name;
                if (updates.last_name) (user as any).lastName = updates.last_name;
                if (updates.image_url) (user as any).image_url = updates.image_url;
                user.name = [(user as any).firstName, (user as any).lastName].filter(Boolean).join(' ');
              }
            }
          }
        }
        if (!(user as any).role) (user as any).role = 'psicologo';
        console.log('=== FIN SIGNIN (permitido) ===');
        console.log('Usuario final para JWT:', { id: user.id, email: user.email, role: (user as any).role, name: user.name, sbAccessTokenExists: !!(user as any).sbAccessToken, firstName: (user as any).firstName, lastName: (user as any).lastName, image_url: (user as any).image_url });
        return true;
      } catch (e) {
        console.error('[SignIn] Unexpected top-level error:', e);
        return false;
      }
    },

    async jwt({ token, user, account, profile, trigger, session: updateData }: { token: JWT; user?: NextAuthUser | undefined; account?: Account | null; profile?: any; trigger?: "signIn" | "signUp" | "update" | undefined; session?: any }): Promise<JWT> {
      console.log("[JWT] Callback - START", { userId: user?.id, accountProvider: account?.provider, currentTokenId: token.id, trigger });

      if (user) {
        console.log('[JWT] User object received during sign-in/sign-up:', JSON.stringify({
          id: user.id,
          email: user.email,
          role: (user as any).role,
          name: user.name,
          firstName: (user as any).firstName,
          lastName: (user as any).lastName,
          image_url: (user as any).image_url,
          sbAccessTokenExists: !!(user as any).sbAccessToken,
          sbRefreshTokenExists: !!(user as any).sbRefreshToken,
        }, null, 2));

        token.id = user.id;
        token.email = user.email || token.email;
        token.firstName = (user as any).firstName || token.firstName;
        token.lastName = (user as any).lastName || token.lastName;
        token.image_url = (user as any).image_url || token.image_url;
        token.role = (user as any).role || token.role;
        token.name = user.name || token.name;

        const userSbAccessToken = (user as any).sbAccessToken;
        const userSbRefreshToken = (user as any).sbRefreshToken;
        console.log(`[JWT - User Processing] Raw user.sbAccessToken value: '${userSbAccessToken}'`);
        console.log(`[JWT - User Processing] Type of user.sbAccessToken: ${typeof userSbAccessToken}`);
        
        if (userSbAccessToken && typeof userSbAccessToken === 'string' && userSbAccessToken.length > 0) {
          console.log('[JWT] user.sbAccessToken is a non-empty string. Assigning to token.sbAccessToken.');
          token.sbAccessToken = userSbAccessToken;
          // Assign refresh token only if access token is being assigned
          if (userSbRefreshToken && typeof userSbRefreshToken === 'string' && userSbRefreshToken.length > 0) {
            token.sbRefreshToken = userSbRefreshToken;
            console.log('[JWT] user.sbRefreshToken is a non-empty string. Assigning to token.sbRefreshToken.');
          } else {
            console.log('[JWT] user.sbRefreshToken is falsy or not a non-empty string. Not assigning to token.sbRefreshToken.');
            // delete token.sbRefreshToken; // Consider if stale refresh token should be cleared
          }
        } else {
          console.log('[JWT] user.sbAccessToken is falsy or not a non-empty string. NOT assigning to token.sbAccessToken.');
          // delete token.sbAccessToken; // Consider if stale tokens should be cleared
          // delete token.sbRefreshToken;
        }
      }

      if (trigger === "update" && updateData) {
        console.log("[JWT Callback] Update trigger received", { updateData });
        const sourceForUpdates = updateData.user || updateData;
        if (typeof sourceForUpdates.image_url === 'string') token.image_url = sourceForUpdates.image_url;
        if (typeof sourceForUpdates.firstName === 'string') token.firstName = sourceForUpdates.firstName;
        if (typeof sourceForUpdates.lastName === 'string') token.lastName = sourceForUpdates.lastName;
        if (typeof sourceForUpdates.role === 'string') token.role = sourceForUpdates.role;
        if (typeof sourceForUpdates.name === 'string') token.name = sourceForUpdates.name;
        else if (token.firstName && token.lastName && (typeof sourceForUpdates.firstName === 'string' || typeof sourceForUpdates.lastName === 'string')) {
            token.name = `${token.firstName} ${token.lastName}`.trim();
        }
      }

      if (account && account.provider === "google") {
        console.log("[JWT Callback] Google Account object present.", { account_scopes: account.scope });
        token.googleLoginAccessToken = account.access_token;
        token.googleLoginRefreshToken = account.refresh_token || token.googleLoginRefreshToken;
        token.googleLoginExpiresAt = account.expires_at ? (Date.now() + account.expires_at * 1000) : undefined;

        if (account.scope?.includes("https://www.googleapis.com/auth/calendar")) {
          console.log("JWT Callback: Google Calendar scope GRANTED in this sign-in.");
          token.googleCalendarAccessToken = account.access_token;
          token.googleCalendarRefreshToken = account.refresh_token || token.googleCalendarRefreshToken;
          token.googleCalendarExpiresAt = account.expires_at ? (Date.now() + account.expires_at * 1000) : undefined;
          token.googleCalendarScopeGranted = true;
        } else if (token.googleCalendarScopeGranted === undefined) {
          token.googleCalendarScopeGranted = false;
        }
        
        if (profile) {
            token.email = profile.email || token.email;
            token.firstName = profile.given_name || token.firstName;
            token.lastName = profile.family_name || token.lastName;
            token.image_url = profile.picture || token.image_url;
            if (!token.name && token.firstName && token.lastName) {
                token.name = `${token.firstName} ${token.lastName}`.trim();
            } else if (!token.name && profile.name) {
                token.name = profile.name;
            }
        }
      }

      if (token.googleCalendarScopeGranted && token.googleCalendarAccessToken && token.googleCalendarExpiresAt && Date.now() > token.googleCalendarExpiresAt) {
        console.log("JWT Callback: Google Calendar access token expired. Attempting refresh.");
        if (token.googleCalendarRefreshToken) {
          const refreshed = await refreshAccessToken({ ...token, refreshToken: token.googleCalendarRefreshToken, accessToken: token.googleCalendarAccessToken, accessTokenExpires: token.googleCalendarExpiresAt });
          if (refreshed.error) {
            console.error("JWT Callback: Error refreshing Google Calendar access token:", refreshed.error);
            token.error = "RefreshCalendarTokenError";
            delete token.googleCalendarAccessToken;
            delete token.googleCalendarExpiresAt;
            token.googleCalendarScopeGranted = false;
          } else {
            console.log("JWT Callback: Google Calendar access token REFRESHED successfully.");
            token.googleCalendarAccessToken = refreshed.accessToken;
            token.googleCalendarExpiresAt = refreshed.accessTokenExpires;
            token.googleCalendarRefreshToken = refreshed.refreshToken || token.googleCalendarRefreshToken;
            token.error = undefined;
          }
        } else {
          console.warn("JWT Callback: Google Calendar access token expired, but NO refresh token available.");
          token.error = "NoCalendarRefreshToken";
          delete token.googleCalendarAccessToken;
          delete token.googleCalendarExpiresAt;
          token.googleCalendarScopeGranted = false;
        }
      }

      console.log('[JWT] JWT Callback - END. Returning token:', JSON.stringify({
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        firstName: token.firstName,
        lastName: token.lastName,
        image_url: token.image_url,
        sbAccessTokenExists: !!token.sbAccessToken,
        googleLoginAccessTokenExists: !!token.googleLoginAccessToken,
        googleCalendarAccessTokenExists: !!token.googleCalendarAccessToken,
        googleCalendarScopeGranted: token.googleCalendarScopeGranted,
      }, null, 2));
      return token;
    },

    async session({ session, token }: { session: any; token: JWT }): Promise<any> {
      console.log("[Session] Callback - START", { currentSessionUserId: session.user?.id, tokenId: token.id, tokenRole: token.role });
      if (!session.user) session.user = {};

      session.user.id = token.id as string;
      session.user.email = token.email || session.user.email;
      session.user.firstName = token.firstName || session.user.firstName;
      session.user.lastName = token.lastName || session.user.lastName;
      session.user.role = token.role || 'psicologo';
      session.user.image_url = token.image_url || session.user.image_url;
      session.user.name = token.name || [token.firstName, token.lastName].filter(Boolean).join(' ') || session.user.name;

      if (token.sbAccessToken) {
        console.log('[Session] sbAccessToken FOUND on JWT token. Adding to session.');
        session.sbAccessToken = token.sbAccessToken as string;
        session.sbRefreshToken = token.sbRefreshToken as string;
      } else {
        console.log('[Session] sbAccessToken NOT FOUND on JWT token.');
      }

      if (token.googleLoginAccessToken) session.googleLoginAccessToken = token.googleLoginAccessToken;
      if (token.googleCalendarAccessToken) session.googleCalendarAccessToken = token.googleCalendarAccessToken;
      session.googleCalendarScopeGranted = token.googleCalendarScopeGranted || false;
      session.error = token.error;

      console.log('[Session] Session Callback - END. Returning session:', JSON.stringify({
        user: { id: session.user.id, email: session.user.email, name: session.user.name, role: session.user.role, firstName: session.user.firstName, lastName: session.user.lastName, image_url: session.user.image_url },
        sbAccessTokenExists: !!session.sbAccessToken,
        sbRefreshTokenExists: !!session.sbRefreshToken,
        googleLoginAccessToken: session.googleLoginAccessToken,
        googleCalendarAccessToken: session.googleCalendarAccessToken,
        googleCalendarScopeGranted: session.googleCalendarScopeGranted,
        error: session.error,
        expires: session.expires
      }, null, 2));
      return session;
    }
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
};
