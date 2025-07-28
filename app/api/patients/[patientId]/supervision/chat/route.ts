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

RECUERDA: Mantén siempre el rol de colega supervisor, no de terapeuta directo.

## HERRAMIENTAS DISPONIBLES
Tienes acceso a las siguientes herramientas para buscar datos específicos del paciente cuando sea clínicamente relevante:

1. **buscarCuestionario**: Para obtener resultados específicos de un cuestionario
2. **buscarHistoriaClinica**: Para buscar información específica en la historia clínica
3. **buscarDatosBasicos**: Para obtener información demográfica y básica del paciente
4. **buscarEntrevistaInicial**: Para obtener datos estructurados completos de la entrevista inicial (26 campos organizados)
5. **buscarEvoluciones**: Para revisar evoluciones clínicas por tipo
6. **buscarInformes**: Para consultar informes de síntesis generados

Usa estas herramientas cuando el psicólogo haga preguntas específicas que requieran datos concretos. Por ejemplo:
- "¿Qué puntaje tiene en el PHQ-9?" → usar buscarCuestionario
- "¿Menciona algo sobre ansiedad en su historia?" → usar buscarHistoriaClinica
- "¿Cuál es su edad y motivo de consulta?" → usar buscarDatosBasicos
- "¿Cómo es su situación familiar y antecedentes?" → usar buscarEntrevistaInicial
- "¿Cómo ha evolucionado en las últimas sesiones?" → usar buscarEvoluciones
- "¿Qué informes se han generado?" → usar buscarInformes`;

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

    // Funciones auxiliares para buscar datos específicos
    const buscarDatosEspecificos = async (tipo: string, parametros: any) => {
      try {
        const baseUrl = request.url.replace(`/api/patients/${patientId}/supervision/chat`, '');
        const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          }
        });

        if (!dataResponse.ok) {
          return { error: 'No se pudieron obtener los datos del paciente' };
        }

        const patientData = await dataResponse.json();

        switch (tipo) {
          case 'buscarCuestionario':
            const nombreCuestionario = parametros.nombre.toLowerCase();
            const cuestionario = patientData.questionnaires?.find((q: any) => 
              q.questionnaire_name.toLowerCase().includes(nombreCuestionario)
            );
            if (cuestionario) {
              return {
                nombre: cuestionario.questionnaire_name,
                puntaje: cuestionario.total_score,
                fecha: cuestionario.created_at,
                respuestas: cuestionario.responses || []
              };
            }
            return { error: `No se encontró el cuestionario ${parametros.nombre}` };

          case 'buscarHistoriaClinica':
            const termino = parametros.termino.toLowerCase();
            const historia = patientData.intake?.reason_for_consultation + ' ' + 
                           (patientData.intake?.current_symptoms || '') + ' ' +
                           (patientData.intake?.history || '');
            const menciones = historia.toLowerCase().includes(termino);
            return {
              encontrado: menciones,
              contexto: menciones ? historia.substring(0, 500) + '...' : 'No se encontraron menciones',
              termino: parametros.termino
            };

          case 'buscarDatosBasicos':
            return {
              nombre: patientData.patient?.name || 'No especificado',
              edad: patientData.patient?.age || 'No especificada',
              genero: patientData.patient?.gender || 'No especificado',
              motivoConsulta: patientData.intake?.reason_for_consultation || 'No especificado',
              diagnostico: patientData.intake?.diagnosis || 'No especificado'
            };

          case 'buscarEntrevistaInicial':
            const intakeData = patientData.intake?.datos || {};
            return {
              sociodemograficos: {
                edad: intakeData.edad,
                sexo: intakeData.sexo,
                estadoCivil: intakeData.estadoCivil,
                ocupacion: intakeData.ocupacion
              },
              nucleoFamiliar: {
                grupoFamiliar: intakeData.grupoFamiliar,
                conviveCon: intakeData.conviveCon
              },
              formulacionInicial: {
                presentacion: intakeData.presentacion,
                diagnosticoTexto: intakeData.diagnosticoTexto,
                diagnosticoCodigo: intakeData.diagnosticoCodigo,
                nivelPersonalidad: intakeData.nivelPersonalidad,
                etiologia: intakeData.etiologia
              },
              evaluacionActual: {
                malestarPaciente: intakeData.malestarPaciente,
                gravedadTerapeuta: intakeData.gravedadTerapeuta,
                gaf: intakeData.gaf,
                apoyoSocial: intakeData.apoyoSocial
              },
              antecedentes: {
                duracionTratPrevio: intakeData.duracionTratPrevio,
                medicacionPrev: intakeData.medicacionPrev,
                antecedentesSM: intakeData.antecedentesSM,
                biologicos: intakeData.biologicos
              },
              planTerapeutico: {
                estrategia: intakeData.estrategia,
                posicionTerap: intakeData.posicionTerap
              }
            };

          case 'buscarEvoluciones':
            // Buscar evoluciones clínicas
            try {
              const evolutionsResponse = await fetch(`${baseUrl}/api/patients/${patientId}/evolutions/history?tipo=${parametros.tipo || 'intake'}`, {
                headers: {
                  'Authorization': request.headers.get('Authorization') || '',
                  'Cookie': request.headers.get('Cookie') || ''
                }
              });
              
              if (evolutionsResponse.ok) {
                const evolutions = await evolutionsResponse.json();
                return {
                  tipo: parametros.tipo || 'intake',
                  total: evolutions.length,
                  evoluciones: evolutions.slice(0, 5).map((ev: any) => ({
                    fecha: ev.created_at,
                    version: ev.version,
                    estado: ev.estado,
                    contenido: ev.contenido?.substring(0, 300) + '...' // Resumen
                  }))
                };
              }
              return { error: 'No se pudieron obtener las evoluciones' };
            } catch {
              return { error: 'Error al buscar evoluciones' };
            }

          case 'buscarInformes':
            // Buscar informes de síntesis
            try {
              const informesResponse = await fetch(`${baseUrl}/api/informes/paciente/${patientId}`, {
                headers: {
                  'Authorization': request.headers.get('Authorization') || '',
                  'Cookie': request.headers.get('Cookie') || ''
                }
              });
              
              if (informesResponse.ok) {
                const informes = await informesResponse.json();
                return {
                  total: informes.length,
                  informes: informes.slice(0, 3).map((inf: any) => ({
                    id: inf.id,
                    titulo: inf.titulo,
                    fecha: inf.created_at,
                    resumen: inf.contenido?.substring(0, 200) + '...' // Resumen
                  }))
                };
              }
              return { error: 'No se pudieron obtener los informes' };
            } catch {
              return { error: 'Error al buscar informes' };
            }

          default:
            return { error: 'Tipo de búsqueda no reconocido' };
        }
      } catch (error) {
        return { error: 'Error al buscar datos específicos' };
      }
    };

    // Estrategia: Datos bajo demanda - solo cargar cuando sea necesario
    // Verificar si necesitamos datos del paciente basado en el mensaje
    const needsPatientData = message.toLowerCase().includes('paciente') || 
                           message.toLowerCase().includes('caso') ||
                           message.toLowerCase().includes('cuestionario') ||
                           message.toLowerCase().includes('datos') ||
                           conversationHistory.length === 0; // Primera interacción
    
    let patientContext = '';
    
    if (needsPatientData) {
      try {
        const baseUrl = request.url.replace(`/api/patients/${patientId}/supervision/chat`, '');
        const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          }
        });

        if (dataResponse.ok) {
          const patientData = await dataResponse.json();
          
          // Resumen muy conciso - solo lo esencial
          const patientSummary = {
            nombre: patientData.patient?.name || 'No especificado',
            edad: patientData.patient?.age || 'No especificada',
            motivoConsulta: patientData.intake?.reason_for_consultation || 'No especificado',
            diagnostico: patientData.intake?.diagnosis || 'No especificado'
          };
          
          patientContext = `\n\nDATOS BÁSICOS DEL PACIENTE:\n${JSON.stringify(patientSummary, null, 2)}`;
        }
      } catch (error) {
        console.log('[WARNING] Could not load patient data, continuing without it');
        patientContext = '\n\n[DATOS DEL PACIENTE NO DISPONIBLES EN ESTE MOMENTO]';
      }
    }

    // Construir array de mensajes para el contexto
    const messages: ChatMessage[] = [];

    // Agregar prompt del sistema con contexto del paciente
    messages.push({
      role: 'system',
      content: `${SUPERVISOR_SYSTEM_PROMPT}

