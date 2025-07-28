import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const patientId = 'test-patient-id'; // Usar un ID de prueba
    const baseUrl = request.url.replace('/api/test-data-sources', '');
    
    console.log('🔍 DIAGNÓSTICO DE FUENTES DE DATOS');
    console.log('=====================================');
    
    const results = {
      timestamp: new Date().toISOString(),
      baseUrl,
      dataSources: {
        informesData: { status: 'unknown', data: null, error: null },
        evolutionsHistory: { status: 'unknown', data: null, error: null }
      },
      summary: {
        totalSources: 2,
        workingSources: 0,
        failingSources: 0
      }
    };

    // 1. Probar endpoint de datos de informes
    console.log('📊 Probando: /api/informes/datos/[patientId]');
    try {
      const informesResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Cookie': request.headers.get('Cookie') || ''
        }
      });
      
      if (informesResponse.ok) {
        const informesData = await informesResponse.json();
        results.dataSources.informesData = {
          status: 'working',
          data: {
            hasPatient: !!informesData.patient,
            hasIntake: !!informesData.intake,
            questionnairesCount: informesData.questionnaires?.length || 0,
            hasPsychologist: !!informesData.psychologist,
            hasSummary: !!informesData.summary
          },
          error: null
        };
        results.summary.workingSources++;
        console.log('✅ Informes Data: OK');
        console.log(`   - Patient: ${!!informesData.patient}`);
        console.log(`   - Intake: ${!!informesData.intake}`);
        console.log(`   - Questionnaires: ${informesData.questionnaires?.length || 0}`);
        console.log(`   - Psychologist: ${!!informesData.psychologist}`);
      } else {
        results.dataSources.informesData = {
          status: 'failing',
          data: null,
          error: `HTTP ${informesResponse.status}: ${informesResponse.statusText}`
        };
        results.summary.failingSources++;
        console.log(`❌ Informes Data: FAILED (${informesResponse.status})`);
      }
    } catch (error: any) {
      results.dataSources.informesData = {
        status: 'failing',
        data: null,
        error: error.message
      };
      results.summary.failingSources++;
      console.log(`❌ Informes Data: ERROR - ${error.message}`);
    }

    // 2. Probar endpoint de evoluciones clínicas
    console.log('📝 Probando: /api/patients/[patientId]/evolutions/history');
    try {
      const evolutionsResponse = await fetch(`${baseUrl}/api/patients/${patientId}/evolutions/history`, {
        headers: {
          'Authorization': request.headers.get('Authorization') || '',
          'Cookie': request.headers.get('Cookie') || ''
        }
      });
      
      if (evolutionsResponse.ok) {
        const evolutionsData = await evolutionsResponse.json();
        results.dataSources.evolutionsHistory = {
          status: 'working',
          data: {
            evolutionsCount: Array.isArray(evolutionsData) ? evolutionsData.length : 0,
            isArray: Array.isArray(evolutionsData),
            sampleEvolution: Array.isArray(evolutionsData) && evolutionsData.length > 0 
              ? {
                  hasContent: !!evolutionsData[0].contenido,
                  hasDate: !!evolutionsData[0].fecha,
                  hasType: !!evolutionsData[0].tipo
                }
              : null
          },
          error: null
        };
        results.summary.workingSources++;
        console.log('✅ Evolutions History: OK');
        console.log(`   - Count: ${Array.isArray(evolutionsData) ? evolutionsData.length : 0}`);
      } else {
        results.dataSources.evolutionsHistory = {
          status: 'failing',
          data: null,
          error: `HTTP ${evolutionsResponse.status}: ${evolutionsResponse.statusText}`
        };
        results.summary.failingSources++;
        console.log(`❌ Evolutions History: FAILED (${evolutionsResponse.status})`);
      }
    } catch (error: any) {
      results.dataSources.evolutionsHistory = {
        status: 'failing',
        data: null,
        error: error.message
      };
      results.summary.failingSources++;
      console.log(`❌ Evolutions History: ERROR - ${error.message}`);
    }

    // 3. Resumen final
    console.log('📋 RESUMEN FINAL:');
    console.log(`   - Fuentes funcionando: ${results.summary.workingSources}/${results.summary.totalSources}`);
    console.log(`   - Fuentes fallando: ${results.summary.failingSources}/${results.summary.totalSources}`);
    
    const overallStatus = results.summary.failingSources === 0 ? 'ALL_WORKING' : 
                         results.summary.workingSources === 0 ? 'ALL_FAILING' : 'PARTIAL_WORKING';
    
    console.log(`   - Estado general: ${overallStatus}`);
    console.log('=====================================');

    return NextResponse.json({
      ...results,
      overallStatus,
      recommendations: overallStatus === 'ALL_WORKING' 
        ? ['✅ Todas las fuentes de datos están funcionando correctamente']
        : results.summary.failingSources > 0 
        ? [
            '⚠️ Algunas fuentes de datos no están funcionando',
            'Revisar autenticación y permisos',
            'Verificar que los endpoints existan y estén configurados correctamente'
          ]
        : ['❌ Ninguna fuente de datos está funcionando - revisar configuración completa']
    });

  } catch (error: any) {
    console.error('❌ Error en diagnóstico completo:', error);
    return NextResponse.json(
      { 
        error: 'Error en diagnóstico de fuentes de datos',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
