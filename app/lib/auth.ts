import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import { AuthOptions, User as NextAuthUser, Account } from 'next-auth'; // Profile no se usa explícitamente aquí
import { JWT } from 'next-auth/jwt';
import { UserRoleType } from '@/types/roles';
import { SupabaseAdapter } from "@next-auth/supabase-adapter";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

    // Validate token structure from Google
    if (typeof refreshedTokens.access_token !== 'string' || 
        typeof refreshedTokens.expires_in !== 'number' ||
        (refreshedTokens.refresh_token !== undefined && typeof refreshedTokens.refresh_token !== 'string')) { // If refresh_token is present, it must be a string
      console.error("Invalid token structure from Google:", refreshedTokens);
      // When structure is invalid, we should not use any of refreshedTokens,
      // and return the original token with an error.
      return { 
        ...token, 
        error: "InvalidTokenStructureFromGoogle" 
      };
    }
    console.log("Successfully refreshed token");

    const newAccessToken = refreshedTokens.access_token as string;
    const newExpiresIn = refreshedTokens.expires_in as number;
    // refreshedTokens.refresh_token could be a string or undefined. If undefined, this cast is fine.
    const newRefreshToken = refreshedTokens.refresh_token as (string | undefined);

    return {
      ...token,
      accessToken: newAccessToken,
      accessTokenExpires: Date.now() + newExpiresIn * 1000,
      refreshToken: newRefreshToken ?? token.refreshToken, // If newRefreshToken is undefined, use the original token's refreshToken
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

const TOKEN_REFRESH_BUFFER_SEC = 60;

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
        console.log('[Cred-authorize] INICIO.', { email: credentials?.email });
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

          console.log('[Cred-authorize] authError?', !!authError, 'user?', !!authData?.user, 'session?', !!authData?.session);
          if (authData?.session) {
            console.log('[Cred-authorize] access_token len=', authData.session.access_token?.length);
          }

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
          const userToReturn: any = {
            id: publicUser.id, // Este es el ID de la tabla public.users
            email: publicUser.email,
            name: fullName,
            firstName: publicUser.first_name,
            lastName: publicUser.last_name,
            role: 'psicologo', // Asignar rol por defecto o buscarlo si está en public.users
          };

          if (authData.session) {
            console.log('[AuthOptions-Credentials] Session object from Supabase found, attaching tokens.');
            userToReturn.sbAccessToken = authData.session.access_token;
            userToReturn.sbRefreshToken = authData.session.refresh_token;
          } else {
            console.warn('[AuthOptions-Credentials] Supabase session object NOT FOUND after signInWithPassword. sbAccessToken will be missing.');
          }
          
          console.log('[Cred-authorize] DEVOLVEMOS user con sbAccessToken?', !!userToReturn.sbAccessToken);
          return userToReturn;
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
          console.log('[SignIn] Google OAuth login (post-adapter). Ensuring canonical user.id from public.users');

          const { data: publicProfile, error } = await supabaseAdmin
            .from('users')
            .select('id, first_name, last_name, role, image_url')
            .eq('email', user.email)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('[SignIn] Error fetching public.users by email for Google login:', error);
            return false;
          }

          if (publicProfile) {
            console.log('[SignIn] Found public.users profile for Google user:', publicProfile.id);
            user.id = publicProfile.id;
            (user as any).firstName = publicProfile.first_name;
            (user as any).lastName = publicProfile.last_name;
            user.role = publicProfile.role;
            (user as any).image_url = publicProfile.image_url;
            user.name = [publicProfile.first_name, publicProfile.last_name].filter(Boolean).join(' ') || user.name;
          } else {
            console.warn('[SignIn] No public.users row found for Google email. Relying on SupabaseAdapter to create it.');
          }

          // NEW: Obtain Supabase session via Google ID token to get sbAccessToken / sbRefreshToken
          if ((account as any).id_token) {
            try {
              const { data: supaAuthData, error: supaAuthErr } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: (account as any).id_token as string,
              });
              if (supaAuthErr) {
                console.error('[SignIn] Supabase signInWithIdToken error:', supaAuthErr);
              } else if (supaAuthData?.session) {
                console.log('[SignIn] Supabase session acquired via Google ID token. Attaching sbAccessToken to user.');
                (user as any).sbAccessToken = supaAuthData.session.access_token;
                (user as any).sbRefreshToken = supaAuthData.session.refresh_token;
              } else {
                console.warn('[SignIn] signInWithIdToken returned no error but also no session.');
              }
            } catch (e: any) {
              console.error('[SignIn] Exception during Supabase signInWithIdToken:', e);
            }
          } else {
            console.warn('[SignIn] account.id_token missing; cannot obtain Supabase session for Google login.');
          }

          return true; // Skip credentials-specific logic
        }

        // --- Credentials login branch (public.users manual sync) ---
        
        const { data: publicProfile, error: fetchError } = await supabaseAdmin
          .from('users')
          .select('id, email, first_name, last_name, role, image_url')
          .eq('id', user.id)
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

          if (account?.provider === 'credentials' && profile) {
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

          if (account?.provider === 'credentials' && profile) {
            const updates: any = {};
            const newFirstName = profile.given_name || profile.first_name || '';
            const newLastName = profile.family_name || profile.last_name || '';
            const newImageUrl = profile.picture;

            if (newFirstName && newFirstName !== publicProfile.first_name) updates.first_name = newFirstName;
            if (newLastName && newLastName !== publicProfile.last_name) updates.last_name = newLastName;
            if (newImageUrl && newImageUrl !== publicProfile.image_url) updates.image_url = newImageUrl;

            if (Object.keys(updates).length > 0) {
              updates.updated_at = new Date().toISOString();
              console.log(`[SignIn] Updating public.users for ${user.email} from profile:`, updates);
              const { error: updateError } = await supabaseAdmin.from('users').update(updates).eq('id', user.id);
              if (updateError) console.error('[SignIn] Error updating public.users from profile:', updateError);
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

      // Ensure Supabase expiry is set even on token reloads
      // Ensure sbExpiresAt is a number if sbAccessToken exists
      if (token.sbAccessToken && typeof token.sbExpiresAt !== 'number') {
        console.log('[JWT] sbAccessToken exists but sbExpiresAt is not a number or missing. Attempting to parse exp claim from sbAccessToken.');
        try {
          const payload = JSON.parse(Buffer.from(token.sbAccessToken.split('.')[1], 'base64').toString('utf8'));
          if (payload.exp) {
            token.sbExpiresAt = payload.exp; // seconds since epoch
          }
        } catch (e) {
          console.error('[JWT] Failed to parse sbAccessToken for exp claim. Deleting sbExpiresAt.:', e);
          delete token.sbExpiresAt;
        }
      }

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
          console.log('[JWT] user.sbAccessToken is valid. Assigning to token.sbAccessToken.');
          token.sbAccessToken = userSbAccessToken;

          if (userSbRefreshToken && typeof userSbRefreshToken === 'string' && userSbRefreshToken.length > 0) {
            console.log('[JWT] user.sbRefreshToken is valid. Assigning to token.sbRefreshToken.');
            token.sbRefreshToken = userSbRefreshToken;
          } else {
            console.log('[JWT] user.sbRefreshToken is NOT valid or not present. Clearing token.sbRefreshToken.');
            delete token.sbRefreshToken; 
          }

          if (account?.provider === 'credentials') {
            console.log(`[JWT - Credentials Login] Supabase tokens processed from user object. sbAccessToken: ${!!token.sbAccessToken}, sbRefreshToken: ${!!token.sbRefreshToken}`);
          }
        } else {
          // This case means user.sbAccessToken was not valid to begin with.
          console.log('[JWT] user.sbAccessToken is NOT valid or not present. Clearing token.sbAccessToken and token.sbRefreshToken.');
          delete token.sbAccessToken;
          delete token.sbRefreshToken;
          if (account?.provider === 'credentials') {
            console.warn('[JWT - Credentials Login] sbAccessToken was NOT found or was invalid on the user object from authorize. This is unexpected for credentials login. Both sbAccessToken and sbRefreshToken will be undefined in JWT.');
          }
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

      const expiresAt = token.googleCalendarExpiresAt;
      if (token.googleCalendarScopeGranted && token.googleCalendarAccessToken && typeof expiresAt === 'number' && Date.now() > expiresAt) {
        console.log("JWT Callback: Google Calendar access token expired. Attempting refresh.");
        if (token.googleCalendarRefreshToken) {
          const refreshed: JWT = await refreshAccessToken({ ...token, refreshToken: token.googleCalendarRefreshToken, accessToken: token.googleCalendarAccessToken, accessTokenExpires: token.googleCalendarExpiresAt });
          if (refreshed.error) {
            console.error("JWT Callback: Error refreshing Google Calendar access token:", refreshed.error);
            token.error = "RefreshCalendarTokenError";
            delete token.googleCalendarAccessToken;
            delete token.googleCalendarExpiresAt;
            token.googleCalendarScopeGranted = false;
          } else {
            console.log("JWT Callback: Google Calendar access token REFRESHED successfully.");

            if (typeof refreshed.accessToken === 'string') {
              token.googleCalendarAccessToken = refreshed.accessToken;
            } else {
              console.error('[JWT Callback] Post-refresh: refreshed.accessToken was not a string. Clearing googleCalendarAccessToken.');
              delete token.googleCalendarAccessToken;
            }

            if (typeof refreshed.accessTokenExpires === 'number') {
              token.googleCalendarExpiresAt = refreshed.accessTokenExpires;
            } else {
              console.error('[JWT Callback] Post-refresh: refreshed.accessTokenExpires was not a number. Clearing googleCalendarExpiresAt.');
              delete token.googleCalendarExpiresAt;
            }

            // refreshed.refreshToken already incorporates fallback to the original token.googleCalendarRefreshToken if Google didn't provide a new one.
            // So, we assign it if it's a string, or assign undefined if it's undefined.
            if (typeof refreshed.refreshToken === 'string') {
              token.googleCalendarRefreshToken = refreshed.refreshToken;
            } else if (refreshed.refreshToken === undefined) {
              token.googleCalendarRefreshToken = undefined; // Explicitly set to undefined if that's what refreshed.refreshToken is
            } else {
              console.error('[JWT Callback] Post-refresh: refreshed.refreshToken was neither string nor undefined. Clearing googleCalendarRefreshToken.');
              delete token.googleCalendarRefreshToken;
            }
            
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

      // --- SUPABASE ACCESS TOKEN REFRESH LOGIC ---
      console.log('[JWT] Checking Supabase token state before refresh logic. sbAccessToken exists:', !!token.sbAccessToken, 'sbRefreshToken exists:', !!token.sbRefreshToken, 'sbExpiresAt:', token.sbExpiresAt, 'Current error state:', token.error);
      if (token.sbAccessToken && token.sbRefreshToken) {
        const nowSec = Math.floor(Date.now() / 1000);
        if (typeof token.sbExpiresAt === 'number' && (token.sbExpiresAt - nowSec) < TOKEN_REFRESH_BUFFER_SEC) {
          console.log('[JWT] Supabase token needs refresh. Current time:', nowSec, 'Expires at:', token.sbExpiresAt, 'Refresh buffer (s):', TOKEN_REFRESH_BUFFER_SEC);
          try {
            const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseAnonKey) {
              console.error('[JWT] CRITICAL: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Cannot refresh Supabase token.');
              token.error = 'SupabaseConfigError';
              // Delete tokens because config is missing, refresh is impossible
              delete token.sbAccessToken;
              delete token.sbRefreshToken;
              delete token.sbExpiresAt;
            } else {
              const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': supabaseAnonKey,
                },
                body: JSON.stringify({ refresh_token: token.sbRefreshToken })
              });

              console.log(`[JWT] Supabase refresh fetch completed. Status: ${refreshResponse.status}, OK: ${refreshResponse.ok}`);

              let parsedResponseData: any;
              try {
                parsedResponseData = await refreshResponse.json();
                console.log('[JWT] Supabase refresh response JSON parsed successfully:', parsedResponseData);
              } catch (parseError) {
                let responseText = '';
                try {
                  responseText = await refreshResponse.text();
                } catch (textError) {
                  console.error('[JWT] Failed to even get text response after JSON parse failed:', textError);
                }
                console.error(`[JWT] Supabase refresh response JSON parsing failed. Status: ${refreshResponse.status}. Response Text: ${responseText}. Parse Error:`, parseError);
                token.error = 'SupabaseRefreshResponseMalformed';
                delete token.sbAccessToken;
                delete token.sbRefreshToken;
                delete token.sbExpiresAt;
                // End refresh attempt here as response is unparsable
                return token; 
              }

              if (refreshResponse.ok) {
                if (parsedResponseData && typeof parsedResponseData.access_token === 'string' && parsedResponseData.access_token.length > 0) {
                  console.log('[JWT] Supabase token refreshed successfully.');
                  token.sbAccessToken = parsedResponseData.access_token;
                  token.sbExpiresAt = nowSec + (typeof parsedResponseData.expires_in === 'number' ? parsedResponseData.expires_in : 3600);
                  if (typeof parsedResponseData.refresh_token === 'string' && parsedResponseData.refresh_token.length > 0) {
                    token.sbRefreshToken = parsedResponseData.refresh_token;
                    console.log('[JWT] New Supabase refresh_token received and updated in JWT.');
                  } else {
                    console.warn('[JWT] Supabase refresh response OK, but new refresh_token was NOT found. Old refresh_token will persist in JWT.');
                  }
                  if (typeof token.error === 'string' && token.error.startsWith('Supabase')) {
                    delete token.error; // Clear any previous Supabase specific error
                  }
                } else {
                  // refreshResponse.ok was true, but access_token was missing or invalid in parsedResponseData
                  console.error('[JWT] Supabase refresh response OK, but access_token was missing or invalid in parsed response. Parsed Data:', parsedResponseData);
                  token.error = 'SupabaseRefreshNoToken';
                  delete token.sbAccessToken;
                  delete token.sbRefreshToken;
                  delete token.sbExpiresAt;
                }
              } else {
                // refreshResponse.ok is false, handle error based on parsedResponseData (which is the error object from Supabase)
                const errorData = parsedResponseData; // parsedResponseData is the error object from Supabase
                console.error(`[JWT] Supabase token refresh failed. Status: ${refreshResponse.status}. Error Data:`, errorData);

                if (errorData && errorData.error_description && errorData.error_description.includes('Refresh token already used')) {
                  token.error = 'SupabaseRefreshTokenAlreadyUsedError';
                  console.warn('[JWT] Refresh token already used. Not deleting sbAccessToken/sbRefreshToken to allow other requests to potentially succeed.');
                  // DO NOT delete sbAccessToken or sbRefreshToken here
                } else if (errorData && (errorData.error === 'invalid_grant' || errorData.error === 'invalid_request' || errorData.code === '401')) {
                  token.error = 'SupabaseInvalidRefreshToken';
                  console.warn(`[JWT] Invalid Supabase refresh token (error: ${errorData.error}, description: ${errorData.error_description}, code: ${errorData.code}). Deleting Supabase tokens.`);
                  delete token.sbAccessToken;
                  delete token.sbRefreshToken;
                  delete token.sbExpiresAt;
                } else {
                  token.error = 'SupabaseRefreshFailed'; // Fallback for other non-200 responses
                  console.warn(`[JWT] Uncategorized Supabase refresh failure (status ${refreshResponse.status}). Error: ${errorData?.error}, Desc: ${errorData?.error_description}. Deleting Supabase tokens.`);
                  delete token.sbAccessToken;
                  delete token.sbRefreshToken;
                  delete token.sbExpiresAt;
                }
              }
            }
          } catch (err: any) { 
            console.error('[JWT] Outer error/exception during Supabase token refresh logic:', err.message, err.stack);
            token.error = 'SupabaseRefreshOuterError'; 
            delete token.sbAccessToken;
            delete token.sbRefreshToken;
            delete token.sbExpiresAt;
            console.warn('[JWT] Cleared Supabase tokens due to outer error/exception in refresh logic.');
          }
        } else if (typeof token.sbExpiresAt === 'number') {
          console.log(`[JWT] Supabase token present but not yet within refresh window. Expires in ${token.sbExpiresAt - nowSec}s. Buffer: ${TOKEN_REFRESH_BUFFER_SEC}s.`);
        } else {
          console.warn('[JWT] Supabase token present but sbExpiresAt is not a number. Cannot determine if refresh is needed. sbExpiresAt:', token.sbExpiresAt);
        }
      } else {
        console.log('[JWT] Skipping Supabase token refresh logic: sbAccessToken or sbRefreshToken is missing.');
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

      // Propagate Supabase access token to session only if no critical Supabase token error occurred in JWT
      const hasSupabaseTokenError = typeof token.error === 'string' && token.error.startsWith('Supabase');

      if (token.sbAccessToken && !hasSupabaseTokenError) {
        console.log('[Session] sbAccessToken FOUND on JWT token and no Supabase error. Adding to session.');
        session.sbAccessToken = token.sbAccessToken as string;
      } else if (token.sbAccessToken && hasSupabaseTokenError) {
        console.warn(`[Session] sbAccessToken FOUND on JWT token, but a Supabase error ('${token.error}') exists. NOT adding sbAccessToken to session.`);
        delete session.sbAccessToken; // Ensure it's not there from a previous session state if session object is reused
      } else {
        console.log('[Session] sbAccessToken NOT FOUND on JWT token or a Supabase error is present. sbAccessToken will not be in session.');
        delete session.sbAccessToken; // Ensure it's not there
      }
      
      // NEVER propagate sbRefreshToken to the client-side session for security reasons.
      // The client should never need the refresh token directly.
      delete session.sbRefreshToken;

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
  }
};