${patientContext}`
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
      tools: [{
        functionDeclarations: [
          {
            name: 'buscarCuestionario',
            description: 'Busca y obtiene los resultados de un cuestionario específico del paciente',
            parameters: {
              type: 'object',
              properties: {
                nombre: {
                  type: 'string',
                  description: 'Nombre del cuestionario a buscar (ej: PHQ-9, GAD-7, Beck, etc.)'
                }
              },
              required: ['nombre']
            }
          },
          {
            name: 'buscarHistoriaClinica',
            description: 'Busca información específica en la historia clínica del paciente',
            parameters: {
              type: 'object',
              properties: {
                termino: {
                  type: 'string',
                  description: 'Término o concepto a buscar en la historia clínica (ej: ansiedad, trauma, familia, etc.)'
                }
              },
              required: ['termino']
            }
          },
          {
            name: 'buscarDatosBasicos',
            description: 'Obtiene información demográfica y básica del paciente',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'buscarEntrevistaInicial',
            description: 'Obtiene datos estructurados completos de la entrevista inicial (26 campos organizados por categorías)',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          },
          {
            name: 'buscarEvoluciones',
            description: 'Busca evoluciones clínicas del paciente por tipo',
            parameters: {
              type: 'object',
              properties: {
                tipo: {
                  type: 'string',
                  description: 'Tipo de evolución a buscar (ej: intake, supervision, sesion, etc.)'
                }
              },
              required: []
            }
          },
          {
            name: 'buscarInformes',
            description: 'Obtiene informes de síntesis clínica generados para el paciente',
            parameters: {
              type: 'object',
              properties: {},
              required: []
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 2048  // Aumentar para respuestas más completas
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
    
    // Verificar si hay function calls
    const functionCalls = parts.filter(part => 'functionCall' in part);
    
    if (functionCalls.length > 0) {
      console.log('[DEBUG] Function calls detected:', functionCalls.length);
      
      // Procesar function calls
      const functionResults = [];
      for (const part of functionCalls) {
        if ('functionCall' in part) {
          const { name, args } = part.functionCall;
          console.log(`[DEBUG] Executing function: ${name} with args:`, args);
          
          const result = await buscarDatosEspecificos(name, args);
          functionResults.push({
            function: name,
            args,
            result
          });
        }
      }
      
      // Crear una segunda llamada con los resultados de las funciones
      const functionResultsText = functionResults.map(fr => 
        `RESULTADO DE ${fr.function.toUpperCase()}(${JSON.stringify(fr.args)}):\n${JSON.stringify(fr.result, null, 2)}`
      ).join('\n\n');
      
      const followUpRequest: GeminiRequest = {
        contents: [{
          parts: [{
            text: `${finalText}\n\n--- RESULTADOS DE FUNCIONES ---\n${functionResultsText}\n\nAhora responde como supervisor clínico usando esta información:`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 2048
        }
      };
      
      // Segunda llamada sin tools para obtener la respuesta final
      const followUpResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(followUpRequest)
      });
      
      if (!followUpResponse.ok) {
        throw new Error('Error en follow-up request');
      }
      
      const followUpData: GeminiResponse = await followUpResponse.json();
      const textParts = followUpData.candidates[0].content.parts.filter(part => 'text' in part);
      
      if (textParts.length === 0) {
        throw new Error('No se obtuvo respuesta de texto después de function calls');
      }
      
      const response = (textParts[0] as { text: string }).text;
      console.log('[DEBUG] Final response after function calls:', response);
      
      if (!response || response.trim().length === 0) {
        throw new Error('Respuesta vacía del modelo');
      }
      
      return NextResponse.json({
        response,
        timestamp: new Date().toISOString(),
        model: 'gemini-2.5-pro',
        patientId,
        functionCalls: functionResults
      });
    }
    
    // Respuesta normal sin function calls
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
