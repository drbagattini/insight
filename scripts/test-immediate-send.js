#!/usr/bin/env node

/**
 * Script to test immediate questionnaire sending
 * Creates a scheduled send that's due NOW for immediate processing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createImmediateTest() {
  console.log('🚀 Creating immediate test for recurrence system...\n');

  try {
    // 1. Find patient and questionnaire
    const { data: patients } = await supabase
      .from('patients')
      .select('id, name, email')
      .limit(1);
    
    const { data: questionnaire } = await supabase
      .from('cuestionarios')
      .select('id, titulo')
      .eq('codigo', 'OPD-CA2-SQ')
      .single();

    if (!patients?.[0] || !questionnaire) {
      console.error('❌ Missing patient or questionnaire');
      return;
    }

    const patient = patients[0];
    console.log(`👤 Patient: ${patient.name} (${patient.email})`);
    console.log(`📋 Questionnaire: ${questionnaire.titulo}`);

    // 2. Create a scheduled send that's due NOW (for immediate processing)
    const now = new Date();
    now.setMinutes(now.getMinutes() - 1); // Set 1 minute in the past to be immediately due

    const { data: scheduledSend, error: scheduleError } = await supabase
      .from('envios_programados')
      .insert({
        paciente_id: patient.id,
        cuestionario_id: questionnaire.id,
        canal: 'email',
        frecuencia: 'semanal', // Use valid frequency
        proximo_envio: now.toISOString(),
        activo: true
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('❌ Error creating scheduled send:', scheduleError);
      return;
    }

    console.log(`\n✅ Created scheduled send:`)
    console.log(`   ID: ${scheduledSend.id}`);
    console.log(`   Due: ${now.toLocaleString()} (OVERDUE - ready for processing)`);
    console.log(`   Frequency: semanal (will reschedule to +1 week after processing)`);

    console.log(`\n🎯 NOW TEST THE PROCESSING:`);
    console.log(`1. Run the processing endpoint:`);
    console.log(`   curl -X POST http://localhost:3001/api/test/process-fast`);
    console.log(`\n2. Or visit admin panel:`);
    console.log(`   http://localhost:3001/admin/scheduler`);
    console.log(`\n3. Expected results:`);
    console.log(`   ✅ Email sent to ${patient.email}`);
    console.log(`   ✅ Questionnaire link generated`);
    console.log(`   ✅ Next send scheduled for +1 week`);
    console.log(`   ✅ Job remains active for weekly recurrence`);

    // 3. Show current status
    console.log(`\n📊 CURRENT STATUS:`);
    const { data: currentStatus } = await supabase
      .from('envios_programados')
      .select('id, frecuencia, proximo_envio, activo')
      .eq('id', scheduledSend.id)
      .single();
    
    if (currentStatus) {
      console.log(`   Frequency: ${currentStatus.frecuencia}`);
      console.log(`   Next Send: ${new Date(currentStatus.proximo_envio).toLocaleString()}`);
      console.log(`   Active: ${currentStatus.activo}`);
      console.log(`   Status: ${new Date(currentStatus.proximo_envio) <= new Date() ? 'OVERDUE ⚠️' : 'PENDING 🕐'}`);
    }

    console.log(`\n🧹 CLEANUP COMMAND:`);
    console.log(`DELETE FROM envios_programados WHERE id = '${scheduledSend.id}';`);

    console.log(`\n✅ Test setup complete! Run the process endpoint to see the system in action.`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createImmediateTest();
