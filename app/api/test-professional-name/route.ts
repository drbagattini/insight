import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST PROFESSIONAL NAME] Verificando extracción del nombre del profesional...');

    const patientId = "1"; // ID de prueba

    // Simular la lógica del endpoint de inicialización
    const baseUrl = request.url.replace('/api/test-professional-name', '');
    
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!dataResponse.ok) {
      return NextResponse.json({ 
        error: 'No se pudo obtener datos del paciente', 
        status: dataResponse.status 
      }, { status: 500 });
    }

    const patientData = await dataResponse.json();

    // Aplicar la misma lógica de extracción de nombres que en initialize
    const patientName = patientData?.patient?.name || patientData?.patient?.nombre || 'el paciente';
    
    // Nueva lógica mejorada para el nombre del profesional
    const professionalName = 
      patientData?.professional?.name || 
      patientData?.professional?.nombre ||
      patientData?.psychologist?.name ||
      patientData?.psychologist?.nombre ||
      (patientData?.psychologist?.first_name && patientData?.psychologist?.last_name ? 
        `${patientData.psychologist.first_name} ${patientData.psychologist.last_name}`.trim() : null) ||
      'Doctor/a';

    // Mensaje inicial que se generaría
    const initialMessage = `Hola ${professionalName}, he leído toda la información acerca de ${patientName}. ¿Qué te interesa explorar ahora?`;

    return NextResponse.json({
      success: true,
      message: "🔍 TEST EXTRACCIÓN NOMBRE PROFESIONAL",
      data_analysis: {
        patient_name: patientName,
        professional_name: professionalName,
        initial_message: initialMessage
      },
      data_sources_checked: {
        professional_name: patientData?.professional?.name || null,
        professional_nombre: patientData?.professional?.nombre || null,
        psychologist_name: patientData?.psychologist?.name || null,
        psychologist_nombre: patientData?.psychologist?.nombre || null,
        psychologist_first_name: patientData?.psychologist?.first_name || null,
        psychologist_last_name: patientData?.psychologist?.last_name || null
      },
      available_fields: {
        patient_keys: patientData?.patient ? Object.keys(patientData.patient) : [],
        professional_keys: patientData?.professional ? Object.keys(patientData.professional) : [],
        psychologist_keys: patientData?.psychologist ? Object.keys(patientData.psychologist) : [],
        root_keys: Object.keys(patientData)
      },
      fallback_used: professionalName === 'Doctor/a',
      recommendation: professionalName === 'Doctor/a' ? 
        "❌ Usando fallback - verificar estructura de datos del profesional" :
        "✅ Nombre del profesional extraído correctamente"
    });

  } catch (error) {
    console.error('[TEST PROFESSIONAL NAME] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
