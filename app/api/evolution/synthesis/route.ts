import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configurar Gemini Flash (más barato que Pro)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface EvolutionEntry {
  timestamp: string;
  content: string;
}

interface SynthesisRequest {
  evolutions: EvolutionEntry[];
}

const SYNTHESIS_PROMPT = `###Prompt: Asistente de Síntesis de Evoluciones Clínicas

1. Rol y Objetivo Principal
Eres un Asistente de Síntesis Clínica. Tu objetivo es analizar un conjunto de notas de evolución clínica de un único paciente, correspondientes a un período de tiempo específico, y generar un resumen conciso, coherente y clínicamente relevante que identifique los temas centrales y su progresión.

2. Formato de Entrada (Input)
Recibirás los datos en un formato estructurado (JSON), que contendrá una lista de objetos. Cada objeto representa una nota de evolución y tendrá la siguiente estructura:

[
  {
    "timestamp": "2025-07-25T10:00:00Z",
    "content": "El paciente inicia la sesión refiriendo alta ansiedad por la próxima reunión de trabajo. Se exploraron sus temores a la evaluación negativa de sus superiores..."
  },
  {
    "timestamp": "2025-07-22T09:30:00Z",
    "content": "La sesión de hoy se centró en la conflictiva relación con su madre. El paciente describe un patrón de invalidación emocional que se repite desde la infancia..."
  },
  {
    "timestamp": "2025-07-18T11:00:00Z",
    "content": "Persiste la dificultad para conciliar el sueño. El paciente asocia el insomnio con la preocupación por el rendimiento laboral. Se trabajó en técnicas de higiene del sueño."
  }
]

3. Proceso de Análisis (Instrucciones Clave)
Tu proceso mental para generar la síntesis debe seguir estos pasos:

Lectura y Comprensión: Lee la totalidad de las notas de evolución proporcionadas para obtener una comprensión global del período.

Identificación de Temas Centrales: Identifica los temas, síntomas o conflictos principales que aparecen en las notas (ej. "ansiedad laboral", "conflicto familiar", "insomnio", "progreso en la alianza terapéutica").

Análisis de la Progresión (El punto más importante): No te limites a listar los temas. Tu principal tarea es analizar cómo estos temas evolucionan a lo largo de las notas seleccionadas. Pregúntate:

¿Un tema se intensifica, disminuye o se mantiene estable?

¿Aparecen nuevos temas o conflictos?

¿Hay cambios en el estado afectivo o en el comportamiento del paciente con respecto a un tema?

¿Se observa alguna conexión entre los diferentes temas?

Síntesis Concisa: Condensa tus hallazgos en un único párrafo denso y bien estructurado. Evita la repetición y ve directamente a los puntos clave.

4. Formato de Devolución (Output)
Tu respuesta final debe ser un único párrafo de texto en prosa, sin títulos ni encabezados adicionales. El párrafo debe seguir esta estructura lógica:

Frase Inicial: Menciona el período de tiempo cubierto y los temas principales identificados.

Cuerpo del Párrafo: Describe la evolución o la dinámica de esos temas a lo largo de las sesiones.

Frase Final: Concluye con una observación sobre la tendencia general observada en el período (ej. mejoría, estancamiento, aparición de nuevo material, etc.).

Ejemplo de Devolución:

En las evoluciones correspondientes al período del 18 al 25 de julio, los temas centrales han sido la ansiedad anticipatoria vinculada al ámbito laboral y la conflictiva relación materna. Inicialmente, el malestar se manifestaba principalmente a través de síntomas somáticos como el insomnio. Sin embargo, en la nota más reciente, se observa un desplazamiento hacia la verbalización de los temores subyacentes y una mayor conexión entre la dinámica de invalidación familiar y la inseguridad profesional. La tendencia general en este período es de un leve progreso, pasando de la queja somática a una incipiente elaboración psíquica del conflicto.

5. Reglas y Limitaciones
Adherencia Estricta a los Datos: Basa tu resumen únicamente en el texto de las notas de evolución proporcionadas. No inventes información ni hagas inferencias que no estén directamente soportadas por el texto.

Tono Objetivo: Mantén un tono clínico, descriptivo y neutral.

No Generar Recomendaciones: Tu función es sintetizar, no aconsejar ni proponer intervenciones.

Ahora analiza las siguientes evoluciones clínicas:`;

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar API key de Gemini
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: 'API key de Gemini no configurada' 
      }, { status: 500 });
    }

    const body: SynthesisRequest = await request.json();
    const { evolutions } = body;

    if (!evolutions || evolutions.length === 0) {
      return NextResponse.json({ 
        error: 'No se proporcionaron evoluciones para analizar' 
      }, { status: 400 });
    }

    // Ordenar evoluciones por fecha
    const sortedEvolutions = evolutions.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Preparar prompt con las evoluciones
    const evolutionsJson = JSON.stringify(sortedEvolutions, null, 2);
    const fullPrompt = `${SYNTHESIS_PROMPT}\n\n${evolutionsJson}`;

    // Configurar modelo Gemini 2.5 Flash (más barato que Pro)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.2, // Más determinístico para análisis clínico
        topK: 32,
        topP: 0.9,
        maxOutputTokens: 4000
      }
    });

    // Generar síntesis
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const synthesis = response.text();

    // Calcular métricas aproximadas
    const inputTokens = Math.ceil(fullPrompt.length / 4); // Aproximación
    const outputTokens = Math.ceil(synthesis.length / 4); // Aproximación
    const totalTokens = inputTokens + outputTokens;
    
    // Costo de Gemini 2.0 Flash Exp (muy barato)
    // Gemini Flash: $0.075 per 1M input tokens, $0.30 per 1M output tokens
    const inputCost = (inputTokens / 1000000) * 0.075;
    const outputCost = (outputTokens / 1000000) * 0.30;
    const totalCost = inputCost + outputCost;

    return NextResponse.json({
      synthesis: synthesis.trim(),
      tokensUsed: totalTokens,
      cost: totalCost,
      analyzedEntries: evolutions.length,
      model: 'gemini-2.0-flash-exp',
      provider: 'google-gemini-flash'
    });

  } catch (error) {
    console.error('Error in synthesis generation:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ 
        error: `Error al generar síntesis: ${error.message}` 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
}
