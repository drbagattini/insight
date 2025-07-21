import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { computeNextDate } from '@/app/lib/utils/cuestionarios';

// Fast processing endpoint for testing - processes ALL due sends including "10_minutos"
export async function POST(req: NextRequest) {
  console.log('🚀 FAST TESTING: Processing scheduled sends...');
  
  const now = new Date().toISOString();
  const { data: schedules, error: fetchError } = await supabaseAdmin
    .from('envios_programados')
    .select('id, paciente_id, cuestionario_id, canal, frecuencia, proximo_envio')
    .lte('proximo_envio', now)
    .eq('activo', true)
    .order('proximo_envio', { ascending: true });

  if (fetchError) {
    console.error('❌ Error fetching schedules:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!schedules || schedules.length === 0) {
    console.log('ℹ️  No scheduled sends found for processing');
    return NextResponse.json({ 
      success: true, 
      processed: 0, 
      message: 'No hay envíos para procesar en este momento.',
      currentTime: now
    });
  }

  console.log(`📋 Found ${schedules.length} scheduled sends to process at ${now}`);
  
  let processedCount = 0;
  const results = [];

  for (const job of schedules) {
    try {
      console.log(`\n🎯 Processing job ${job.id.substring(0, 8)}... (${job.frecuencia} via ${job.canal})`);
      console.log(`   Due: ${job.proximo_envio} (${(new Date(job.proximo_envio) <= new Date()) ? 'OVERDUE' : 'PENDING'})`);
      
      // Call internal send endpoint
      const sendEndpointUrl = `http://localhost:3000/api/internal/enviar-cuestionario`;
      const payload = {
        pacienteId: job.paciente_id,
        cuestionarioId: job.cuestionario_id,
        canal: job.canal,
        envioProgramadoId: job.id,
      };

      const res = await fetch(sendEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`❌ Job ${job.id} failed to send:`, errText);
        results.push({
          id: job.id.substring(0, 8),
          status: 'failed',
          error: errText,
          frequency: job.frecuencia,
          dueTime: job.proximo_envio
        });
        continue;
      }

      const responseData = await res.json();
      console.log(`✅ Job ${job.id} sent successfully to ${responseData.paciente}`);
      
      processedCount++;

      // Update database with next schedule or deactivate
      if (job.frecuencia === 'unico') {
        const { error: updateError } = await supabaseAdmin
          .from('envios_programados')
          .update({ 
            activo: false, 
            proximo_envio: null,
            actualizado_en: new Date().toISOString()
          })
          .eq('id', job.id);
          
        if (updateError) {
          console.error(`❌ Error deactivating unique send ${job.id}:`, updateError);
        } else {
          console.log(`🔄 Deactivated unique send ${job.id}`);
        }
        
        results.push({
          id: job.id.substring(0, 8),
          status: 'sent_and_deactivated',
          frequency: job.frecuencia,
          sentTo: responseData.paciente,
          questionnaire: responseData.cuestionario,
          link: responseData.link,
          nextAction: 'DEACTIVATED - No more sends'
        });
        
      } else {
        // Calculate next send date for recurring sends
        const nextDate = computeNextDate(job.proximo_envio, job.frecuencia);
        
        if (!nextDate) {
          console.error(`❌ Could not compute next date for ${job.id} with frequency ${job.frecuencia}`);
          
          const { error: deactivateError } = await supabaseAdmin
            .from('envios_programados')
            .update({ 
              activo: false,
              actualizado_en: new Date().toISOString()
            })
            .eq('id', job.id);
            
          results.push({
            id: job.id.substring(0, 8),
            status: 'sent_but_deactivated',
            frequency: job.frecuencia,
            error: 'Could not compute next date',
            sentTo: responseData.paciente
          });
          continue;
        }
        
        const { error: updateError } = await supabaseAdmin
          .from('envios_programados')
          .update({ 
            proximo_envio: nextDate,
            actualizado_en: new Date().toISOString()
          })
          .eq('id', job.id);
          
        if (updateError) {
          console.error(`❌ Error updating next send for ${job.id}:`, updateError);
        } else {
          console.log(`🔄 Updated ${job.id}: Next send ${nextDate}`);
        }
        
        results.push({
          id: job.id.substring(0, 8),
          status: 'sent_and_rescheduled',
          frequency: job.frecuencia,
          sentTo: responseData.paciente,
          questionnaire: responseData.cuestionario,
          link: responseData.link,
          nextSend: nextDate,
          nextAction: `Next send in ${job.frecuencia === '10_minutos' ? '10 minutes' : 
                                      job.frecuencia === 'semanal' ? '1 week' : 
                                      job.frecuencia === 'mensual' ? '1 month' : 
                                      job.frecuencia === 'trimestral' ? '3 months' : 'unknown'}`
        });
      }

    } catch (e) {
      console.error(`❌ Exception processing job ${job.id}:`, e);
      results.push({
        id: job.id.substring(0, 8),
        status: 'exception',
        error: e instanceof Error ? e.message : String(e),
        frequency: job.frecuencia
      });
    }
  }

  console.log(`\n🎉 Fast processing completed: ${processedCount}/${schedules.length} sends processed`);
  
  return NextResponse.json({
    success: true,
    processed: processedCount,
    total: schedules.length,
    currentTime: now,
    testingMode: true,
    results: results,
    summary: {
      sent: results.filter(r => r.status.includes('sent')).length,
      failed: results.filter(r => r.status === 'failed').length,
      rescheduled: results.filter(r => r.status === 'sent_and_rescheduled').length,
      deactivated: results.filter(r => r.status === 'sent_and_deactivated').length
    }
  });
}
