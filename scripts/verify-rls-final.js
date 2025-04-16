const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ctrncyswjdvckozsosnv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cm5jeXN3amR2Y2tvenNvc252Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQxMjA4NywiZXhwIjoyMDU5OTg4MDg3fQ.NkS4I4IOE_8V4PHmpuBAEydJ6zMntw0ceALdDvXPkHM';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function verifyRLSConfiguration() {
  try {
    console.log('\n===== Verificando políticas RLS =====');
    
    // 1. Verificar políticas existentes
    const { data: policies, error: policiesError } = await supabase
      .from('pg_tables_and_policies')
      .select('*')
      .eq('tablename', 'users');
    
    if (policiesError) throw new Error(`Error consultando políticas: ${policiesError.message}`);
    
    console.log('\n📋 Políticas actuales en tabla users:');
    policies.forEach(policy => {
      console.log(`- ${policy.policyname}: ${policy.cmd} para ${policy.roles.join(', ')}`);
      console.log(`  USING: ${policy.qual}`);
      if (policy.with_check) console.log(`  WITH CHECK: ${policy.with_check}`);
      console.log(''); // línea en blanco para mejor legibilidad
    });
    
    // 2. Verificar constraint de roles
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.check_constraints')
      .select('*')
      .eq('constraint_name', 'users_role_check');
    
    if (constraintsError) throw new Error(`Error consultando constraints: ${constraintsError.message}`);
    
    console.log('\n🔒 Constraint de roles:');
    if (constraints && constraints.length > 0) {
      constraints.forEach(constraint => {
        console.log(`- ${constraint.constraint_name}: ${constraint.check_clause}`);
      });
    } else {
      console.log('❌ No se encontró constraint de roles!');
    }
    
    // 3. Ejecutar pruebas básicas
    console.log('\n===== Pruebas básicas de inserción =====');
    
    // 3.1 Insertar como anónimo (debería permitir paciente pero no psicologo)
    const anonClient = createClient(supabaseUrl, supabaseUrl, {
      auth: { persistSession: false }
    });
    
    const testEmail = `test.${Date.now()}@example.com`;
    
    // Probar inserción de paciente anónimo
    const { data: pacienteInsert, error: pacienteError } = await anonClient
      .from('users')
      .insert({
        email: `paciente.${testEmail}`,
        password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
        role: 'paciente',
        first_name: 'Test',
        last_name: 'Paciente'
      })
      .select();
    
    console.log('\n📝 Inserción de paciente anónimo:');
    if (pacienteError) {
      console.log(`❌ Error: ${pacienteError.message}`);
    } else {
      console.log('✅ Éxito')
    }
    
    // Probar inserción de psicologo anónimo (debe fallar)
    const { data: psicologoInsert, error: psicologoError } = await anonClient
      .from('users')
      .insert({
        email: `psicologo.${testEmail}`,
        password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
        role: 'psicologo',
        first_name: 'Test',
        last_name: 'Psicologo'
      })
      .select();
    
    console.log('\n📝 Inserción de psicólogo anónimo:');
    if (psicologoError) {
      console.log(`✅ Error esperado: ${psicologoError.message}`);
    } else {
      console.log('❌ Problema: Se permitió la inserción cuando debería fallar!')
    }
    
    console.log('\n💡 Nota: Para pruebas completas desde el frontend, sigue las instrucciones del plan');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyRLSConfiguration();
