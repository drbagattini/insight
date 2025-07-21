import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { computeNextDate } from '@/app/lib/utils/cuestionarios';

/**
 * Simplified test endpoint to verify the basic processing logic works
 * without depending on the actual email/WhatsApp sending
 */
export async function POST() {
  try {
    console.log('🧪 Simplified process test started');
    
    // Get current time and due jobs
    const now = new Date().toISOString();
    console.log(`🕐 Current time: ${now}`);
    
    const { data: schedules, error: fetchError } = await supabaseAdmin
      .from('envios_programados')
      .select('id, paciente_id, cuestionario_id, canal, frecuencia, proximo_envio')
      .lte('proximo_envio', now)
      .eq('activo', true);

    if (fetchError) {
      console.error('❌ Error fetching schedules:', fetchError);
      return NextResponse.json({ 
        success: false, 
        error: `Error fetching schedules: ${fetchError.message}` 
      }, { status: 500 });
    }

    console.log(`📋 Found ${schedules?.length || 0} schedules to process`);
    
    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: 'No due schedules found' 
      });
    }

    let processed = 0;
    const results = [];

    for (const job of schedules) {
      try {
        console.log(`🚀 Processing job ${job.id}: ${job.frecuencia} via ${job.canal}`);
        
        // Simulate the sending (skip actual email/WhatsApp)
        console.log(`📧 [SIMULATED] Would send ${job.cuestionario_id} to patient ${job.paciente_id} via ${job.canal}`);
        
        // Update the job based on frequency
        if (job.frecuencia === 'unico') {
          // Mark one-time sends as inactive
          const { error: updateError } = await supabaseAdmin
            .from('envios_programados')
            .update({ 
              activo: false, 
              proximo_envio: null,
              actualizado_en: new Date().toISOString()
            })
            .eq('id', job.id);
            
          if (updateError) {
            console.error(`❌ Error deactivating job ${job.id}:`, updateError);
            results.push({
              jobId: job.id,
              success: false,
              error: `Error deactivating: ${updateError.message}`
            });
            continue;
          }
          
          console.log(`🔄 Job ${job.id} (frequency: unico) marked as inactive`);
          results.push({
            jobId: job.id,
            success: true,
            action: 'deactivated',
            frequency: job.frecuencia
          });
          
        } else {
          // Calculate next send date for recurring sends
          const nextProximoEnvio = computeNextDate(job.proximo_envio, job.frecuencia);
          
          if (!nextProximoEnvio) {
            console.error(`❌ Error calculating next date for job ${job.id} with frequency ${job.frecuencia}`);
            
            // Deactivate job with invalid frequency
            await supabaseAdmin
              .from('envios_programados')
              .update({ activo: false })
              .eq('id', job.id);
              
            results.push({
              jobId: job.id,
              success: false,
              error: `Invalid frequency ${job.frecuencia}, job deactivated`
            });
            continue;
          }
          
          const { error: updateError } = await supabaseAdmin
            .from('envios_programados')
            .update({ 
              proximo_envio: nextProximoEnvio,
              actualizado_en: new Date().toISOString()
            })
            .eq('id', job.id);
            
          if (updateError) {
            console.error(`❌ Error updating next send for job ${job.id}:`, updateError);
            results.push({
              jobId: job.id,
              success: false,
              error: `Error updating: ${updateError.message}`
            });
            continue;
          }
          
          console.log(`🔄 Job ${job.id} (frequency: ${job.frecuencia}) updated. Next send: ${nextProximoEnvio}`);
          results.push({
            jobId: job.id,
            success: true,
            action: 'rescheduled',
            frequency: job.frecuencia,
            nextSend: nextProximoEnvio
          });
        }
        
        processed++;
        
      } catch (error) {
        console.error(`🔥 Error processing job ${job.id}:`, error);
        results.push({
          jobId: job.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Simplified process completed. Processed ${processed}/${schedules.length} jobs`);
    
    return NextResponse.json({
      success: true,
      processed,
      total: schedules.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔥 Simplified process test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
