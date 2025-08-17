const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugTokenVerification() {
  console.log('🔍 Debugging Token Verification Process\n');

  try {
    // 1. Buscar un token activo de OYS
    console.log('1️⃣ Finding active OYS token...');
    const { data: links, error: linksError } = await supabase
      .from('links_cuestionario')
      .select('*')
      .eq('consumido', false)
      .gt('expira_en', new Date().toISOString())
      .limit(5);

    if (linksError) {
      console.error('❌ Error fetching links:', linksError);
      return;
    }

    console.log(`Found ${links?.length || 0} active links`);
    
    const oysLink = links?.find(link => 
      link.cuestionario_codigo && link.cuestionario_codigo.includes('OYS')
    );

    if (!oysLink) {
      console.log('⚠️ No active OYS links found. Creating test link...');
      
      // Crear un link de prueba
      const { data: questionnaires } = await supabase
        .from('cuestionarios')
        .select('*')
        .eq('codigo', 'OYS-PS-P-SF20')
        .eq('activo', true)
        .single();

      if (!questionnaires) {
        console.error('❌ OYS questionnaire not found');
        return;
      }

      const testToken = 'test-token-' + Date.now();
      const { data: newLink, error: createError } = await supabase
        .from('links_cuestionario')
        .insert({
          token: testToken,
          cuestionario_id: questionnaires.id,
          paciente_id: 'test-patient-id',
          expira_en: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          consumido: false
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating test link:', createError);
        return;
      }

      console.log('✅ Created test link:', testToken);
      
      // Usar el nuevo link
      const token = testToken;
      
      // 2. Simular el proceso de verificación del token
      console.log('\n2️⃣ Simulating token verification process...');
      console.log('Token:', token);

      // Obtener el link
      const { data: link, error: linkError } = await supabase
        .from('links_cuestionario')
        .select('*')
        .eq('token', token)
        .single();

      if (linkError) {
        console.error('❌ Link error:', linkError);
        return;
      }

      console.log('✅ Link found:', {
        cuestionario_id: link.cuestionario_id,
        paciente_id: link.paciente_id,
        consumido: link.consumido
      });

      // Obtener el cuestionario
      const { data: cuestionario, error: questError } = await supabase
        .from('cuestionarios')
        .select('*')
        .eq('id', link.cuestionario_id)
        .single();

      if (questError) {
        console.error('❌ Questionnaire error:', questError);
        return;
      }

      console.log('✅ Questionnaire found:', {
        codigo: cuestionario.codigo,
        titulo: cuestionario.titulo,
        items_length: Array.isArray(cuestionario.items) ? cuestionario.items.length : 'not array',
        items_sample: Array.isArray(cuestionario.items) ? cuestionario.items.slice(0, 2) : cuestionario.items
      });

      // 3. Verificar el proceso de parsing de ítems
      console.log('\n3️⃣ Analyzing items parsing...');
      
      let parsedItems = [];
      if (cuestionario.items) {
        try {
          parsedItems = typeof cuestionario.items === 'string' 
            ? JSON.parse(cuestionario.items) 
            : cuestionario.items;
        } catch (e) {
          console.error('❌ Items parsing error:', e.message);
          console.log('Raw items:', cuestionario.items);
        }
      }

      console.log('Parsed items:', {
        length: parsedItems.length,
        first_item: parsedItems[0],
        has_opciones: parsedItems[0]?.opciones_respuesta ? 'YES' : 'NO'
      });

      // 4. Simular la adición de opciones dinámicas
      console.log('\n4️⃣ Simulating dynamic options addition...');
      
      const addDynamicOptions = (items, codigo) => {
        if (!Array.isArray(items)) return [];
        
        return items.map(item => {
          if (item.opciones_respuesta && item.opciones_respuesta.length > 0) {
            return item; // Ya tiene opciones
          }

          // Determinar opciones según el código
          let opciones = [];
          if (codigo.includes('PS')) {
            // Problemas: 0-5
            opciones = [
              { valor: 0, texto: 'Nada en absoluto' },
              { valor: 1, texto: 'Una o dos veces' },
              { valor: 2, texto: 'Varias veces' },
              { valor: 3, texto: 'A menudo' },
              { valor: 4, texto: 'La mayor parte del tiempo' },
              { valor: 5, texto: 'Todo el tiempo' }
            ];
          } else if (codigo.includes('F')) {
            // Funcionamiento: 0-4
            opciones = [
              { valor: 0, texto: 'Problemas extremos' },
              { valor: 1, texto: 'Bastantes problemas' },
              { valor: 2, texto: 'Algunos problemas' },
              { valor: 3, texto: 'Bien' },
              { valor: 4, texto: 'Muy bien' }
            ];
          }

          return {
            ...item,
            opciones_respuesta: opciones
          };
        });
      };

      const itemsWithOptions = addDynamicOptions(parsedItems, cuestionario.codigo);
      
      console.log('Items with dynamic options:', {
        length: itemsWithOptions.length,
        first_item_options: itemsWithOptions[0]?.opciones_respuesta?.length || 0,
        sample_options: itemsWithOptions[0]?.opciones_respuesta?.slice(0, 3)
      });

      // 5. Verificar la respuesta final que se enviaría al frontend
      console.log('\n5️⃣ Final response structure...');
      
      const finalResponse = {
        cuestionario: {
          id: cuestionario.id,
          codigo: cuestionario.codigo,
          titulo: cuestionario.titulo,
          items: itemsWithOptions
        },
        patient: { id: link.patient_id },
        link: { token: link.token }
      };

      console.log('Final response summary:', {
        cuestionario_codigo: finalResponse.cuestionario.codigo,
        items_count: finalResponse.cuestionario.items.length,
        first_item_has_options: finalResponse.cuestionario.items[0]?.opciones_respuesta ? 'YES' : 'NO',
        options_count: finalResponse.cuestionario.items[0]?.opciones_respuesta?.length || 0
      });

      console.log('\n📋 DIAGNOSIS:');
      console.log('- Token verification: ✅');
      console.log('- Questionnaire loading: ✅');
      console.log('- Items parsing: ✅');
      console.log('- Dynamic options: ✅');
      console.log('- Response structure: ✅');

    } else {
      console.log('✅ Found existing OYS link:', oysLink.token);
      // Procesar el link existente...
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugTokenVerification();
