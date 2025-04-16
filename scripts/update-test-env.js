const fs = require('fs');
const path = require('path');

// Crear un archivo de entorno temporal para pruebas
const envContent = `NEXT_PUBLIC_SUPABASE_URL=https://ctrncyswjdvckozsosnv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cm5jeXN3amR2Y2tvenNvc252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MTIwODcsImV4cCI6MjA1OTk4ODA4N30.t0eOvRz2ktJOJpsWDJ95YSADClAxfTMtoAE6mTPS1s0
`;

const tempEnvPath = path.join(__dirname, 'test.env');
fs.writeFileSync(tempEnvPath, envContent, 'utf8');

console.log(`Archivo de entorno temporal creado: ${tempEnvPath}`);
console.log('Contenido:');
console.log(envContent);

// Script para probar las políticas RLS con la clave anónima correcta
const { createClient } = require('@supabase/supabase-js');

// Usar las variables del archivo temporal
const supabaseUrl = 'https://ctrncyswjdvckozsosnv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0cm5jeXN3amR2Y2tvenNvc252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0MTIwODcsImV4cCI6MjA1OTk4ODA4N30.t0eOvRz2ktJOJpsWDJ95YSADClAxfTMtoAE6mTPS1s0';

// Crear cliente de Supabase con la clave anónima correcta
const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

async function testRLSPolicies() {
  try {
    console.log('\n===== Pruebas de políticas RLS con clave anónima correcta =====');
    
    // 1. Probar lectura anónima
    console.log('\n1. Probando lectura anónima...');
    const { data: readData, error: readError } = await anonClient
      .from('users')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.log(`❌ Error de lectura: ${readError.message}`);
    } else {
      console.log(`✅ Lectura exitosa: ${readData.length} registros obtenidos`);
    }
    
    // 2. Probar inserción de paciente
    console.log('\n2. Probando inserción de PACIENTE...');
    const { data: pacienteData, error: pacienteError } = await anonClient
      .from('users')
      .insert({
        email: `test.paciente.${Date.now()}@example.com`,
        password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
        role: 'paciente',
        first_name: 'Test',
        last_name: 'Paciente',
        is_active: true
      })
      .select();
    
    if (pacienteError) {
      console.log(`❌ Error al insertar paciente: ${pacienteError.message}`);
      console.log(`   Código: ${pacienteError.code}`);
      console.log(`   Detalles: ${pacienteError.details || 'No hay detalles'}`);
    } else {
      console.log(`✅ Paciente insertado correctamente: ${pacienteData[0].email}`);
    }
    
    // 3. Probar inserción de psicólogo
    console.log('\n3. Probando inserción de PSICÓLOGO (debe fallar)...');
    const { data: psicologoData, error: psicologoError } = await anonClient
      .from('users')
      .insert({
        email: `test.psicologo.${Date.now()}@example.com`,
        password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
        role: 'psicologo',
        first_name: 'Test',
        last_name: 'Psicologo',
        is_active: true
      })
      .select();
    
    if (psicologoError) {
      if (psicologoError.message.includes('violates row-level security')) {
        console.log(`✅ Error esperado al insertar psicólogo: ${psicologoError.message}`);
      } else {
        console.log(`❓ Error inesperado al insertar psicólogo: ${psicologoError.message}`);
      }
    } else {
      console.log(`❌ Problema: Se permitió insertar un psicólogo cuando debería fallar!`);
    }
    
    console.log('\n===== Recomendaciones =====');
    console.log('1. Si las pruebas siguen fallando, ejecuta el script final-rls-setup.sql en el editor SQL de Supabase.');
    console.log('2. Asegúrate de que el archivo .env.local contenga la clave anónima correcta.');
    console.log('3. Reinicia el servidor de desarrollo después de actualizar el archivo de entorno.');
    
  } catch (error) {
    console.error('Error inesperado:', error);
  }
}

testRLSPolicies();
