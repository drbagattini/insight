import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { patientId = "2385677e-cf3e-45e3-8d28-9100afa90a3a" } = await request.json();
    
    // Simular la carga de datos del paciente para verificar OPD
    const baseUrl = request.url.replace('/api/test-opd-debug', '');
    
    console.log('[TEST] Testing OPD questionnaire access for patient:', patientId);
    
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!dataResponse.ok) {
      return NextResponse.json({
        error: 'Could not load patient data',
        status: dataResponse.status
      });
    }

    const patientData = await dataResponse.json();
    
    // Analizar cuestionarios disponibles
    const questionnaires = patientData.questionnaires || [];
    const questionnaireInfo = questionnaires.map((q: any) => ({
      codigo: q.codigo,
      titulo: q.titulo,
      puntuacion: q.puntuacion,
      fecha: q.fecha,
      hasOPD: q.codigo?.toLowerCase().includes('opd')
    }));
    
    // Buscar específicamente OPD
    const opdQuestionnaire = questionnaires.find((q: any) => 
      q.codigo?.toLowerCase().includes('opd') ||
      q.titulo?.toLowerCase().includes('opd')
    );
    
    return NextResponse.json({
      patientId,
      totalQuestionnaires: questionnaires.length,
      questionnaireInfo,
      opdFound: !!opdQuestionnaire,
      opdData: opdQuestionnaire || null,
      allCodes: questionnaires.map((q: any) => q.codigo),
      debug: {
        searchingFor: 'opd',
        searchMethod: 'codigo.toLowerCase().includes("opd")',
        patientName: patientData.patient?.name
      }
    });

  } catch (error) {
    console.error('[TEST] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
