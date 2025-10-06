import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { phoneNumber, testLink } = body;

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'insight_test_2';

  if (!token || !phoneNumberId) {
    return NextResponse.json({ 
      error: 'Missing WhatsApp configuration',
      hasToken: !!token,
      hasPhoneNumberId: !!phoneNumberId
    }, { status: 500 });
  }

  const requestBody = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'en', // Template is in English
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: 'John Doe' // Parámetro 1: Nombre del paciente
            },
            {
              type: 'text',
              text: 'WHO-5 Wellbeing Index' // Parámetro 2: Nombre del cuestionario
            }
          ]
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            {
              type: 'text',
              text: testLink || 'test-123-abc' // Parte dinámica del link
            }
          ]
        }
      ]
    },
  };

  console.log('🧪 TEST: Sending WhatsApp with requestBody:', JSON.stringify(requestBody, null, 2));

  try {
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

    const responseData = await response.json();

    console.log('🧪 TEST: WhatsApp API Response:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp API Error',
        statusCode: response.status,
        apiError: responseData,
        requestSent: requestBody,
        details: {
          errorMessage: responseData.error?.message || 'Unknown error',
          errorCode: responseData.error?.code || 'N/A',
          errorType: responseData.error?.type || 'N/A',
          errorFbtraceId: responseData.error?.fbtrace_id || 'N/A'
        }
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp sent successfully',
      whatsappResponse: responseData,
      requestSent: requestBody,
      templateUsed: templateName,
      phoneNumberId: phoneNumberId
    });

  } catch (error) {
    console.error('🧪 TEST: Exception:', error);
    return NextResponse.json({
      success: false,
      error: 'Exception occurred',
      message: error instanceof Error ? error.message : String(error),
      requestSent: requestBody
    }, { status: 500 });
  }
}
