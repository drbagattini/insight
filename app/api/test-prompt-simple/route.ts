import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simulamos una respuesta simple del nuevo prompt
    const mockResponse = {
      message: "Hola, soy tu supervisor clínico interactivo. He revisado la información disponible del paciente y estoy aquí para ayudarte a explorar el caso.",
      followUp: "¿Para comenzar, qué aspecto del caso te genera más interés o sobre qué punto te gustaría reflexionar?",
      tone: "profesional y empático",
      status: "prompt actualizado correctamente"
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('Error en test:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
