import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

const registerSchema = z.object({
  nombre: z.string().nonempty(),
  apellido: z.string().nonempty(),
  email: z.string().email(),
  whatsapp: z.string().nonempty(),
  edad: z.number().int().nonnegative(),
  canal: z.enum(['email', 'whatsapp', 'ambos']),
  frecuencia: z.enum(['semanal', 'mensual', 'trimestral']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, apellido, email, whatsapp, edad, canal, frecuencia } = registerSchema.parse(body);

    // Determine psychologist_id (env or first psicologo)
    let psychologistId = process.env.DEFAULT_PSYCHOLOGIST_ID;
    if (!psychologistId) {
      const { data: psy, error: psyErr } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'psicologo')
        .limit(1)
        .single();
      if (psyErr || !psy) {
        return NextResponse.json({ error: 'No se encontró psicólogo' }, { status: 500 });
      }
      psychologistId = psy.id;
    }

    // Insert patient
    const { data: pat, error: patErr } = await supabaseAdmin
      .from('patients')
      .insert([{ psychologist_id: psychologistId, name: nombre, email, whatsapp, metadata: { apellido, edad } }])
      .select('id')
      .single();
    if (patErr || !pat) {
      return NextResponse.json({ error: patErr?.message }, { status: 500 });
    }
    const pacienteId = pat.id;

    // Get WHO-5 template id
    const { data: tpl, error: tplErr } = await supabaseAdmin
      .from('cuestionarios')
      .select('id')
      .eq('codigo', 'WHO-5')
      .single();
    if (tplErr || !tpl) {
      return NextResponse.json({ error: 'Plantilla WHO-5 no encontrada' }, { status: 500 });
    }
    const cuestionarioId = tpl.id;

    // Calculate next send date
    const nextDate = new Date();
    if (frecuencia === 'semanal') nextDate.setDate(nextDate.getDate() + 7);
    else if (frecuencia === 'mensual') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (frecuencia === 'trimestral') nextDate.setMonth(nextDate.getMonth() + 3);
    const proximo_envio = nextDate.toISOString();

    // Schedule envio
    const { data: sched, error: schedErr } = await supabaseAdmin
      .from('envios_programados')
      .insert([
        { paciente_id: pacienteId, cuestionario_id, canal, frecuencia, proximo_envio },
      ])
      .single();
    if (schedErr) {
      return NextResponse.json({ error: schedErr.message }, { status: 500 });
    }

    return NextResponse.json({ paciente: pat, schedule: sched }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
