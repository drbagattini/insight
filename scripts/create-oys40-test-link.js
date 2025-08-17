const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createOYS40TestLink() {
  console.log('🔗 Creating OYS-40 consolidated test link (no notifications)\n');

  try {
    // 1) Get an existing psychologist/user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ No users found in table "users"', userError);
      return process.exit(1);
    }

    const psychologistId = users[0].id;
    console.log('✅ Using psychologist:', psychologistId);

    // 2) Create a test patient linked to that psychologist
    const testPatientId = randomUUID();
    const { error: patientError } = await supabase
      .from('patients')
      .insert({
        id: testPatientId,
        name: 'OYS Forty Test',
        email: 'noreply@example.com',
        psychologist_id: psychologistId,
        active: true,
        metadata: {}
      });

    if (patientError) {
      console.error('❌ Error creating patient:', patientError);
      return process.exit(1);
    }

    console.log('✅ Created patient:', testPatientId);

    // 3) Find consolidated OYS-40 (prefer parents, fallback youth)
    let consolidated;
    const preferredCodes = ['OYS-PADRES-40', 'OYS-JOVENES-40'];
    for (const code of preferredCodes) {
      const { data, error } = await supabase
        .from('cuestionarios')
        .select('id, codigo, titulo, activo')
        .eq('codigo', code)
        .eq('activo', true)
        .single();
      if (!error && data) {
        consolidated = data;
        break;
      }
    }

    if (!consolidated) {
      console.error('❌ No active OYS-40 consolidated questionnaire found (OYS-PADRES-40 or OYS-JOVENES-40).');
      return process.exit(1);
    }

    console.log('✅ Using questionnaire:', consolidated.codigo, consolidated.id);

    // 4) Create token link (no sending)
    const token = randomUUID();
    const { error: linkError } = await supabase
      .from('links_cuestionario')
      .insert({
        token,
        cuestionario_id: consolidated.id,
        paciente_id: testPatientId,
        expira_en: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        consumido: false
      });

    if (linkError) {
      console.error('❌ Error creating link:', linkError);
      return process.exit(1);
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cuestionario/${token}`;
    console.log('✅ Created OYS-40 test link token:', token);
    console.log('🔗 Test URL:', url);

    // 5) Optional: basic verify API test (if dev server is running)
    try {
      const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cuestionarios/verificar/${token}`;
      const res = await fetch(verifyUrl);
      console.log('🧪 Verify API status:', res.status);
      if (res.ok) {
        const json = await res.json();
        const count = Array.isArray(json?.cuestionario?.items) ? json.cuestionario.items.length : 0;
        console.log('   Items count:', count);
        if (count === 40) console.log('✅ OYS-40 verified with 40 items');
        else console.log('⚠️ Unexpected item count (expected 40)');
      }
    } catch (e) {
      console.log('ℹ️ Verify API check skipped (dev server not running)');
    }

    return token;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

createOYS40TestLink();
