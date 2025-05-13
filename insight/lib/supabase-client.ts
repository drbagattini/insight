import { createClient } from '@supabase/supabase-js';
import { User, UserCreateInput } from '@/types/user';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function logSupabaseError(error: any, context: string) {
  const errorDetails = {
    message: error?.message || 'No message provided',
    details: error?.details || 'No details provided',
    hint: error?.hint || 'No hint provided',
    code: error?.code || 'No code provided',
    status: error?.status,
    statusText: error?.statusText,
    data: error?.data,
    rawError: error,
  };

  console.error(`Supabase error in ${context}:`, errorDetails);
  return errorDetails;
}

// Funciones de usuario
export async function createUser(userData: Omit<UserCreateInput, 'password_hash'> & { password?: string }) {
  try {
    console.log('Attempting to create user with data:', {
      ...userData,
      password_hash: '[REDACTED]'
    });

    console.log('Client: Preparing registration request...');
    console.log('Client: Window location:', window.location.href);
    const baseUrl = window.location.origin;
    console.log('Client: Base URL:', baseUrl);
    const apiUrl = `/api/auth/register`;  // Usando ruta relativa y la nueva API
    console.log('Client: Full API URL:', apiUrl);
    console.log('Client: Request data:', { ...userData, password_hash: '[REDACTED]' });

    try {
      console.log('Client: Executing fetch with POST to:', apiUrl);

      const response = await fetch(apiUrl, {
        cache: 'no-store',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
        mode: 'cors',
      });

      console.log('Client: Response received');
      console.log('Client: Response URL:', response.url);
      console.log('Client: Response type:', response.type);
      console.log('Client: Response status:', response.status);
      console.log('Client: Response status text:', response.statusText);
      console.log('Client: Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (result.userId) {
        console.log('User created successfully via API:', { userId: result.userId });
        return { user: { id: result.userId }, error: null }; 
      } else {
        console.warn('API response OK but missing userId:', result);
        throw new Error('Respuesta inesperada del servidor durante el registro.');
      }

    } catch (innerErr) {
      console.error('Error in createUser function:', innerErr);
      return { user: null, error: innerErr instanceof Error ? innerErr.message : String(innerErr) };
    }
  } catch (err) {
    console.error('Error in createUser:', err);
    return { 
      user: null, 
      error: err instanceof Error ? err : new Error('Error desconocido al crear usuario')
    };
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      const errorDetails = logSupabaseError(error, 'updateUser');
      throw new Error(`Error updating user: ${errorDetails.message}`);
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error in updateUser:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err : new Error('Unknown error in user update')
    };
  }
}

// Función para verificar si un email ya está registrado
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      const errorDetails = logSupabaseError(error, 'checkEmailExists');
      throw new Error(`Error checking email: ${errorDetails.message}`);
    }

    return !!data;
  } catch (err) {
    console.error('Unexpected error in checkEmailExists:', err);
    throw err;
  }
}

// Función para hashear contraseñas de forma segura
export async function hashPassword(password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (err) {
    console.error('Error hashing password:', err);
    throw new Error('Error al procesar la contraseña');
  }
}

// Función de ayuda para verificar la conexión
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Error al conectar con Supabase:', error);
      return { connected: false, error: error.message };
    }
    
    return { connected: true, error: null };
  } catch (err) {
    console.error('Error al verificar conexión Supabase:', err);
    return { 
      connected: false, 
      error: err instanceof Error ? err.message : 'Error desconocido'
    };
  }
}
