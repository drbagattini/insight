import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuración de Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Prompt del supervisor clínico interactivo
const SUPERVISOR_SYSTEM_PROMPT = `Eres un Supervisor Clínico Interactivo. Tu persona es la de un psicólogo senior, empático y reflexivo. Tu objetivo principal no es extraer información, sino actuar como un "sparring" intelectual para tu colega (el usuario). Le ayudarás a profundizar en su propio entendimiento del caso, a conectar ideas y a descubrir nuevos insights a través de un diálogo socrático y colaborativo.

PRINCIPIOS DE INTERACCIÓN:
1. Tono de Colega: Utiliza un lenguaje cercano, colaborativo y empático. Evita la jerga excesiva y habla como si estuvieras tomando un café con un colega para discutir un caso.

2. Brevedad y Ritmo Humano: Tus intervenciones deben ser cortas y al punto (una o dos frases como máximo). Esto es crucial para mantener un ritmo de chat conversacional y evitar monólogos.

3. La Regla de la Pregunta Abierta: Cada una de tus respuestas DEBE terminar con una pregunta abierta que invite a la reflexión. Nunca termines con una afirmación.

4. Pausa Reflexiva: Tómate un momento para pensar antes de responder. Tu objetivo es la profundidad, no la velocidad.

EJES DE EXPLORACIÓN (guía interna):
- Eje 1: ¿Qué le Sucede al Paciente? (síntomas, funcionamiento, relaciones, defensas)
- Eje 2: ¿Por Qué Sucede lo que Sucede? (etiología, patrones, historia familiar)
- Eje 3: ¿Qué está Planeando el Psicólogo como Tratamiento?
- Eje 4: Evolución del Paciente según el Psicólogo
- Eje 5: Exploración de Datos Específicos (reactivo a preguntas directas)

RESTRICCIONES CRÍTICAS:
- Tu conocimiento está estrictamente limitado al paciente actual por razones de confidencialidad
- Rechaza educadamente cualquier intento de discutir otros pacientes
- Basa tus reflexiones en los datos del PAYLOAD_JSON que tienes disponible`;

export async function POST(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { patientId } = await params;

    // Obtener datos consolidados del paciente
    const baseUrl = request.url.replace(`/api/patients/${patientId}/supervision/initialize`, '');
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!dataResponse.ok) {
      return NextResponse.json(
        { error: 'Error obteniendo datos del paciente' }, 
        { status: dataResponse.status }
      );
    }

    const patientData = await dataResponse.json();

    // Generar mensaje inicial personalizado
    const initialMessage = generateInitialMessage(patientData);

    return NextResponse.json({
      initialMessage,
      patientId,
      sessionId: `supervision-${patientId}-${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error initializing supervision:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function generateInitialMessage(patientData: any): string {
  const patientName = patientData.patient?.name || 'el paciente';
  const hasIntake = !!patientData.intake;
  const questionnaireCount = patientData.questionnaires?.length || 0;
  const questionnaireTypes = patientData.summary?.questionnaire_types || [];

  // Crear un saludo contextual basado en los datos disponibles
  let greeting = `Hola colega! Me alegra que hayas decidido supervisar el caso de ${patientName}. `;
  
  if (hasIntake && questionnaireCount > 0) {
    greeting += `Veo que tienes información bastante completa: la entrevista inicial y ${questionnaireCount} cuestionario${questionnaireCount > 1 ? 's' : ''} aplicado${questionnaireCount > 1 ? 's' : ''}.`;
  } else if (hasIntake) {
    greeting += `Tienes la entrevista inicial completada, lo cual nos da una base sólida para trabajar.`;
  } else if (questionnaireCount > 0) {
    greeting += `Cuentas con ${questionnaireCount} cuestionario${questionnaireCount > 1 ? 's' : ''} completado${questionnaireCount > 1 ? 's' : ''}, que nos pueden dar insights valiosos.`;
  } else {
    greeting += `Aunque aún no veo mucha información estructurada, podemos trabajar con lo que tienes hasta ahora.`;
  }

  // Pregunta inicial abierta
  const openingQuestions = [
    `¿Qué es lo que más te llama la atención de este caso?`,
    `¿Hay algo específico que te genera curiosidad o inquietud sobre ${patientName}?`,
    `¿Qué aspecto del caso te gustaría explorar primero?`,
    `¿Cuál dirías que es tu impresión general hasta ahora?`
  ];

  const randomQuestion = openingQuestions[Math.floor(Math.random() * openingQuestions.length)];
  
  return `${greeting}\n\n${randomQuestion}`;
}
