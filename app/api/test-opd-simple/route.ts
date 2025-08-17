import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simular los datos que típicamente se encuentran en cuestionarios
    const mockQuestionnaires = [
      { codigo: "WHO-5", titulo: "WHO-5 Bienestar", puntuacion: 8 },
      { codigo: "PHQ-9", titulo: "PHQ-9 Depresión", puntuacion: 12 },
      { codigo: "GAD-7", titulo: "GAD-7 Ansiedad", puntuacion: 6 },
      { codigo: "OPD-2", titulo: "Diagnóstico Psicodinámico Operacionalizado", puntuacion: null },
      { codigo: "Beck", titulo: "Inventario de Depresión de Beck", puntuacion: 15 }
    ];
    
    // Simular la búsqueda de OPD
    const messageText = "cuéntame sobre el cuestionario opd";
    const needsPatientData = messageText.includes('opd');
    
    const opdQuestionnaire = mockQuestionnaires.find(q => 
      q.codigo?.toLowerCase().includes('opd')
    );
    
    return NextResponse.json({
      test: 'OPD Detection Test',
      messageText,
      needsPatientData,
      mockQuestionnaires,
      opdFound: !!opdQuestionnaire,
      opdData: opdQuestionnaire,
      searchResults: {
        byCode: mockQuestionnaires.filter(q => q.codigo?.toLowerCase().includes('opd')),
        byTitle: mockQuestionnaires.filter(q => q.titulo?.toLowerCase().includes('opd')),
        allCodes: mockQuestionnaires.map(q => q.codigo)
      },
      recommendations: {
        currentTrigger: 'messageText.includes("opd")',
        suggestedTriggers: [
          'messageText.includes("opd")',
          'messageText.includes("operacionalizado")',
          'messageText.includes("psicodinamico")',
          'messageText.includes("diagnostico psicodinamico")'
        ]
      }
    });

  } catch (error: unknown) {
    console.error('[TEST] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Error interno del servidor', details: message },
      { status: 500 }
    );
  }
}
