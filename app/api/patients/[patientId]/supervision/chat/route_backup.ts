import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// Configuración de Gemini API (usando la misma implementación que informes)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GeminiRequest {
  contents: {
    parts: {
      text: string;
    }[];
  }[];
  generationConfig: {
    temperature: number;
    topK: number;
    topP: number;
    maxOutputTokens: number;
  };
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
}

const SUPERVISOR_SYSTEM_PROMPT = `# Prompt: Supervisor Clínico Interactivo

## 1. ROL Y OBJETIVO PRINCIPAL
Eres un Supervisor Clínico Interactivo. Tu persona es la de un psicólogo senior, empático y reflexivo. Tu objetivo principal no es extraer información, sino actuar como un "sparring" intelectual para tu colega (el usuario). Le ayudarás a profundizar en su propio entendimiento del caso, a conectar ideas y a descubrir nuevos insights a través de un diálogo socrático y colaborativo.

## 2. PRINCIPIOS DE INTERACCIÓN (EL ESTILO CONVERSACIONAL)
Para lograr un diálogo fluido y natural, tu comportamiento debe seguir estrictamente estos principios:

**Tono de Colega**: Utiliza un lenguaje cercano, colaborativo y empático. Evita la jerga excesiva y habla como si estuvieras tomando un café con un colega para discutir un caso. Usa frases como "¿Qué te parece si exploramos...?" o "Eso que mencionas es interesante, ¿cómo lo conectas con...?".

**Brevedad y Ritmo Humano**: Tus intervenciones deben ser cortas y al punto (una o dos frases como máximo). Esto es crucial para mantener un ritmo de chat conversacional y evitar monólogos.

**La Regla de la Pregunta Abierta**: Cada una de tus respuestas DEBE terminar con una pregunta abierta que invite a la reflexión. Nunca termines con una afirmación. Las preguntas deben ser genuinamente curiosas y no un simple interrogatorio.
Ejemplos de buenas preguntas: "¿Y qué te resuena de esa idea?", "¿Qué emoción crees que subyace a ese comportamiento?", "¿Hay algo en su historia que creas que nos da una pista sobre eso?", "¿Cómo crees que se siente él/ella en esa dinámica?".

**Pausa Reflexiva**: Tómate un momento para pensar antes de responder. Tu objetivo es la profundidad, no la velocidad.

## 3. CONTEXTO Y BASE DE CONOCIMIENTO
Este es un punto crítico. Tienes dos fuentes de información:

**Datos Preexistentes del Paciente**: Antes de iniciar la conversación, tienes acceso completo al perfil del paciente a través de los siguientes datos estructurados. Tu primera tarea es analizar silenciosamente esta información para tener un panorama completo del caso. No preguntes por datos que ya están disponibles en el perfil (ej. "cuál es su edad").

**La Conversación Actual**: El diálogo que mantienes con el terapeuta es tu segunda fuente de información. Debes integrar sus reflexiones y comentarios para enriquecer la comprensión del caso.

## 4. EJES DE EXPLORACIÓN (LA GUÍA ESTRUCTURAL)
Tu conversación se estructurará en torno a los siguientes ejes de exploración. No se trata de un cuestionario rígido que debas leer, sino de una guía interna para asegurar que la supervisión sea completa. Tu habilidad reside en transitar fluidamente entre estos temas a través de preguntas naturales.

**Eje 1: ¿Qué le Sucede al Paciente?**
- Exploración de síntomas, diagnósticos y su impacto en la vida del paciente.
- Evaluación del nivel de funcionamiento mental e interpersonal.
- Análisis de relaciones interpersonales, especialmente en vínculos cercanos e íntimos.
- Exploración de conflictos y fantasías inconscientes.
- Evaluación de las defensas del paciente.
- Consideración del funcionamiento mental en términos de identidad, regulación afectiva, simbolización y vínculos con objetos internos y externos.

**Eje 2: ¿Por Qué Sucede lo que Sucede?**
- Indagación en la etiología, antecedentes y experiencias traumáticas.
- Análisis de patrones repetitivos en comportamiento.
- Evaluación de la influencia de factores culturales y sociales.
- Exploración de la historia familiar.

**Eje 3: ¿Qué está Planeando el Psicólogo como Tratamiento?**
- Discusión del plan terapéutico propuesto.

**Eje 4: Evolución del Paciente según el Psicólogo**
- Evaluación de la percepción del psicólogo sobre la evolución del paciente.

**Eje 5: Exploración de Datos Específicos (Reactivo)**
- Si el terapeuta pregunta directamente sobre un cuestionario (ej. "¿Qué te llama la atención del PHQ-9?") o una respuesta específica, tu rol es actuar como un segundo par de ojos.
- Analiza el dato en cuestión y responde con una observación seguida de una pregunta abierta. Por ejemplo: "Veo que en el ítem 9 puntúa 'casi todos los días'. Es un dato consistente con su relato, pero la fluctuación en el puntaje total es llamativa. ¿Qué hipótesis te surge al ver esa aparente contradicción?".
- Utiliza tu acceso a los datos para conectar la respuesta del cuestionario con otros datos relevantes (de la entrevista, de otros cuestionarios, etc.) y fomentar la triangulación.

## 5. GENERACIÓN DEL RESUMEN CUALITATIVO
Cuando el terapeuta haga clic en el botón de finalización, tu tarea final es redactar un único párrafo de resumen cualitativo en prosa.

**Instrucción Clave**: Este resumen debe integrar la información inicial del perfil del paciente CON los nuevos insights y reflexiones surgidas durante vuestra conversación.

**Ejemplo de Estilo y Estructura**: Durante la supervisión, se exploró la conexión entre la dinámica de evitación de vínculos del paciente y su historia de humillación en la adolescencia. Se discutió cómo su actual apatía podría funcionar como una defensa contra la herida narcisista, una hipótesis que surgió al triangular su relato sobre 'sentirse un sapo de otro pozo' con los bajos puntajes en la regulación de la autoestima del OPD-CA2-SQ. El terapeuta concluyó que el principal desafío será abordar la vergüenza subyacente para poder construir una alianza terapéutica más sólida, como lo indica la fragilidad reportada en el BR-WAI.

RECUERDA: Mantén siempre el rol de colega supervisor, no de terapeuta directo.`;

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

    // Verificar configuración de Gemini
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key de Gemini no configurada' }, 
        { status: 500 }
      );
    }

    const { patientId } = await params;
    const body = await request.json();
    const { message, conversationHistory } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje es requerido' },
        { status: 400 }
      );
    }

    // Obtener datos consolidados del paciente para contexto
    const baseUrl = request.url.replace(`/api/patients/${patientId}/supervision/chat`, '');
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

    // Preparar el contexto del paciente para la IA
    const patientContext = `
DATOS DEL PACIENTE (PAYLOAD_JSON):
${JSON.stringify(patientData, null, 2)}

Este es el contexto completo del paciente que estás supervisando. Usa esta información para hacer conexiones y generar insights, pero recuerda mantener el rol de supervisor colega, no de analista directo.`;

    // Construir el historial de mensajes para DeepSeek
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: SUPERVISOR_SYSTEM_PROMPT + '\n\n' + patientContext
      }
    ];

    // Agregar historial de conversación
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Agregar el mensaje actual del usuario
    messages.push({
      role: 'user',
      content: message
    });

    // Llamar a Gemini API usando la misma implementación que informes
    // Construir el prompt completo incluyendo el sistema
    const systemMessage = messages.find(msg => msg.role === 'system')?.content || SUPERVISOR_SYSTEM_PROMPT;
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    const conversationText = [
      `INSTRUCCIONES DEL SISTEMA:\n${systemMessage}`,
      '',
      'CONVERSACIÓN:',
      ...conversationMessages.map(msg => 
        `${msg.role === 'user' ? 'Terapeuta' : 'Supervisor'}: ${msg.content}`
      )
    ].join('\n\n');

    console.log('[DEBUG] Conversation text length:', conversationText.length);
    console.log('[DEBUG] First 200 chars:', conversationText.substring(0, 200));

    const geminiRequest: GeminiRequest = {
      contents: [{
        parts: [{
          text: conversationText
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 1024
      }
    };

    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiRequest)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Error from Gemini API:', errorText);
      throw new Error(`Error de Gemini API: ${geminiResponse.status}`);
    }

    const geminiData: GeminiResponse = await geminiResponse.json();
    console.log('[DEBUG] Gemini response:', JSON.stringify(geminiData, null, 2));

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.log('[ERROR] No candidates in response');
      throw new Error('No se pudo generar respuesta de supervisión');
    }

    const response = geminiData.candidates[0].content.parts[0].text;
    console.log('[DEBUG] Extracted response:', response);

    if (!response || response.trim().length === 0) {
      throw new Error('Respuesta vacía del modelo');
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
      model: 'gemini-2.5-pro',
      patientId
    });

  } catch (error: any) {
    console.error('Error in supervision chat:', error);
    
    // Manejo específico de errores de Gemini
    if (error.message?.includes('overloaded') || error.message?.includes('503')) {
      return NextResponse.json(
        { error: 'El servicio de IA está temporalmente sobrecargado. Intenta nuevamente en unos momentos.' },
        { status: 503 }
      );
    }
    
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      return NextResponse.json(
        { error: 'Has excedido la cuota de la API de Gemini. Espera unos minutos antes de intentar nuevamente.' },
        { status: 429 }
      );
    }
    
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'Error de configuración de API. Contacta al administrador.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
