const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testBrWaiApi() {
  console.log('🔍 PRUEBA DE API BR-WAI');
  console.log('=======================\n');

  try {
    // 1. Verificar que BR-WAI existe en la base de datos
    console.log('1️⃣ Verificando cuestionario BR-WAI en base de datos...');
    const { data: cuestionario, error: qError } = await supabase
      .from('cuestionarios')
      .select('*')
      .eq('codigo', 'BR-WAI')
      .single();

    if (qError) {
      console.error('❌ Error al buscar BR-WAI:', qError);
      return;
    }

    console.log('✅ BR-WAI encontrado:');
    console.log(`   ID: ${cuestionario.id}`);
    console.log(`   Título: ${cuestionario.titulo}`);
    console.log(`   Activo: ${cuestionario.activo}`);

    // 2. Buscar un paciente existente o usar uno fijo
    console.log('\n2️⃣ Buscando paciente existente...');
    
    // Primero intentar buscar pacientes existentes
    const { data: pacientesExistentes, error: buscarError } = await supabase
      .from('patients')
      .select('id, name')
      .limit(1);
    
    let paciente;
    
    if (buscarError) {
      console.error('❌ Error al buscar pacientes:', buscarError);
      return;
    }
    
    if (pacientesExistentes && pacientesExistentes.length > 0) {
      paciente = pacientesExistentes[0];
      console.log(`✅ Usando paciente existente: ${paciente.name} (${paciente.id})`);
    } else {
      // Si no hay pacientes, usar un ID fijo para la prueba
      console.log('⚠️ No hay pacientes existentes, usando ID fijo para prueba');
      paciente = { id: '00000000-0000-0000-0000-000000000001', name: 'Paciente Prueba' };
    }



    // 3. Crear respuestas de prueba
    const respuestasPrueba = [4, 5, 4, 2, 5, 4, 3, 1, 5, 4, 4, 2, 5, 4, 4, 1];
    console.log('\n3️⃣ Respuestas de prueba:', respuestasPrueba);

    // 4. Calcular score esperado manualmente
    console.log('\n4️⃣ Cálculo manual esperado:');
    
    // Procesar ítems inversos
    const reverseItems = [3, 7, 11, 15]; // índices para ítems 4, 8, 12, 16
    const processedAnswers = respuestasPrueba.map((answer, index) => {
      if (reverseItems.includes(index)) {
        return 6 - answer;
      }
      return answer;
    });

    // Calcular subescalas
    const vinculoItems = [0, 2, 4, 6, 8, 10, 12, 14];
    const tareasObjetivosItems = [1, 3, 5, 7, 9, 11, 13, 15];
    
    const vinculo = vinculoItems.reduce((sum, index) => sum + processedAnswers[index], 0);
    const tareasObjetivos = tareasObjetivosItems.reduce((sum, index) => sum + processedAnswers[index], 0);
    const total = vinculo + tareasObjetivos;

    console.log(`   Vínculo esperado: ${vinculo}`);
    console.log(`   Tareas-Objetivos esperado: ${tareasObjetivos}`);
    console.log(`   Total esperado: ${total}`);

    // 5. Insertar respuesta en la base de datos
    console.log('\n5️⃣ Insertando respuesta en base de datos...');
    
    const { data: respuestaInsertada, error: rError } = await supabase
      .from('respuestas_cuestionarios')
      .insert({
        paciente_id: paciente.id,
        cuestionario_id: cuestionario.id,
        respuestas: respuestasPrueba,
        completado: true
      })
      .select()
      .single();

    if (rError) {
      console.error('❌ Error al insertar respuesta:', rError);
      return;
    }

    console.log(`✅ Respuesta insertada con ID: ${respuestaInsertada.id}`);

    // 6. Hacer llamada a la API para obtener resultados
    console.log('\n6️⃣ Probando API de resultados...');
    
    const apiUrl = `http://localhost:3000/api/cuestionarios/resultados/paciente/${paciente.id}?codigo=BR-WAI`;
    console.log(`   URL: ${apiUrl}`);

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error en API (${response.status}):`, errorText);
      return;
    }

    const apiResult = await response.json();
    console.log('\n✅ Resultado de la API:');
    console.log(JSON.stringify(apiResult, null, 2));

    // 7. Verificar que los cálculos coinciden
    console.log('\n7️⃣ Verificación de cálculos:');
    
    if (apiResult.data && apiResult.data.length > 0) {
      const ultimoResultado = apiResult.data[apiResult.data.length - 1];
      
      if (ultimoResultado.score_detallado) {
        const scoreApi = ultimoResultado.score_detallado;
        console.log(`   Total: API=${scoreApi.total}, Esperado=${total} ${scoreApi.total === total ? '✅' : '❌'}`);
        console.log(`   Vínculo: API=${scoreApi.vinculo}, Esperado=${vinculo} ${scoreApi.vinculo === vinculo ? '✅' : '❌'}`);
        console.log(`   Tareas-Objetivos: API=${scoreApi.tareasObjetivos}, Esperado=${tareasObjetivos} ${scoreApi.tareasObjetivos === tareasObjetivos ? '✅' : '❌'}`);
        
        console.log('\n🎯 Interpretaciones de la API:');
        if (scoreApi.interpretacion) {
          console.log(`   Total: ${scoreApi.interpretacion.total}`);
          console.log(`   Vínculo: ${scoreApi.interpretacion.vinculo}`);
          console.log(`   Tareas-Objetivos: ${scoreApi.interpretacion.tareasObjetivos}`);
        }
      } else {
        console.log('⚠️ No se encontró score_detallado en la respuesta de la API');
      }
    } else {
      console.log('⚠️ No se encontraron datos en la respuesta de la API');
    }

    // 8. Limpiar datos de prueba
    console.log('\n8️⃣ Limpiando datos de prueba...');
    
    // Eliminar respuesta
    const { error: deleteRespuestaError } = await supabase
      .from('respuestas_cuestionarios')
      .delete()
      .eq('id', respuestaInsertada.id);

    if (deleteRespuestaError) {
      console.error('⚠️ Error al eliminar respuesta de prueba:', deleteRespuestaError);
    } else {
      console.log('✅ Respuesta de prueba eliminada');
    }
    
    // No eliminamos el paciente ya que puede ser un paciente real existente
    console.log('ℹ️ Paciente no eliminado (puede ser paciente real existente)');

  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }

  console.log('\n🏁 PRUEBA COMPLETADA');
}

// Ejecutar la prueba
testBrWaiApi().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
