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
  email: z.string().email().nullable().optional(),
  whatsapp: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional().default({}),
  sendInitial: z.boolean().optional().default(true),
});

// Función para calcular la próxima fecha de envío según frecuencia
function calcularProximoEnvio(frecuencia: string): string {
  const nextDate = new Date();
  if (frecuencia === 'semanal') nextDate.setDate(nextDate.getDate() + 7);
  else if (frecuencia === 'quincenal') nextDate.setDate(nextDate.getDate() + 14);
  else if (frecuencia === 'mensual') nextDate.setMonth(nextDate.getMonth() + 1);
  else if (frecuencia === 'trimestral') nextDate.setMonth(nextDate.getMonth() + 3);
  return nextDate.toISOString();
}

//// ---------- GET ----------
export async function GET() {
  // 1) Obtener sesión y verificar autorización
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, {
      status: 401,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  }

  try {
    console.log(`[GET /api/patients] Buscando pacientes para psicólogo: ${session.user.id}`);
    
    // Obtener pacientes del psicólogo
    const { data, error } = await supabaseAdmin
      .from("patients")
      .select("*")
      .eq("psychologist_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/patients] Error al obtener pacientes:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[GET /api/patients] Encontrados ${data?.length || 0} pacientes`);
    // Asegurarse de devolver un array incluso si data es null/undefined
    return NextResponse.json(Array.isArray(data) ? data : [], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error("[GET /api/patients] Error inesperado:", error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );
  }
}

//// ---------- POST ----------
export async function POST(req: NextRequest) {
  // 1) Sesión y autorización
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const psicologoId = session.user.id;

  // Asegurar y obtener el perfil de psicólogo
  let profileId = session.user.id;
  const email = session.user.email ?? '';
  const [firstName, ...rest] = (session.user.name ?? email.split('@')[0]).split(' ');
  const lastName = rest.join(' ');
  // Verificar perfil por ID
  const { data: userById } = await supabaseAdmin.from('users').select('id, email').eq('id', profileId).single();
  
  if (!userById) {
    // Verificar perfil por email existente
    if (!email) {
      console.error('[POST /api/patients] No se puede crear usuario sin email');
      return NextResponse.json({ 
        error: 'Se requiere email para crear el perfil del psicólogo' 
      }, { status: 400 });
    }

    // Buscar usuario por email
    const { data: userByEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userByEmail) {
      // Si existe por email, usar ese ID
      profileId = userByEmail.id;
      console.log(`[POST /api/patients] Usuario encontrado por email, usando ID: ${profileId}`);
    } else {
      // Crear nuevo perfil con upsert para evitar duplicados
      console.log(`[POST /api/patients] Creando nuevo usuario con email: ${email}`);
      const { data: newUser, error: createErr } = await supabaseAdmin
        .from('users')
        .upsert({
          id: session.user.id,
          email,
          password_hash: '',
          role: session.user.role ?? 'psicologo',
          first_name: firstName,
          last_name: lastName
        })
        .select()
        .single();

      if (createErr || !newUser) {
        console.error('[POST /api/patients] Error en upsert de usuario:', createErr);
        return NextResponse.json({ 
          error: 'Error en el registro del psicólogo',
          details: createErr?.message || 'No se pudo crear el usuario'
        }, { status: 500 });
      }
      
      console.log(`[POST /api/patients] Usuario creado: ${session.user.id}`);
      profileId = newUser.id;
    }
  } else if (userById.email !== email && email) {
    // Actualizar email si es diferente
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ email })
      .eq('id', profileId);
      
    if (updateError) {
      console.error('[POST /api/patients] Error actualizando email:', updateError);
    } else {
      console.log(`[POST /api/patients] Email actualizado para usuario ${profileId}`);
    }
  }

  // 2) Validar body
  const body = await req.json();
  console.log('POST /api/patients body:', body);
  const parsed = newPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sendInitial } = parsed.data;

  // Ya verificamos y aseguramos la existencia del perfil del psicólogo al inicio
  console.log(`[POST /api/patients] Usando perfil de psicólogo con ID: ${profileId}`);

  // Insertar paciente con service role key y filtro manual
  const { data: paciente, error: pacienteError } = await supabaseAdmin
    .from("patients")
    .insert({
      psychologist_id: profileId,
      name: parsed.data.name,
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp,
      metadata: parsed.data.metadata,
      active: true, // Establecer paciente como activo por defecto
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
  const frecuencia = metadataAny.preferencias_cuestionario?.frecuencia || 'mensual';
  
  // Envío inicial si se solicitó
  if (sendInitial && cuestionario) {
    try {
      const origin = new URL(req.url).origin;
      
      // 1. Programar la recurrencia primero
      const scheduleRes = await fetch(`${origin}/api/envios_programados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          pacienteId: paciente.id,
          cuestionarioId: cuestionario.id,
          canal: canalToSend,
          frecuencia: frecuencia,
          proximoEnvio: calcularProximoEnvio(frecuencia)
        }),
      });
      
      const scheduleData = await scheduleRes.json();
      
      if (scheduleRes.ok) {
        console.log('Recurrencia programada:', scheduleData);
        
        // 2. Enviar inmediatamente con referencia al envío programado
        const sendRes = await fetch(`${origin}/api/cuestionarios/enviar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.get('cookie') || ''
          },
          body: JSON.stringify({ 
            pacienteId: paciente.id, 
            cuestionarioId: cuestionario.id, 
            canal: canalToSend,
            envioProgramadoId: scheduleData.id
          }),
        });
        
        const sendData = await sendRes.json();
        if (sendRes.ok) {
          console.log('Primer envío realizado con recurrencia:', sendData);
          responsePayload.link = sendData.link;
          responsePayload.recurrencia = {
            id: scheduleData.id,
            frecuencia: frecuencia,
            proximoEnvio: scheduleData.proximoEnvio
          };
        } else {
          console.error('Error en primer envío:', sendData);
        }
      } else {
        console.error('Error al programar recurrencia:', scheduleData);
        // Fallback: enviar sin recurrencia
        const sendRes = await fetch(`${origin}/api/cuestionarios/enviar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.get('cookie') || ''
          },
          body: JSON.stringify({ pacienteId: paciente.id, cuestionarioId: cuestionario.id, canal: canalToSend }),
        });
        const sendData = await sendRes.json();
        if (sendRes.ok) {
          responsePayload.link = sendData.link;
        }
      }
    } catch (error) {
      console.error('Error al realizar envío con recurrencia:', error);
    }
  }

  return NextResponse.json(responsePayload, { status: 201 });
}