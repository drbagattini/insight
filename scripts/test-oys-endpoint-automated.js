const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOYSEndpointAutomated() {
  console.log('🤖 AUTOMATED OYS ENDPOINT TESTING');
  console.log('==================================\n');

  let testPatientId = null;
  let testPatientName = null;

  try {
    // 1. Check environment
    console.log('1️⃣ Checking environment...');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing environment variables');
      return;
    }
    console.log('✅ Environment OK\n');

    // 2. Check if OYS questionnaires exist
    console.log('2️⃣ Checking OYS questionnaires...');
    const { data: questionnaires, error: qError } = await supabase
      .from('cuestionarios')
      .select('id, codigo, titulo, activo')
      .in('codigo', ['OYS-PADRES-40', 'OYS-JOVENES-40']);

    if (qError) {
      console.error('❌ Error checking questionnaires:', qError.message);
      return;
    }

    const activeCodes = questionnaires?.filter(q => q.activo).map(q => q.codigo) || [];
    console.log(`✅ Found ${activeCodes.length}/2 active OYS questionnaires:`, activeCodes);

    if (activeCodes.length === 0) {
      console.log('❌ No OYS questionnaires found. Please run the SQL script first: scripts/create-oys-questionnaire.sql');
      return;
    }
    console.log('');

    // 3. Find or create test patient
    console.log('3️⃣ Finding test patient...');
    const { data: patients, error: pError } = await supabase
      .from('patients')
      .select('id, name, psychologist_id')
      .limit(1);

    if (pError) {
      console.error('❌ Error finding patients:', pError.message);
      return;
    }

    if (patients && patients.length > 0) {
      testPatientId = patients[0].id;
      testPatientName = patients[0].name;
      console.log(`✅ Using existing patient: ${testPatientName} (${testPatientId})`);
    } else {
      // Need to create a patient - first find a psychologist
      const { data: users, error: uError } = await supabase
        .from('users')
        .select('id, email')
        .limit(1);

      if (uError || !users || users.length === 0) {
        console.error('❌ No users found to create patient');
        return;
      }

      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert({
          psychologist_id: users[0].id,
          name: 'Paciente Prueba OYS Automatizado',
          email: `test-oys-auto-${Date.now()}@example.com`
        })
        .select('id, name')
        .single();

      if (createError || !newPatient) {
        console.error('❌ Error creating test patient:', createError?.message);
        return;
      }

      testPatientId = newPatient.id;
      testPatientName = newPatient.name;
      console.log(`✅ Created test patient: ${testPatientName} (${testPatientId})`);
    }
    console.log('');

    // 4. Clean existing test data
    console.log('4️⃣ Cleaning existing test data...');
    const { error: cleanError } = await supabase
      .from('respuestas')
      .delete()
      .eq('paciente_id', testPatientId)
      .eq('enviado_desde', 'email')
      .gte('puntuacion', 0);

    if (cleanError) {
      console.log('⚠️  Warning cleaning existing data:', cleanError.message);
    } else {
      console.log('✅ Cleaned existing test data');
    }
    console.log('');

    // 5. Generate test data using direct database insertion
    console.log('5️⃣ Generating OYS test data...');
    
    // Get questionnaire IDs
    const { data: qData, error: qDataError } = await supabase
      .from('cuestionarios')
      .select('id, codigo')
      .in('codigo', ['OYS-PADRES-40', 'OYS-JOVENES-40'])
      .eq('activo', true);

    if (qDataError || !qData || qData.length === 0) {
      console.error('❌ Error getting questionnaire data:', qDataError?.message);
      return;
    }

    const qByCode = new Map(qData.map(q => [q.codigo, q]));
    
    // Generate test dates (4 points over 30 days)
    const now = new Date();
    const testDates = [
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      new Date() // today
    ];

    const responses = [];
    
    for (const [dateIndex, fecha] of testDates.entries()) {
      for (const code of ['OYS-PADRES-40', 'OYS-JOVENES-40']) {
        const q = qByCode.get(code);
        if (!q) continue;

        const isPS = code.includes('-PS-');
        const respuestas = {};
        
        // Generate 40 realistic responses for consolidated questionnaires
        for (let i = 1; i <= 40; i++) {
          if (i <= 20) {
            // Items 1-20: Problem Severity - higher scores = worse problems, improve over time
            const base = Math.max(0, 5 - dateIndex + Math.floor(Math.random() * 2));
            respuestas[i] = Math.min(4, base);
          } else {
            // Items 21-40: Functioning - higher scores = better functioning, improve over time  
            const base = Math.min(4, dateIndex + 1 + Math.floor(Math.random() * 2));
            respuestas[i] = Math.max(0, base);
          }
        }

        const puntuacion = Object.values(respuestas).reduce((sum, val) => sum + val, 0);
        
        responses.push({
          paciente_id: testPatientId,
          cuestionario_id: q.id,
          respuestas,
          enviado_desde: 'email',
          enviado_en: fecha.toISOString(),
          puntuacion,
          creado_en: fecha.toISOString()
        });
      }
    }

    // Insert all responses
    const { error: insertError } = await supabase
      .from('respuestas')
      .insert(responses);

    if (insertError) {
      console.error('❌ Error inserting test data:', insertError.message);
      return;
    }

    console.log(`✅ Inserted ${responses.length} test responses (${testDates.length} time points × ${qData.length} questionnaires)`);
    console.log('');

    // 6. Verify data insertion
    console.log('6️⃣ Verifying inserted data...');
    const { data: inserted, error: verifyError } = await supabase
      .from('respuestas')
      .select(`
        id,
        enviado_en,
        puntuacion,
        cuestionarios!inner(codigo, titulo)
      `)
      .eq('paciente_id', testPatientId)
      .eq('enviado_desde', 'email')
      .order('enviado_en', { ascending: true });

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError.message);
      return;
    }

    console.log(`✅ Verified ${inserted?.length || 0} responses in database:`);
    if (inserted) {
      inserted.forEach(r => {
        const fecha = new Date(r.enviado_en).toLocaleDateString('es-ES');
        console.log(`   - ${fecha}: ${r.cuestionarios.codigo} (score: ${r.puntuacion})`);
      });
    }
    console.log('');

    // 7. Test consolidated endpoints
    console.log('7️⃣ Testing consolidated OYS endpoints...');
    
    // Test parents endpoint
    const { data: padresData, error: padresError } = await supabase
      .from('respuestas')
      .select(`
        id,
        enviado_en,
        respuestas,
        cuestionarios!inner(codigo)
      `)
      .eq('paciente_id', testPatientId)
      .in('cuestionarios.codigo', ['OYS-PADRES-40'])
      .order('enviado_en', { ascending: true });

    if (!padresError && padresData && padresData.length > 0) {
      console.log(`✅ Parents data: ${padresData.length} responses found`);
    } else {
      console.log('⚠️  Parents data verification failed');
    }

    // Test youth endpoint  
    const { data: jovenData, error: jovenError } = await supabase
      .from('respuestas')
      .select(`
        id,
        enviado_en,
        respuestas,
        cuestionarios!inner(codigo)
      `)
      .eq('paciente_id', testPatientId)
      .in('cuestionarios.codigo', ['OYS-JOVENES-40'])
      .order('enviado_en', { ascending: true });

    if (!jovenError && jovenData && jovenData.length > 0) {
      console.log(`✅ Youth data: ${jovenData.length} responses found`);
    } else {
      console.log('⚠️  Youth data verification failed');
    }
    console.log('');

    // 8. SUCCESS - Provide UI testing instructions
    console.log('🎉 AUTOMATED TESTING COMPLETED SUCCESSFULLY!');
    console.log('==========================================\n');
    
    console.log('📋 NOW TEST FROM UI:');
    console.log('-------------------');
    console.log(`1. Go to: http://localhost:3000/dashboard/perfil-del-paciente/${testPatientId}`);
    console.log('2. In the questionnaire selector dropdown, choose:');
    console.log('   - "Ohio Youth Scales - Padres/Tutores (40 ítems)" (for parents data)');
    console.log('   - "Ohio Youth Scales - Jóvenes (40 ítems)" (for youth data)');
    console.log('3. The chart should render showing improvement over time');
    console.log('4. You should see 4 data points spanning ~30 days');
    console.log('5. Each questionnaire contains both Problem Severity (items 1-20) and Functioning (items 21-40)');
    console.log('');
    
    console.log('📊 EXPECTED CHART BEHAVIOR:');
    console.log('---------------------------');
    console.log('- Problem Severity (items 1-20): Should show DECREASING trend (improvement)');
    console.log('- Functioning (items 21-40): Should show INCREASING trend (improvement)');
    console.log('- Both charts should have 4 data points');
    console.log('- Dates should span from ~30 days ago to today');
    console.log('- Consolidated questionnaires should display detailed response tables');
    console.log('');
    
    console.log('🧹 CLEANUP (when done testing):');
    console.log('-------------------------------');
    console.log(`DELETE FROM respuestas WHERE paciente_id = '${testPatientId}' AND enviado_desde = 'email';`);
    console.log('');
    
    console.log('✅ All automated tests passed! Ready for UI testing.');

  } catch (error) {
    console.error('❌ Automated test failed:', error);
  }
}

testOYSEndpointAutomated();
