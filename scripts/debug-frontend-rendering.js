// Debug frontend rendering issue - check what data is actually reaching the frontend
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugFrontendRendering() {
  console.log('🔍 Debugging Frontend Rendering Issue\n');

  try {
    // 1. Get an existing link token from the database
    console.log('1️⃣ Finding existing questionnaire link...');
    const { data: existingLink, error: linkError } = await supabase
      .from('links_cuestionario')
      .select('*')
      .eq('consumido', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let linkToUse;
    if (linkError || !existingLink) {
      console.log('No existing link found, creating new one...');
      
      // Get OYS questionnaire and a patient
      const { data: questionnaire } = await supabase
        .from('cuestionarios')
        .select('*')
        .eq('codigo', 'OYS-PS-P-SF20')
        .single();
        
      const { data: patient } = await supabase
        .from('patients')
        .select('*')
        .limit(1)
        .single();

      if (!questionnaire || !patient) {
        console.error('❌ Missing questionnaire or patient');
        return;
      }

      // Create a new link with proper UUID
      const testToken = crypto.randomUUID();
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 24);

      const { data: newLink, error: createError } = await supabase
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

      if (createError) {
        console.error('❌ Error creating link:', createError);
        return;
      }

      console.log('✅ Created new test link:', testToken);
      // Use the new link data
      linkToUse = newLink;
    } else {
      console.log('✅ Found existing link:', existingLink.token);
      linkToUse = existingLink;
    }

    // 2. Test the verificar endpoint directly
    console.log('\n2️⃣ Testing verificar endpoint...');
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`http://localhost:3000/api/cuestionarios/verificar/${linkToUse.token}`);
    
    if (!response.ok) {
      console.error('❌ Verificar endpoint failed:', response.status);
      const errorText = await response.text();
      console.error('Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Verificar endpoint response received');

    // 3. Analyze the response structure
    console.log('\n3️⃣ Analyzing response structure...');
    console.log('- pacienteId:', data.pacienteId);
    console.log('- pacienteNombre:', data.pacienteNombre);
    console.log('- cuestionarioId:', data.cuestionarioId);
    console.log('- expirado:', data.expirado);
    
    console.log('\n4️⃣ Questionnaire analysis:');
    const cuestionario = data.cuestionario;
    console.log('- codigo:', cuestionario?.codigo);
    console.log('- titulo:', cuestionario?.titulo);
    console.log('- items type:', typeof cuestionario?.items);
    console.log('- items is array:', Array.isArray(cuestionario?.items));
    console.log('- items length:', cuestionario?.items?.length);

    if (!cuestionario?.items) {
      console.error('❌ CRITICAL: No items in cuestionario object');
      return;
    }

    if (!Array.isArray(cuestionario.items)) {
      console.error('❌ CRITICAL: Items is not an array:', typeof cuestionario.items);
      console.log('Items value:', cuestionario.items);
      return;
    }

    if (cuestionario.items.length === 0) {
      console.error('❌ CRITICAL: Items array is empty');
      return;
    }

    console.log('\n5️⃣ First 3 items analysis:');
    cuestionario.items.slice(0, 3).forEach((item, i) => {
      console.log(`Item ${i + 1}:`);
      console.log('  - id:', item.id);
      console.log('  - orden:', item.orden);
      console.log('  - texto:', item.texto?.substring(0, 50) + '...');
      console.log('  - has opciones_respuesta:', !!item.opciones_respuesta);
      console.log('  - opciones_respuesta length:', item.opciones_respuesta?.length);
      
      if (item.opciones_respuesta && item.opciones_respuesta.length > 0) {
        console.log('  - first option:', item.opciones_respuesta[0]);
        console.log('  - last option:', item.opciones_respuesta[item.opciones_respuesta.length - 1]);
      }
    });

    // 6. Check if the issue is in the frontend rendering logic
    console.log('\n6️⃣ Frontend rendering check:');
    const firstItem = cuestionario.items[0];
    const opciones = firstItem.opciones_respuesta || [];
    
    console.log('- opciones variable:', opciones);
    console.log('- opciones.length:', opciones.length);
    console.log('- opciones.length > 0:', opciones.length > 0);
    
    if (opciones.length === 0) {
      console.error('❌ CRITICAL: First item has no opciones_respuesta');
      console.log('This explains why no buttons are rendered!');
    } else {
      console.log('✅ First item has opciones_respuesta');
      console.log('The issue might be elsewhere in the rendering logic');
    }

    console.log('\n🔗 Test this URL in your browser:');
    console.log(`http://localhost:3000/cuestionario/${linkToUse.token}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugFrontendRendering();
