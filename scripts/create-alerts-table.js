const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAlertsTable() {
  console.log('🔧 Creating alertas_clinicas table...');

  try {
    // Create the table using direct SQL query
    const { data, error } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);

    // Since we can't execute raw SQL easily, let's try inserting a dummy record to trigger table creation
    // This won't work, but let's check if we can create via API endpoint instead
    
    console.log('❌ Cannot create table directly via Supabase client');
    console.log('ℹ️  Table needs to be created via Supabase dashboard or direct SQL connection');
    console.log('');
    console.log('SQL to run in Supabase dashboard:');
    console.log('');
    console.log(`
CREATE TABLE IF NOT EXISTS public.alertas_clinicas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    paciente_id UUID NOT NULL,
    respuesta_id UUID,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('tdah', 'sustancias', 'autolesion')),
    severidad VARCHAR(20) NOT NULL CHECK (severidad IN ('warning', 'danger')),
    mensaje TEXT NOT NULL,
    evidencia JSONB,
    recomendaciones JSONB,
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_paciente_id ON public.alertas_clinicas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_respuesta_id ON public.alertas_clinicas(respuesta_id);
CREATE INDEX IF NOT EXISTS idx_alertas_clinicas_tipo ON public.alertas_clinicas(tipo);

-- Enable RLS
ALTER TABLE public.alertas_clinicas ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.alertas_clinicas TO authenticated;
GRANT ALL ON public.alertas_clinicas TO service_role;
    `);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createAlertsTable();
