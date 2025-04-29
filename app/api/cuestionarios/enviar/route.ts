import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

// Schema para validación
const enviarCuestionarioSchema = z.object({
  pacienteId: z.string().uuid("ID de paciente inválido"),
  cuestionarioId: z.string().uuid().optional(),
});

// Función para generar un token único y calcular fecha de expiración
function generarTokenYExpiracion() {
  const token = crypto.randomUUID();
  const expiracion = new Date();
  expiracion.setDate(expiracion.getDate() + 7); // Expira en 7 días
  return { token, expiracion: expiracion.toISOString() };
}

// Función para enviar el cuestionario (simulada por ahora)
async function enviarCuestionarioPorCanal(email: string | null, whatsapp: string | null, canal: string, linkPublico: string) {
  // Aquí implementaríamos la lógica real de envío
  console.log(`Enviando cuestionario por ${canal} a ${email || whatsapp}`);
  console.log(`Link público: ${linkPublico}`);
  
  // En una implementación real, aquí llamaríamos a servicios como SendGrid o Twilio
  return true;
}

export async function POST(req: NextRequest) {
  // 1) Verificar sesión y autorización
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const psicologoId = session.user.id;

  // 2) Validar body
  const body = await req.json();
  const parsed = enviarCuestionarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // 3) Verificar que el paciente pertenezca al psicólogo
  const { data: paciente, error: pacienteError } = await supabaseAdmin
    .from("patients")
    .select("id, email, whatsapp, metadata")
    .eq("id", parsed.data.pacienteId)
    .eq("psychologist_id", psicologoId)
    .single();

  if (pacienteError || !paciente) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  // 4) Obtener el cuestionario (WHO-5 por defecto)
  let cuestionarioId = parsed.data.cuestionarioId;
  if (!cuestionarioId) {
    const { data: cuestionario, error: cuestionarioError } = await supabaseAdmin
      .from("cuestionarios")
      .select("id")
      .eq("codigo", "WHO-5")
      .single();

    if (cuestionarioError || !cuestionario) {
      return NextResponse.json({ error: "Cuestionario WHO-5 no encontrado" }, { status: 404 });
    }
    cuestionarioId = cuestionario.id;
  }

  // 5) Determinar el canal de envío desde las preferencias
  const preferencias = paciente.metadata?.preferencias_cuestionario as { canal: string } | undefined;
  const canal = preferencias?.canal || "email";

  // 6) Verificar que el paciente tenga el medio de contacto necesario
  if (canal === "email" && !paciente.email) {
    return NextResponse.json({ error: "El paciente no tiene email registrado" }, { status: 400 });
  }
  if (canal === "whatsapp" && !paciente.whatsapp) {
    return NextResponse.json({ error: "El paciente no tiene WhatsApp registrado" }, { status: 400 });
  }

  // 7) Generar token y fecha de expiración
  const { token, expiracion } = generarTokenYExpiracion();

  // 8) Crear el link público en la base de datos
  const { data: link, error: linkError } = await supabaseAdmin
    .from("links_cuestionario")
    .insert({
      paciente_id: paciente.id,
      cuestionario_id: cuestionarioId,
      token,
      expira_en: expiracion,
    })
    .select("token")
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Error al generar el link" }, { status: 500 });
  }

  // 9) Construir la URL pública
  const { origin } = new URL(req.url);
  const linkPublico = `${origin}/cuestionario/${link.token}`;

  // 10) Enviar el cuestionario por el canal seleccionado
  try {
    await enviarCuestionarioPorCanal(paciente.email, paciente.whatsapp, canal, linkPublico);
    
    return NextResponse.json({
      success: true,
      message: `Cuestionario enviado por ${canal}`,
      link: linkPublico
    });
  } catch (error) {
    console.error("Error al enviar cuestionario:", error);
    return NextResponse.json({ error: "Error al enviar el cuestionario" }, { status: 500 });
  }
}
