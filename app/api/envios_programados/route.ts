import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

// GET: listar envíos programados de un paciente
export async function GET(request: Request) {
  const url = new URL(request.url);
  const pacienteId = url.searchParams.get('pacienteId');
  if (!pacienteId) {
    return NextResponse.json({ error: 'Paciente ID no proporcionado' }, { status: 400 });
  }

  const { data: schedules, error } = await supabaseAdmin
    .from('envios_programados')
    .select('*, cuestionarios(codigo)')
    .eq('paciente_id', pacienteId)
    .order('proximo_envio', { ascending: true });

  if (error) {
    console.error('Error al listar envíos programados:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = await Promise.all(
    schedules.map(async (send) => {
      let lastSent: string | null = null;
      let respondido = false;
      try {
        const { data: respList, error: respError } = await supabaseAdmin
          .from('respuestas')
          .select('enviado_en')
          .eq('paciente_id', pacienteId)
          .eq('cuestionario_id', send.cuestionario_id)
          .order('enviado_en', { ascending: false })
          .limit(1);
        if (respError) {
          console.error('Error al obtener respuestas para envío', send.id, respError);
        } else if (respList && respList.length > 0) {
          lastSent = respList[0].enviado_en;
          respondido = true;
        }
      } catch (e) {
        console.error('Error inesperado al obtener respuestas para envío', send.id, e);
      }
      return {
        ...send,
        lastSent,
        respondido,
      };
    })
  );

  return NextResponse.json(enriched);
}

// POST: crear un nuevo envío programado
export async function POST(request: Request) {
  const body = await request.json();
  console.log('envios_programados POST body:', body);
  const { pacienteId, canal, frecuencia, proximoEnvio } = body;
  let cuestionarioId = body.cuestionarioId;
  if (!pacienteId || !canal || !frecuencia || !proximoEnvio) {
    return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 });
  }

  // Usar WHO-5 si no se especifica cuestionario
  if (!cuestionarioId) {
    const { data: cuestionario, error: qError } = await supabaseAdmin
      .from('cuestionarios')
      .select('id')
      .eq('codigo', 'WHO-5')
      .single();
    if (qError || !cuestionario) {
      return NextResponse.json({ error: 'Cuestionario WHO-5 no encontrado' }, { status: 404 });
    }
    cuestionarioId = cuestionario.id;
  }

  const { data, error } = await supabaseAdmin
    .from('envios_programados')
    .insert([
      {
        paciente_id: pacienteId,
        cuestionario_id: cuestionarioId,
        canal,
        frecuencia,
        proximo_envio: new Date(proximoEnvio)
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error al crear envío programado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
