import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { computeNextDate } from '@/app/lib/utils/cuestionarios';

/**
 * Test endpoint that works around the trigger issue by using raw SQL updates
 */
export async function POST() {
  try {
    console.log('🧪 No-trigger process test started');
    
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
        
        // Simulate the sending
        console.log(`📧 [SIMULATED] Would send ${job.cuestionario_id} to patient ${job.paciente_id} via ${job.canal}`);
        
        // Update using raw SQL to bypass triggers
        if (job.frecuencia === 'unico') {
          // Mark one-time sends as inactive using raw SQL
          const { error: updateError } = await supabaseAdmin.rpc('update_envio_programado', {
            envio_id: job.id,
            nuevo_activo: false,
            nuevo_proximo_envio: null,
            timestamp_update: new Date().toISOString()
          });
          
          if (updateError) {
            // If RPC doesn't exist, fall back to disabling trigger first
            console.log('RPC not available, trying to disable trigger temporarily...');
            
            // Try direct SQL update
            const { error: sqlError } = await supabaseAdmin
              .from('envios_programados')
              .update({ activo: false })
              .eq('id', job.id);
              
            if (sqlError) {
              console.error(`❌ Error deactivating job ${job.id}:`, sqlError);
              results.push({
                jobId: job.id,
                success: false,
                error: `Error deactivating: ${sqlError.message}`
              });
              continue;
            }
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
            results.push({
              jobId: job.id,
              success: false,
              error: `Invalid frequency ${job.frecuencia}`
            });
            continue;
          }
          
          // Try RPC first, then fallback
          const { error: updateError } = await supabaseAdmin.rpc('update_envio_programado', {
            envio_id: job.id,
            nuevo_activo: true,
            nuevo_proximo_envio: nextProximoEnvio,
            timestamp_update: new Date().toISOString()
          });
          
          if (updateError) {
            console.log('RPC not available, trying direct update...');
            
            // Try using a simpler update that might work around the trigger
            const { error: directError } = await supabaseAdmin
              .from('envios_programados')
              .update({ proximo_envio: nextProximoEnvio })
              .eq('id', job.id);
              
            if (directError) {
              console.error(`❌ Error updating job ${job.id}:`, directError);
              results.push({
                jobId: job.id,
                success: false,
                error: `Error updating: ${directError.message}`
              });
              continue;
            }
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

    console.log(`✅ No-trigger process completed. Processed ${processed}/${schedules.length} jobs`);
    
    return NextResponse.json({
      success: true,
      processed,
      total: schedules.length,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔥 No-trigger process test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
