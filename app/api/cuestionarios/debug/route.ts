import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

// Debug endpoint without authentication
export async function GET() {
  try {
    console.log('🔍 Debug endpoint called');
    
    // Test basic Supabase connection - get ALL questionnaires first
    const { data: allData, error: allError } = await supabaseAdmin
      .from('cuestionarios')
      .select('id, codigo, titulo, activo')
      .order('codigo');

    if (allError) {
      console.error('❌ Error getting all questionnaires:', allError);
      return NextResponse.json({ 
        error: 'Database error', 
        details: allError.message 
      }, { status: 500 });
    }

    // Filter OYS questionnaires
    const oysQuests = allData?.filter(q => q.codigo && q.codigo.includes('OYS')) || [];
    const activeOYS = oysQuests.filter(q => q.activo);
    
    console.log(`Total questionnaires: ${allData?.length || 0}`);
    console.log(`OYS questionnaires: ${oysQuests.length}`);
    console.log(`Active OYS: ${activeOYS.length}`);

    // Get active questionnaires
    const { data, error } = await supabaseAdmin
      .from('cuestionarios')
      .select('id, codigo, titulo, activo')
      .eq('activo', true)
      .limit(10);

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    console.log('✅ Found questionnaires:', data?.length || 0);
    
    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      questionnaires: data || [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
