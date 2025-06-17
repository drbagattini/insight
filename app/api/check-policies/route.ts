import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Verificar el estado de las políticas RLS con un cliente service key (solo para diagnóstico)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

export async function GET() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Faltan variables de entorno',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }
    
    // Usar service key para este diagnóstico específico (solo desde el servidor)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });
    
    // 1. Verificar si RLS está habilitado
    const { data: rlsData, error: rlsError } = await supabase.rpc('check_rls_enabled', {
      table_name: 'users'
    });
    
    if (rlsError) {
      // Si la función RPC no existe, intentar directamente con SQL
      const sqlQuery = `
        SELECT relname as table_name, relrowsecurity as rls_enabled
        FROM pg_class
        WHERE oid = 'public.users'::regclass;
      `;
      
      const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', {
        sql: sqlQuery
      });
      
      if (sqlError) {
        return NextResponse.json({
          error: 'No se pudo verificar RLS',
          details: sqlError.message,
          recommendedAction: 'Ejecutar SQL directo en Supabase'
        }, { status: 500 });
      }
      
      // 2. Verificar políticas existentes
      const policyQuery = `
        SELECT policyname, cmd, roles, qual, with_check
        FROM pg_policies
        WHERE tablename = 'users';
      `;
      
      const { data: policyData, error: policyError } = await supabase.rpc('execute_sql', {
        sql: policyQuery
      });
      
      if (policyError) {
        return NextResponse.json({
          rls: sqlData,
          error: 'No se pudieron obtener políticas',
          details: policyError.message
        }, { status: 500 });
      }
      
      return NextResponse.json({
        rls: sqlData,
        policies: policyData
      });
    }
    
    // Si la función RPC personalizada funcionó
    return NextResponse.json({
      rls: rlsData,
      message: 'Verificación exitosa con función RPC'
    });
    
  } catch (error) {
    return NextResponse.json({
      error: 'Error inesperado al verificar políticas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
