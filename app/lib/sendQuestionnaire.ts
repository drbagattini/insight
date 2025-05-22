import { sendWhatsAppTemplate } from './whatsapp';

export const sendQuestionnaireWhatsApp = async (phone: string, link: string, language: string): Promise<void> => {
  await sendWhatsAppTemplate({
    to: phone,
    templateName: 'insight',
    languageCode: language,
    parameters: [
      {
        type: 'text',
        text: link,
      },
    ],
  });
};
