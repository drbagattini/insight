const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCuestionariosSchema() {
  console.log('🔍 Checking cuestionarios table schema\n');

  try {
    // Obtener información de la tabla
    const { data, error } = await supabase
      .from('cuestionarios')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying table:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Table columns found:');
      Object.keys(data[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof data[0][column]}`);
      });
    }

    // Verificar si existe la columna destinatario
    const sampleRecord = data[0];
    const hasDestinatario = 'destinatario' in sampleRecord;
    
    console.log(`\n📋 Column 'destinatario' exists: ${hasDestinatario ? '✅ YES' : '❌ NO'}`);

    if (!hasDestinatario) {
      console.log('\n🔧 Need to add destinatario column to cuestionarios table');
      console.log('This should be done via SQL migration or Supabase dashboard');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkCuestionariosSchema();
