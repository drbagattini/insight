import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener patientId de query params
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    if (!patientId) {
      return NextResponse.json({ error: 'patientId requerido' }, { status: 400 });
    }

    // Obtener datos del paciente
    const baseUrl = request.url.replace('/api/test-supervision-data', '');
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!dataResponse.ok) {
      return NextResponse.json({ error: 'Error obteniendo datos' }, { status: 500 });
    }

    const patientData = await dataResponse.json();
    
    // Buscar cuestionarios específicos
    const questionnaires = patientData.questionnaires || [];
    const who5 = questionnaires.find((q: any) => 
      q.questionnaire_name?.toLowerCase().includes('who') ||
      q.questionnaire_name?.toLowerCase().includes('5')
    );
    
    const opd = questionnaires.find((q: any) => 
      q.questionnaire_name?.toLowerCase().includes('opd')
    );

    return NextResponse.json({
      patient: {
        name: patientData.patient?.name,
        age: patientData.patient?.age
      },
      totalQuestionnaires: questionnaires.length,
      questionnaireNames: questionnaires.map((q: any) => q.questionnaire_name),
      who5Data: who5 ? {
        name: who5.questionnaire_name,
        totalScore: who5.total_score,
        responses: who5.responses,
        date: who5.created_at
      } : null,
      opdData: opd ? {
        name: opd.questionnaire_name,
        totalScore: opd.total_score,
        responses: opd.responses,
        date: opd.created_at
      } : null
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
