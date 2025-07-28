import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    // Verificar que la API key esté configurada
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Inicializar Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Hacer una prueba simple
    const result = await model.generateContent('Responde solo "Hola, funciono correctamente"');
    const response = result.response.text();

    return NextResponse.json({
      success: true,
      response,
      model: 'gemini-1.5-pro',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error testing Gemini:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error desconocido',
        success: false 
      },
      { status: 500 }
    );
  }
}
