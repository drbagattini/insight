const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createEvolucionClinicaTable() {
  try {
    console.log('🚀 Creando tabla evolucion_clinica...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'sql', 'create_evolucion_clinica_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar el SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      process.exit(1);
    }
    
    console.log('✅ Tabla evolucion_clinica creada exitosamente');
    
    // Verificar que la tabla fue creada
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'evolucion_clinica');
    
    if (tablesError) {
      console.error('❌ Error verificando tabla:', tablesError);
    } else if (tables && tables.length > 0) {
      console.log('✅ Verificación exitosa: tabla evolucion_clinica existe');
    } else {
      console.log('⚠️  Advertencia: no se pudo verificar la existencia de la tabla');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Función alternativa usando SQL directo
async function createTableDirectly() {
  try {
    console.log('🚀 Creando tabla evolucion_clinica directamente...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Tabla para el módulo de Evolución Clínica
        CREATE TABLE IF NOT EXISTS public.evolucion_clinica (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            paciente_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
            author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('clinica', 'supervision', 'sesion', 'paciente')),
            content TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            tags TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Índices para optimizar consultas
        CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_paciente_id ON public.evolucion_clinica(paciente_id);
        CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_author_id ON public.evolucion_clinica(author_id);
        CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_entry_type ON public.evolucion_clinica(entry_type);
        CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_created_at ON public.evolucion_clinica(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_tags ON public.evolucion_clinica USING GIN(tags);
        CREATE INDEX IF NOT EXISTS idx_evolucion_clinica_metadata ON public.evolucion_clinica USING GIN(metadata);

        -- Trigger para actualizar updated_at automáticamente
        CREATE OR REPLACE FUNCTION update_evolucion_clinica_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trigger_update_evolucion_clinica_updated_at
            BEFORE UPDATE ON public.evolucion_clinica
            FOR EACH ROW
            EXECUTE FUNCTION update_evolucion_clinica_updated_at();
      `
    });
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error);
      process.exit(1);
    }
    
    console.log('✅ Tabla evolucion_clinica creada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Intentar primero con el archivo, luego directamente
createEvolucionClinicaTable().catch(() => {
  console.log('🔄 Intentando método alternativo...');
  createTableDirectly();
});
