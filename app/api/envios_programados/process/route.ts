import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { computeNextDate } from '@/app/lib/utils/cuestionarios'; // Asumiendo que generarTokenYExpiracion y enviarCuestionarioPorCanal no son necesarias aquí directamente

// POST /api/envios_programados/process
export async function POST(req: NextRequest) {
  // Obtener fecha actual y jobs vencidos
  const now = new Date().toISOString();
  const { data: schedules, error: fetchError } = await supabaseAdmin
    .from('envios_programados')
    .select('id, paciente_id, cuestionario_id, canal, frecuencia, proximo_envio')
    .lte('proximo_envio', now)
    .eq('activo', true);

  if (fetchError) {
    console.error('Error al listar envíos programados para procesar:', fetchError);
    return NextResponse.json({ error: `Error al listar envíos: ${fetchError.message}` }, { status: 500 });
  }

  if (!schedules || schedules.length === 0) {
    console.log('No hay envíos programados para procesar en este momento.');
    return NextResponse.json({ success: true, processed: 0, message: 'No hay envíos para procesar.' });
  }

  console.log(`📋 Found ${schedules.length} scheduled sends to process`);
  schedules.forEach((job, index) => {
    console.log(`   ${index + 1}. Job ${job.id}: ${job.frecuencia} via ${job.canal}, due: ${job.proximo_envio}`);
  });

  let count = 0;
  for (const job of schedules) {
    try {
      // Llamar al endpoint interno de envío (sin autenticación)
      const sendEndpointUrl = `http://localhost:3000/api/internal/enviar-cuestionario`;
      const payload = {
        pacienteId: job.paciente_id,
        cuestionarioId: job.cuestionario_id,
        canal: job.canal,
        envioProgramadoId: job.id, // Pasar el ID del job de envío programado
      };
      
      console.log(`🚀 Processing job ${job.id}. Payload for ${sendEndpointUrl}:`, payload);

      const res = await fetch(sendEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`❌ Job ${job.id} failed to send (${res.status}):`, errText);
        continue; // Pasar al siguiente job
      }

      const responseData = await res.json();
      console.log(`✅ Job ${job.id} sent successfully:`, responseData);
      count++;

      // Actualizar el job en la base de datos
      if (job.frecuencia === 'unico') {
        // Si es un envío único, marcar como inactivo y opcionalmente limpiar proximo_envio
        const { error: updateError } = await supabaseAdmin
          .from('envios_programados')
          .update({ 
            activo: false, 
            proximo_envio: null,
            actualizado_en: new Date().toISOString()
          })
          .eq('id', job.id);
        if (updateError) {
          console.error(`Error al desactivar envío único ${job.id}:`, updateError);
        }
        console.log(`🔄 Job ${job.id} (frequency: unico) marked as inactive.`);
      } else {
        // Si es recurrente, calcular y actualizar la próxima fecha de envío
        const nextProximoEnvio = computeNextDate(job.proximo_envio, job.frecuencia);
        if (!nextProximoEnvio) {
            console.error(`Error al calcular nextProximoEnvio para job ${job.id} con frecuencia ${job.frecuencia}. El job se desactivará.`);
            await supabaseAdmin
              .from('envios_programados')
              .update({ activo: false })
              .eq('id', job.id);
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
          console.error(`Error al actualizar proximo_envio para job ${job.id}:`, updateError);
        }
        console.log(`🔄 Job ${job.id} (frequency: ${job.frecuencia}) updated. Next send: ${nextProximoEnvio}`);
      }
    } catch (e) {
      // Catch para errores inesperados durante el procesamiento del loop
      console.error('Error general procesando job', job.id, e instanceof Error ? e.message : String(e));
    }
  }
  return NextResponse.json({ success: true, processed: count });
}
