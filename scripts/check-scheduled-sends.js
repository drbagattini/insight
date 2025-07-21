import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno requeridas no encontradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkScheduledSends() {
  console.log('🔍 Consultando envíos programados...\n');
  
  const { data, error } = await supabase
    .from('envios_programados')
    .select('*')
    .order('creado_en', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📊 Total de envíos programados: ${data.length}\n`);
  
  if (data.length === 0) {
    console.log('ℹ️  No hay envíos programados en la base de datos');
    return;
  }

  const now = new Date();
  
  data.forEach((envio, index) => {
    const proximoEnvio = new Date(envio.proximo_envio);
    const vencido = proximoEnvio <= now;
    const estado = envio.activo ? (vencido ? '🔴 VENCIDO' : '🟡 PENDIENTE') : '⚫ INACTIVO';
    
    console.log(`${index + 1}. ID: ${envio.id}`);
    console.log(`   Estado: ${estado}`);
    console.log(`   Paciente: ${envio.paciente_id}`);
    console.log(`   Cuestionario: ${envio.cuestionario_id}`);
    console.log(`   Frecuencia: ${envio.frecuencia}`);
    console.log(`   Próximo envío: ${envio.proximo_envio} (${vencido ? 'vencido' : 'pendiente'})`);
    console.log(`   Activo: ${envio.activo}`);
    console.log(`   Canal: ${envio.canal}`);
    console.log(`   Creado: ${envio.creado_en}`);
    console.log('');
  });
  
  const vencidos = data.filter(e => e.activo && new Date(e.proximo_envio) <= now);
  console.log(`🎯 Envíos que deberían procesarse: ${vencidos.length}`);
}

checkScheduledSends();
