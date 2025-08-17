const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixOYSCriticalIssues() {
  console.log('🔧 Fixing OYS Critical Issues\n');

  try {
    // 1. Activar cuestionarios de forma corta (SF20) y desactivar los de 40 ítems
    console.log('1️⃣ Activating SF20 questionnaires and deactivating 40-item versions...');
    
    const { error: activateError } = await supabase
      .from('cuestionarios')
      .update({ activo: true })
      .in('codigo', ['OYS-PS-P-SF20', 'OYS-F-P-SF20', 'OYS-PS-Y-SF20', 'OYS-F-Y-SF20']);

    if (activateError) {
      console.error('❌ Error activating SF20 questionnaires:', activateError);
      return;
    }

    const { error: deactivateError } = await supabase
      .from('cuestionarios')
      .update({ activo: false })
      .in('codigo', ['OYS-JOVENES-40', 'OYS-PADRES-40']);

    if (deactivateError) {
      console.error('❌ Error deactivating 40-item questionnaires:', deactivateError);
      return;
    }

    console.log('✅ Questionnaire activation status updated');

    // 2. Establecer destinatarios correctos
    console.log('2️⃣ Setting correct recipients...');
    
    const { error: parentError } = await supabase
      .from('cuestionarios')
      .update({ destinatario: 'padre_tutor' })
      .in('codigo', ['OYS-PS-P-SF20', 'OYS-F-P-SF20']);

    if (parentError) {
      console.error('❌ Error setting parent recipients:', parentError);
      return;
    }

    const { error: youthError } = await supabase
      .from('cuestionarios')
      .update({ destinatario: 'paciente' })
      .in('codigo', ['OYS-PS-Y-SF20', 'OYS-F-Y-SF20']);

    if (youthError) {
      console.error('❌ Error setting youth recipients:', youthError);
      return;
    }

    console.log('✅ Recipients set correctly');

    // 3. Agregar opciones de respuesta a cuestionarios de 40 ítems (por si se necesitan después)
    console.log('3️⃣ Adding response options to 40-item questionnaires...');
    
    const { data: longQuestionnaires } = await supabase
      .from('cuestionarios')
      .select('*')
      .in('codigo', ['OYS-JOVENES-40', 'OYS-PADRES-40']);

    for (const quest of longQuestionnaires) {
      if (Array.isArray(quest.items) && quest.items.length > 0) {
        const isProblems = quest.items.some(item => 
          item.texto && (
            item.texto.includes('Discutir') || 
            item.texto.includes('peleas') ||
            item.texto.includes('problemas')
          )
        );

        const responseOptions = isProblems ? [
          { valor: 0, texto: "Nada en absoluto" },
          { valor: 1, texto: "Una o dos veces" },
          { valor: 2, texto: "Varias veces" },
          { valor: 3, texto: "A menudo" },
          { valor: 4, texto: "La mayor parte del tiempo" },
          { valor: 5, texto: "Todo el tiempo" }
        ] : [
          { valor: 0, texto: "Problemas extremos" },
          { valor: 1, texto: "Bastantes problemas" },
          { valor: 2, texto: "Algunos problemas" },
          { valor: 3, texto: "Bien" },
          { valor: 4, texto: "Muy bien" }
        ];

        const updatedItems = quest.items.map(item => ({
          ...item,
          opciones_respuesta: item.opciones_respuesta || responseOptions
        }));

        const { error: updateError } = await supabase
          .from('cuestionarios')
          .update({ 
            items: updatedItems,
            destinatario: quest.codigo.includes('JOVENES') ? 'paciente' : 'padre_tutor'
          })
          .eq('id', quest.id);

        if (updateError) {
          console.error(`❌ Error updating ${quest.codigo}:`, updateError);
        } else {
          console.log(`✅ Updated ${quest.codigo} with response options`);
        }
      }
    }

    // 4. Verificar estado final
    console.log('4️⃣ Verifying final state...');
    const { data: finalState } = await supabase
      .from('cuestionarios')
      .select('codigo, activo, destinatario')
      .ilike('codigo', 'OYS%')
      .order('codigo');

    console.log('\n📊 Final OYS Questionnaires State:');
    finalState.forEach(q => {
      const status = q.activo ? '🟢 ACTIVE' : '🔴 INACTIVE';
      console.log(`   ${status} ${q.codigo} → ${q.destinatario || 'undefined'}`);
    });

    console.log('\n✅ OYS Critical Issues Fixed Successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixOYSCriticalIssues();
