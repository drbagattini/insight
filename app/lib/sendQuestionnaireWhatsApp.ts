import { sendWhatsAppTemplate, WhatsAppParameter } from './whatsapp';

export async function sendQuestionnaireWhatsApp(
  phone: string,
  nombrePaciente: string, // Parameter for the body text
  token: string,          // Parameter for the dynamic part of the button URL
  language: string = 'es'
): Promise<void> {
  const bodyParams: WhatsAppParameter[] = [
    { type: 'text', text: nombrePaciente },
  ];

  const buttonParams: WhatsAppButtonParameter[] = [
    { type: 'payload', payload: token }, 
  ];

  await sendWhatsAppTemplate({
    to: phone,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'insight',
    languageCode: language,
    bodyParameters: bodyParams,
    buttonParameters: buttonParams,
  });
}
