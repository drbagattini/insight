import { supabase } from './supabaseClient';

/**
 * Crea un nuevo usuario delegando en la API interna `/api/auth/register`.
 * Se hace desde el cliente para reutilizar la validación ya implementada en el backend.
 */
export async function createUser(userData: Record<string, unknown>): Promise<{ user: any | null; error: string | null }> {
  try {
    const response = await fetch('/api/auth/register', {
      cache: 'no-store',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    return { user: result.user ?? null, error: null };
  } catch (err) {
    console.error('userAPI.createUser error:', err);
    return { user: null, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Comprueba si un email ya está registrado en la tabla `users`.
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/register/check', {
      cache: 'no-store',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }
    // API returns available: true if email NOT registered
    return !result.available;
  } catch (err) {
    console.error('userAPI.checkEmailExists error:', err);
    // En caso de fallo al verificar, asumimos que el email no existe y dejamos que createUser maneje duplicados
    return false;
  }
}

/**
 * Realiza una consulta trivial para verificar que la conexión con Supabase funciona.
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}
