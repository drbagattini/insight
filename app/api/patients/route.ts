import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

// Cliente Supabase admin (usar service role key)
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

  // 2) Validar body
  const body = await req.json();
  const parsed = newPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

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
    console.error("[POST /api/patients]", pacienteError?.message);
    return NextResponse.json({ error: pacienteError?.message }, { status: 500 });
  }

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

    if (scheduleError) {
      console.error("[POST /api/patients] Error al programar cuestionario:", scheduleError.message);
      // No fallamos la creación del paciente si falla la programación
    }
  }

  return NextResponse.json(paciente, { status: 201 });
}