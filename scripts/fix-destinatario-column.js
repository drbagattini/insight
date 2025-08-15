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
    // Agregar la columna destinatario
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE envios_programados 
        ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT 'paciente';
        
        COMMENT ON COLUMN envios_programados.destinatario IS 'Destinatario del cuestionario: paciente o padre_tutor';
      `
    });

    if (error) {
      console.error('❌ Error adding column:', error);
      return false;
    }

    console.log('✅ Column added successfully');
    
    // Verificar que la columna existe
    const { data: columns, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, column_default, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'envios_programados' 
        AND column_name = 'destinatario';
      `
    });

    if (checkError) {
      console.error('❌ Error checking column:', checkError);
      return false;
    }

    if (columns && columns.length > 0) {
      console.log('✅ Column verification successful:', columns[0]);
      return true;
    } else {
      console.log('⚠️ Column not found after creation');
      return false;
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Ejecutar el script
addDestinatarioColumn()
  .then(success => {
    if (success) {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Migration failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
