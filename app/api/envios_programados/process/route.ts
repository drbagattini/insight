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
    // console.log('No hay envíos programados para procesar en este momento.'); // Comentado para reducir logs en Vercel si se ejecuta muy seguido
    return NextResponse.json({ success: true, processed: 0, message: 'No hay envíos para procesar.' });
  }

  let count = 0;
  for (const job of schedules) {
    try {
      // Llamar al endpoint de envío interno, pasando el ID del job
      const sendEndpointUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/cuestionarios/enviar`;
      const payload = {
        pacienteId: job.paciente_id,
        cuestionarioId: job.cuestionario_id,
        canal: job.canal,
        envioProgramadoId: job.id, // Pasar el ID del job de envío programado
      };
      
      // console.log(`Procesando job ${job.id}. Payload para ${sendEndpointUrl}:`, payload); // Comentado para reducir logs

      const res = await fetch(sendEndpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Job ${job.id} falló en el envío (endpoint /api/cuestionarios/enviar): ${res.status}`, errText);
        // Considerar si se debe reintentar o marcar como fallido permanentemente. Por ahora, solo se salta.
        continue; // Pasar al siguiente job
      }

      // console.log(`Job ${job.id} enviado exitosamente via /api/cuestionarios/enviar.`); // Comentado para reducir logs
      count++;

      // Actualizar el job en la base de datos
      if (job.frecuencia === 'unico') {
        // Si es un envío único, marcar como inactivo y opcionalmente limpiar proximo_envio
        const { error: updateError } = await supabaseAdmin
          .from('envios_programados')
          .update({ activo: false, proximo_envio: null })
          .eq('id', job.id);
        if (updateError) {
          console.error(`Error al desactivar envío único ${job.id}:`, updateError);
        }
        // console.log(`Job ${job.id} (frecuencia: unico) marcado como inactivo.`); // Comentado para reducir logs
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
          .update({ proximo_envio: nextProximoEnvio })
          .eq('id', job.id);
        if (updateError) {
          console.error(`Error al actualizar proximo_envio para job ${job.id}:`, updateError);
        }
        // console.log(`Job ${job.id} (frecuencia: ${job.frecuencia}) actualizado. Próximo envío: ${nextProximoEnvio}`); // Comentado para reducir logs
      }
    } catch (e) {
      // Catch para errores inesperados durante el procesamiento del loop
      console.error('Error general procesando job', job.id, e instanceof Error ? e.message : String(e));
    }
  }
  return NextResponse.json({ success: true, processed: count });
}
