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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkScheduledSends() {
  console.log('🔍 Consultando envíos programados con detalles...\n');
  
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
    const creadoEn = new Date(envio.creado_en);
    const actualizadoEn = envio.actualizado_en ? new Date(envio.actualizado_en) : null;
    const vencido = proximoEnvio <= now;
    const estado = envio.activo ? (vencido ? '🔴 VENCIDO' : '🟡 PENDIENTE') : '⚫ INACTIVO';
    
    console.log(`${index + 1}. ID: ${envio.id.substring(0, 8)}...`);
    console.log(`   Estado: ${estado}`);
    console.log(`   Frecuencia: ${envio.frecuencia}`);
    console.log(`   Próximo envío: ${envio.proximo_envio}`);
    console.log(`   Activo: ${envio.activo}`);
    console.log(`   Creado: ${envio.creado_en}`);
    console.log(`   Actualizado: ${envio.actualizado_en || 'nunca'}`);
    
    // Calcular tiempo transcurrido
    if (actualizadoEn) {
      const tiempoDesdeActualizacion = (now - actualizadoEn) / 1000 / 60; // minutos
      console.log(`   Actualizado hace: ${tiempoDesdeActualizacion.toFixed(1)} minutos`);
    }
    
    console.log('');
  });
  
  const vencidos = data.filter(e => e.activo && new Date(e.proximo_envio) <= now);
  const inactivos = data.filter(e => !e.activo);
  const actualizadosRecientemente = data.filter(e => {
    if (!e.actualizado_en) return false;
    const actualizacion = new Date(e.actualizado_en);
    const diferencia = (now - actualizacion) / 1000 / 60; // minutos
    return diferencia < 10; // Actualizados en los últimos 10 minutos
  });
  
  console.log(`🎯 Envíos que deberían procesarse: ${vencidos.length}`);
  console.log(`⚫ Envíos inactivos: ${inactivos.length}`);
  console.log(`🕐 Actualizados recientemente (< 10 min): ${actualizadosRecientemente.length}`);
  
  // Verificar también los links generados recientemente
  console.log('\n🔗 Verificando links de cuestionario recientes...');
  
  const { data: links, error: linksError } = await supabase
    .from('links_cuestionario')
    .select('token, paciente_id, cuestionario_id, creado_en, envio_programado_id')
    .gte('creado_en', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Últimos 10 minutos
    .order('creado_en', { ascending: false });
  
  if (linksError) {
    console.error('❌ Error consultando links:', linksError);
  } else {
    console.log(`📫 Links generados recientemente: ${links?.length || 0}`);
    if (links && links.length > 0) {
      links.forEach((link, index) => {
        console.log(`   ${index + 1}. Token: ${link.token.substring(0, 12)}...`);
        console.log(`      Paciente: ${link.paciente_id.substring(0, 8)}...`);
        console.log(`      Envío programado: ${link.envio_programado_id ? link.envio_programado_id.substring(0, 8) + '...' : 'manual'}`);
        console.log(`      Creado: ${link.creado_en}`);
        console.log('');
      });
    }
  }
}

checkScheduledSends();
