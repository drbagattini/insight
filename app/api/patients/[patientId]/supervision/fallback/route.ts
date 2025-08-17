import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

/**
 * ENDPOINT DE FALLBACK PARA SUPERVISIÓN CLÍNICA
 * 
 * Este endpoint se activa cuando hay problemas de cuota con la API de Gemini.
 * Proporciona respuestas estructuradas basadas en patrones clínicos conocidos
 * mientras se resuelven los problemas de API.
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ patientId: string }> }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { patientId } = await context.params;
    const body = await request.json();
    const { message, conversationHistory } = body;

    console.log('[FALLBACK SUPERVISION] Activado para patientId:', patientId);
    console.log('[FALLBACK SUPERVISION] Mensaje del usuario:', message);

    // Generar respuesta de fallback basada en patrones comunes
    const fallbackResponse = generateFallbackResponse(message, conversationHistory);

    return NextResponse.json({
      response: fallbackResponse,
      isFallback: true,
      notice: "⚠️ Modo de respuesta simplificada activo debido a saturación de API"
    });

  } catch (error) {
    console.error('[FALLBACK SUPERVISION] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function generateFallbackResponse(userMessage: string, conversationHistory: any[]): string {
  const message = userMessage.toLowerCase();
  
  // Patrones de respuesta basados en temas comunes de supervisión
  if (message.includes('contratransferencia') || message.includes('siento')) {
    return `Entiendo que estás explorando aspectos contratransferenciales con este paciente. 

Las reacciones emocionales que experimentas como terapeuta son información valiosa sobre la dinámica terapéutica. 

**Algunas preguntas para reflexionar:**
- ¿Qué específicamente sientes cuando interactúas con este paciente?
- ¿Hay algún patrón en estas reacciones que puedas identificar?
- ¿Cómo crees que estas reacciones podrían estar relacionadas con la historia o estilo relacional del paciente?

*Nota: Esta es una respuesta simplificada. Para un análisis más profundo basado en los datos específicos del paciente, intenta nuevamente cuando la API esté disponible.*`;
  }

  if (message.includes('diagnóstico') || message.includes('evaluación')) {
    return `Te acompaño en la reflexión diagnóstica sobre este caso.

**Elementos clave a considerar:**
- Síntomas presentados y su evolución temporal
- Funcionamiento interpersonal y patrones relacionales
- Factores precipitantes y mantenedores
- Recursos y fortalezas del paciente

¿Qué aspecto específico del cuadro clínico te genera más dudas o te gustaría explorar con mayor profundidad?

*Nota: Para un análisis detallado basado en los cuestionarios específicos del paciente, intenta nuevamente cuando la API esté disponible.*`;
  }

  if (message.includes('intervención') || message.includes('técnica') || message.includes('estrategia')) {
    return `Reflexionemos sobre las posibles intervenciones terapéuticas para este caso.

**Consideraciones importantes:**
- Fase actual del proceso terapéutico
- Motivación y disposición al cambio del paciente
- Recursos disponibles y limitaciones
- Objetivos terapéuticos priorizados

¿Hay alguna intervención específica que hayas considerado o alguna dificultad particular que encuentras en el abordaje?

*Nota: Para recomendaciones específicas basadas en el perfil completo del paciente, intenta nuevamente cuando la API esté disponible.*`;
  }

  if (message.includes('resistencia') || message.includes('difícil') || message.includes('bloqueo')) {
    return `Las resistencias y dificultades en el proceso terapéutico son oportunidades de comprensión profunda.

**Posibles enfoques:**
- Explorar el significado de la resistencia para el paciente
- Revisar si el timing o enfoque de las intervenciones es adecuado
- Considerar aspectos transferenciales y contratransferenciales
- Evaluar si hay necesidades no atendidas

¿Puedes describir más específicamente qué tipo de resistencia o dificultad estás observando?

*Nota: Para un análisis detallado del caso específico, intenta nuevamente cuando la API esté disponible.*`;
  }

  // Respuesta general para otros casos
  return `Gracias por compartir tu reflexión sobre este caso clínico.

Como supervisor, me interesa acompañarte en esta exploración. Para poder ofrecerte la mejor orientación, me gustaría entender mejor:

**¿Podrías ser más específico sobre:**
- ¿Qué aspecto particular del caso te interesa explorar?
- ¿Hay alguna duda clínica específica que tengas?
- ¿Qué te llama la atención o te genera curiosidad sobre este paciente?

Tu pregunta me ayudará a enfocar mejor nuestra conversación de supervisión.

*Nota: Esta es una respuesta general. Para análisis específicos basados en los datos completos del paciente (cuestionarios, evolución, etc.), intenta nuevamente cuando la API esté disponible.*`;
};
