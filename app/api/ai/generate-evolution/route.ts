import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, entryType, patientId, context } = body;

    if (!prompt || !entryType || !patientId) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Aquí integrarías con tu servicio de IA preferido (OpenAI, Anthropic, etc.)
    // Por ahora, simulamos la generación de contenido
    const generatedContent = await generateClinicalContent(prompt, entryType, context);

    return NextResponse.json({
      generatedContent,
      metadata: {
        originalPrompt: prompt,
        entryType,
        generatedAt: new Date().toISOString(),
        model: 'clinical-ai-v1'
      }
    });

  } catch (error) {
    console.error('Error generating AI content:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function generateClinicalContent(prompt: string, entryType: string, context?: string): Promise<string> {
  // Simulación de generación de IA - reemplazar con tu servicio de IA real
  
  const templates = {
    clinica: `
Basándose en los conceptos clave proporcionados: "${prompt}"

**EVALUACIÓN CLÍNICA:**
El paciente presenta signos compatibles con los elementos mencionados. Se observa una evolución que requiere seguimiento continuo y ajuste en el plan terapéutico.

**OBSERVACIONES:**
- Estado emocional: Requiere atención especializada
- Síntomas reportados: Consistentes con el cuadro clínico
- Respuesta al tratamiento: En evaluación

**PLAN DE SEGUIMIENTO:**
Se recomienda continuar con las intervenciones actuales y monitorear la evolución en las próximas sesiones.
    `,
    sesion: `
**DESARROLLO DE LA SESIÓN:**
Durante el encuentro terapéutico se abordaron los aspectos relacionados con: ${prompt}

**PROCESO TERAPÉUTICO:**
El paciente mostró disposición para explorar los temas planteados. Se trabajó en la comprensión y procesamiento de los elementos identificados.

**INTERVENCIONES REALIZADAS:**
- Exploración de pensamientos y emociones
- Técnicas de regulación emocional
- Psicoeducación sobre el proceso

**OBJETIVOS PARA PRÓXIMAS SESIONES:**
Continuar el trabajo terapéutico enfocado en los aspectos identificados y fortalecer las estrategias de afrontamiento.
    `
  };

  // Simular delay de procesamiento
  await new Promise(resolve => setTimeout(resolve, 2000));

  const baseTemplate = templates[entryType as keyof typeof templates] || templates.clinica;
  
  return baseTemplate.trim();
}
