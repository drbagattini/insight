const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugResponseDetail() {
  console.log('🔍 Debugging OYS response detail issue...');
  
  try {
    // Find a recent OYS response
    const { data: responses, error: responseError } = await supabase
      .from('respuestas')
      .select(`
        id,
        cuestionario_id,
        respuestas,
        cuestionarios!inner (
          codigo,
          titulo,
          items
        )
      `)
      .eq('cuestionarios.codigo', 'OYS-PADRES-40')
      .limit(1);

    if (responseError) {
      console.error('❌ Error fetching response:', responseError);
      return;
    }

    if (!responses || responses.length === 0) {
      console.log('❌ No OYS-PADRES-40 responses found');
      return;
    }

    const response = responses[0];
    console.log('📋 Response found:', {
      id: response.id,
      cuestionario_codigo: response.cuestionarios?.codigo,
      titulo: response.cuestionarios?.titulo
    });

    // Check the structure of respuestas
    console.log('📝 Response answers structure:');
    if (response.respuestas && Array.isArray(response.respuestas)) {
      console.log('  - Type: Array');
      console.log('  - Length:', response.respuestas.length);
      console.log('  - First few items:', response.respuestas.slice(0, 3));
    } else {
      console.log('  - Type:', typeof response.respuestas);
      console.log('  - Value:', response.respuestas);
    }

    // Check the structure of questionnaire items
    console.log('📋 Questionnaire items structure:');
    const items = response.cuestionarios?.items;
    if (items && Array.isArray(items)) {
      console.log('  - Type: Array');
      console.log('  - Length:', items.length);
      console.log('  - First few items:', items.slice(0, 3));
      
      // Check if items have proper IDs
      const itemsWithIds = items.filter(item => item && typeof item === 'object' && item.id);
      console.log('  - Items with IDs:', itemsWithIds.length);
      
      if (itemsWithIds.length > 0) {
        console.log('  - Sample item with ID:', itemsWithIds[0]);
      }
    } else {
      console.log('  - Type:', typeof items);
      console.log('  - Value:', items);
    }

    // Check if there's a mismatch between response pregunta_id and item IDs
    if (response.respuestas && Array.isArray(response.respuestas) && items && Array.isArray(items)) {
      const responseIds = response.respuestas.map(r => r.pregunta_id).filter(id => id !== undefined);
      const itemIds = items.map(item => item.id || item.orden_global).filter(id => id !== undefined);
      
      console.log('🔍 ID Analysis:');
      console.log('  - Response pregunta_ids:', responseIds.slice(0, 5), '...');
      console.log('  - Item IDs:', itemIds.slice(0, 5), '...');
      
      const missingIds = responseIds.filter(id => !itemIds.includes(id));
      if (missingIds.length > 0) {
        console.log('  - ❌ Missing item IDs for responses:', missingIds.slice(0, 5));
      } else {
        console.log('  - ✅ All response IDs found in items');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugResponseDetail();
