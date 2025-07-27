const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  try {
    console.log('🚀 Verificando si la tabla evolucion_clinica ya existe...');
    
    // Intentar hacer una consulta simple para ver si la tabla existe
    const { data, error } = await supabase
      .from('evolucion_clinica')
      .select('id')
      .limit(1);
    
    if (!error) {
      console.log('✅ La tabla evolucion_clinica ya existe');
      return;
    }
    
    console.log('📝 La tabla no existe, necesita ser creada manualmente en Supabase');
    console.log('');
    console.log('Por favor, ejecuta el siguiente SQL en el SQL Editor de Supabase:');
    console.log('');
    console.log('-- Tabla para el módulo de Evolución Clínica');
    console.log('CREATE TABLE IF NOT EXISTS public.evolucion_clinica (');
    console.log('    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,');
    console.log('    paciente_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,');
    console.log('    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,');
    console.log('    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN (\'clinica\', \'supervision\', \'sesion\', \'paciente\')),');
    console.log('    content TEXT NOT NULL,');
    console.log('    metadata JSONB DEFAULT \'{}\',');
    console.log('    tags TEXT[] DEFAULT \'{}\',');
    console.log('    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
    console.log('    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
    console.log(');');
    console.log('');
    console.log('-- Índices para optimizar consultas');
    console.log('CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_paciente_id ON public.evolucion_clinica(paciente_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_author_id ON public.evolucion_clinica(author_id);');
    console.log('CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_entry_type ON public.evolucion_clinica(entry_type);');
    console.log('CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_created_at ON public.evolucion_clinica(created_at DESC);');
    console.log('CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_tags ON public.evolucion_clinica USING GIN(tags);');
    console.log('CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_metadata ON public.evolucion_clinica USING GIN(metadata);');
    console.log('');
    console.log('-- Trigger para actualizar updated_at automáticamente');
    console.log('CREATE OR REPLACE FUNCTION update_evolucion_clinica_updated_at()');
    console.log('RETURNS TRIGGER AS $$');
    console.log('BEGIN');
    console.log('    NEW.updated_at = NOW();');
    console.log('    RETURN NEW;');
    console.log('END;');
    console.log('$$ LANGUAGE plpgsql;');
    console.log('');
    console.log('CREATE TRIGGER trigger_update_evolucion_clinica_updated_at');
    console.log('    BEFORE UPDATE ON public.evolucion_clinica');
    console.log('    FOR EACH ROW');
    console.log('    EXECUTE FUNCTION update_evolucion_clinica_updated_at();');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTable();
