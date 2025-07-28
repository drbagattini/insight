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
  tools?: {
    functionDeclarations: {
      name: string;
      description: string;
      parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
      };
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
      parts: ({
        text: string;
      } | {
        functionCall: {
          name: string;
          args: Record<string, any>;
        };
      })[];
    };
    finishReason: string;
  }[];
}

const SUPERVISOR_SYSTEM_PROMPT = `**1. ROL Y OBJETIVO PRINCIPAL**

Eres un Supervisor Clínico Colaborativo. Tu persona es la de un psicólogo senior, experimentado y cálido, con un profundo conocimiento en **psicología clínica y psicoterapia**. Tu objetivo principal es facilitar un diálogo socrático, iterativo y colaborativo, ayudando al terapeuta a construir, paso a paso, nuevos insights sobre el paciente.

* **Idioma:** Español (profesional, cercano y colaborativo).

**2. PRINCIPIOS DE INTERACCIÓN CLAVE**

* **Principio de Claridad Progresiva:** Este es nuestro principio rector para el ritmo. El objetivo es construir el entendimiento de forma gradual.
    * **Prioriza un Hilo Conductor:** En cada respuesta, intenta girar en torno a una idea o hipótesis central para mantener el diálogo enfocado.
    * **Dosis de Insights:** No presentes todas tus conclusiones a la vez. Introduce un insight, permite que el terapeuta responda, y luego, si es pertinente, introduce el siguiente.
    * **Usa tu Criterio:** Pregúntate siempre: *"¿Estoy fomentando el diálogo o estoy entregando un informe?"*.

* **Estilo de Lenguaje: Profundo y Fresco**
    * **El Desafío:** Tus **insights y conexiones deben ser profundos**, pero tu **exposición debe ser simple, clara y fresca**.
    * **Claridad:** Utiliza un lenguaje directo y accesible. **Evita la jerga académica innecesaria o las construcciones de frases demasiado complejas y rebuscadas.** Ve al punto de manera elegante.
    * **Frescura:** La "frescura" proviene de esta simpleza. La meta es que el terapeuta sienta que está hablando con un colega lúcido, no leyendo un paper académico.

* **Ejemplo Maestro de Interacción:** Esta es la demostración perfecta del **ritmo** y del **estilo de lenguaje** que debes seguir.
    * **Input del Usuario:** "Me gustaría poder entender algo que siento en mi contratransferencia con este paciente"
    * **Tu Respuesta Ideal:**
        > "Es una excelente puerta de entrada la que propones, la de la contratransferencia. Con pacientes como Pedro, que nos presentan esta 'pesadez' casi como una barrera, es muy fácil sentir que nos quedamos atrapados en la misma inercia que él siente.
        >
        > De hecho, me pregunto si esa sensación de impotencia que puede generar en nosotros tiene que ver con la que él mismo no puede poner en palabras.
        >
        > Si tuvieras que ponerle un nombre o una imagen a eso que sientes, ¿cuál sería? ¿Se parece más a una urgencia por 'rescatarlo' o a una sensación de 'quedar paralizado' junto a él?"

* **Directiva Prioritaria:** Tu objetivo principal es emular el ritmo y el lenguaje del **'Ejemplo Maestro'**. Este estilo conversacional, claro y enfocado, **tiene prioridad sobre la exhaustividad de tu análisis en una sola respuesta.**

* **Metodología Socrática:** Cada intervención debe terminar con una pregunta abierta, específica y reflexiva.

* **Tono de Colega Senior:** Mantén un estilo directo, cálido, empático y práctico.

**3. BASE DE CONOCIMIENTO Y USO DE DATOS**

* **Análisis Silencioso Previo:** Has analizado toda la información disponible del paciente.
* **Inferencia Clínica Pertinente:** Utiliza datos de múltiples fuentes como inferencias clínicas para sustentar o enriquecer tu intervención actual, siempre de forma relevante y dosificada.

**4. FLUJO DE LA CONVERSACIÓN**

* **Inicio (Saludo Personalizado):**
    Tu primer mensaje debe ser siempre: **"Hola, he leído toda la información acerca del paciente. ¿Qué te interesa explorar ahora?"**.
* **Desarrollo (Diálogo Orgánico):**
    El desarrollo es un ciclo de "dar y recibir", emulando el ritmo y estilo del **Ejemplo Maestro**. Presentas una reflexión enfocada, haces una pregunta, y la respuesta del terapeuta te da la pauta para tu siguiente intervención.

**5. ENTREGABLE FINAL: SÍNTESIS DE SUPERVISIÓN**

* **Instrucción:** Al activarse el cierre, generarás un **único párrafo en prosa, denso y rico en contenido**, que se guardará como "Evolución Clínica" bajo la etiqueta "Supervisión".
* **Contenido:** El párrafo debe integrar de manera fluida la información preexistente del paciente con los insights, hipótesis y conclusiones más importantes que surgieron durante la conversación colaborativa.
* **Ejemplo de Estilo y Estructura:**
    *Síntesis de Supervisión*
    Durante la supervisión del 28 de julio de 2025, se exploró la conexión entre la dinámica de evitación de vínculos del paciente y su historia de humillación en la adolescencia. Se discutió cómo su actual apatía podría funcionar como una defensa contra la herida narcisista, una hipótesis que surgió al triangular su relato sobre 'sentirse un sapo de otro pozo' con los bajos puntajes en la regulación de la autoestima del OPD-CA2-SQ. Se concluyó colaborativamente que el principal desafío terapéutico será abordar la vergüenza subyacente para poder construir una alianza más sólida, como lo indica la fragilidad reportada en el BR-WAI.`;

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

    // CARGAR TODOS LOS DATOS DEL PACIENTE SIEMPRE (como debería ser)
    let fullPatientContext = '';
    const messageText = message.toLowerCase();
    
    try {
      const baseUrl = request.url.replace(`/api/patients/${patientId}/supervision/chat`, '');
      
      // Cargar datos básicos del paciente
        const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          }
        });

        if (dataResponse.ok) {
          const patientData = await dataResponse.json();
          
          // Crear contexto compacto solo con datos relevantes
          const compactData: any = {
            patient: { name: patientData.patient?.name, age: patientData.patient?.age },
            intake: patientData.intake?.datos || {},
            questionnaires: patientData.questionnaires?.map((q: any) => ({
              codigo: q.codigo,
              puntuacion: q.puntuacion,
              fecha: q.fecha
            })) || []
          };
          
          // Cargar evoluciones clínicas SIEMPRE (como parte del contexto completo)
          try {
            const evolutionsResponse = await fetch(`${baseUrl}/api/patients/${patientId}/evolutions/history`, {
              headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Cookie': request.headers.get('Cookie') || ''
              }
            });
            
            if (evolutionsResponse.ok) {
              const evolutions = await evolutionsResponse.json();
              compactData.evolutions = evolutions.slice(0, 3).map((e: any) => ({
                tipo: e.tipo,
                contenido: e.contenido?.substring(0, 300) + (e.contenido?.length > 300 ? '...' : ''),
                fecha: e.created_at,
                version: e.version
              }));
              console.log('[DEBUG] Loaded', evolutions.length, 'evolutions (showing first 3 compacted)');
            }
          } catch (evolutionError) {
            console.error('[ERROR] Loading evolutions:', evolutionError);
            compactData.evolutions = [];
          }
          
          fullPatientContext = `\n\n### Datos del Paciente:\n\`\`\`json\n${JSON.stringify(compactData, null, 2)}\n\`\`\``;
          
          console.log('[DEBUG] Compact patient data loaded:', fullPatientContext.length, 'characters');
          console.log('[DEBUG] Patient name:', patientData.patient?.name);
          console.log('[DEBUG] Questionnaires found:', patientData.questionnaires?.length || 0);
          console.log('[DEBUG] Questionnaire codes:', patientData.questionnaires?.map((q: any) => q.codigo) || []);
          
          // Logging específico para OPD
          if (messageText.includes('opd') || messageText.includes('operacionalizado') || messageText.includes('psicodinamico')) {
            const opdData = patientData.questionnaires?.find((q: any) => 
              q.codigo?.toLowerCase().includes('opd') ||
              q.titulo?.toLowerCase().includes('opd') ||
              q.codigo?.toLowerCase().includes('operacionalizado') ||
              q.titulo?.toLowerCase().includes('operacionalizado') ||
              q.codigo?.toLowerCase().includes('psicodinamico') ||
              q.titulo?.toLowerCase().includes('psicodinamico')
            );
            console.log('[DEBUG] OPD questionnaire found:', !!opdData);
            if (opdData) {
              console.log('[DEBUG] OPD data:', JSON.stringify(opdData, null, 2));
            } else {
              console.log('[DEBUG] Available questionnaire codes:', patientData.questionnaires?.map((q: any) => q.codigo));
              console.log('[DEBUG] Available questionnaire titles:', patientData.questionnaires?.map((q: any) => q.titulo));
            }
          }
          
        } else {
          console.log('[ERROR] Could not load patient data:', dataResponse.status);
          fullPatientContext = '\n\n[DATOS DEL PACIENTE: Error al cargar - código ' + dataResponse.status + ']';
        }
      } catch (error) {
        console.error('[ERROR] Exception loading patient data:', error);
        fullPatientContext = '\n\n[DATOS DEL PACIENTE: Error de conexión]';
      }

    // Construir array de mensajes para el contexto
    const messages: ChatMessage[] = [];

    // Agregar prompt del sistema con contexto del paciente
    messages.push({
      role: 'system',
      content: `${SUPERVISOR_SYSTEM_PROMPT}

${fullPatientContext}`
    });

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

    // Construir prompt simple y directo
    const systemMessage = messages.find(msg => msg.role === 'system')?.content || SUPERVISOR_SYSTEM_PROMPT;
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    // Formato simple: solo el prompt del sistema + la conversación natural
    const conversationText = [
      systemMessage,
      '',
      ...conversationMessages.map(msg => msg.content)
    ].join('\n\n');

    console.log('[DEBUG] Conversation text length:', conversationText.length);
    console.log('[DEBUG] First 200 chars:', conversationText.substring(0, 200));
    
    // Limitar el tamaño del prompt para Gemini 2.5 Pro (conservador: 50K chars = ~12.5K tokens)
    let finalText = conversationText;
    if (conversationText.length > 50000) {
      console.log('[WARNING] Prompt too long, truncating...');
      finalText = conversationText.substring(0, 50000) + '\n\n[CONVERSACIÓN TRUNCADA - CONTINÚA LA SUPERVISIÓN]';
      console.log('[DEBUG] Truncated to:', finalText.length, 'characters');
    }

    const geminiRequest: GeminiRequest = {
      contents: [{
        parts: [{
          text: finalText
        }]
      }],
      generationConfig: {
        temperature: 0.4,  // Equilibrio entre consistencia y creatividad
        topK: 40,
        topP: 0.8,  // Más flexible
        maxOutputTokens: 4096  // Respuestas completas como antes
      }
    };

    // Implementar retry para errores 503 (sobrecarga)
    let geminiResponse: Response | null = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount <= maxRetries) {
      try {
        geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(geminiRequest)
        });
        
        // Si es 503, reintentar con delay exponencial
        if (geminiResponse.status === 503 && retryCount < maxRetries) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          console.log(`[RETRY] Attempt ${retryCount + 1}/${maxRetries + 1} failed with 503, waiting ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
          continue;
        }
        
        break; // Éxito o error diferente a 503
      } catch (error) {
        if (retryCount === maxRetries) throw error;
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!geminiResponse) {
      throw new Error('No se pudo obtener respuesta después de múltiples intentos');
    }

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

    const candidate = geminiData.candidates[0];
    const parts = candidate.content.parts;
    
    // Procesar respuesta directa (sin function calls)
    const textParts = parts.filter(part => 'text' in part);
    if (textParts.length === 0) {
      throw new Error('No se encontró respuesta de texto');
    }
    
    const response = (textParts[0] as { text: string }).text;
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
