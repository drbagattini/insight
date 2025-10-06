import { NextResponse } from 'next/server';

// Define and export a more flexible parameter type
export type WhatsAppParameter = {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video'; // Add other types as needed
  text?: string;
  // Add other fields like 'link', 'filename', 'id' for media if needed
};

export type WhatsAppButtonParameter = {
  type: 'payload' | 'text'; // payload for dynamic URLs, text for static parts
  payload?: string; 
  text?: string; 
};

interface SendWhatsAppTemplateArgs {
  to: string;
  templateName: string;
  languageCode?: string; // Make language optional, default to 'en'
  bodyParameters?: WhatsAppParameter[];
  buttonParameters?: WhatsAppButtonParameter[]; // Specifically for button dynamic content
}

export const sendWhatsAppTemplate = async ({
  to,
  templateName,
  languageCode = 'en', // Default to English (template is in English)
  bodyParameters,
  buttonParameters,
}: SendWhatsAppTemplateArgs) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  console.log('Preparando envío WhatsApp:', { to, templateName, languageCode, phoneNumberId, tokenSet: !!token, bodyParameters, buttonParameters });

  if (!token || !phoneNumberId) {
    throw new Error('Missing WhatsApp configuration');
  }

  const components = [];
  if (bodyParameters && bodyParameters.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParameters,
    });
  }

  // Assuming the button is at index '0' and is a URL button
  // And it expects ONE dynamic part for its URL
  if (buttonParameters && buttonParameters.length > 0) {
    // The API expects parameters for button to be a list, even if only one button token
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0', // Assuming your button is the first one (index 0)
      parameters: buttonParameters.map(p => ({ type: 'text', text: p.text || p.payload })) // Adapt based on API needs, often 'text' type for payload
    });
  }

  const requestBody = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
      // Only include components if there are any
      ...(components.length > 0 && { components }), 
    },
  };
  console.log('WhatsApp requestBody:', requestBody);

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    }
  );
  console.log('WhatsApp response ok?:', response.ok, 'status:', response.status);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error sending WhatsApp template:', JSON.stringify(errorData, null, 2));
    console.error('Request body sent:', JSON.stringify(requestBody, null, 2));
    throw new Error(`Failed to send WhatsApp message: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  console.log('WhatsApp enviado con éxito:', data);
  return data;
};
