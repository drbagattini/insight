import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { enviarCuestionarioPorCanal, generarTokenYExpiracion } from "@/app/lib/utils/cuestionarios";

// Schema para validación - versión interna sin requerir autenticación
const enviarCuestionarioSchema = z.object({
  pacienteId: z.string().uuid(),
  cuestionarioId: z.string().uuid(),
  canal: z.enum(["email", "whatsapp"]),
  envioProgramadoId: z.string().uuid().optional(), // ID del envío programado que origina este envío
});

export async function POST(req: NextRequest) {
  console.log('🔄 POST /api/internal/enviar-cuestionario called');
  
  // 1) Validar body
  const body = await req.json();
  console.log('Body received:', body);
  
  const parsed = enviarCuestionarioSchema.safeParse(body);
  if (!parsed.success) {
    console.error('Schema validation failed:', parsed.error.flatten());
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  
  const { pacienteId, cuestionarioId, canal, envioProgramadoId } = parsed.data;

  try {
    // 2) Obtener datos del paciente
    const { data: paciente, error: pacienteError } = await supabaseAdmin
      .from("patients")
      .select("id, name, email, whatsapp, metadata")
      .eq("id", pacienteId)
      .single();

    if (pacienteError || !paciente) {
      console.error('Patient not found:', pacienteError);
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // 3) Obtener datos del cuestionario
    const { data: cuestionario, error: cuestionarioError } = await supabaseAdmin
      .from("cuestionarios")
      .select("id, titulo")
      .eq("id", cuestionarioId)
      .single();
    
    if (cuestionarioError || !cuestionario) {
      console.error('Questionnaire not found:', cuestionarioError);
      return NextResponse.json({ error: "Cuestionario no encontrado" }, { status: 404 });
    }

    // 4) Verificar que el paciente tenga el medio de contacto necesario
    if (canal === "email" && !paciente.email) {
      return NextResponse.json({ error: "El paciente no tiene email registrado" }, { status: 400 });
    }
    if (canal === "whatsapp" && !paciente.whatsapp) {
      return NextResponse.json({ error: "El paciente no tiene WhatsApp registrado" }, { status: 400 });
    }
    // Validar consentimiento de WhatsApp
    if (canal === "whatsapp" && !(paciente.metadata?.whatsappConsent === true)) {
      return NextResponse.json({ error: "El paciente no autorizó recibir notificaciones por WhatsApp" }, { status: 400 });
    }

    // 5) Generar token y fecha de expiración
    const { token, expiracion } = generarTokenYExpiracion();

    // 6) Crear el link público en la base de datos
    const insertData: any = {
      paciente_id: paciente.id,
      cuestionario_id: cuestionario.id,
      token,
      expira_en: expiracion,
      enviado_desde: canal,
    };

    if (envioProgramadoId) {
      insertData.envio_programado_id = envioProgramadoId;
    }

    const { data: link, error: linkError } = await supabaseAdmin
      .from("links_cuestionario")
      .insert(insertData)
      .select("token")
      .single();

    if (linkError || !link) {
      console.error("Database error generating link:", linkError);
      return NextResponse.json({ 
        error: `Error al generar el link: ${linkError?.message || 'Unknown error'}` 
      }, { status: 500 });
    }

    // 7) Construir la URL pública
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const linkPublico = `${baseUrl}/cuestionario/${link.token}`;

    // 8) Enviar el cuestionario por el canal seleccionado
    console.log("Sending questionnaire:", {
      patient: paciente.name,
      questionnaire: cuestionario.titulo,
      channel: canal,
      link: linkPublico,
      email: paciente.email,
      whatsapp: paciente.whatsapp
    });

    await enviarCuestionarioPorCanal(
      paciente.email,
      paciente.whatsapp,
      paciente.name ?? '',
      cuestionario.titulo,
      canal,
      linkPublico
    );

    console.log(`✅ Questionnaire sent successfully to ${paciente.name} via ${canal}`);

    return NextResponse.json({
      success: true,
      message: `Cuestionario enviado por ${canal}`,
      link: linkPublico,
      paciente: paciente.name,
      cuestionario: cuestionario.titulo
    });

  } catch (error) {
    console.error("Error in internal send endpoint:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
