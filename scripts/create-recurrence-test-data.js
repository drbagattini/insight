const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTestData() {
  console.log('🚀 Creating test data for questionnaire recurrence...');

  try {
    // 1. Get existing patient and questionnaire
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, name')
      .limit(1);

    if (patientsError || !patients || patients.length === 0) {
      console.error('❌ No patients found:', patientsError);
      return;
    }

    const patient = patients[0];
    console.log(`👤 Using patient: ${patient.name} (${patient.id})`);

    // 2. Get WHO-5 questionnaire
    const { data: questionnaire, error: qError } = await supabase
      .from('cuestionarios')
      .select('id, codigo')
      .eq('codigo', 'WHO-5')
      .single();

    if (qError || !questionnaire) {
      console.error('❌ WHO-5 questionnaire not found:', qError);
      return;
    }

    console.log(`📋 Using questionnaire: ${questionnaire.codigo} (${questionnaire.id})`);

    // 3. Create test scheduled sends with past dates to trigger immediate processing
    const now = new Date();
    const testSends = [
      {
        paciente_id: patient.id,
        cuestionario_id: questionnaire.id,
        canal: 'email',
        frecuencia: 'semanal',
        proximo_envio: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), // 1 hour ago
        activo: true
      },
      {
        paciente_id: patient.id,
        cuestionario_id: questionnaire.id,
        canal: 'whatsapp',
        frecuencia: 'mensual',
        proximo_envio: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        activo: true
      },
      {
        paciente_id: patient.id,
        cuestionario_id: questionnaire.id,
        canal: 'email',
        frecuencia: 'unico',
        proximo_envio: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        activo: true
      }
    ];

    // 4. Delete existing test data first
    const { error: deleteError } = await supabase
      .from('envios_programados')
      .delete()
      .eq('paciente_id', patient.id);

    if (deleteError) {
      console.warn('⚠️ Could not delete existing test data:', deleteError);
    } else {
      console.log('🧹 Cleaned existing test data');
    }

    // 5. Insert test data
    const { data: insertedSends, error: insertError } = await supabase
      .from('envios_programados')
      .insert(testSends)
      .select();

    if (insertError) {
      console.error('❌ Error inserting test data:', insertError);
      return;
    }

    console.log(`✅ Created ${insertedSends.length} test scheduled sends:`);
    insertedSends.forEach((send, index) => {
      console.log(`   ${index + 1}. ${send.frecuencia} via ${send.canal} - Next: ${new Date(send.proximo_envio).toLocaleString()}`);
    });

    // 6. List all scheduled sends for this patient
    const { data: allSends, error: listError } = await supabase
      .from('envios_programados')
      .select('*')
      .eq('paciente_id', patient.id)
      .order('proximo_envio', { ascending: true });

    if (listError) {
      console.error('❌ Error listing scheduled sends:', listError);
      return;
    }

    console.log(`\n📊 Total scheduled sends for patient: ${allSends.length}`);
    console.log('💡 Now you can test the scheduler by calling: GET /api/test/scheduler');
    console.log('🌐 Or visit: http://localhost:3000/admin/scheduler');

  } catch (error) {
    console.error('🔥 Unexpected error:', error);
  }
}

// Run the script
createTestData().then(() => {
  console.log('✨ Test data creation completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
