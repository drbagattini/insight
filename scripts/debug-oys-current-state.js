const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugOYSCurrentState() {
  console.log('🔍 Debugging OYS Current State\n');

  try {
    // 1. Verificar cuestionarios OYS existentes
    console.log('1️⃣ Checking existing OYS questionnaires...');
    const { data: questionnaires, error: qError } = await supabase
      .from('cuestionarios')
      .select('*')
      .ilike('codigo', 'OYS%')
      .order('codigo');

    if (qError) {
      console.error('❌ Error fetching questionnaires:', qError);
      return;
    }

    console.log(`✅ Found ${questionnaires.length} OYS questionnaires:`);
    questionnaires.forEach(q => {
      console.log(`   - ${q.codigo}: ${q.titulo}`);
      console.log(`     Destinatario: ${q.destinatario}`);
      console.log(`     Activo: ${q.activo}`);
      console.log(`     Items: ${Array.isArray(q.items) ? q.items.length : 'Not array'}`);
      
      if (Array.isArray(q.items) && q.items.length > 0) {
        const firstItem = q.items[0];
        console.log(`     First item structure:`, {
          id: firstItem.id,
          texto: firstItem.texto?.substring(0, 30) + '...',
          hasOptions: !!firstItem.opciones_respuesta,
          optionsCount: firstItem.opciones_respuesta?.length || 0
        });
      }
      console.log('');
    });

    // 2. Verificar estructura específica de un cuestionario padre
    console.log('2️⃣ Checking OYS-PS-P-SF20 detailed structure...');
    const parentQuest = questionnaires.find(q => q.codigo === 'OYS-PS-P-SF20');
    
    if (parentQuest) {
      console.log('✅ OYS-PS-P-SF20 found');
      console.log('Items structure:', typeof parentQuest.items);
      
      if (Array.isArray(parentQuest.items)) {
        console.log(`Items count: ${parentQuest.items.length}`);
        
        if (parentQuest.items.length > 0) {
          const item = parentQuest.items[0];
          console.log('First item detailed:', {
            id: item.id,
            orden: item.orden,
            texto: item.texto,
            opciones_respuesta: item.opciones_respuesta
          });
        }
      } else {
        console.log('❌ Items is not an array:', parentQuest.items);
      }
    } else {
      console.log('❌ OYS-PS-P-SF20 not found');
    }

    // 3. Verificar si hay respuestas existentes
    console.log('3️⃣ Checking existing responses...');
    const { data: responses, error: rError } = await supabase
      .from('respuestas')
      .select('cuestionario_id, respuestas')
      .in('cuestionario_id', questionnaires.map(q => q.id))
      .limit(5);

    if (rError) {
      console.log('⚠️ No responses found or error:', rError.message);
    } else {
      console.log(`✅ Found ${responses.length} existing responses`);
      responses.forEach(r => {
        const quest = questionnaires.find(q => q.id === r.cuestionario_id);
        console.log(`   - ${quest?.codigo}: ${Object.keys(r.respuestas || {}).length} answers`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugOYSCurrentState();
