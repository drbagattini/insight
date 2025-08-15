const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addDestinatarioColumn() {
  console.log('🔧 Adding destinatario column to envios_programados table...');
  
  try {
    // Primero verificar si la columna ya existe
    const { data: existingColumns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'envios_programados')
      .eq('column_name', 'destinatario');

    if (existingColumns && existingColumns.length > 0) {
      console.log('✅ Column destinatario already exists');
      return true;
    }

    // Si no existe, intentar agregarla usando una función personalizada
    console.log('🔧 Attempting to add column via direct query...');
    
    // Usar una query directa para agregar la columna
    const { error } = await supabase.rpc('execute_sql', {
      query: 'ALTER TABLE envios_programados ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT \'paciente\''
    });

    if (error && !error.message.includes('already exists')) {
      console.error('❌ Error adding column:', error);
      
      // Intentar método alternativo
      console.log('🔄 Trying alternative method...');
      
      // Verificar estructura actual de la tabla
      const { data: tableInfo, error: infoError } = await supabase
        .from('envios_programados')
        .select('*')
        .limit(1);
      
      if (infoError) {
        console.error('❌ Cannot access table:', infoError);
        return false;
      }
      
      console.log('📋 Current table accessed successfully');
      console.log('⚠️ Manual column addition required in Supabase dashboard');
      console.log('📝 SQL to run manually:');
      console.log('ALTER TABLE envios_programados ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT \'paciente\';');
      
      return false;
    }

    console.log('✅ Column added successfully');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('📝 Manual SQL to run in Supabase:');
    console.log('ALTER TABLE envios_programados ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT \'paciente\';');
    return false;
  }
}

// Ejecutar el script
addDestinatarioColumn()
  .then(success => {
    if (success) {
      console.log('🎉 Migration completed successfully');
    } else {
      console.log('⚠️ Manual intervention required');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
