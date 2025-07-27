const { createClient } = require('@supabase/supabase-js');

// Leer variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixEntryTypeLength() {
  try {
    console.log('🔍 Problema identificado: entry_type VARCHAR(20) es muy corto');
    console.log('📏 sintesis_evolutiva_ia tiene 21 caracteres');
    
    console.log('💡 Necesitas ejecutar estas SQL directamente en el dashboard de Supabase:');
    console.log('');
    console.log('-- 1. Ampliar la columna entry_type');
    console.log('ALTER TABLE public.evolucion_clinica ALTER COLUMN entry_type TYPE VARCHAR(30);');
    console.log('');
    console.log('-- 2. Eliminar restricción antigua');
    console.log('ALTER TABLE public.evolucion_clinica DROP CONSTRAINT IF EXISTS evolucion_clinica_entry_type_check;');
    console.log('');
    console.log('-- 3. Agregar nueva restricción');
    console.log(`ALTER TABLE public.evolucion_clinica 
ADD CONSTRAINT evolucion_clinica_entry_type_check 
CHECK (entry_type IN ('clinica', 'supervision', 'sesion', 'paciente', 'sintesis_evolutiva_ia'));`);
    console.log('');
    console.log('🔗 Ve a: https://supabase.com/dashboard/project/[tu-proyecto]/sql');
    console.log('');
    
    // Verificar longitud actual
    console.log('📊 Verificando longitudes de tipos:');
    const types = ['clinica', 'supervision', 'sesion', 'paciente', 'sintesis_evolutiva_ia'];
    types.forEach(type => {
      console.log(`   ${type}: ${type.length} caracteres ${type.length > 20 ? '❌' : '✅'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixEntryTypeLength();
