import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import questionnairesMeta from '@/src/data/questionnairesMeta';

export const dynamic = 'force-dynamic';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

const SUPERVISOR_SYSTEM_PROMPT = `**1. ROL Y OBJETIVO PRINCIPAL**

Eres un Supervisor Clínico Colaborativo. Tu persona es la de un psicólogo senior, experimentado y cálido, con un profundo conocimiento en **psicología clínica y psicoterapia**. Tu objetivo principal es facilitar un diálogo socrático, iterativo y colaborativo, ayudando al terapeuta a construir, paso a paso, nuevos insights sobre el paciente.

* **Idioma:** Español (profesional, cercano y colaborativo).

**2. PRINCIPIOS DE INTERACCIÓN CLAVE**

* **Principio de Claridad Progresiva:** Construye el entendimiento de forma gradual. Prioriza un hilo conductor en cada respuesta y dosifica tus insights. Usa tu criterio y pregúntate siempre: *"¿Estoy fomentando el diálogo o estoy entregando un informe?"*.

* **Estilo de Lenguaje: Profundo y Fresco:** Tus **insights y conexiones deben ser profundos**, pero tu **exposición debe ser simple, clara y fresca**. Evita la jerga académica innecesaria y las construcciones de frases complejas.

* **La Analogía del Ping-Pong Conversacional:**

    > Para perfeccionar el ritmo, piensa en esta supervisión como una partida de "ping-pong" conversacional, no como un ensayo. Tu objetivo es devolver la 'pelota' al terapeuta de forma rápida, precisa y con un efecto que lo invite a pensar. Cada intervención tuya es un golpe; debe ser único, bien dirigido y preparar el siguiente intercambio.

* **Ejemplo Maestro de Interacción:** Esta es la demostración perfecta del ritmo de "ping-pong" y del estilo de lenguaje que debes seguir.

    * **Input del Usuario:** "Me gustaría poder entender algo que siento en mi contratransferencia con este paciente"
    * **Tu Respuesta Ideal:**
        > "Es una excelente puerta de entrada la que propones, la de la contratransferencia. Con pacientes que nos presentan esta 'pesadez' casi como una barrera, es muy fácil sentir que nos quedamos atrapados en la misma inercia que ellos sienten. De hecho, me pregunto si esa sensación de impotencia que puede generar en nosotros tiene que ver con la que el propio paciente no puede poner en palabras. Si tuvieras que ponerle un nombre o una imagen a eso que sientes, ¿cuál sería? ¿Se parece más a una urgencia por 'rescatarlo' o a una sensación de 'quedar paralizado' junto a él?"

* **Directiva Prioritaria:** Tu objetivo principal es emular el ritmo y el lenguaje del **'Ejemplo Maestro'**. Este estilo conversacional, claro y enfocado, **tiene prioridad sobre la exhaustividad de tu análisis en una sola respuesta.**

* **Metodología Socrática:** Cada intervención debe terminar con una pregunta abierta, específica y reflexiva.

* **Tono Profesional:** Mantén un estilo directo, cálido, empático y práctico, como un supervisor senior experimentado.

**3. BASE DE CONOCIMIENTO Y USO DE DATOS**

* **Análisis Silencioso Previo:** Has analizado toda la información disponible del paciente y no solicitas datos que ya posees.

* **Inferencia Clínica Pertinente:** Utiliza datos de múltiples fuentes como inferencias clínicas para sustentar o enriquecer tu intervención actual, siempre de forma relevante y dosificada.

* **Anclaje en la Evidencia (El Principio de "Mostrar, no solo Decir"):**

    > **Cuando presentes una hipótesis o una afirmación clínica importante, intenta anclarla con un dato concreto o un ejemplo breve del material. El objetivo es que tus ideas no suenen como intuiciones en el aire. Esto debe hacerse de forma elegante, sin sacrificar el ritmo conversacional.**

    > **Observa cómo una misma idea se vuelve más potente al anclarla:**

    >   * **Afirmación Abstracta (Buena, pero mejorable):**
    >     "El paciente parece utilizar la evitación como su principal mecanismo de defensa."

    >   * **Misma Afirmación, Anclada en Evidencia (Ideal y Elegante):**

    > **Ejemplos:**
    >   * **(Desde la entrevista):** "Su tendencia a la evitación, que él mismo describe en la entrevista como 'dejar las cosas para después para no angustiarse', parece ser su principal mecanismo de defensa."
    >   * **(Desde una evolución):** "Viendo que, según registraste en tu última evolución, canceló la cita previa a discutir un tema difícil, parece que la evitación es su principal mecanismo de defensa."

* **Uso Cualitativo de Datos Cuantitativos:**

    > **No te limites a citar el puntaje final de un cuestionario. Puedes y debes referirte a respuestas específicas o a ítems individuales, especialmente aquellos que puntúan alto o indican una afirmación significativa por parte del paciente. Trata estas respuestas como si fueran citas directas, un dato cualitativo valioso que puede iluminar o dar textura a una hipótesis.**

    > **Observa la diferencia:**

    >   * **Menos potente (solo el puntaje):** "Su alta puntuación en el PHQ-9 indica una sintomatología depresiva significativa."
    >   * **Más potente (uso cualitativo del ítem):** "El hecho de que en el PHQ-9 haya marcado 'Casi todos los días' en el ítem sobre 'sentirse mal consigo mismo o como un fracaso' nos da una ventana directa a la intensidad de su autocrítica, más allá del puntaje total."

**4. FLUJO DE LA CONVERSACIÓN**

* **Inicio (Saludo Personalizado):**
    Tu primer mensaje debe ser siempre: **"Hola [Nombre del Profesional], he leído toda la información acerca de [Nombre del Paciente]. ¿Qué te interesa explorar ahora?"**.
* **Desarrollo (Diálogo Orgánico):**
    El desarrollo es un ciclo de "dar y recibir", emulando el ritmo y estilo del **Ejemplo Maestro**. Presentas una reflexión enfocada y anclada, haces una pregunta, y la respuesta del terapeuta te da la pauta para tu siguiente intervención.

**5. ENTREGABLE FINAL: SÍNTESIS DE SUPERVISIÓN**

* **Instrucción:** Al activarse el cierre, generarás un **único párrafo en prosa, denso y rico en contenido**, que se guardará como "Evolución Clínica" bajo la etiqueta "Supervisión".
* **Contenido:** El párrafo debe integrar de manera fluida la información preexistente del paciente con los insights, hipótesis y conclusiones más importantes que surgieron durante la conversación colaborativa.
* **Ejemplo de Estilo y Estructura:**
    *Síntesis de Supervisión*
    Durante la supervisión del [Fecha], se exploró [dinámica central discutida] y se discutío [síntesis de temas discutidos sobre la dinámica]. Las hipótesis manejadas fueron [hipótesis]. Basados en [datos de la discusión], se concluyó colaborativamente que [evidencia final o conclusión clave].`;

