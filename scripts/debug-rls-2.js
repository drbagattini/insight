const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ctrncyswjdvckozsosnv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cm5jeXN3amR2Y2tvenNvc252Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxMjA4NywiZXhwIjoyMDU5OTg4MDg3fQ.NkS4I4IOE_8V4PHmpuBAEydJ6zMntw0ceALdDvXPkHM';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function debugRLS() {
  try {
    // 1. Verificar si RLS está habilitado
    console.log('1. Verificando si RLS está habilitado para la tabla users...');
    
    const { data: rls, error: rlsError } = await supabase
      .from('pg_class')
      .select('relname, relrowsecurity')
      .eq('relname', 'users')
      .maybeSingle();
    
    if (rlsError) {
      console.log('Error consultando estado RLS:', rlsError.message);
      
      // Intentar con SQL directo
      const { data: sqlData, error: sqlError } = await supabase.rpc('pg_execute', {
        sql: "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'users'"
      });
      
      if (sqlError) {
        console.error('Error ejecutando SQL:', sqlError.message);
      } else {
        console.log('Estado RLS:', sqlData);
      }
    } else {
      console.log('Estado RLS:', rls);
    }

    // 2. Listar políticas existentes
    console.log('\n2. Consultando políticas existentes...');
    const { data: policyData, error: policyError } = await supabase.rpc('pg_execute', {
      sql: "SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'users'"
    });
    
    if (policyError) {
      console.error('Error consultando políticas:', policyError.message);
      
      // Verificar si la función existe
      console.log('\nIntentando verificar si pg_execute existe...');
      const { data: funcData, error: funcError } = await supabase.rpc('pg_execute', {
        sql: "SELECT proname FROM pg_proc WHERE proname = 'pg_execute'"
      });
      
      if (funcError) {
        console.error('Error consultando funciones:', funcError.message);
      } else {
        console.log('Funciones encontradas:', funcData);
      }
    } else {
      console.log('Políticas existentes:');
      console.table(policyData);
    }
    
    // 3. Verificar constraint de roles
    console.log('\n3. Verificando constraint de roles...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('role')
      .limit(1);
    
    if (usersError) {
      console.error('Error consultando tabla users:', usersError.message);
    } else {
      console.log('Datos de users:', usersData);
      
      // Intentar inserción con service key
      console.log('\nProbando inserción con SERVICE KEY...');
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          email: `service.test.${Date.now()}@example.com`,
          password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
          role: 'paciente',
          first_name: 'Service',
          last_name: 'Test',
          is_active: true
        })
        .select();
      
      if (insertError) {
        console.error('Error insertando con service key:', insertError.message);
      } else {
        console.log('Inserción con service key exitosa:', insertData);
      }
    }
    
    console.log('\n===== RECOMENDACIÓN FINAL =====');
    console.log('Ejecuta el siguiente comando SQL DIRECTAMENTE en el editor SQL de Supabase:');
    console.log('\nALTER TABLE public.users DISABLE ROW LEVEL SECURITY;');
    console.log('\nLuego ejecuta el script final-rls-setup.sql completo y vuelve a probar.');
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

debugRLS();
