import nodemailer, { Transporter } from 'nodemailer';

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
    secure: parseInt(process.env.BREVO_SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });
} else {
  console.warn('Faltan variables de entorno para configurar Brevo SMTP');
}

/**
 * Envía un cuestionario por correo electrónico o WhatsApp.
 * @param email - Correo electrónico del destinatario (para envío por email)
 * @param whatsapp - Número de WhatsApp del destinatario (para envío por WhatsApp)
 * @param nombrePaciente - Nombre del paciente que recibirá el cuestionario
 * @param nombreCuestionario - Nombre del cuestionario a enviar
 * @param canal - Canal de envío ('email' o 'whatsapp')
 * @param linkPublico - URL del cuestionario
 * @returns Promise<boolean> - true si el envío fue exitoso
 */
export async function enviarCuestionarioPorCanal(
  email: string | null,
  whatsapp: string | null,
  nombrePaciente: string,
  nombreCuestionario: string,
  canal: string,
  linkPublico: string
): Promise<boolean> {
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
      return true;
    } else {
      console.error('Brevo transporter no está configurado. No se pudo enviar email.');
      return false;
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
      console.error('Configuración de WhatsApp incompleta:', { 
        phoneNumberIdRaw, 
        accessTokenRaw: accessTokenRaw ? 'set' : 'missing' 
      });
      throw new Error('Faltan variables de entorno de WhatsApp');
    }
    
    const phoneNumberId = phoneNumberIdRaw;
    const accessToken = accessTokenRaw;
    const version = 'v18.0';
    
    try {
      const response = await fetch(
        `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: whatsapp,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en' },
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
                  index: '0', // Assuming it's the first button
                  parameters: [
                    { type: 'text', text: linkPublico } // This is for the button's dynamic URL part
                  ]
                }
              ]
            }
          }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error al enviar WhatsApp:', data);
        throw new Error(`Error al enviar WhatsApp: ${JSON.stringify(data)}`);
      }
      
      console.log('WhatsApp enviado con éxito:', data);
      return true;
    } catch (error) {
      console.error('Error al enviar WhatsApp:', error);
      throw error;
    }
  } else {
    console.error('Canal no soportado o falta información de contacto:', { canal, email, whatsapp });
    return false;
  }
}

/**
 * Genera un token único y calcula la fecha de expiración.
 * @returns Un objeto con el token y la fecha de expiración en formato ISO string.
 */
export function generarTokenYExpiracion() {
  const token = crypto.randomUUID();
  const expiracion = new Date();
  expiracion.setDate(expiracion.getDate() + 7); // Expira en 7 días
  return { token, expiracion: expiracion.toISOString() };
}

// Función para calcular la próxima fecha basada en la frecuencia
export function computeNextDate(frequency: string, currentDate: Date = new Date()): Date {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'semanal':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'quincenal':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'mensual':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'trimestral':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    default:
      // Default to monthly if frequency is not recognized
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  return nextDate;
}
