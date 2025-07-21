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

async function createFreshTestData() {
  console.log('🔄 Creando datos de prueba frescos...\n');
  
  // 1. Limpiar datos anteriores
  const { error: deleteError } = await supabase
    .from('envios_programados')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Eliminar todos
    
  if (deleteError) {
    console.error('❌ Error eliminando datos anteriores:', deleteError);
  } else {
    console.log('✅ Datos anteriores eliminados');
  }
  
  // 2. Crear envíos con fechas claramente vencidas
  const now = new Date();
  const hace1Hora = new Date(now.getTime() - 1 * 60 * 60 * 1000); // Hace 1 hora
  const hace2Horas = new Date(now.getTime() - 2 * 60 * 60 * 1000); // Hace 2 horas
  const hace3Horas = new Date(now.getTime() - 3 * 60 * 60 * 1000); // Hace 3 horas
  
  const testData = [
    {
      paciente_id: '20856aa1-f69f-414a-943a-17989809e12b', // Nicolas Bagattini
      cuestionario_id: '6630e0b4-9ae2-4f0d-932c-e649dadead81', // WHO-5
      frecuencia: 'semanal',
      proximo_envio: hace3Horas.toISOString(),
      canal: 'email',
      activo: true
    },
    {
      paciente_id: '20856aa1-f69f-414a-943a-17989809e12b', // Nicolas Bagattini
      cuestionario_id: '6630e0b4-9ae2-4f0d-932c-e649dadead81', // WHO-5
      frecuencia: 'mensual',
      proximo_envio: hace2Horas.toISOString(),
      canal: 'email', // Cambio a email para evitar problemas con WhatsApp
      activo: true
    },
    {
      paciente_id: '20856aa1-f69f-414a-943a-17989809e12b', // Nicolas Bagattini
      cuestionario_id: '6630e0b4-9ae2-4f0d-932c-e649dadead81', // WHO-5
      frecuencia: 'unico',
      proximo_envio: hace1Hora.toISOString(),
      canal: 'email',
      activo: true
    }
  ];
  
  console.log('📅 Fechas de prueba:');
  console.log(`   Hace 3 horas: ${hace3Horas.toISOString()}`);
  console.log(`   Hace 2 horas: ${hace2Horas.toISOString()}`);
  console.log(`   Hace 1 hora: ${hace1Hora.toISOString()}`);
  console.log(`   Ahora: ${now.toISOString()}\n`);
  
  // 3. Insertar datos de prueba
  const { data: insertedData, error: insertError } = await supabase
    .from('envios_programados')
    .insert(testData)
    .select('id, paciente_id, cuestionario_id, frecuencia, proximo_envio, canal');
    
  if (insertError) {
    console.error('❌ Error insertando datos:', insertError);
    return;
  }
  
  console.log(`✅ ${insertedData.length} envíos programados creados:\n`);
  
  insertedData.forEach((envio, index) => {
    console.log(`${index + 1}. ID: ${envio.id.substring(0, 8)}...`);
    console.log(`   Frecuencia: ${envio.frecuencia}`);
    console.log(`   Próximo envío: ${envio.proximo_envio}`);
    console.log(`   Canal: ${envio.canal}`);
    console.log('');
  });
  
  console.log('🎯 Los 3 envíos están vencidos y listos para ser procesados');
}

createFreshTestData();
