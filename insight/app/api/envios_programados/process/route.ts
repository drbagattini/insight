import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

// Compute next date based on frequency
function computeNextDate(dateStr: string, frequency: string): string {
  const date = new Date(dateStr);
  if (frequency === 'semanal') date.setDate(date.getDate() + 7);
  else if (frequency === 'mensual') date.setMonth(date.getMonth() + 1);
  else if (frequency === 'trimestral') date.setMonth(date.getMonth() + 3);
  return date.toISOString();
}

// Generate token and expiration
function generarTokenYExpiracion() {
  const token = crypto.randomUUID();
  const expiracion = new Date();
  expiracion.setDate(expiracion.getDate() + 7);
  return { token, expiracion: expiracion.toISOString() };
}

// Simulated send logic (integrate with SendGrid or Twilio)
async function enviarCuestionarioPorCanal(
  email: string | null,
  whatsapp: string | null,
  canal: string,
  linkPublico: string
) {
  console.log(`[Cron] Enviando cuestionario por ${canal} a ${email || whatsapp}`);
  console.log(`Link: ${linkPublico}`);
  return true;
}

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
      const next = new Date(job.proximo_envio);
      switch (job.frecuencia) {
        case 'semanal': next.setDate(next.getDate() + 7); break;
        case 'mensual': next.setMonth(next.getMonth() + 1); break;
        case 'trimestral': next.setMonth(next.getMonth() + 3); break;
      }
      await supabaseAdmin
        .from('envios_programados')
        .update({ proximo_envio: next.toISOString() })
        .eq('id', job.id);
    } catch (e) {
      console.error('Error procesando job', job.id, e);
    }
  }
  return NextResponse.json({ success: true, processed: count });
}
