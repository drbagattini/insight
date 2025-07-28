import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock conversation history para probar
    const mockConversationHistory = [
      {
        role: 'user',
        content: 'Resúmeme por favor la entrevista inicial'
      },
      {
        role: 'assistant', 
        content: 'Claro. Aquí tienes un resumen de la entrevista inicial centrado en los puntos clave para la formulación del caso. Estamos ante un adolescente cursando un primer episodio de depresión mayor, de carácter grave, con ideación suicida pasiva y un significativo deterioro funcional. La sintomatología es clara: anhedonia generalizada (abandono del básquet, "la comida no tiene sabor"), abulia y apatía marcadas, alteraciones del sueño y concentración, y sentimientos de desesperanza. El contexto familiar muestra dinámicas complejas: padres separados con conflictos persistentes, una madre que parece proyectar sus propias dificultades emocionales, y un padre más contenedor pero geográficamente distante.'
      },
      {
        role: 'user',
        content: 'Qué me puedes decir del cuestionario OPD?'
      },
      {
        role: 'assistant',
        content: 'El OPD-CA2-SQ revela un perfil psicodinámico significativo. Los puntajes más elevados se concentran en las dificultades de regulación emocional y en los patrones relacionales disfuncionales. Específicamente, vemos puntuaciones altas en "regulación de la autoestima" (indicando fragilidad narcisista) y en "contacto" (sugiriendo dificultades para establecer vínculos genuinos). Esto se alinea perfectamente con su relato de sentirse "un sapo de otro pozo" y su tendencia al aislamiento social. La puntuación en "regulación de impulsos" también es relevante, aunque no crítica, lo que explica por qué la ideación suicida se mantiene en un nivel pasivo sin planes concretos.'
      }
    ];

    const testPayload = {
      conversationHistory: mockConversationHistory
    };

    console.log('[TEST SYNTHESIS] Payload:', JSON.stringify(testPayload, null, 2));

    // Test que el payload es válido
    if (!testPayload.conversationHistory || testPayload.conversationHistory.length < 2) {
      return NextResponse.json({
        error: 'Test failed: insufficient conversation history',
        received: testPayload.conversationHistory?.length || 0
      }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Test synthesis endpoint ready',
      conversationLength: testPayload.conversationHistory.length,
      payload: testPayload,
      status: 'ready_for_synthesis'
    });

  } catch (error) {
    console.error('[TEST SYNTHESIS] Error:', error);
    return NextResponse.json(
      { error: 'Error in test synthesis endpoint' },
      { status: 500 }
    );
  }
}
