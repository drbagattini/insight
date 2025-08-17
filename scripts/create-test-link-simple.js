const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestLink() {
  console.log('🔗 Creating test link for OYS questionnaire\n');

  try {
    // 1. Obtener un usuario existente (tabla users)
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (userError || !users?.length) {
      console.error('❌ No users found:', userError);
      return;
    }

    const psychologistId = users[0].id;
    console.log('✅ Using psychologist:', psychologistId);

    // 2. Crear paciente con psychologist_id
    const testPatientId = crypto.randomUUID();
    const { error: patientError } = await supabase
      .from('patients')
      .insert({
        id: testPatientId,
        name: 'Leo Bagattini',
        email: 'test@example.com',
        psychologist_id: psychologistId
      });

    if (patientError) {
      console.error('❌ Error creating patient:', patientError);
      return;
    }

    console.log('✅ Created patient:', testPatientId);

    // 3. Obtener cuestionario OYS
    const { data: oysQuest, error: questError } = await supabase
      .from('cuestionarios')
      .select('*')
      .eq('codigo', 'OYS-PS-P-SF20')
      .eq('activo', true)
      .single();

    if (questError || !oysQuest) {
      console.error('❌ OYS questionnaire not found:', questError);
      return;
    }

    console.log('✅ Found questionnaire:', oysQuest.codigo);

    // 4. Crear link
    const testToken = crypto.randomUUID();
    const { error: linkError } = await supabase
      .from('links_cuestionario')
      .insert({
        token: testToken,
        cuestionario_id: oysQuest.id,
        paciente_id: testPatientId,
        expira_en: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        consumido: false
      });

    if (linkError) {
      console.error('❌ Error creating link:', linkError);
      return;
    }

    console.log('✅ Created test link:', testToken);
    console.log('🔗 Test URL: http://localhost:3000/cuestionario/' + testToken);

    // 5. Probar el API de verificación
    console.log('\n🧪 Testing API verification...');
    
    try {
      const response = await fetch(`http://localhost:3000/api/cuestionarios/verificar/${testToken}`);
      console.log('Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response received');
        console.log('Cuestionario:', data.cuestionario?.codigo);
        console.log('Items count:', data.cuestionario?.items?.length);
        
        if (data.cuestionario?.items?.length > 0) {
          const firstItem = data.cuestionario.items[0];
          console.log('\n📋 First item analysis:');
          console.log('- Texto:', firstItem.texto);
          console.log('- Has opciones:', !!firstItem.opciones_respuesta);
          console.log('- Options count:', firstItem.opciones_respuesta?.length || 0);
          
          if (firstItem.opciones_respuesta?.length > 0) {
            console.log('- Sample options:');
            firstItem.opciones_respuesta.slice(0, 3).forEach((opt, i) => {
              console.log(`  ${opt.valor}: ${opt.texto}`);
            });
            console.log('✅ OPTIONS ARE PRESENT IN API');
          } else {
            console.log('❌ NO OPTIONS IN API RESPONSE');
          }

          // Verificar si hay más de 5 preguntas por página
          console.log('\n📄 Pagination analysis:');
          console.log('Total items:', data.cuestionario.items.length);
          console.log('Expected pages (10 per page):', Math.ceil(data.cuestionario.items.length / 10));
          console.log('Current behavior (5 per page):', Math.ceil(data.cuestionario.items.length / 5));
        }
      } else {
        const errorText = await response.text();
        console.log('❌ API Error:', errorText);
      }
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError.message);
    }

    return testToken;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestLink();
