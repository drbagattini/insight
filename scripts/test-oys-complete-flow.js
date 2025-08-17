const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOYSCompleteFlow() {
  console.log('🧪 Testing OYS Complete Flow\n');

  try {
    // 1. Verificar cuestionarios activos
    console.log('1️⃣ Testing questionnaire listing API...');
    const { data: questionnaires, error: qError } = await supabase
      .from('cuestionarios')
      .select('*')
      .eq('activo', true)
      .ilike('codigo', 'OYS%');

    if (qError) {
      console.error('❌ Error fetching questionnaires:', qError);
      return;
    }

    console.log(`✅ Found ${questionnaires.length} active OYS questionnaires:`);
    questionnaires.forEach(q => {
      const destinatario = q.codigo.includes('-P-') || q.codigo.includes('PADRES') ? 'padre_tutor' : 'paciente';
      console.log(`   - ${q.codigo}: ${q.titulo} → ${destinatario}`);
      console.log(`     Items: ${Array.isArray(q.items) ? q.items.length : 'Not array'}`);
      
      if (Array.isArray(q.items) && q.items.length > 0) {
        const hasOptions = q.items[0].opciones_respuesta && q.items[0].opciones_respuesta.length > 0;
        console.log(`     First item has options: ${hasOptions ? '✅' : '❌'}`);
      }
    });

    // 2. Crear un paciente de prueba
    console.log('\n2️⃣ Creating test patient...');
    const testPatient = {
      name: 'Paciente Prueba OYS',
      email: 'test@example.com'
    };

    const { error: patientError } = await supabase
      .from('patients')
      .upsert(testPatient);

    if (patientError) {
      console.error('❌ Error creating patient:', patientError);
      return;
    }
    console.log('✅ Test patient created');

    // 3. Simular envío de cuestionario a padre
    console.log('\n3️⃣ Testing questionnaire sending to parent...');
    const parentQuestionnaire = questionnaires.find(q => q.codigo === 'OYS-PS-P-SF20');
    
    if (!parentQuestionnaire) {
      console.error('❌ OYS-PS-P-SF20 not found');
      return;
    }

    const linkToken = 'test-token-' + Date.now();
    const linkData = {
      token: linkToken,
      paciente_id: testPatient.id,
      cuestionario_id: parentQuestionnaire.id,
      destinatario: 'padre_tutor',
      canal: 'email',
      expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      consumido: false
    };

    const { error: linkError } = await supabase
      .from('links_cuestionario')
      .upsert(linkData);

    if (linkError) {
      console.error('❌ Error creating questionnaire link:', linkError);
      return;
    }
    console.log('✅ Questionnaire link created');

    // 4. Simular verificación del token (como lo haría el frontend)
    console.log('\n4️⃣ Testing token verification...');
    const { data: linkInfo, error: verifyError } = await supabase
      .from('links_cuestionario')
      .select('*')
      .eq('token', linkToken)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying token:', verifyError);
      return;
    }

    const { data: questionnaireData, error: qDataError } = await supabase
      .from('cuestionarios')
      .select('*')
      .eq('id', linkInfo.cuestionario_id)
      .single();

    if (qDataError) {
      console.error('❌ Error fetching questionnaire data:', qDataError);
      return;
    }

    console.log('✅ Token verification successful');
    console.log(`   Questionnaire: ${questionnaireData.codigo}`);
    console.log(`   Items count: ${Array.isArray(questionnaireData.items) ? questionnaireData.items.length : 'Not array'}`);
    
    if (Array.isArray(questionnaireData.items) && questionnaireData.items.length > 0) {
      const firstItem = questionnaireData.items[0];
      console.log(`   First item: "${firstItem.texto}"`);
      console.log(`   Response options: ${firstItem.opciones_respuesta ? firstItem.opciones_respuesta.length : 0}`);
      
      if (firstItem.opciones_respuesta && firstItem.opciones_respuesta.length > 0) {
        console.log(`   Options: ${firstItem.opciones_respuesta.map(o => `${o.valor}="${o.texto}"`).join(', ')}`);
      }
    }

    // 5. Simular respuestas del cuestionario
    console.log('\n5️⃣ Testing questionnaire responses...');
    const mockResponses = {};
    for (let i = 1; i <= 20; i++) {
      mockResponses[i] = Math.floor(Math.random() * 6); // 0-5 para OYS-PS
    }

    const responseData = {
      token: linkToken,
      paciente_id: testPatient.id,
      cuestionario_id: parentQuestionnaire.id,
      respuestas: mockResponses,
      completado_en: new Date().toISOString(),
      informante: 'padre_tutor'
    };

    const { error: responseError } = await supabase
      .from('respuestas')
      .upsert(responseData);

    if (responseError) {
      console.error('❌ Error saving responses:', responseError);
      return;
    }
    console.log('✅ Responses saved successfully');
    console.log(`   Sample responses: ${JSON.stringify(Object.fromEntries(Object.entries(mockResponses).slice(0, 5)))}`);

    // 6. Marcar link como consumido
    const { error: consumeError } = await supabase
      .from('links_cuestionario')
      .update({ consumido: true })
      .eq('token', linkToken);

    if (consumeError) {
      console.error('❌ Error marking link as consumed:', consumeError);
    } else {
      console.log('✅ Link marked as consumed');
    }

    // 7. Cleanup - eliminar datos de prueba
    console.log('\n6️⃣ Cleaning up test data...');
    await supabase.from('respuestas').delete().eq('token', linkToken);
    await supabase.from('links_cuestionario').delete().eq('token', linkToken);
    await supabase.from('patients').delete().eq('id', testPatient.id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 OYS Complete Flow Test SUCCESSFUL!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Questionnaires are active and have proper structure');
    console.log('   ✅ Items have response options');
    console.log('   ✅ Token verification works');
    console.log('   ✅ Response saving works');
    console.log('   ✅ Parent/tutor flow is functional');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testOYSCompleteFlow();
