import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { enviarCuestionarioPorCanal, generarTokenYExpiracion } from "@/app/lib/utils/cuestionarios";

// Schema para validación
const enviarCuestionarioSchema = z.object({
  pacienteId: z.string().uuid("ID de paciente inválido"),
  cuestionarioId: z.string().uuid().optional(),
  canal: z.enum(['email','whatsapp']).optional(),
});

export async function POST(req: NextRequest) {
  // 1) Verificar sesión y autorización
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const psicologoId = session.user.id;

  // 2) Validar body
  const body = await req.json();
  console.log('POST /api/cuestionarios/enviar body:', body);
  const parsed = enviarCuestionarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  console.log('Valores para enviarCuestionarioPorCanal:', parsed.data);

  // 3) Verificar que el paciente pertenezca al psicólogo
  const { data: paciente, error: pacienteError } = await supabaseAdmin
    .from("patients")
    .select("id, name, email, whatsapp, metadata")
    .eq("id", parsed.data.pacienteId)
    .eq("psychologist_id", psicologoId)
    .single();

  if (pacienteError || !paciente) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }

  // 4) Obtener el cuestionario (WHO-5 por defecto)
  let cuestionarioId = parsed.data.cuestionarioId;
  let nombreCuestionario: string | undefined;

  if (!cuestionarioId) {
    // Si no viene ID, buscar WHO-5 por defecto y obtener su nombre
    const { data: cuestionarioDefault, error: cuestionarioDefaultError } = await supabaseAdmin
      .from("cuestionarios")
      .select("id, titulo") // Obtener ID y Nombre
      .eq("codigo", "WHO-5")
      .single();

    if (cuestionarioDefaultError || !cuestionarioDefault) {
      console.error("Error al buscar cuestionario default WHO-5:", cuestionarioDefaultError);
      return NextResponse.json({ error: "Cuestionario WHO-5 no encontrado" }, { status: 404 });
    }
    cuestionarioId = cuestionarioDefault.id;
    nombreCuestionario = cuestionarioDefault.titulo; // Guardar nombre
    console.log(`Cuestionario por defecto encontrado: ID=${cuestionarioId}, Nombre=${nombreCuestionario}`);

  } else {
    // Si viene ID, buscar ese cuestionario específico para obtener su nombre
    const { data: cuestionarioEspecifico, error: cuestionarioEspecificoError } = await supabaseAdmin
      .from("cuestionarios")
      .select("titulo") // Solo necesitamos el nombre
      .eq("id", cuestionarioId)
      .single();
    
    if (cuestionarioEspecificoError || !cuestionarioEspecifico) {
      return NextResponse.json({ error: "Cuestionario especificado no encontrado" }, { status: 404 }); 
    } else {
      nombreCuestionario = cuestionarioEspecifico.titulo; // Guardar nombre
      console.log(`Cuestionario específico encontrado: ID=${cuestionarioId}, Nombre=${nombreCuestionario}`);
    }
  }

  // 5) Determinar el canal de envío desde las preferencias
  const preferencias = paciente.metadata?.preferencias_cuestionario as { canal: string } | undefined;
  const canal = parsed.data.canal || preferencias?.canal || "email";

  // 6) Verificar que el paciente tenga el medio de contacto necesario
  if (canal === "email" && !paciente.email) {
    return NextResponse.json({ error: "El paciente no tiene email registrado" }, { status: 400 });
  }
  if (canal === "whatsapp" && !paciente.whatsapp) {
    return NextResponse.json({ error: "El paciente no tiene WhatsApp registrado" }, { status: 400 });
  }
  // 6.b) Validar consentimiento de WhatsApp
  if (canal === "whatsapp" && !(paciente.metadata?.whatsappConsent === true)) {
    return NextResponse.json({ error: "El paciente no autorizó recibir notificaciones por WhatsApp" }, { status: 400 });
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
  const baseUrl = process.env.NODE_ENV !== 'production'
    ? new URL(req.url).origin
    : process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  console.log('Computed baseUrl:', baseUrl);
  const linkPublico = `${baseUrl}/cuestionario/${link.token}`;

  // 10) Enviar el cuestionario por el canal seleccionado
  try {
    console.log("Valores para enviarCuestionarioPorCanal:", {
      nombrePacienteCheck: paciente.name,
      nombreCuestionarioCheck: nombreCuestionario,
      canalCheck: canal,
      linkPublicoCheck: linkPublico,
      emailCheck: paciente.email,
      whatsappCheck: paciente.whatsapp
    });

    await enviarCuestionarioPorCanal(
      paciente.email,
      paciente.whatsapp,
      paciente.name ?? '',
      nombreCuestionario ?? 'Nombre No Encontrado', // Usar un placeholder más claro si falla
      canal,
      linkPublico
    );

    return NextResponse.json({
      success: true,
      message: `Cuestionario enviado por ${canal}`,
      link: linkPublico
    });
  } catch (error) {
    console.error("Error al enviar cuestionario:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
