import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers'; 
import { NextResponse, NextRequest } from 'next/server'; 
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import type { Database } from '@/types/supabase';
import type { ResponseRow } from '@/types/patient-responses';
import type { Session as NextAuthSession } from 'next-auth';

interface CustomSession extends NextAuthSession { 
  sbAccessToken?: string;
  sbRefreshToken?: string;
}

export const dynamic = 'force-dynamic'; // Force dynamic to ensure latest data

interface RouteHandlerParams {
  id: string;
}

export async function GET(
  request: NextRequest,
  context: any
) {
  const { id: patientId } = (context.params as RouteHandlerParams);
  console.log('[API /patients/[id]/responses] Route called for patientId:', patientId);

  const nextAuthSession = await getServerSession(authOptions) as CustomSession | null;

  if (!nextAuthSession) {
    console.log('[API /patients/[id]/responses] No NextAuth session found.');
    return NextResponse.json({ error: 'Unauthorized: No NextAuth session' }, { status: 401 });
  }

  if (!nextAuthSession.user || !nextAuthSession.user.id) { 
    console.log('[API /patients/[id]/responses] NextAuth session found, but user or user ID is missing.');
    return NextResponse.json({ error: 'Unauthorized: User or User ID missing in NextAuth session' }, { status: 401 });
  }
  const psychologistId = nextAuthSession.user.id; 
  console.log('[API /patients/[id]/responses] NextAuth session found. User ID (Psychologist ID):', psychologistId);

  const supabaseAccessToken = nextAuthSession.sbAccessToken;
  const supabaseRefreshToken = nextAuthSession.sbRefreshToken; 

  if (!supabaseAccessToken) {
    console.error('[API /patients/[id]/responses] Supabase access token not found in NextAuth session.');
    return NextResponse.json({ error: 'Server configuration error: Supabase token missing' }, { status: 500 });
  }
  console.log('[API /patients/[id]/responses] Supabase access token found in NextAuth session.');

  let supabase;
  try {
    supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          async get(name: string) { 
            const cookieStore = await cookies(); 
            return cookieStore.get(name)?.value;
          },
          async set(name: string, value: string, options: CookieOptions) {
            try {
              const cookieStore = await cookies();
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.warn(`[API /patients/[id]/responses] Error setting cookie (set: ${name}):`, error);
            }
          },
          async remove(name: string, options: CookieOptions) {
            try {
              const cookieStore = await cookies();
              cookieStore.set({ name, value: '', ...options, maxAge: 0 });
            } catch (error) {
              console.warn(`[API /patients/[id]/responses] Error removing cookie (remove: ${name}):`, error);
            }
          },
        },
      }
    );
  } catch (e: any) {
    console.error('[API /patients/[id]/responses] Error creating Supabase client:', e.message);
    return NextResponse.json({ error: 'Failed to initialize Supabase client', details: e.message }, { status: 500 });
  }

  console.log('[API /patients/[id]/responses] Attempting to set Supabase session manually with token...');
  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: supabaseAccessToken,
    refresh_token: supabaseRefreshToken || '', 
  });

  if (setSessionError) {
    console.error('[API /patients/[id]/responses] Error setting Supabase session:', setSessionError.message);
    return NextResponse.json({ error: 'Failed to set Supabase session', details: setSessionError.message }, { status: 500 });
  }
  console.log('[API /patients/[id]/responses] Supabase session presumably set. Verifying user...');

  const { data: { user: supabaseUser }, error: getUserError } = await supabase.auth.getUser();

  if (getUserError || !supabaseUser) {
    console.error('[API /patients/[id]/responses] Error verifying Supabase user or no user found after setSession:', getUserError?.message);
    return NextResponse.json({ error: 'Unauthorized: Failed to verify Supabase user', details: getUserError?.message }, { status: 401 });
  }

  console.log('[API /patients/[id]/responses] Supabase user verified:', supabaseUser.id);
  if (supabaseUser.id !== psychologistId) {
    console.error(`[API /patients/[id]/responses] Mismatch between NextAuth user ID (${psychologistId}) and Supabase user ID (${supabaseUser.id}) after setSession.`);
    return NextResponse.json({ error: 'User ID mismatch after session synchronization' }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const qcode = searchParams.get('qcode') || undefined;
    const fromDate = searchParams.get('fromDate') || undefined;
    const toDate = searchParams.get('toDate') || undefined; 
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    let from_date_param_for_sql = fromDate === 'all' ? undefined : fromDate;
    let to_date_param_for_sql = toDate; 

    if (from_date_param_for_sql && !from_date_param_for_sql.includes('T')) {
        from_date_param_for_sql = `${from_date_param_for_sql}T00:00:00.000Z`;
    }
    if (to_date_param_for_sql && !to_date_param_for_sql.includes('T')) { 
        to_date_param_for_sql = `${to_date_param_for_sql}T23:59:59.999Z`;
    }
    
    const countParams = {
      patient_id_param: patientId,
      qcode_param: qcode,
      from_date_param: from_date_param_for_sql 
    };
    console.log('[API /patients/[id]/responses] Fetching count with params:', countParams);
    const countRpcFullResponse = await supabase.rpc('get_patient_responses_count', countParams);

    if (countRpcFullResponse.error) {
      console.error('[API /patients/[id]/responses] Error fetching count via RPC:', countRpcFullResponse.error);
      return NextResponse.json({ error: 'Failed to fetch response count', details: countRpcFullResponse.error.message }, { status: 500 });
    }
    const totalCount = countRpcFullResponse.data;
    console.log('[API /patients/[id]/responses] Extracted Count from RPC (.data):', totalCount);

    const tableRpcParams = {
      patient_id_param: patientId,
      qcode_param: qcode,
      from_date_param: from_date_param_for_sql,
      max_results_param: limit,
      start_index_param: offset,
    };
    console.log('[API /patients/[id]/responses] Fetching table data with params:', tableRpcParams);
    const { data: tableData, error: tableError } = await supabase.rpc('get_patient_responses_table', tableRpcParams);
    
    if (tableError) {
      console.error('[API /patients/[id]/responses] Error fetching responses table via RPC:', tableError);
      return NextResponse.json({ error: 'Failed to fetch patient responses', details: tableError.message }, { status: 500 });
    }
    console.log('[API /patients/[id]/responses] Table data result:', JSON.stringify(tableData, null, 2));
    
    const actualResponses: ResponseRow[] = Array.isArray(tableData) ? tableData.map(row => ({
      id: row.id,
      date: row.date,
      questionnaire: row.questionnaire,
      score: row.score
    })) : [];
    
    console.log(
      '[API /patients/[id]/responses] Processed TABLE Data. Actual Responses Count:', 
      actualResponses.length, 
      'Total Count from count function:', 
      totalCount
    );

    return NextResponse.json({ 
      responses: actualResponses, 
      totalCount: totalCount || 0, 
      page, 
      limit 
    });
    
  } catch (error: any) {
    console.error('[API /patients/[id]/responses] Unexpected error during RPC calls or data processing:', error.message);
    return NextResponse.json({ error: 'Unexpected error during data retrieval', details: error.message }, { status: 500 });
  }
}