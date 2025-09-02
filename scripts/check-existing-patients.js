const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingPatients() {
  console.log('🔍 Checking existing patients in database...\n');

  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching patients:', error);
      return;
    }

    if (!patients || patients.length === 0) {
      console.log('❌ No patients found in database');
      console.log('💡 The create-oys-test-data.js script will create a test patient automatically');
      return;
    }

    console.log(`✅ Found ${patients.length} patients:`);
    console.log('');
    
    patients.forEach((patient, index) => {
      const createdDate = new Date(patient.created_at).toLocaleDateString('es-ES');
      console.log(`${index + 1}. ${patient.name}`);
      console.log(`   ID: ${patient.id}`);
      console.log(`   Email: ${patient.email || 'No email'}`);
      console.log(`   Created: ${createdDate}`);
      console.log('');
    });

    console.log('💡 You can use any of these patient IDs for testing OYS charts');
    console.log('💡 Or run create-oys-test-data.js to create test data for any patient');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkExistingPatients();
