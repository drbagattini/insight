import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

// Cliente Supabase admin (usar service role key)
console.log('[POST /api/patients] ServiceRoleKey loaded?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false }
  }
);

// Schema Zod
const newPatientSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
  sendInitial: z.boolean().optional().default(true),
});

// Función para calcular la próxima fecha de envío según frecuencia
function calcularProximoEnvio(frecuencia: string): string {
  const nextDate = new Date();
  if (frecuencia === 'semanal') nextDate.setDate(nextDate.getDate() + 7);
  else if (frecuencia === 'mensual') nextDate.setMonth(nextDate.getMonth() + 1);
  else if (frecuencia === 'trimestral') nextDate.setMonth(nextDate.getMonth() + 3);
  return nextDate.toISOString();
}

//// ---------- GET ----------
export async function GET() {
  // 1) Obtener sesión y verificar autorización
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Obtener pacientes del psicólogo con service role key y filtro manual
  const { data, error } = await supabaseAdmin
    .from("patients")
    .select("*")
    .eq("psychologist_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/patients]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 3) Devolver lista vacía si no hay datos
  return NextResponse.json(data ?? []);
}

//// ---------- POST ----------
export async function POST(req: NextRequest) {
  // 1) Sesión y autorización
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const psicologoId = session.user.id;

  // Ensure legacy psychologists have profile record to satisfy FK constraint
  try {
    const upsertResponse = await supabaseAdmin
      .from('users')
      .upsert({
        id: psicologoId,
        email: session.user.email ?? '',
        password_hash: '', // placeholder for legacy users
        role: session.user.role,
        first_name: session.user.name ?? '',
        last_name: '',
      }, { onConflict: 'id' });
    console.log('[POST /api/patients] Upsert response:', upsertResponse);
    const profileError = upsertResponse.error;
    if (profileError && profileError.code !== '23505') {
      console.error('[POST /api/patients] Error ensuring profile exists:', profileError);
      const profileMsg = profileError.message || profileError.code || 'Error interno al verificar perfil';
      return NextResponse.json({ error: profileMsg }, { status: 500 });
    }
    const { data: checkUser, error: checkErr } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', psicologoId);
    console.log('[POST /api/patients] User exists after upsert:', { checkUser, checkErr });

    // Si después del upsert seguimos sin registro, crear uno mínimo para evitar error FK
    if ((!checkUser || checkUser.length === 0) && !checkErr) {
      console.warn('[POST /api/patients] No se encontró perfil tras upsert, creando registro mínimo');
      const { error: insertMissingError } = await supabaseAdmin.from('users').insert({
        id: psicologoId,
        email: session.user.email ?? '',
        password_hash: '',
        role: session.user.role ?? 'psicologo',
        first_name: session.user.name?.split(' ')[0] ?? session.user.email?.split('@')[0] ?? '',
        last_name: session.user.name?.split(' ').slice(1).join(' ') ?? '',
      });
      if (insertMissingError) {
        console.error('[POST /api/patients] Error creando perfil mínimo:', insertMissingError);
        return NextResponse.json({ error: 'Error interno creando perfil' }, { status: 500 });
      }
    }
  } catch (err) {
    console.error('[POST /api/patients] Unexpected error ensuring profile exists:', err);
    return NextResponse.json({ error: 'Error interno verificando perfil' }, { status: 500 });
  }

  // 2) Validar body
  const body = await req.json();
  console.log('POST /api/patients body:', body);
  const parsed = newPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sendInitial } = parsed.data;

  // Insertar paciente con service role key y filtro manual
  const { data: paciente, error: pacienteError } = await supabaseAdmin
    .from("patients")
    .insert({
      psychologist_id: psicologoId,
      name: parsed.data.name,
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp,
      metadata: parsed.data.metadata,
    })
    .select("*")
    .single();

  if (pacienteError || !paciente) {
    console.error('[POST /api/patients] Error inserting patient:', pacienteError);
    const errMsg = pacienteError?.message || pacienteError?.code || JSON.stringify(pacienteError) || 'Error interno al crear paciente';
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
  console.log('Paciente creado:', paciente);

  // Obtener el ID del cuestionario WHO-5
  const { data: cuestionario, error: cuestionarioError } = await supabaseAdmin
    .from("cuestionarios")
    .select("id")
    .eq("codigo", "WHO-5")
    .single();

  if (cuestionarioError) {
    console.warn("[POST /api/patients] No se encontró el cuestionario WHO-5:", cuestionarioError.message);
    // Continuamos aunque no se encuentre el cuestionario
  } else if (cuestionario) {
    // Extraer preferencias de cuestionario del metadata
    const preferencias = parsed.data.metadata?.preferencias_cuestionario as { canal: string; frecuencia: string } | undefined;
    const canal = preferencias?.canal || 'email';
    const frecuencia = preferencias?.frecuencia || 'mensual';
    
    // Programar el envío del cuestionario
    const proximo_envio = calcularProximoEnvio(frecuencia);
    
    const { error: scheduleError } = await supabaseAdmin
      .from("envios_programados")
      .insert({
        paciente_id: paciente.id,
        cuestionario_id: cuestionario.id,
        canal,
        frecuencia,
        proximo_envio
      });

    console.log('Envio programado:', { pacienteId: paciente.id, cuestionarioId: cuestionario.id, canal, frecuencia, proximo_envio });
    if (scheduleError) {
      console.error("[POST /api/patients] Error al programar cuestionario:", scheduleError.message);
      // No fallamos la creación del paciente si falla la programación
    }
  }

  // Preparar payload de respuesta
  let responsePayload: any = { paciente };
  // Determinar canal para el envío inicial
  const metadataAny = parsed.data.metadata as any;
  const canalToSend = metadataAny.preferencias_cuestionario?.canal || 'email';
  // Envío inicial si se solicitó
  if (sendInitial) {
    try {
      const origin = new URL(req.url).origin;
      const sendRes = await fetch(`${origin}/api/cuestionarios/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({ pacienteId: paciente.id, cuestionarioId: cuestionario?.id, canal: canalToSend }),
      });
      const sendData = await sendRes.json();
      if (sendRes.ok) {
        console.log('Primer envío realizado:', sendData);
        responsePayload.link = sendData.link;
      } else {
        console.error('Error en primer envío:', sendData);
      }
    } catch (error) {
      console.error('Error al realizar primer envío:', error);
    }
  }

  return NextResponse.json(responsePayload, { status: 201 });
}