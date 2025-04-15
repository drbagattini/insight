import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Crea un cliente Supabase con la configuración óptima para RLS
 * 
 * Esta función centraliza la creación de clientes Supabase con la configuración
 * que se ha comprobado que funciona correctamente con las políticas RLS.
 * 
 * @returns Una instancia del cliente Supabase configurada correctamente
 */
export function createSupabaseClient(): SupabaseClient {
  // Verificar entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Error: Variables de entorno Supabase no disponibles');
  }
  
  // Configuración simplificada que funciona correctamente con políticas RLS
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
      // IMPORTANTE: No incluir detectSessionInUrl para evitar problemas con RLS
    }
  });
}

/**
 * Verifica si un error de Supabase está relacionado con políticas RLS
 * 
 * @param error Error devuelto por una operación de Supabase
 * @returns true si el error está relacionado con políticas RLS
 */
export function isRLSError(error: any): boolean {
  return !!error && 
    (error.code === '42501' || 
     (typeof error.message === 'string' && 
      error.message.toLowerCase().includes('row-level security')));
}