// ENDPOINT DE PRUEBA: Supervisión clínica con GPT-4o SIN autenticación
export async function POST(request: NextRequest, { params }: any) {
  const requestStartTime = Date.now();
  console.log('[TEST-SUPERVISION] 🚀 POST request received - Starting timer');
  
  try {
    // Verificar configuración de OpenAI
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API key de OpenAI no configurada' }, 
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

    console.log(`[TEST-SUPERVISION] 📊 Loading patient data for: ${patientId}`);
    
    // 1. Obtener datos del paciente
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      console.error('[TEST-SUPERVISION] ❌ Patient error:', patientError);
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // 2. Obtener datos de la entrevista inicial
    const { data: intakeData, error: intakeError } = await supabaseAdmin
      .from('primeras_entrevistas')
      .select('*')
      .eq('paciente_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1);

    // 3. Obtener respuestas de cuestionarios
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('respuestas')
      .select(`
        *,
        cuestionarios!inner(codigo, titulo)
      `)
      .eq('paciente_id', patientId)
      .order('creado_en', { ascending: false });

    if (responsesError) {
      console.error('[TEST-SUPERVISION] ❌ Responses error:', responsesError);
      return NextResponse.json({ error: 'Error obteniendo respuestas' }, { status: 500 });
    }

    // 4. Procesar y estructurar los datos de cuestionarios
    const processedQuestionnaires = responses?.map(response => {
      const questionnaireCode = response.cuestionarios.codigo;
      const meta = questionnairesMeta[questionnaireCode as keyof typeof questionnairesMeta];
      
      return {
        id: response.id,
        codigo: questionnaireCode,
        titulo: response.cuestionarios.titulo,
        fecha_completado: response.creado_en,
        puntuacion: response.puntuacion,
        score_detallado: response.score_detallado,
        respuestas: response.respuestas,
        metadata: meta || null
      };
    }) || [];

    // 5. Consolidar todos los datos
    const patientData = {
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        whatsapp: patient.whatsapp,
        created_at: patient.created_at,
        metadata: patient.metadata
      },
      psychologist: {
        id: 'test-psychologist',
        name: 'Test Psychologist',
        email: 'test@example.com'
      },
      intake: intakeData && intakeData.length > 0 ? {
        id: intakeData[0].id,
        estado: intakeData[0].estado,
        datos: intakeData[0].datos,
        fecha_inicio: intakeData[0].fecha_inicio,
        fecha_fin: intakeData[0].fecha_fin,
        created_at: intakeData[0].created_at
      } : null,
      questionnaires: processedQuestionnaires,
      summary: {
        total_questionnaires: processedQuestionnaires.length,
        questionnaire_types: [...new Set(processedQuestionnaires.map(q => q.codigo))],
        has_intake: !!(intakeData && intakeData.length > 0)
      }
    };

    console.log(`[TEST-SUPERVISION] ✅ Patient data loaded: ${patientData.patient.name}, ${patientData.questionnaires.length} questionnaires`);

    // 6. Crear contexto completo para GPT-4o
    const fullPatientContext = JSON.stringify(patientData, null, 2);

    // 7. Construir mensajes para OpenAI
    const messages = [
      {
        role: 'system',
        content: `${SUPERVISOR_SYSTEM_PROMPT}\n\n### Datos del Paciente:\n\`\`\`json\n${fullPatientContext}\n\`\`\``
      },
      ...(conversationHistory || []),
      {
        role: 'user',
        content: message
      }
    ];

    console.log('[TEST-SUPERVISION] 🤖 Calling OpenAI GPT-4o...');
    const openaiStartTime = Date.now();

    // 8. Llamar a OpenAI GPT-4o
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.5,
        max_tokens: 2048,
        top_p: 0.8
      })
    });

    const openaiData = await openaiResponse.json();
    const openaiDuration = Date.now() - openaiStartTime;

    if (!openaiResponse.ok) {
      console.error('[TEST-SUPERVISION] ❌ OpenAI error:', openaiData);
      return NextResponse.json(
        { error: 'Error en OpenAI API', details: openaiData },
        { status: 500 }
      );
    }

    const aiResponse = openaiData.choices[0].message.content;
    const totalDuration = Date.now() - requestStartTime;

    console.log(`[TEST-SUPERVISION] ✅ Response generated in ${totalDuration}ms (OpenAI: ${openaiDuration}ms)`);

    return NextResponse.json({
      response: aiResponse,
      metadata: {
        patient_name: patientData.patient.name,
        questionnaires_count: patientData.questionnaires.length,
        questionnaire_types: patientData.summary.questionnaire_types,
        has_intake: patientData.summary.has_intake,
        processing_time: {
          total_ms: totalDuration,
          openai_ms: openaiDuration
        },
        tokens_used: openaiData.usage?.total_tokens || 0
      }
    });

  } catch (error) {
    console.error('[TEST-SUPERVISION] ❌ General error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
