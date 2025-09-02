const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createOYSTestData() {
  console.log('🧪 Creating OYS Test Data for Chart Testing\n');

  try {
    // 1. Buscar un paciente existente o crear uno de prueba
    console.log('1️⃣ Finding or creating test patient...');
    
    let { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, name')
      .limit(1);

    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError);
      return;
    }

    let patientId;
    if (patients && patients.length > 0) {
      patientId = patients[0].id;
      console.log(`✅ Using existing patient: ${patients[0].name} (ID: ${patientId})`);
    } else {
      // Crear paciente de prueba
      const { data: newPatient, error: createError } = await supabase
        .from('patients')
        .insert({
          name: 'Paciente Prueba OYS',
          email: 'test-oys@example.com'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating patient:', createError);
        return;
      }
      
      patientId = newPatient.id;
      console.log(`✅ Created test patient: ${newPatient.name} (ID: ${patientId})`);
    }

    // 2. Buscar cuestionarios OYS
    console.log('\n2️⃣ Finding OYS questionnaires...');
    const { data: questionnaires, error: qError } = await supabase
      .from('cuestionarios')
      .select('id, codigo, titulo')
      .in('codigo', ['OYS-PS-P-SF20', 'OYS-F-P-SF20', 'OYS-PS-J-SF20', 'OYS-F-J-SF20'])
      .eq('activo', true);

    if (qError) {
      console.error('❌ Error fetching questionnaires:', qError);
      return;
    }

    console.log(`✅ Found ${questionnaires.length} OYS questionnaires:`);
    questionnaires.forEach(q => console.log(`   - ${q.codigo}: ${q.titulo}`));

    if (questionnaires.length === 0) {
      console.error('❌ No OYS questionnaires found. Make sure they are active in the database.');
      return;
    }

    // 3. Crear respuestas de prueba para diferentes fechas
    console.log('\n3️⃣ Creating test responses...');
    
    const testDates = [
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
      new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 días atrás
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),  // 7 días atrás
      new Date() // Hoy
    ];

    const responses = [];

    for (const [dateIndex, fecha] of testDates.entries()) {
      for (const questionnaire of questionnaires) {
        const isPS = questionnaire.codigo.includes('-PS-');
        const isPadres = questionnaire.codigo.includes('-P-');
        
        // Generar respuestas realistas
        const respuestas = {};
        const numItems = 20; // OYS-SF20 tiene 20 items
        
        for (let i = 1; i <= numItems; i++) {
          // Simular progreso: valores más altos al inicio, mejorando con el tiempo
          const baseValue = isPS ? 
            Math.max(0, 4 - dateIndex + Math.floor(Math.random() * 2)) : // PS: 4-0 (mejorando)
            Math.min(4, dateIndex + 1 + Math.floor(Math.random() * 2));   // F: 1-4 (mejorando)
          
          respuestas[i] = Math.max(0, Math.min(4, baseValue));
        }

        const responseData = {
          paciente_id: patientId,
          cuestionario_id: questionnaire.id,
          respuestas: respuestas,
          enviado_desde: 'email',
          enviado_en: fecha.toISOString(),
          puntuacion: Object.values(respuestas).reduce((sum, val) => sum + val, 0),
          creado_en: fecha.toISOString(),
          token: `test-token-${questionnaire.codigo}-${dateIndex}-${Date.now()}`
        };

        responses.push(responseData);
      }
    }

    // Insertar todas las respuestas
    const { error: insertError } = await supabase
      .from('respuestas')
      .insert(responses);

    if (insertError) {
      console.error('❌ Error inserting responses:', insertError);
      return;
    }

    console.log(`✅ Created ${responses.length} test responses`);
    console.log(`   - ${testDates.length} time points`);
    console.log(`   - ${questionnaires.length} questionnaires per time point`);
    console.log(`   - Patient ID: ${patientId}`);

    // 4. Verificar que los datos se insertaron correctamente
    console.log('\n4️⃣ Verifying inserted data...');
    const { data: insertedResponses, error: verifyError } = await supabase
      .from('respuestas')
      .select(`
        id,
        enviado_en,
        cuestionarios!inner(codigo, titulo)
      `)
      .eq('paciente_id', patientId)
      .order('enviado_en', { ascending: true });

    if (verifyError) {
      console.error('❌ Error verifying data:', verifyError);
      return;
    }

    console.log(`✅ Verified ${insertedResponses.length} responses in database:`);
    insertedResponses.forEach(r => {
      const fecha = new Date(r.enviado_en).toLocaleDateString('es-ES');
      console.log(`   - ${fecha}: ${r.cuestionarios.codigo} `);
    });

    console.log('\n🎉 OYS Test Data Creation SUCCESSFUL!');
    console.log('\n📋 Next Steps:');
    console.log(`   1. Go to /dashboard/patients/${patientId}`);
    console.log('   2. Select "OYS Padres 40" or "OYS Jóvenes 40" from the questionnaire selector');
    console.log('   3. The chart should now render with the test data');
    console.log('\n🧹 To clean up test data later, run:');
    console.log(`   DELETE FROM respuestas WHERE paciente_id = '${patientId}' AND token LIKE 'test-token-%';`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createOYSTestData();
