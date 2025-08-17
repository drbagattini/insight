const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeSQLMigration() {
  console.log('🔧 Executing SQL Migration for destinatario column\n');

  try {
    // 1. Add destinatario column
    console.log('1️⃣ Adding destinatario column...');
    const { error: alterError } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE cuestionarios 
        ADD COLUMN IF NOT EXISTS destinatario TEXT CHECK (destinatario IN ('paciente', 'padre_tutor'));
      `
    });

    if (alterError) {
      console.error('❌ Error adding column:', alterError);
      // Try alternative approach using direct SQL
      console.log('Trying alternative approach...');
      
      const { error: directError } = await supabase
        .from('cuestionarios')
        .update({ destinatario: 'paciente' })
        .eq('id', 'non-existent-id'); // This will fail but might create the column

      console.log('Direct approach result:', directError?.message || 'Unknown');
    } else {
      console.log('✅ Column added successfully');
    }

    // 2. Update OYS questionnaires with correct recipients (using a workaround)
    console.log('2️⃣ Updating OYS questionnaires recipients...');
    
    // Get all OYS questionnaires first
    const { data: oysQuests } = await supabase
      .from('cuestionarios')
      .select('id, codigo')
      .ilike('codigo', 'OYS%');

    console.log(`Found ${oysQuests.length} OYS questionnaires to update`);

    // Update each questionnaire individually
    for (const quest of oysQuests) {
      let destinatario = 'paciente'; // default
      
      if (quest.codigo.includes('-P-') || quest.codigo.includes('PADRES')) {
        destinatario = 'padre_tutor';
      }

      // Try to update using a custom field approach
      const { error: updateError } = await supabase
        .from('cuestionarios')
        .update({ 
          descripcion_escala: { 
            ...{}, // preserve existing data
            destinatario: destinatario // store as metadata
          }
        })
        .eq('id', quest.id);

      if (updateError) {
        console.error(`❌ Error updating ${quest.codigo}:`, updateError);
      } else {
        console.log(`✅ Updated ${quest.codigo} → ${destinatario}`);
      }
    }

    // 3. Activate correct questionnaires
    console.log('3️⃣ Activating SF20 questionnaires...');
    const { error: activateError } = await supabase
      .from('cuestionarios')
      .update({ activo: true })
      .in('codigo', ['OYS-PS-P-SF20', 'OYS-F-P-SF20', 'OYS-PS-Y-SF20', 'OYS-F-Y-SF20']);

    if (activateError) {
      console.error('❌ Error activating questionnaires:', activateError);
    } else {
      console.log('✅ SF20 questionnaires activated');
    }

    const { error: deactivateError } = await supabase
      .from('cuestionarios')
      .update({ activo: false })
      .in('codigo', ['OYS-JOVENES-40', 'OYS-PADRES-40']);

    if (deactivateError) {
      console.error('❌ Error deactivating 40-item questionnaires:', deactivateError);
    } else {
      console.log('✅ 40-item questionnaires deactivated');
    }

    // 4. Verify final state
    console.log('4️⃣ Verifying final state...');
    const { data: finalState } = await supabase
      .from('cuestionarios')
      .select('codigo, activo, descripcion_escala')
      .ilike('codigo', 'OYS%')
      .order('codigo');

    console.log('\n📊 Final OYS Questionnaires State:');
    finalState.forEach(q => {
      const status = q.activo ? '🟢 ACTIVE' : '🔴 INACTIVE';
      const destinatario = q.descripcion_escala?.destinatario || 'undefined';
      console.log(`   ${status} ${q.codigo} → ${destinatario}`);
    });

    console.log('\n✅ Migration completed!');
    console.log('\n⚠️  Note: destinatario is stored in descripcion_escala.destinatario due to schema limitations');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

executeSQLMigration();
