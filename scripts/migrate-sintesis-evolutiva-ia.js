const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Leer variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración para agregar tipo sintesis_evolutiva_ia...');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'sql', 'add_sintesis_evolutiva_ia_type.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Dividir en comandos individuales (por punto y coma)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--'));

    for (const command of commands) {
      if (command.trim()) {
        console.log(`📝 Ejecutando: ${command.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          console.error('❌ Error ejecutando comando:', error);
          throw error;
        }
      }
    }

    console.log('✅ Migración completada exitosamente');
    
    // Verificar que funciona
    console.log('🔍 Verificando migración...');
    const { data, error } = await supabase
      .from('evolucion_clinica')
      .select('entry_type')
      .limit(1);
    
    if (error) {
      console.log('⚠️  No se pudo verificar (tabla puede estar vacía):', error.message);
    } else {
      console.log('✅ Verificación exitosa - tabla accesible');
    }

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

runMigration();
