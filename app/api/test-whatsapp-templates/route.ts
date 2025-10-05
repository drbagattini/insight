import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  
  if (!token) {
    return NextResponse.json({ error: 'Missing WHATSAPP_ACCESS_TOKEN' }, { status: 500 });
  }

  if (!businessAccountId) {
    return NextResponse.json({ 
      error: 'Missing WHATSAPP_BUSINESS_ACCOUNT_ID',
      note: 'This is needed to list templates. Please add it to environment variables.'
    }, { status: 500 });
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${businessAccountId}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        error: 'Failed to fetch templates',
        details: errorData 
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      templates: data.data || [],
      count: data.data?.length || 0,
      templateNames: (data.data || []).map((t: any) => ({
        name: t.name,
        status: t.status,
        language: t.language
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error fetching templates',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
