const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ctrncyswjdvckozsosnv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cm5jeXN3amR2Y2tvenNvc252Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxMjA4NywiZXhwIjoyMDU5OTg4MDg3fQ.NkS4I4IOE_8V4PHmpuBAEydJ6zMntw0ceALdDvXPkHM';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function checkRLSConfiguration() {
  try {
    console.log('Verificando configuración de RLS...');
    
    // Verificar si RLS está habilitado
    const { data: rlsStatus, error: rlsError } = await supabase.rpc('pg_get_rls_status', {
      table_name: 'users'
    });
    
    if (rlsError) {
      // Si falla la función RPC personalizada, intentamos una consulta SQL
      console.log('Ejecutando SQL para verificar RLS...');
      
      // Ejecutar consulta SQL personalizada para aplicar el script final-rls-setup.sql
      const sqlScript = `
        -- Primero, verificar el estado actual
        SELECT relname as tabla, relrowsecurity as rls_habilitado
        FROM pg_class
        WHERE oid = 'public.users'::regclass;
        
        -- Listar políticas actuales
        SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
        FROM pg_policies
        WHERE tablename = 'users';
        
        -- Verificar constraint de roles
        SELECT con.conname as constraint_name,
               pg_get_constraintdef(con.oid) as constraint_definition
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'users'
        AND nsp.nspname = 'public'
        AND con.conname = 'users_role_check';
      `;
      
      const { data, error } = await supabase.rpc('pgfunction', {
        query: sqlScript
      });
      
      if (error) {
        console.error('Error consultando configuración RLS:', error.message);
        
        // Intentemos otra aproximación: consulta directa a la tabla
        console.log('\nIntentando verificar permisos de acceso...');
        
        // 1. Verificar si podemos leer usuarios con service key
        const { data: serviceData, error: serviceError } = await supabase
          .from('users')
          .select('*')
          .limit(1);
        
        console.log(`Lectura con service key: ${serviceError ? 'ERROR' : 'OK'}`);
        if (serviceError) console.log(`Error: ${serviceError.message}`);
        
        // 2. Crear cliente anónimo para pruebas
        console.log('\nCreando cliente anónimo para pruebas...');
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        const anonClient = createClient(supabaseUrl, anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cm5jeXN3amR2Y2tvenNvc252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDQyNTYwMDAsImV4cCI6MTk1OTgzMjAwMH0.U5qLGkVvjJKNNMZQzjgk3NujVmpFwZJ9S-ehps7IH6M');
        
        // Probar SELECT anónimo
        const { data: anonData, error: anonError } = await anonClient
          .from('users')
          .select('*')
          .limit(1);
        
        console.log(`Lectura con anon key: ${anonError ? 'ERROR' : 'OK'}`);
        if (anonError) console.log(`Error: ${anonError.message}`);
        
        // Probar INSERT anónimo para paciente
        const { data: insertData, error: insertError } = await anonClient
          .from('users')
          .insert({
            email: `test.patient.${Date.now()}@example.com`,
            password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
            role: 'paciente',
            first_name: 'Test',
            last_name: 'Patient',
            is_active: true
          });
        
        console.log(`Inserción paciente con anon key: ${insertError ? 'ERROR' : 'OK'}`);
        if (insertError) console.log(`Error: ${insertError.message}`);
        
        console.log('\nRecomendación: Es necesario ejecutar el script SQL directamente en el editor SQL de Supabase.');
        console.log('El script final-rls-setup.sql debe ejecutarse manualmente en la interfaz de Supabase.');
        
        return;
      }
      
      console.log('Resultados de la consulta SQL:', data);
    } else {
      console.log('Estado de RLS:', rlsStatus);
    }
  } catch (error) {
    console.error('Error verificando RLS:', error);
  }
}

checkRLSConfiguration();
