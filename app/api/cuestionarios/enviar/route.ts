import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import nodemailer, { Transporter } from 'nodemailer';
import crypto from 'crypto';

// Configurar Brevo SMTP
let brevoTransporter: Transporter | null = null;
if (
  process.env.BREVO_SMTP_HOST &&
  process.env.BREVO_SMTP_PORT &&
  process.env.BREVO_SMTP_USER &&
  process.env.BREVO_SMTP_PASS
) {
  brevoTransporter = nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST,
    port: parseInt(process.env.BREVO_SMTP_PORT, 10),
    secure: parseInt(process.env.BREVO_SMTP_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });
} else {
  console.warn('Faltan variables de entorno para configurar Brevo SMTP');
}

// Schema para validación
const enviarCuestionarioSchema = z.object({
  pacienteId: z.string().uuid("ID de paciente inválido"),
  cuestionarioId: z.string().uuid().optional(),
  canal: z.enum(['email','whatsapp']).optional(),
});

// Función para generar un token único y calcular fecha de expiración
function generarTokenYExpiracion() {
  const token = crypto.randomUUID();
  const expiracion = new Date();
  expiracion.setDate(expiracion.getDate() + 7); // Expira en 7 días
  return { token, expiracion: expiracion.toISOString() };
}

// Función para enviar el cuestionario por email o WhatsApp
async function enviarCuestionarioPorCanal(
  email: string | null,
  whatsapp: string | null,
  nombrePaciente: string,
  nombreCuestionario: string,
  canal: string,
  linkPublico: string
) {
  if (canal === 'email' && email) {
    console.log('Enviando email:', { to: email, plantilla: nombreCuestionario, link: linkPublico });
    if (brevoTransporter) {
      await brevoTransporter.sendMail({
        from: `"Insight | Centro UNO" <${process.env.EMAIL_SENDER ?? process.env.BREVO_SMTP_USER}>`,
        to: email,
        subject: 'Completá tu cuestionario de seguimiento',
        html: `
          <p style="margin-bottom: 12px;">Hola <strong>${nombrePaciente}</strong>,</p>
          <p style="margin-bottom: 12px;">Te invitamos a completar el cuestionario "<strong>${nombreCuestionario}</strong>", como parte de tu proceso en Centro UNO.</p>
          <p style="margin-bottom: 12px;">Esta información nos permitirá acompañarte mejor en tu evolución.</p>
          <p style="margin-bottom: 12px;"><strong><a href="${linkPublico}" style="text-decoration: none; color: #007bff;">Haz clic aquí para acceder al cuestionario</a></strong>.</p>
          <p style="margin-bottom: 12px;">Si tenés dudas, podés consultar con tu profesional o comunicarte con el Centro UNO al 2401 2966.</p>
          <p style="margin-bottom: 12px;">Gracias por tu tiempo.</p>
          <p style="margin-bottom: 0;">El equipo de Insight</p>
        `
      });
      console.log('Email enviado con éxito a', email);
    } else {
      console.error('Brevo transporter no está configurado. No se pudo enviar email.');
    }
  } else if (canal === 'whatsapp' && whatsapp) {
    // Validar nombre de plantilla (template)
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'insight';
    console.log('Env WHATSAPP_TEMPLATE_NAME:', process.env.WHATSAPP_TEMPLATE_NAME);
    console.log('Using template fallback to:', templateName);
    console.log('Env NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    // Validación de variables de entorno para WhatsApp
    const phoneNumberIdRaw = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessTokenRaw = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!phoneNumberIdRaw || !accessTokenRaw) {
      console.error('Configuración de WhatsApp incompleta:', { phoneNumberIdRaw, accessTokenRaw: accessTokenRaw ? 'set' : 'missing' });
      throw new Error('Faltan variables de entorno de WhatsApp');
    }
    const phoneNumberId = phoneNumberIdRaw;
    const accessToken = accessTokenRaw;
    const formattedWhatsapp = whatsapp.startsWith('+') ? whatsapp.slice(1) : whatsapp;
    console.log("WhatsApp send payload:", { canal, whatsapp: formattedWhatsapp, linkPublico, template: templateName });
    // envío por WhatsApp usando Meta Graph API y plantilla aprobada
    let res;
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: whatsapp.startsWith('+') ? whatsapp.substring(1) : whatsapp, // Asegurar que no tenga el '+'
        type: 'template',
        template: {
          name: templateName, // Usar la variable de entorno
          language: { code: 'en' }, // English translation
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: nombrePaciente },
                { type: 'text', text: nombreCuestionario }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: '0',
              parameters: [
                // Send only the questionnaire ID as the single parameter for the button URL
                { type: 'text', text: linkPublico.split('/').pop() || '' }
              ]
            }
          ]
        }
      };

      console.log('WhatsApp send payload (all params without name):', JSON.stringify(payload, null, 2));
      res = await fetch(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
    } catch (networkError) {
      console.error('Error de red enviando a Meta API:', networkError);
      throw new Error('Error de red al enviar WhatsApp');
    }

    if (!res.ok) {
      const text = await res.text();
      let errMsg: string;
      try {
        const json = JSON.parse(text);
        errMsg = json?.error?.message || text;
      } catch {
        errMsg = text;
      }
      console.error('Error en Meta API:', {
        status: res.status,
        statusText: res.statusText,
        errorResponse: text
      });
      throw new Error(`Meta API Error (${res.status}): ${errMsg}`);
    }

    const responseData = await res.json();
    console.log('Respuesta exitosa de Meta API:', responseData);
  } else {
    console.warn('Medio de envío no soportado o datos faltantes');
  }
  return true;
}

// La función enviarCuestionarioPorCanal se utiliza internamente por POST.
// Si se necesita para pruebas unitarias externas, considerar moverla a un archivo de utilidades.

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
