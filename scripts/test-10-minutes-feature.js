#!/usr/bin/env node

/**
 * Script to test the 10-minute frequency feature
 * Run with: node scripts/test-10-minutes-feature.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase config
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTenMinutesFeature() {
  console.log('🧪 Testing 10-minute recurrence feature...\n');

  try {
    // 1. Find an existing patient
    console.log('1️⃣ Looking for existing patients...');
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, name, email')
      .limit(1);

    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError);
      return;
    }

    if (!patients || patients.length === 0) {
      console.log('⚠️  No patients found. Please create a patient first in the UI.');
      return;
    }

    const patient = patients[0];
    console.log(`✅ Found patient: ${patient.name} (${patient.email})`);

    // 2. Find OPD-CA2-SQ questionnaire
    console.log('\n2️⃣ Looking for OPD-CA2-SQ questionnaire...');
    const { data: questionnaire, error: qError } = await supabase
      .from('cuestionarios')
      .select('id, titulo')
      .eq('codigo', 'OPD-CA2-SQ')
      .single();

    if (qError || !questionnaire) {
      console.error('❌ OPD-CA2-SQ questionnaire not found:', qError);
      console.log('Try using WHO-5 instead...');
      
      const { data: whoquestionnaire, error: whoError } = await supabase
        .from('cuestionarios')
        .select('id, titulo')
        .eq('codigo', 'WHO-5')
        .single();
        
      if (whoError || !whoquestionnaire) {
        console.error('❌ WHO-5 questionnaire also not found:', whoError);
        return;
      }
      
      questionnaire = whoquestionnaire;
    }

    console.log(`✅ Found questionnaire: ${questionnaire.titulo}`);

    // 3. Create a 10-minute scheduled send
    console.log('\n3️⃣ Creating 10-minute scheduled send...');
    
    const nextSend = new Date();
    nextSend.setMinutes(nextSend.getMinutes() + 1); // Start in 1 minute for immediate testing
    
    const { data: scheduledSend, error: scheduleError } = await supabase
      .from('envios_programados')
      .insert({
        paciente_id: patient.id,
        cuestionario_id: questionnaire.id,
        canal: 'email',
        frecuencia: '10_minutos',
        proximo_envio: nextSend.toISOString(),
        activo: true
      })
      .select()
      .single();

    if (scheduleError) {
      console.error('❌ Error creating scheduled send:', scheduleError);
      return;
    }

    console.log(`✅ Created scheduled send with ID: ${scheduledSend.id}`);
    console.log(`📅 Next send scheduled for: ${nextSend.toLocaleString()}`);

    // 4. Show processing endpoint
    console.log('\n4️⃣ Ready for testing!');
    console.log('\n📋 TO TEST THE RECURRENCE:');
    console.log('1. Wait 1 minute, then call the processing endpoint:');
    console.log('   curl -X POST http://localhost:3001/api/test/process-fast');
    console.log('\n2. Or visit the admin panel:');
    console.log('   http://localhost:3001/admin/scheduler');
    console.log('\n3. Check your email for the questionnaire link');
    console.log('\n4. After processing, the next send will be scheduled for +10 minutes');

    // 5. Show cleanup command
    console.log('\n🧹 TO CLEANUP AFTER TESTING:');
    console.log(`DELETE FROM envios_programados WHERE id = '${scheduledSend.id}';`);

    console.log('\n✅ 10-minute recurrence test setup completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testTenMinutesFeature();
