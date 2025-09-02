const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixOYSTitles() {
  console.log('🔧 Fixing OYS questionnaire titles...');
  
  try {
    // Update OYS-PADRES-40
    const { data: padresData, error: padresError } = await supabase
      .from('cuestionarios')
      .update({ 
        titulo: 'Ohio Youth Scales - Padres/Tutores'
      })
      .eq('codigo', 'OYS-PADRES-40')
      .select();

    if (padresError) {
      console.error('❌ Error updating OYS-PADRES-40:', padresError);
    } else {
      console.log('✅ Updated OYS-PADRES-40:', padresData);
    }

    // Update OYS-JOVENES-40
    const { data: jovenesData, error: jovenesError } = await supabase
      .from('cuestionarios')
      .update({ 
        titulo: 'Ohio Youth Scales - Jóvenes'
      })
      .eq('codigo', 'OYS-JOVENES-40')
      .select();

    if (jovenesError) {
      console.error('❌ Error updating OYS-JOVENES-40:', jovenesError);
    } else {
      console.log('✅ Updated OYS-JOVENES-40:', jovenesData);
    }

    // Verify the changes
    const { data: verifyData, error: verifyError } = await supabase
      .from('cuestionarios')
      .select('codigo, titulo')
      .in('codigo', ['OYS-PADRES-40', 'OYS-JOVENES-40']);

    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError);
    } else {
      console.log('📋 Current questionnaire titles:');
      verifyData.forEach(q => {
        console.log(`  ${q.codigo}: ${q.titulo}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixOYSTitles();
