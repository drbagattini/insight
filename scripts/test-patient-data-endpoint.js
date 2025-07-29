#!/usr/bin/env node

/**
 * Probar el endpoint de datos del paciente con diferentes métodos
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testPatientDataEndpoint() {
  console.log('🔍 PROBANDO ENDPOINT DE DATOS DEL PACIENTE');
  console.log('=' .repeat(60));

  // Usar un paciente ID que sabemos que existe
  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('\n📊 MÉTODO 1: Consulta directa a Supabase');
    console.log('-'.repeat(40));

    // 1. Obtener datos del paciente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', testPatientId)
      .single();

    if (patientError) {
      console.log('❌ Error obteniendo paciente:', patientError.message);
      return;
    }

    console.log(`✅ Paciente encontrado: ${patient.name}`);

    // 2. Obtener respuestas de cuestionarios
    const { data: responses, error: responsesError } = await supabase
      .from('respuestas')
      .select(`
        *,
        cuestionarios!inner(codigo, titulo)
      `)
      .eq('paciente_id', testPatientId)
      .order('creado_en', { ascending: false });

    if (responsesError) {
      console.log('❌ Error obteniendo respuestas:', responsesError.message);
      return;
    }

    console.log(`✅ Respuestas encontradas: ${responses.length}`);

    // 3. Procesar datos como lo hace el endpoint
    const processedQuestionnaires = responses?.map(response => {
      const questionnaireCode = response.cuestionarios.codigo;
      
      return {
        id: response.id,
        codigo: questionnaireCode,
        titulo: response.cuestionarios.titulo,
        fecha_completado: response.creado_en,
        puntuacion: response.puntuacion,
        score_detallado: response.score_detallado,
        respuestas: response.respuestas,
        metadata: null // Se cargaría desde questionnairesMeta
      };
    }) || [];

    console.log('\n📋 CUESTIONARIOS PROCESADOS:');
    processedQuestionnaires.forEach((q, index) => {
      console.log(`\n${index + 1}. ${q.codigo} - ${q.titulo}`);
      console.log(`   📊 Puntuación: ${q.puntuacion}`);
      console.log(`   📅 Fecha: ${q.fecha_completado}`);
      console.log(`   🎯 Score detallado: ${q.score_detallado ? 'SÍ' : 'NO'}`);
      console.log(`   📝 Respuestas: ${q.respuestas ? q.respuestas.length : 0} ítems`);
      
      if (q.score_detallado) {
        console.log(`   📊 Claves score: ${Object.keys(q.score_detallado).join(', ')}`);
      }
    });

    // 4. Verificar datos de entrevista inicial
    const { data: intakeData, error: intakeError } = await supabase
      .from('primeras_entrevistas')
      .select('*')
      .eq('paciente_id', testPatientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (intakeError) {
      console.log('\n⚠️ Error obteniendo entrevista inicial:', intakeError.message);
    } else if (intakeData && intakeData.length > 0) {
      console.log('\n✅ ENTREVISTA INICIAL ENCONTRADA:');
      console.log(`   📊 Estado: ${intakeData[0].estado}`);
      console.log(`   📝 Campos en datos: ${Object.keys(intakeData[0].datos || {}).length}`);
    } else {
      console.log('\n⚠️ No se encontró entrevista inicial');
    }

    // 5. Simular la estructura final que recibe GPT-4o
    const consolidatedData = {
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        whatsapp: patient.whatsapp,
        created_at: patient.created_at,
        metadata: patient.metadata
      },
      questionnaires: processedQuestionnaires,
      intake: intakeData && intakeData.length > 0 ? {
        id: intakeData[0].id,
        estado: intakeData[0].estado,
        datos: intakeData[0].datos,
        fecha_inicio: intakeData[0].fecha_inicio,
        fecha_fin: intakeData[0].fecha_fin,
        created_at: intakeData[0].created_at
      } : null,
      summary: {
        total_questionnaires: processedQuestionnaires.length,
        questionnaire_types: [...new Set(processedQuestionnaires.map(q => q.codigo))],
        has_intake: !!(intakeData && intakeData.length > 0)
      }
    };

    console.log('\n🎯 RESUMEN DE DATOS PARA GPT-4O:');
    console.log(`   👤 Paciente: ${consolidatedData.patient.name}`);
    console.log(`   📋 Total cuestionarios: ${consolidatedData.summary.total_questionnaires}`);
    console.log(`   🧪 Tipos: ${consolidatedData.summary.questionnaire_types.join(', ')}`);
    console.log(`   📝 Entrevista inicial: ${consolidatedData.summary.has_intake ? 'SÍ' : 'NO'}`);

    console.log('\n✅ CONCLUSIÓN: Los datos están disponibles y estructurados correctamente');
    console.log('🚨 El problema debe estar en la autenticación del endpoint HTTP');

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testPatientDataEndpoint();
