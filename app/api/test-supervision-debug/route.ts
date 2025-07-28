import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación (deshabilitado para prueba)
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    // }

    // Obtener patientId de query params
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'patientId es requerido' }, { status: 400 });
    }

    console.log('[DEBUG TEST] Testing data loading for patient:', patientId);

    const baseUrl = request.url.replace('/api/test-supervision-debug', '');
    
    // 1. Probar endpoint de datos de informes
    console.log('[DEBUG TEST] Testing informes endpoint...');
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    let informesData = null;
    let informesError = null;

    if (dataResponse.ok) {
      informesData = await dataResponse.json();
      console.log('[DEBUG TEST] Informes data loaded successfully');
      console.log('[DEBUG TEST] Patient name:', informesData.patient?.name);
      console.log('[DEBUG TEST] Has intake:', !!informesData.intake);
      console.log('[DEBUG TEST] Questionnaires count:', informesData.questionnaires?.length || 0);
      console.log('[DEBUG TEST] Questionnaire types:', informesData.questionnaires?.map((q: any) => q.codigo) || []);
    } else {
      informesError = `Status: ${dataResponse.status}, Text: ${await dataResponse.text()}`;
      console.log('[DEBUG TEST] Informes endpoint failed:', informesError);
    }

    // 2. Probar endpoint de evoluciones
    console.log('[DEBUG TEST] Testing evolutions endpoint...');
    let evolutionsData = null;
    let evolutionsError = null;

    try {
      const evolutionsResponse = await fetch(`${baseUrl}/api/patients/${patientId}/evolutions/history`, {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Cookie': request.headers.get('Cookie') || ''
        }
      });
      
      if (evolutionsResponse.ok) {
        evolutionsData = await evolutionsResponse.json();
        console.log('[DEBUG TEST] Evolutions loaded:', evolutionsData.length);
      } else {
        evolutionsError = `Status: ${evolutionsResponse.status}, Text: ${await evolutionsResponse.text()}`;
        console.log('[DEBUG TEST] Evolutions endpoint failed:', evolutionsError);
      }
    } catch (error) {
      evolutionsError = `Exception: ${error}`;
      console.log('[DEBUG TEST] Evolutions exception:', error);
    }

    // 3. Buscar WHO-5 específicamente
    let who5Data = null;
    if (informesData?.questionnaires) {
      who5Data = informesData.questionnaires.find((q: any) => 
        q.codigo?.toLowerCase().includes('who') || 
        q.titulo?.toLowerCase().includes('who')
      );
      console.log('[DEBUG TEST] WHO-5 found:', !!who5Data);
      if (who5Data) {
        console.log('[DEBUG TEST] WHO-5 details:', {
          codigo: who5Data.codigo,
          titulo: who5Data.titulo,
          puntuacion: who5Data.puntuacion,
          fecha: who5Data.fecha_completado
        });
      }
    }

    // 4. Verificar estructura de intake
    let intakeStructure = null;
    if (informesData?.intake) {
      intakeStructure = {
        hasId: !!informesData.intake.id,
        hasEstado: !!informesData.intake.estado,
        hasDatos: !!informesData.intake.datos,
        datosKeys: informesData.intake.datos ? Object.keys(informesData.intake.datos) : []
      };
      console.log('[DEBUG TEST] Intake structure:', intakeStructure);
    }

    return NextResponse.json({
      success: true,
      patientId,
      informes: {
        success: !!informesData,
        error: informesError,
        hasPatient: !!informesData?.patient,
        hasIntake: !!informesData?.intake,
        questionnairesCount: informesData?.questionnaires?.length || 0,
        questionnaireCodes: informesData?.questionnaires?.map((q: any) => q.codigo) || []
      },
      evolutions: {
        success: !!evolutionsData,
        error: evolutionsError,
        count: evolutionsData?.length || 0
      },
      who5: {
        found: !!who5Data,
        data: who5Data ? {
          codigo: who5Data.codigo,
          titulo: who5Data.titulo,
          puntuacion: who5Data.puntuacion,
          fecha: who5Data.fecha_completado
        } : null
      },
      intake: {
        found: !!informesData?.intake,
        structure: intakeStructure
      },
      fullDataSample: {
        patient: informesData?.patient || null,
        intake: informesData?.intake ? {
          id: informesData.intake.id,
          estado: informesData.intake.estado,
          datosKeys: informesData.intake.datos ? Object.keys(informesData.intake.datos) : []
        } : null,
        questionnaires: informesData?.questionnaires?.slice(0, 2) || []
      }
    });

  } catch (error) {
    console.error('[DEBUG TEST] Error:', error);
    return NextResponse.json(
      { error: `Error interno: ${error}` }, 
      { status: 500 }
    );
  }
}
