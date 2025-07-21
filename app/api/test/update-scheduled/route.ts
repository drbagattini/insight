import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { computeNextDate } from "@/app/lib/utils/cuestionarios";

export async function POST(req: NextRequest) {
  console.log('🔧 Testing scheduled sends update logic...');
  
  // Obtener los envíos programados recientes que deberían actualizarse
  const { data: schedules, error: fetchError } = await supabaseAdmin
    .from('envios_programados')
    .select('*')
    .order('creado_en', { ascending: false })
    .limit(3);

  if (fetchError) {
    console.error('❌ Error fetching schedules:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!schedules || schedules.length === 0) {
    return NextResponse.json({ error: 'No schedules found' }, { status: 404 });
  }

  console.log(`📋 Found ${schedules.length} schedules to test`);
  
  const results = [];
  
  for (const job of schedules) {
    console.log(`\n🔄 Processing job ${job.id.substring(0, 8)}... (${job.frecuencia})`);
    
    try {
      if (job.frecuencia === 'unico') {
        console.log('   → Marking as inactive (unique send)');
        
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('envios_programados')
          .update({ 
            activo: false, 
            proximo_envio: null,
            actualizado_en: new Date().toISOString()
          })
          .eq('id', job.id)
          .select('id, activo, proximo_envio, actualizado_en');
          
        if (updateError) {
          console.error(`   ❌ Update error:`, updateError);
          results.push({ 
            id: job.id, 
            status: 'error', 
            error: updateError.message 
          });
        } else {
          console.log(`   ✅ Updated successfully:`, updateData);
          results.push({ 
            id: job.id, 
            status: 'success', 
            type: 'deactivated',
            data: updateData 
          });
        }
        
      } else {
        // Recurrente - calcular próxima fecha
        const nextProximoEnvio = computeNextDate(job.proximo_envio, job.frecuencia);
        console.log(`   → Next send date calculated: ${nextProximoEnvio}`);
        
        if (!nextProximoEnvio) {
          console.error(`   ❌ Could not compute next date for frequency: ${job.frecuencia}`);
          
          const { data: updateData, error: updateError } = await supabaseAdmin
            .from('envios_programados')
            .update({ 
              activo: false,
              actualizado_en: new Date().toISOString()
            })
            .eq('id', job.id)
            .select('id, activo, actualizado_en');
            
          results.push({ 
            id: job.id, 
            status: 'error', 
            error: 'Could not compute next date',
            data: updateData 
          });
          continue;
        }
        
        const { data: updateData, error: updateError } = await supabaseAdmin
          .from('envios_programados')
          .update({ 
            proximo_envio: nextProximoEnvio,
            actualizado_en: new Date().toISOString()
          })
          .eq('id', job.id)
          .select('id, proximo_envio, actualizado_en');
          
        if (updateError) {
          console.error(`   ❌ Update error:`, updateError);
          results.push({ 
            id: job.id, 
            status: 'error', 
            error: updateError.message 
          });
        } else {
          console.log(`   ✅ Updated successfully:`, updateData);
          results.push({ 
            id: job.id, 
            status: 'success', 
            type: 'rescheduled',
            nextSend: nextProximoEnvio,
            data: updateData 
          });
        }
      }
      
    } catch (e) {
      console.error(`   ❌ Exception processing job ${job.id}:`, e);
      results.push({ 
        id: job.id, 
        status: 'exception', 
        error: e instanceof Error ? e.message : String(e) 
      });
    }
  }
  
  return NextResponse.json({
    success: true,
    processed: results.length,
    results: results
  });
}
