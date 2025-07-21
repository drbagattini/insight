#!/usr/bin/env node

/**
 * Create an immediate test send for 10-minute recurrence
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createImmediateTest() {
  console.log('🚀 Creating immediate 10-minute test send...\n');

  try {
    // Find patient
    const { data: patients } = await supabase
      .from('patients')
      .select('id, name, email')
      .limit(1);
    
    // Find WHO-5 questionnaire
    const { data: questionnaire } = await supabase
      .from('cuestionarios')
      .select('id, titulo')
      .eq('codigo', 'WHO-5')
      .single();

    if (!patients?.[0] || !questionnaire) {
      console.error('❌ Missing patient or questionnaire');
      return;
    }

    const patient = patients[0];
    console.log(`👤 Patient: ${patient.name} (${patient.email})`);
    console.log(`📋 Questionnaire: ${questionnaire.titulo}`);

    // Create a send that's due NOW (1 minute ago)
    const now = new Date();
    now.setMinutes(now.getMinutes() - 1); // 1 minute in the past

    const { data: scheduledSend, error: scheduleError } = await supabase
      .from('envios_programados')
      .insert({
        paciente_id: patient.id,
        cuestionario_id: questionnaire.id,
        canal: 'email',
        frecuencia: '10_minutos',
        proximo_envio: now.toISOString(),
        activo: true
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('❌ Error creating scheduled send:', scheduleError);
      return;
    }

    console.log(`\n✅ Created immediate test send:`);
    console.log(`   ID: ${scheduledSend.id}`);
    console.log(`   Due: ${now.toLocaleString()} (OVERDUE - ready now)`);
    console.log(`   Frequency: 10_minutos`);
    console.log(`   Patient: ${patient.name}`);
    console.log(`   Email: ${patient.email}`);

    console.log(`\n🎯 The automatic processor should pick this up in the next minute!`);
    console.log(`📊 Monitor with: tail -f processor-3000.log`);

    console.log(`\n🧹 CLEANUP COMMAND:`);
    console.log(`DELETE FROM envios_programados WHERE id = '${scheduledSend.id}';`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createImmediateTest();
