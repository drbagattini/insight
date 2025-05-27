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
          // .eq('paciente_id', pacienteId) // No es necesario si filtramos por envio_programado_id
          // .eq('cuestionario_id', send.cuestionario_id) // No es necesario si filtramos por envio_programado_id
          .eq('envio_programado_id', send.id) // Asumiendo que 'send.id' es el 'envios_programados.id'
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
  const { pacienteId, canal, frecuencia, proximoEnvio: fechaInicioStr } = body; // proximoEnvio del body es nuestra fechaInicioStr
  let cuestionarioId = body.cuestionarioId;

  if (!pacienteId || !canal || !frecuencia || !fechaInicioStr) {
    return NextResponse.json({ error: 'Campos requeridos faltantes: pacienteId, canal, frecuencia, proximoEnvio (fechaInicio)' }, { status: 400 });
  }

  // Validar que la frecuencia sea uno de los valores esperados
  const validFrequencies = ['semanal', 'mensual', 'trimestral', 'unico'];
  if (!validFrequencies.includes(frecuencia)) {
    return NextResponse.json({ error: `Frecuencia inválida. Valores permitidos: ${validFrequencies.join(', ')}` }, { status: 400 });
  }

  // Usar WHO-5 si no se especifica cuestionarioId
  if (!cuestionarioId) {
    const { data: cuestionarioDefault, error: qError } = await supabaseAdmin
      .from('cuestionarios')
      .select('id')
      .eq('codigo', 'WHO-5')
      .single();
    if (qError || !cuestionarioDefault) {
      console.error('Error al buscar cuestionario default WHO-5:', qError);
      return NextResponse.json({ error: 'Cuestionario WHO-5 no encontrado o error al buscarlo.' }, { status: 404 });
    }
    cuestionarioId = cuestionarioDefault.id;
  }

  // Validación de unicidad para programaciones recurrentes
  if (['semanal', 'mensual', 'trimestral'].includes(frecuencia)) {
    const { data: existingActiveRecurrent, error: checkError } = await supabaseAdmin
      .from('envios_programados')
      .select('id')
      .eq('paciente_id', pacienteId)
      .eq('cuestionario_id', cuestionarioId)
      .in('frecuencia', ['semanal', 'mensual', 'trimestral'])
      .eq('activo', true)
      .maybeSingle(); // Usamos maybeSingle para no fallar si no hay ninguno

    if (checkError) {
      console.error('Error al verificar programación existente:', checkError);
      return NextResponse.json({ error: 'Error al verificar programación existente.' }, { status: 500 });
    }

    if (existingActiveRecurrent) {
      return NextResponse.json(
        {
          error: "Este cuestionario ya tiene una programación recurrente activa para este paciente. Te sugerimos modificar la frecuencia desde el envío existente o usar la opción 'Envío único' si querés enviarlo una vez más.",
          errorCode: 'PROGRAMACION_RECURRENTE_EXISTENTE'
        },
        { status: 409 } // 409 Conflict
      );
    }
  }

  const fechaInicio = new Date(fechaInicioStr);
  if (isNaN(fechaInicio.getTime())) {
    return NextResponse.json({ error: 'Formato de fecha de inicio inválido.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('envios_programados')
    .insert([
      {
        paciente_id: pacienteId,
        cuestionario_id: cuestionarioId,
        canal,
        frecuencia,
        fecha_inicio_programada: fechaInicio.toISOString(), // Guardar como ISO string (UTC)
        proximo_envio: fechaInicio.toISOString(), // Inicialmente igual a la fecha de inicio
        activo: true,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error al crear envío programado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
  
