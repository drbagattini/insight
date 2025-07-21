import { NextResponse } from 'next/server';

/**
 * Test endpoint to manually trigger the scheduled questionnaire processor
 * GET /api/test/scheduler - Trigger the scheduler manually for testing
 */
export async function GET() {
  try {
    console.log('🧪 Manual scheduler test triggered');
    
    // Call the process endpoint directly
    const processUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/envios_programados/process`;
    
    console.log(`📡 Calling process endpoint: ${processUrl}`);
    
    const response = await fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Manual-Test-Trigger'
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Process endpoint failed:', result);
      return NextResponse.json({
        success: false,
        error: 'Process endpoint failed',
        details: result
      }, { status: response.status });
    }

    console.log(`✅ Successfully processed ${result.processed || 0} scheduled sends`);
    
    return NextResponse.json({
      success: true,
      message: `Manual test completed. Processed ${result.processed || 0} scheduled sends`,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔥 Manual scheduler test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * POST endpoint for webhook-style calls (like from Supabase cron or Edge Functions)
 */
export async function POST(request: Request) {
  try {
    console.log('🚀 Webhook scheduler trigger received');
    
    // Get request body if any
    let requestData = {};
    try {
      requestData = await request.json();
    } catch {
      // No body or invalid JSON, that's okay
    }
    
    console.log('📦 Request data:', requestData);
    
    // Call the process endpoint directly
    const processUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/envios_programados/process`;
    
    console.log(`📡 Calling process endpoint: ${processUrl}`);
    
    const response = await fetch(processUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Webhook-Scheduler-Trigger'
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Process endpoint failed:', result);
      return NextResponse.json({
        success: false,
        error: 'Process endpoint failed',
        details: result,
        requestData
      }, { status: response.status });
    }

    console.log(`✅ Successfully processed ${result.processed || 0} scheduled sends`);
    
    return NextResponse.json({
      success: true,
      message: `Webhook trigger completed. Processed ${result.processed || 0} scheduled sends`,
      result,
      requestData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔥 Webhook scheduler trigger error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
