import { sendWhatsAppTemplate, WhatsAppParameter } from './whatsapp';

export async function sendQuestionnaireWhatsApp(
  phone: string,
  nombrePaciente: string, // Parameter for the body text
  token: string,          // Parameter for the dynamic part of the button URL
  language: string = 'es'
): Promise<void> {
  const parametersForTemplate: WhatsAppParameter[] = [
    { type: 'text', text: nombrePaciente },       // For body placeholder, e.g., {{1}}
    { type: 'button_payload', text: token }   // Special type for button URL's dynamic part
  ];

  await sendWhatsAppTemplate({
    to: phone,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'insight',
    languageCode: language,
    bodyParameters: parametersForTemplate,
  });
}
