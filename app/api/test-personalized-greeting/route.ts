import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[TEST PERSONALIZED GREETING] Verificando estructura de datos...');

    // Simular datos típicos del endpoint /api/informes/datos/[patientId]
    // Probando ambas estructuras: 'name' y 'nombre'
    const mockPatientDataWithName = {
      patient: {
        id: "123",
        name: "María González",
        age: 28,
      },
      professional: {
        id: "456", 
        name: "Dr. Carlos Mendoza",
      },
    };
    
    const mockPatientDataWithNombre = {
      patient: {
        id: "123",
        nombre: "Pedro Martínez",
        edad: 35,
      },
      professional: {
        id: "456", 
        nombre: "Dra. Ana López",
      },
    };

    // Función de personalización (misma lógica que en initialize)
    function generatePersonalizedMessage(patientData: any): string {
      const patientName = patientData?.patient?.name || patientData?.patient?.nombre || 'el paciente';
      const professionalName = patientData?.professional?.name || patientData?.professional?.nombre || 'colega';
      
      return `Hola ${professionalName}, he leído toda la información acerca de ${patientName}. ¿Qué te interesa explorar ahora?`;
    }

    const personalizedMessageWithName = generatePersonalizedMessage(mockPatientDataWithName);
    const personalizedMessageWithNombre = generatePersonalizedMessage(mockPatientDataWithNombre);

    return NextResponse.json({
      success: true,
      message: "🎯 TEST SALUDO PERSONALIZADO",
      data: {
        test_with_name_structure: {
          data: mockPatientDataWithName,
          extracted_names: {
            patient: mockPatientDataWithName?.patient?.name,
            professional: mockPatientDataWithName?.professional?.name
          },
          personalized_greeting: personalizedMessageWithName
        },
        test_with_nombre_structure: {
          data: mockPatientDataWithNombre,
          extracted_names: {
            patient: mockPatientDataWithNombre?.patient?.nombre,
            professional: mockPatientDataWithNombre?.professional?.nombre
          },
          personalized_greeting: personalizedMessageWithNombre
        }
      },
      next_steps: [
        "Verificar que la estructura de datos real coincida con el mock",
        "Confirmar que los nombres se extraen correctamente",
        "Probar con datos reales del endpoint /api/informes/datos/[patientId]"
      ]
    });

  } catch (error) {
    console.error('[TEST PERSONALIZED GREETING] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
