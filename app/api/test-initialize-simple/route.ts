import { NextRequest, NextResponse } from 'next/server';

// Simulamos la función generateInitialMessage del endpoint initialize
function generateInitialMessage(patientData: any): string {
  // Mensaje inicial simple y directo como definimos
  return "Hola, he revisado el caso. ¿Qué te interesa explorar?";
}

export async function POST() {
  try {
    const mockPatientData = {
      patient: { name: "Pedro Subirá" },
      psychologist: { name: "Dr. Nicolás Bagattini" },
      intake: { datos: {} },
      questionnaires: [{ codigo: "WHO-5" }, { codigo: "PHQ-9" }]
    };

    const initialMessage = generateInitialMessage(mockPatientData);

    return NextResponse.json({
      test: 'initialize_endpoint',
      initialMessage,
      messageLength: initialMessage.length,
      comparison: {
        old_message_length: 547, // El mensaje largo anterior
        new_message_length: initialMessage.length,
        reduction: `${Math.round((1 - initialMessage.length / 547) * 100)}%`
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
