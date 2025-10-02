import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabaseAdmin = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const patientId = "2385677e-cf3e-45e3-8d28-9100afa90a3a";
    
    console.log('[TEST] Checking questionnaires in database for patient:', patientId);
    
    // Verificar cuestionarios directamente en la base de datos
    const { data: questionnaires, error } = await supabaseAdmin
      .from('cuestionarios_respuestas')
      .select('*')
      .eq('patient_id', patientId);
    
    if (error) {
      console.error('[TEST] Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Analizar los cuestionarios encontrados
    const questionnaireAnalysis = questionnaires?.map((q: any) => ({
      id: q.id,
      codigo: q.codigo,
      titulo: q.titulo,
      puntuacion: q.puntuacion,
      fecha: q.created_at,
      hasOPD: q.codigo?.toLowerCase().includes('opd') || q.titulo?.toLowerCase().includes('opd'),
      rawData: q
    })) || [];
    
    // Buscar específicamente OPD
    const opdQuestionnaires = questionnaires?.filter((q: any) => 
      q.codigo?.toLowerCase().includes('opd') ||
      q.titulo?.toLowerCase().includes('opd')
    ) || [];
    
    // También buscar por patrones similares
    const possibleOPD = questionnaires?.filter((q: any) => 
      q.codigo?.toLowerCase().includes('operacionalizada') ||
      q.titulo?.toLowerCase().includes('operacionalizada') ||
      q.codigo?.toLowerCase().includes('psicodinamica') ||
      q.titulo?.toLowerCase().includes('psicodinamica')
    ) || [];
    
    return NextResponse.json({
      patientId,
      totalQuestionnaires: questionnaires?.length || 0,
      allCodes: questionnaires?.map((q: any) => q.codigo) || [],
      allTitles: questionnaires?.map((q: any) => q.titulo) || [],
      opdFound: opdQuestionnaires.length > 0,
      opdQuestionnaires,
      possibleOPD,
      questionnaireAnalysis,
      searchPatterns: {
        'opd': questionnaires?.filter((q: any) => q.codigo?.toLowerCase().includes('opd')).length || 0,
        'operacionalizada': questionnaires?.filter((q: any) => q.codigo?.toLowerCase().includes('operacionalizada')).length || 0,
        'psicodinamica': questionnaires?.filter((q: any) => q.codigo?.toLowerCase().includes('psicodinamica')).length || 0
      }
    });

  } catch (error: unknown) {
    console.error('[TEST] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error interno del servidor', details: message },
      { status: 500 }
    );
  }
}
