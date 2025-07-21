#!/usr/bin/env node

/**
 * Test new respondido logic for recurrent questionnaires
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testNewLogic() {
  console.log('🧪 PROBANDO NUEVA LÓGICA DE ESTADO\n');
  
  // Simular la nueva lógica para un envío
  const schedules = await supabase
    .from('envios_programados')
    .select('*')
    .limit(2);
    
  if (!schedules.data || schedules.data.length === 0) {
    console.log('No hay envíos programados para probar');
    return;
  }
  
  for (const send of schedules.data) {
    console.log(`\n📋 Probando envío: ${send.id.substring(0, 8)}...`);
    console.log(`Frecuencia: ${send.frecuencia}`);
    console.log(`Activo: ${send.activo}`);
    
    let respondido = false;
    let lastSent = null;
    
    if (send.frecuencia !== 'unico') {
      console.log('Es recurrente, buscando links específicos...');
      
      // Buscar links para este envío
      const { data: links } = await supabase
        .from('links_cuestionario')
        .select('token, creado_en')
        .eq('envio_programado_id', send.id)
        .order('creado_en', { ascending: false })
        .limit(1);
        
      console.log(`Links encontrados: ${links?.length || 0}`);
      
      if (links && links.length > 0) {
        const latestLink = links[0];
        lastSent = latestLink.creado_en;
        console.log(`Último link: ${latestLink.token} (${new Date(lastSent).toLocaleString()})`);
        
        // Buscar respuestas para este link específico
        const { data: responses } = await supabase
          .from('respuestas')
          .select('enviado_en')
          .eq('link_token', latestLink.token)
          .limit(1);
          
        console.log(`Respuestas para este link: ${responses?.length || 0}`);
        
        if (responses && responses.length > 0) {
          respondido = true;
          console.log('✅ RESPONDIDO para este ciclo específico');
        } else {
          console.log('❌ NO RESPONDIDO para este ciclo');
        }
      } else {
        console.log('No hay links generados aún');
      }
    } else {
      console.log('Es envío único, usando lógica anterior...');
      
      const { data: respList } = await supabase
        .from('respuestas')
        .select('enviado_en')
        .eq('paciente_id', send.paciente_id)
        .eq('cuestionario_id', send.cuestionario_id)
        .order('enviado_en', { ascending: false })
        .limit(1);
        
      if (respList && respList.length > 0) {
        lastSent = respList[0].enviado_en;
        respondido = true;
        console.log('✅ RESPONDIDO (envío único)');
      } else {
        console.log('❌ NO RESPONDIDO (envío único)');
      }
    }
    
    console.log(`\n🎯 RESULTADO:`);
    console.log(`Estado: ${respondido ? '🟢 RESPONDIDO' : '🟡 PENDIENTE'}`);
    console.log(`Último envío: ${lastSent ? new Date(lastSent).toLocaleString() : 'N/A'}`);
    console.log('---');
  }
}

testNewLogic().catch(console.error);
