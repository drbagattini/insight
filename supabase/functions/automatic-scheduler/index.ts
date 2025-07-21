// Deno Edge Function for automatic questionnaire scheduling

// Declare Deno global for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

// @ts-ignore - Deno modules work in Edge Runtime
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore - Deno modules work in Edge Runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Automatic scheduler started')
    
    // Get the app URL from environment
    const appUrl = Deno.env.get('NEXT_PUBLIC_APP_URL')
    if (!appUrl) {
      console.error('❌ NEXT_PUBLIC_APP_URL environment variable not set')
      return new Response(
        JSON.stringify({ 
          error: 'NEXT_PUBLIC_APP_URL environment variable not set',
          success: false 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📡 Calling process endpoint: ${appUrl}/api/envios_programados/process`)
    
    // Call the Next.js API endpoint to process scheduled sends
    const response = await fetch(`${appUrl}/api/envios_programados/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    })

    const result = await response.json()
    console.log('📊 Process result:', result)

    if (!response.ok) {
      console.error('❌ Process endpoint failed:', result)
      return new Response(
        JSON.stringify({ 
          error: 'Process endpoint failed',
          details: result,
          success: false 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Successfully processed ${result.processed || 0} scheduled sends`)
    
    return new Response(
      JSON.stringify({ 
        message: `Processed ${result.processed || 0} scheduled sends`,
        success: true,
        result
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('🔥 Automatic scheduler error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
