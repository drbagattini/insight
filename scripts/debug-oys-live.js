// Debug script to check OYS questionnaire in database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugOYSLive() {
  console.log('🔍 Debugging OYS Questionnaire Live\n');

  try {
    // 1. Check if OYS questionnaire exists
    console.log('1️⃣ Checking OYS questionnaire in database...');
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
      console.error('❌ OYS-PS-P-SF20 questionnaire not found');
      return;
    }

    console.log('✅ Found questionnaire:', {
      id: questionnaire.id,
      codigo: questionnaire.codigo,
      titulo: questionnaire.titulo,
      destinatario: questionnaire.destinatario
    });

    // 2. Analyze items structure
    console.log('\n2️⃣ Analyzing items structure...');
    let items = questionnaire.items;
    console.log('Raw items type:', typeof items);
    console.log('Raw items preview:', JSON.stringify(items).substring(0, 200) + '...');

    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
        console.log('✅ Items parsed from JSON string');
      } catch (parseError) {
        console.error('❌ Error parsing items:', parseError);
        return;
      }
    }

    if (items && typeof items === 'object' && !Array.isArray(items)) {
      if (items.items && Array.isArray(items.items)) {
        items = items.items;
        console.log('✅ Items extracted from nested structure');
      } else {
        console.error('❌ Items object has no items array:', Object.keys(items));
        return;
      }
    }

    if (!Array.isArray(items)) {
      console.error('❌ Items is not an array:', typeof items);
      return;
    }

    console.log(`✅ Items is array with ${items.length} elements`);

    // 3. Check first few items
    console.log('\n3️⃣ First 3 items:');
    items.slice(0, 3).forEach((item, i) => {
      console.log(`Item ${i + 1}:`, {
        id: item.id,
        orden: item.orden,
        texto: item.texto?.substring(0, 60) + '...',
        hasOpciones: !!item.opciones_respuesta,
        opcionesCount: item.opciones_respuesta?.length || 0
      });
    });

    // 4. Create a test link
    console.log('\n4️⃣ Creating test link...');
    
    // Get a test patient
    const { data: patient } = await supabase
      .from('patients')
      .select('id, name')
      .limit(1)
      .single();

    if (!patient) {
      console.log('❌ No patients found for testing');
      return;
    }

    const testToken = 'debug-oys-' + Date.now();
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 1);

    const { data: linkData, error: linkError } = await supabase
      .from('links_cuestionario')
      .insert({
        token: testToken,
        paciente_id: patient.id,
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
      patient: patient.name,
      url: `http://localhost:3000/cuestionario/${testToken}`
    });

    // 5. Test the verificar endpoint directly
    console.log('\n5️⃣ Testing verificar endpoint...');
    try {
      const response = await fetch(`http://localhost:3000/api/cuestionarios/verificar/${testToken}`);
      
      if (!response.ok) {
        console.error('❌ Verificar endpoint failed:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error:', errorText);
      } else {
        const data = await response.json();
        console.log('✅ Verificar endpoint works');
        console.log('Response items count:', data.cuestionario?.items?.length);
        console.log('First item has options:', !!data.cuestionario?.items?.[0]?.opciones_respuesta);
        
        if (data.cuestionario?.items?.[0]?.opciones_respuesta) {
          console.log('Options:', data.cuestionario.items[0].opciones_respuesta.map(opt => `${opt.valor}: ${opt.texto}`));
        }
      }
    } catch (fetchError) {
      console.error('❌ Error testing endpoint:', fetchError.message);
    }

    // Clean up test link after 10 seconds
    setTimeout(async () => {
      await supabase
        .from('links_cuestionario')
        .delete()
        .eq('token', testToken);
      console.log('\n🧹 Test link cleaned up');
    }, 10000);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugOYSLive();
