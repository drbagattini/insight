import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { computeNextDate, generarTokenYExpiracion, enviarCuestionarioPorCanal } from '@/app/lib/utils/cuestionarios';

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
    console.error('Error al listar envíos programados:', fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  let count = 0;
  for (const job of schedules || []) {
    try {
      // Llamar al endpoint de envío interno
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/cuestionarios/enviar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pacienteId: job.paciente_id,
            cuestionarioId: job.cuestionario_id,
            canal: job.canal,
          }),
        }
      );
      if (!res.ok) {
        const errText = await res.text();
        console.error(`Job ${job.id} fallo envío:`, errText);
        continue;
      }
      count++;
      // Calcular próxima fecha
      const next = computeNextDate(job.proximo_envio, job.frecuencia);
      await supabaseAdmin
        .from('envios_programados')
        .update({ proximo_envio: next })
        .eq('id', job.id);
    } catch (e) {
      console.error('Error procesando job', job.id, e);
    }
  }
  return NextResponse.json({ success: true, processed: count });
}
