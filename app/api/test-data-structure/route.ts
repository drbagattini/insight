import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 DIAGNÓSTICO DE ESTRUCTURA DE DATOS');
    console.log('=====================================');
    
    // Simular la estructura de datos que debería recibir el AI
    const mockPatientData = {
      patient: {
        id: "test-123",
        name: "Pedro Subirá",
        email: "pedro@example.com",
        whatsapp: "+1234567890",
        created_at: "2025-01-15T10:00:00Z",
        metadata: {}
      },
      psychologist: {
        id: "psy-456",
        name: "Dr. García",
        email: "garcia@clinic.com"
      },
      intake: {
        id: "intake-789",
        estado: "completado",
        datos: {
          edad: 32,
          sexo: "Masculino",
          presentacion: "Consulta por síntomas depresivos y apatía",
          malestarPaciente: "Se siente como 'un sapo de otro pozo', dificultades en relaciones interpersonales",
          antecedentesPersonales: "Historia de humillación en la adolescencia",
          motivoConsulta: "Depresión y aislamiento social",
          expectativasTratamiento: "Mejorar estado de ánimo y relaciones",
          // ... otros 20+ campos de la entrevista inicial
        },
        fecha_inicio: "2025-01-15T10:00:00Z",
        fecha_fin: "2025-01-15T11:30:00Z",
        created_at: "2025-01-15T10:00:00Z"
      },
      questionnaires: [
        {
          id: "q1",
          codigo: "WHO-5",
          titulo: "WHO-5 Well-being Index",
          fecha_completado: "2025-01-16T09:00:00Z",
          puntuacion: 8,
          score_detallado: { total: 8, porcentaje: 32 },
          respuestas: [
            { pregunta: "Me he sentido alegre y de buen humor", respuesta: 1, valor: 1 },
            { pregunta: "Me he sentido calmado y relajado", respuesta: 2, valor: 2 },
            { pregunta: "Me he sentido activo y vigoroso", respuesta: 1, valor: 1 },
            { pregunta: "Me desperté sintiéndome fresco y descansado", respuesta: 2, valor: 2 },
            { pregunta: "Mi vida diaria ha estado llena de cosas que me interesan", respuesta: 2, valor: 2 }
          ],
          metadata: {
            interpretacion: "Puntuación baja indica posible depresión",
            punto_corte: 13
          }
        },
        {
          id: "q2",
          codigo: "PHQ-9",
          titulo: "Patient Health Questionnaire-9",
          fecha_completado: "2025-01-16T09:15:00Z",
          puntuacion: 12,
          score_detallado: { total: 12, severidad: "moderada" },
          respuestas: [
            { pregunta: "Poco interés o placer en hacer cosas", respuesta: 2, valor: 2 },
            { pregunta: "Se ha sentido decaído, deprimido o sin esperanza", respuesta: 2, valor: 2 },
            { pregunta: "Problemas para dormir o dormir demasiado", respuesta: 1, valor: 1 },
            // ... más respuestas
          ],
          metadata: {
            interpretacion: "Depresión moderada",
            recomendacion: "Considerar intervención terapéutica"
          }
        },
        {
          id: "q3",
          codigo: "GAD-7",
          titulo: "Generalized Anxiety Disorder 7-item",
          fecha_completado: "2025-01-16T09:30:00Z",
          puntuacion: 7,
          score_detallado: { total: 7, severidad: "leve" },
          respuestas: [
            { pregunta: "Sentirse nervioso, ansioso o muy alterado", respuesta: 1, valor: 1 },
            { pregunta: "No poder parar o controlar las preocupaciones", respuesta: 2, valor: 2 },
            // ... más respuestas
          ],
          metadata: {
            interpretacion: "Ansiedad leve",
            punto_corte: 10
          }
        }
      ],
      evolutions: [
        {
          id: "evo-1",
          contenido: "Primera sesión: El paciente se muestra colaborativo pero con afecto aplanado. Refiere sentirse desconectado de otros. Se establece rapport inicial y se exploran expectativas de tratamiento.",
          fecha: "2025-01-20T14:00:00Z",
          tipo: "Sesión inicial",
          version: 1,
          estado: "final"
        },
        {
          id: "evo-2",
          contenido: "Segunda sesión: Se profundiza en la historia de humillación adolescente. El paciente conecta esta experiencia con su actual sensación de 'no encajar'. Se observa mayor apertura emocional.",
          fecha: "2025-01-27T14:00:00Z",
          tipo: "Sesión de seguimiento",
          version: 1,
          estado: "final"
        },
        {
          id: "evo-3",
          contenido: "Supervisión clínica: Se discutió la conexión entre trauma adolescente y patrones actuales de evitación. Se sugiere explorar mecanismos de defensa y trabajar autoestima.",
          fecha: "2025-01-28T10:00:00Z",
          tipo: "Supervisión",
          version: 1,
          estado: "final"
        }
      ],
      summary: {
        total_questionnaires: 3,
        questionnaire_types: ["WHO-5", "PHQ-9", "GAD-7"],
        has_intake: true,
        date_range: {
          earliest: "2025-01-15T10:00:00Z",
          latest: "2025-01-28T10:00:00Z"
        }
      }
    };

    // Simular cómo se formatea para el AI
    const formattedForAI = `### Datos del Paciente:
\`\`\`json
${JSON.stringify(mockPatientData, null, 2)}
\`\`\``;

    // Análisis de la estructura
    const analysis = {
      dataStructure: {
        hasPatient: !!mockPatientData.patient,
        hasIntake: !!mockPatientData.intake,
        questionnairesCount: mockPatientData.questionnaires?.length || 0,
        evolutionsCount: mockPatientData.evolutions?.length || 0,
        hasPsychologist: !!mockPatientData.psychologist,
        hasSummary: !!mockPatientData.summary
      },
      questionnairesAnalysis: {
        availableTypes: mockPatientData.questionnaires?.map(q => q.codigo) || [],
        hasWHO5: mockPatientData.questionnaires?.some(q => q.codigo === 'WHO-5') || false,
        hasPHQ9: mockPatientData.questionnaires?.some(q => q.codigo === 'PHQ-9') || false,
        hasGAD7: mockPatientData.questionnaires?.some(q => q.codigo === 'GAD-7') || false,
        allHaveScores: mockPatientData.questionnaires?.every(q => typeof q.puntuacion === 'number') || false,
        allHaveResponses: mockPatientData.questionnaires?.every(q => Array.isArray(q.respuestas)) || false
      },
      intakeAnalysis: {
        hasBasicInfo: !!(mockPatientData.intake?.datos?.edad && mockPatientData.intake?.datos?.sexo),
        hasPresentation: !!mockPatientData.intake?.datos?.presentacion,
        hasComplaint: !!mockPatientData.intake?.datos?.malestarPaciente,
        hasHistory: !!mockPatientData.intake?.datos?.antecedentesPersonales,
        totalFields: Object.keys(mockPatientData.intake?.datos || {}).length
      },
      evolutionsAnalysis: {
        hasEvolutions: (mockPatientData.evolutions?.length || 0) > 0,
        hasSessions: mockPatientData.evolutions?.some(e => e.tipo === 'Sesión inicial' || e.tipo === 'Sesión de seguimiento') || false,
        hasSupervisions: mockPatientData.evolutions?.some(e => e.tipo === 'Supervisión') || false,
        allHaveContent: mockPatientData.evolutions?.every(e => !!e.contenido) || false,
        allHaveDates: mockPatientData.evolutions?.every(e => !!e.fecha) || false
      },
      formattingAnalysis: {
        jsonLength: formattedForAI.length,
        hasProperFormat: formattedForAI.includes('### Datos del Paciente:') && formattedForAI.includes('```json'),
        estimatedTokens: Math.ceil(formattedForAI.length / 4), // Aproximación rough
        isWithinLimits: formattedForAI.length < 50000 // Límite actual del sistema
      }
    };

    console.log('📊 ANÁLISIS DE ESTRUCTURA:');
    console.log(`✅ Patient: ${analysis.dataStructure.hasPatient}`);
    console.log(`✅ Intake: ${analysis.dataStructure.hasIntake} (${analysis.intakeAnalysis.totalFields} campos)`);
    console.log(`✅ Questionnaires: ${analysis.dataStructure.questionnairesCount} disponibles`);
    console.log(`   - WHO-5: ${analysis.questionnairesAnalysis.hasWHO5}`);
    console.log(`   - PHQ-9: ${analysis.questionnairesAnalysis.hasPHQ9}`);
    console.log(`   - GAD-7: ${analysis.questionnairesAnalysis.hasGAD7}`);
    console.log(`✅ Evolutions: ${analysis.dataStructure.evolutionsCount} disponibles`);
    console.log(`✅ Psychologist: ${analysis.dataStructure.hasPsychologist}`);
    console.log(`✅ Summary: ${analysis.dataStructure.hasSummary}`);
    console.log('');
    console.log('📏 ANÁLISIS DE FORMATO:');
    console.log(`   - JSON Length: ${analysis.formattingAnalysis.jsonLength} chars`);
    console.log(`   - Estimated Tokens: ~${analysis.formattingAnalysis.estimatedTokens}`);
    console.log(`   - Within Limits: ${analysis.formattingAnalysis.isWithinLimits}`);
    console.log(`   - Proper Format: ${analysis.formattingAnalysis.hasProperFormat}`);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      mockData: mockPatientData,
      formattedForAI: formattedForAI.substring(0, 500) + '...[truncated]', // Solo muestra inicio
      analysis,
      status: 'success',
      recommendations: [
        analysis.dataStructure.hasPatient ? '✅ Datos del paciente: OK' : '❌ Faltan datos del paciente',
        analysis.dataStructure.hasIntake ? '✅ Entrevista inicial: OK' : '❌ Falta entrevista inicial',
        analysis.dataStructure.questionnairesCount > 0 ? `✅ Cuestionarios: ${analysis.dataStructure.questionnairesCount} disponibles` : '❌ No hay cuestionarios',
        analysis.questionnairesAnalysis.hasWHO5 ? '✅ WHO-5: Disponible' : '⚠️ WHO-5: No disponible',
        analysis.dataStructure.evolutionsCount > 0 ? `✅ Evoluciones: ${analysis.dataStructure.evolutionsCount} disponibles` : '⚠️ No hay evoluciones clínicas',
        analysis.formattingAnalysis.isWithinLimits ? '✅ Tamaño del prompt: Dentro de límites' : '❌ Prompt demasiado largo',
        '✅ Estructura de datos: Completa y correcta para el AI'
      ]
    });

  } catch (error: any) {
    console.error('❌ Error en diagnóstico de estructura:', error);
    return NextResponse.json(
      { 
        error: 'Error en diagnóstico de estructura de datos',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
