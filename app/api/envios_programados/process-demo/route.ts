import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { computeNextDate } from '@/app/lib/utils/cuestionarios';

// Demo endpoint - processes sends without updating database (due to trigger issue)
export async function POST(req: NextRequest) {
  console.log('🎯 DEMO: Processing scheduled sends without database updates...');
  
  const now = new Date().toISOString();
  const { data: schedules, error: fetchError } = await supabaseAdmin
    .from('envios_programados')
    .select('id, paciente_id, cuestionario_id, canal, frecuencia, proximo_envio')
    .lte('proximo_envio', now)
    .eq('activo', true);

  if (fetchError) {
    console.error('❌ Error fetching schedules:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!schedules || schedules.length === 0) {
    console.log('ℹ️  No scheduled sends found');
    return NextResponse.json({ 
      success: true, 
      processed: 0, 
      message: 'No hay envíos para procesar.',
      demo: true
    });
  }

  console.log(`📋 Found ${schedules.length} scheduled sends to process`);
  
  let processedCount = 0;
  const results = [];

  for (const job of schedules) {
    try {
      console.log(`\n🚀 Processing job ${job.id.substring(0, 8)}... (${job.frecuencia} via ${job.canal})`);
      
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
          id: job.id,
          status: 'failed',
          error: errText,
          frequency: job.frecuencia
        });
        continue;
      }

      const responseData = await res.json();
      console.log(`✅ Job ${job.id} sent successfully`);
      
      processedCount++;
      
      // Calculate what WOULD be the next send date (demo only)
      let nextAction = 'none';
      let nextDate = null;
      
      if (job.frecuencia === 'unico') {
        nextAction = 'would_deactivate';
      } else {
        nextDate = computeNextDate(job.proximo_envio, job.frecuencia);
        nextAction = 'would_reschedule';
      }
      
      results.push({
        id: job.id,
        status: 'sent_successfully',
        frequency: job.frecuencia,
        nextAction,
        nextDate,
        sentTo: responseData.paciente,
        questionnaire: responseData.cuestionario,
        link: responseData.link
      });

    } catch (e) {
      console.error(`❌ Exception processing job ${job.id}:`, e);
      results.push({
        id: job.id,
        status: 'exception',
        error: e instanceof Error ? e.message : String(e),
        frequency: job.frecuencia
      });
    }
  }

  console.log(`\n🎉 DEMO completed: ${processedCount}/${schedules.length} sends processed`);
  
  return NextResponse.json({
    success: true,
    processed: processedCount,
    total: schedules.length,
    demo: true,
    note: "This is a demo - questionnaires were sent but database was not updated due to trigger issue",
    results: results,
    nextSteps: [
      "1. Fix database trigger: DROP TRIGGER trg_update_envios_updated_at; CREATE TRIGGER with correct column name",
      "2. Deploy Edge Function for automatic processing",  
      "3. Configure pg_cron for hourly execution"
    ]
  });
}
