import { NextRequest, NextResponse } from 'next/server';

function generateInitialMessage(patientData: any): string {
  // Mensaje inicial según el nuevo prompt del supervisor colaborativo
  return "Hola, he leído toda la información acerca del paciente. ¿Qué te interesa explorar ahora?";
}

export async function GET() {
  try {
    const mockPatientData = {
      patient: {
        name: "Pedro Subiria",
        age: 6
      }
    };

    const initialMessage = generateInitialMessage(mockPatientData);

    console.log('[TEST NEW INITIAL MESSAGE] Generated:', initialMessage);

    return NextResponse.json({
      success: true,
      message: initialMessage,
      message_length: initialMessage.length,
      comparison: {
        old_message: "Hola, he revisado el caso. ¿Qué te interesa explorar?",
        new_message: initialMessage,
        improvement: "Más específico y colaborativo"
      }
    });

  } catch (error) {
    console.error('[TEST NEW INITIAL MESSAGE] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
