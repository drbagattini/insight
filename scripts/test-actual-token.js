const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testActualToken() {
  console.log('🔍 Testing with actual token from screenshot\n');

  try {
    // 1. Buscar links activos de OYS
    console.log('1️⃣ Finding active OYS links...');
    const { data: links, error: linksError } = await supabase
      .from('links_cuestionario')
      .select('*')
      .eq('consumido', false)
      .gt('expira_en', new Date().toISOString())
      .limit(10);

    if (linksError) {
      console.error('❌ Error fetching links:', linksError);
      return;
    }

    console.log(`Found ${links?.length || 0} active links`);
    
    // Buscar específicamente links OYS
    const oysLinks = links?.filter(link => {
      // Buscar en cuestionario_id o cualquier campo que pueda contener info del cuestionario
      return JSON.stringify(link).includes('OYS');
    }) || [];

    console.log(`OYS links found: ${oysLinks.length}`);
    
    if (oysLinks.length > 0) {
      const testLink = oysLinks[0];
      console.log('Using link:', testLink.token);
      
      // 2. Simular la llamada al API de verificación
      console.log('\n2️⃣ Testing API verification...');
      
      try {
        const response = await fetch(`http://localhost:3000/api/cuestionarios/verificar/${testLink.token}`);
        console.log('API Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API Response received');
          console.log('Cuestionario código:', data.cuestionario?.codigo);
          console.log('Items count:', data.cuestionario?.items?.length);
          console.log('First item:', data.cuestionario?.items?.[0]);
          console.log('First item options:', data.cuestionario?.items?.[0]?.opciones_respuesta?.length);
        } else {
          const errorText = await response.text();
          console.log('❌ API Error:', errorText);
        }
      } catch (fetchError) {
        console.error('❌ Fetch error:', fetchError.message);
      }
    } else {
      console.log('⚠️ No OYS links found. Creating one...');
      
      // Crear un link de prueba
      const { data: oysQuest } = await supabase
        .from('cuestionarios')
        .select('*')
        .eq('codigo', 'OYS-PS-P-SF20')
        .eq('activo', true)
        .single();

      if (oysQuest) {
        // Crear un paciente de prueba
        const testPatientId = crypto.randomUUID();
        const { error: patientError } = await supabase
          .from('patients')
          .insert({
            id: testPatientId,
            name: 'Leo Bagattini Test',
            email: 'test@example.com'
          });

        if (!patientError) {
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

          if (!linkError) {
            console.log('✅ Created test link:', testToken);
            console.log('🔗 Test URL: http://localhost:3000/cuestionario/' + testToken);
            
            // Probar el API
            try {
              const response = await fetch(`http://localhost:3000/api/cuestionarios/verificar/${testToken}`);
              console.log('\nAPI Response status:', response.status);
              
              if (response.ok) {
                const data = await response.json();
                console.log('✅ API Response received');
                console.log('Cuestionario código:', data.cuestionario?.codigo);
                console.log('Items count:', data.cuestionario?.items?.length);
                
                if (data.cuestionario?.items?.length > 0) {
                  const firstItem = data.cuestionario.items[0];
                  console.log('\nFirst item analysis:');
                  console.log('- ID:', firstItem.id);
                  console.log('- Texto:', firstItem.texto);
                  console.log('- Has opciones_respuesta:', !!firstItem.opciones_respuesta);
                  console.log('- Options count:', firstItem.opciones_respuesta?.length || 0);
                  
                  if (firstItem.opciones_respuesta?.length > 0) {
                    console.log('- First option:', firstItem.opciones_respuesta[0]);
                    console.log('✅ OPTIONS ARE PRESENT IN API RESPONSE');
                  } else {
                    console.log('❌ NO OPTIONS IN API RESPONSE');
                  }
                }
              } else {
                const errorText = await response.text();
                console.log('❌ API Error:', errorText);
              }
            } catch (fetchError) {
              console.error('❌ Fetch error:', fetchError.message);
            }
          } else {
            console.error('❌ Error creating link:', linkError);
          }
        } else {
          console.error('❌ Error creating patient:', patientError);
        }
      } else {
        console.error('❌ OYS questionnaire not found');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testActualToken();
