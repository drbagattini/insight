// Fix OYS questionnaire items in database by adding response options
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixOYSItems() {
  console.log('🔧 Fixing OYS Questionnaire Items in Database\n');

  try {
    // Define response options for each OYS questionnaire type
    const responseOptions = {
      'OYS-PS-P-SF20': [
        { valor: 0, texto: "Nada en absoluto" },
        { valor: 1, texto: "Una o dos veces" },
        { valor: 2, texto: "Varias veces" },
        { valor: 3, texto: "A menudo" },
        { valor: 4, texto: "La mayor parte del tiempo" },
        { valor: 5, texto: "Todo el tiempo" }
      ],
      'OYS-F-P-SF20': [
        { valor: 0, texto: "Problemas extremos" },
        { valor: 1, texto: "Bastantes problemas" },
        { valor: 2, texto: "Algunos problemas" },
        { valor: 3, texto: "Bien" },
        { valor: 4, texto: "Muy bien" }
      ],
      'OYS-PS-Y-SF20': [
        { valor: 0, texto: "Nada en absoluto" },
        { valor: 1, texto: "Una o dos veces" },
        { valor: 2, texto: "Varias veces" },
        { valor: 3, texto: "A menudo" },
        { valor: 4, texto: "La mayor parte del tiempo" },
        { valor: 5, texto: "Todo el tiempo" }
      ],
      'OYS-F-Y-SF20': [
        { valor: 0, texto: "Problemas extremos" },
        { valor: 1, texto: "Bastantes problemas" },
        { valor: 2, texto: "Algunos problemas" },
        { valor: 3, texto: "Bien" },
        { valor: 4, texto: "Muy bien" }
      ]
    };

    // Get all OYS questionnaires
    console.log('1️⃣ Fetching OYS questionnaires...');
    const { data: questionnaires, error: fetchError } = await supabase
      .from('cuestionarios')
      .select('*')
      .in('codigo', Object.keys(responseOptions));

    if (fetchError) {
      console.error('❌ Error fetching questionnaires:', fetchError);
      return;
    }

    console.log(`✅ Found ${questionnaires.length} OYS questionnaires`);

    // Process each questionnaire
    for (const questionnaire of questionnaires) {
      console.log(`\n2️⃣ Processing ${questionnaire.codigo}...`);
      
      let items = questionnaire.items;
      
      // Parse items if they're a string
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch (parseError) {
          console.error(`❌ Error parsing items for ${questionnaire.codigo}:`, parseError);
          continue;
        }
      }

      // Handle nested structure
      if (items && typeof items === 'object' && !Array.isArray(items)) {
        if (items.items && Array.isArray(items.items)) {
          items = items.items;
        } else {
          console.error(`❌ Invalid items structure for ${questionnaire.codigo}`);
          continue;
        }
      }

      if (!Array.isArray(items)) {
        console.error(`❌ Items is not an array for ${questionnaire.codigo}`);
        continue;
      }

      console.log(`   Found ${items.length} items`);

      // Add response options to each item
      const options = responseOptions[questionnaire.codigo];
      const updatedItems = items.map(item => ({
        ...item,
        opciones_respuesta: options
      }));

      console.log(`   Adding ${options.length} response options to each item`);

      // Update the questionnaire in database
      const { error: updateError } = await supabase
        .from('cuestionarios')
        .update({ items: updatedItems })
        .eq('id', questionnaire.id);

      if (updateError) {
        console.error(`❌ Error updating ${questionnaire.codigo}:`, updateError);
      } else {
        console.log(`✅ Successfully updated ${questionnaire.codigo}`);
      }
    }

    console.log('\n3️⃣ Verification - checking first item of each questionnaire...');
    
    // Verify the updates
    const { data: verifyData, error: verifyError } = await supabase
      .from('cuestionarios')
      .select('codigo, items')
      .in('codigo', Object.keys(responseOptions));

    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError);
      return;
    }

    verifyData.forEach(q => {
      let items = q.items;
      if (typeof items === 'string') {
        items = JSON.parse(items);
      }
      if (items && typeof items === 'object' && !Array.isArray(items) && items.items) {
        items = items.items;
      }
      
      const firstItem = Array.isArray(items) ? items[0] : null;
      const hasOptions = firstItem && firstItem.opciones_respuesta && firstItem.opciones_respuesta.length > 0;
      
      console.log(`   ${q.codigo}: ${hasOptions ? '✅' : '❌'} ${hasOptions ? firstItem.opciones_respuesta.length + ' options' : 'No options'}`);
    });

    console.log('\n🎉 Database update complete! Try refreshing your questionnaire now.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixOYSItems();
