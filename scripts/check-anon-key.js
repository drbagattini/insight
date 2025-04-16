// Este script verificará la configuración actual de la clave anónima
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Intentar leer el archivo .env.local
let envContent = '';
try {
  envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  console.log('✅ Archivo .env.local encontrado');
} catch (error) {
  console.log('❌ No se pudo leer .env.local:', error.message);
}

// Extraer variables de entorno del archivo
const envVars = {};
if (envContent) {
  const lines = envContent.split('\n');
  lines.forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    }
  });
  
  console.log('Variables en .env.local:');
  Object.keys(envVars).forEach(key => {
    // Mostrar solo los primeros 15 caracteres de las claves por seguridad
    const value = envVars[key];
    const displayValue = value.length > 15 ? value.substring(0, 15) + '...' : value;
    console.log(`- ${key}: ${displayValue}`);
  });
}

// Verificar la clave anónima
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
if (anonKey) {
  try {
    const tokenParts = anonKey.split('.');
    if (tokenParts.length === 3) {
      // Decodificar la parte de payload (segunda parte) del JWT
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('\nJWT payload decodificado:');
      console.log(payload);
      
      if (payload.role === 'anon') {
        console.log('\n✅ La clave tiene el rol "anon" correcto');
      } else {
        console.log(`\n❌ La clave tiene rol "${payload.role}", pero debería ser "anon"`);
      }
    } else {
      console.log('\n❌ La clave no parece ser un JWT válido');
    }
  } catch (error) {
    console.log('\n❌ Error al analizar la clave:', error.message);
  }
} else {
  console.log('\n❌ No se encontró NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
}

// Probar la conexión
console.log('\nProbando conexión a Supabase...');
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && anonKey) {
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Intentar una operación simple
  async function testConnection() {
    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      
      if (error) {
        console.log(`\n❌ Error al conectar: ${error.message}`);
        console.log(`   Código: ${error.code}`);
        console.log(`   Detalles: ${error.details || 'No hay detalles'}`);
      } else {
        console.log(`\n✅ Conexión exitosa: ${data.length} registros obtenidos`);
      }
      
      // Probar inserción de paciente
      console.log('\nProbando inserción de paciente con clave anónima...');
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert({
          email: `test.paciente.${Date.now()}@example.com`,
          password_hash: '$2a$10$xZtcf6LWLD6xRoIgTXpqUO0FdqPHyI.KSNT.YrJUn5NAWMnr2.SK6',
          role: 'paciente',
          first_name: 'Test',
          last_name: 'Paciente',
          is_active: true
        });
      
      if (insertError) {
        console.log(`\n❌ Error al insertar paciente: ${insertError.message}`);
        console.log(`   Código: ${insertError.code}`);
        console.log(`   Detalles: ${insertError.details || 'No hay detalles'}`);
      } else {
        console.log(`\n✅ Paciente insertado correctamente`);
      }
    } catch (e) {
      console.log(`\n❌ Error inesperado: ${e.message}`);
    }
  }
  
  testConnection();
} else {
  console.log('\n❌ Faltan datos de conexión a Supabase');
}
