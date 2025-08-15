const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugOYSQuestionnaire() {
  console.log('🔍 Debugging OYS Questionnaire Display Issue\n');

  try {
    // 1. Verificar que existe el cuestionario OYS-PS-P-SF20
    console.log('1️⃣ Checking if OYS-PS-P-SF20 questionnaire exists...');
    const { data: questionnaire, error: qError } = await supabase
      .from('cuestionarios')
      .select('*')
      .eq('codigo', 'OYS-PS-P-SF20')
      .single();

    if (qError) {
      console.error('❌ Error fetching questionnaire:', qError);
      return;
    }

    if (!questionnaire) {
      console.error('❌ Questionnaire OYS-PS-P-SF20 not found');
      return;
    }

    console.log('✅ Questionnaire found:', {
      id: questionnaire.id,
      codigo: questionnaire.codigo,
      titulo: questionnaire.titulo,
      hasItems: !!questionnaire.items,
      itemsType: typeof questionnaire.items,
      itemsLength: questionnaire.items ? (Array.isArray(questionnaire.items) ? questionnaire.items.length : 'Not array') : 'null'
    });

    // 2. Analizar estructura de items
    console.log('\n2️⃣ Analyzing items structure...');
    let items = questionnaire.items;
    
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
        console.log('✅ Items parsed from JSON string');
      } catch (parseError) {
        console.error('❌ Error parsing items JSON:', parseError);
        return;
      }
    }

    if (!items) {
      console.error('❌ No items found in questionnaire');
      return;
    }

    if (typeof items === 'object' && !Array.isArray(items)) {
      if (items.items && Array.isArray(items.items)) {
        items = items.items;
        console.log('✅ Items extracted from nested structure');
      } else {
        console.error('❌ Items is object but no items array found:', Object.keys(items));
        return;
      }
    }

    if (!Array.isArray(items)) {
      console.error('❌ Items is not an array:', typeof items);
      return;
    }

    console.log(`✅ Items is array with ${items.length} elements`);

    // 3. Analizar primeros items
    console.log('\n3️⃣ Analyzing first 5 items...');
    items.slice(0, 5).forEach((item, index) => {
      console.log(`Item ${index + 1}:`, {
        id: item.id,
        orden: item.orden,
        texto: item.texto?.substring(0, 50) + '...',
        hasOpciones: !!item.opciones_respuesta,
        opcionesLength: item.opciones_respuesta?.length || 0
      });
    });

    // 4. Verificar opciones de respuesta
    console.log('\n4️⃣ Checking response options...');
    const firstItem = items[0];
    if (firstItem && firstItem.opciones_respuesta) {
      console.log('✅ First item has response options:', firstItem.opciones_respuesta);
    } else {
      console.log('❌ First item missing response options');
      
      // Generar opciones de respuesta para OYS-PS-P-SF20
      const oysOptions = [
        { valor: 0, texto: "Nada en absoluto" },
        { valor: 1, texto: "Una o dos veces" },
        { valor: 2, texto: "Varias veces" },
        { valor: 3, texto: "A menudo" },
        { valor: 4, texto: "La mayor parte del tiempo" },
        { valor: 5, texto: "Todo el tiempo" }
      ];
      
      console.log('📝 Expected OYS options:', oysOptions);
    }

    // 5. Crear un token de prueba para verificar el endpoint
    console.log('\n5️⃣ Creating test token...');
    const testToken = 'debug-oys-' + Date.now();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    // Buscar un paciente de prueba
    const { data: testPatient } = await supabase
      .from('patients')
      .select('id, name')
      .limit(1)
      .single();

    if (!testPatient) {
      console.log('❌ No test patient found');
      return;
    }

    const { data: linkData, error: linkError } = await supabase
      .from('links_cuestionario')
      .insert({
        token: testToken,
        paciente_id: testPatient.id,
        cuestionario_id: questionnaire.id,
        expira_en: expirationDate.toISOString(),
        consumido: false
      })
      .select()
      .single();

    if (linkError) {
      console.error('❌ Error creating test link:', linkError);
      return;
    }

    console.log('✅ Test link created:', {
      token: testToken,
      patient: testPatient.name,
      questionnaire: questionnaire.titulo
    });

    console.log('\n🔗 Test URL:', `http://localhost:3000/cuestionario/${testToken}`);

    // 6. Limpiar el token de prueba después de 5 segundos
    setTimeout(async () => {
      await supabase
        .from('links_cuestionario')
        .delete()
        .eq('token', testToken);
      console.log('🧹 Test link cleaned up');
    }, 5000);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Ejecutar debug
debugOYSQuestionnaire();
