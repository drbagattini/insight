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
    console.log('\n===== Verificando configuración RLS =====');
    
    // Ejecutar SQL directamente para verificar políticas
    const { data: policies, error: policiesError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (policiesError) {
      console.error('Error accediendo a la tabla users:', policiesError.message);
    } else {
      console.log('✅ Conexión exitosa a la tabla users');
    }
    
    // Pruebas de inserción desde cliente anónimo
    console.log('\n===== Pruebas de inserción anónima =====');
    
    // Cliente anónimo (con clave anónima)
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseUrl.split('.')[0].split('://')[1];
    const anonClient = createClient(supabaseUrl, anonKey);
    
    const testTime = Date.now();
    
    // Probar inserción de paciente anónimo
    console.log('\n📝 Prueba: inserción de PACIENTE con cliente anónimo');
    const { data: pacienteInsert, error: pacienteError } = await anonClient
      .from('users')
      .insert({
        email: `test.paciente.${testTime}@example.com`,
        password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
        role: 'paciente',
        first_name: 'Test',
        last_name: 'Paciente',
        is_active: true
      })
      .select();
    
    if (pacienteError) {
      console.log(`❌ Error: ${pacienteError.message}`);
    } else {
      console.log('✅ Éxito - Paciente insertado correctamente');
    }
    
    // Probar inserción de psicólogo anónimo (debe fallar)
    console.log('\n📝 Prueba: inserción de PSICOLOGO con cliente anónimo');
    const { data: psicologoInsert, error: psicologoError } = await anonClient
      .from('users')
      .insert({
        email: `test.psicologo.${testTime}@example.com`,
        password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
        role: 'psicologo',
        first_name: 'Test',
        last_name: 'Psicologo',
        is_active: true
      })
      .select();
    
    if (psicologoError) {
      console.log(`✅ Error esperado: ${psicologoError.message}`);
    } else {
      console.log('❌ Problema: Se permitió insertar psicólogo con cliente anónimo');
    }
    
    console.log('\n===== Resumen =====');
    console.log('• Para pruebas completas desde el frontend:');
    console.log('  1. Verifica inserción anónima: paciente OK, psicólogo Error');
    console.log('  2. Inicia sesión como admin: debe poder crear paciente y psicólogo');
    console.log('  3. Inicia sesión como psicólogo: debe poder ver solo su perfil, no otros');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyRLSConfiguration();
