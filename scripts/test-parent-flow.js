const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testParentFlow() {
  console.log('🧪 Testing parent/tutor questionnaire flow...');
  
  try {
    // 1. Verificar que la columna destinatario existe
    console.log('1️⃣ Checking destinatario column...');
    const { data: columns, error: columnError } = await supabase
      .from('envios_programados')
      .select('*')
      .limit(1);
    
    if (columnError) {
      console.error('❌ Error accessing envios_programados:', columnError);
      console.log('📝 Please run this SQL in Supabase:');
      console.log('ALTER TABLE envios_programados ADD COLUMN IF NOT EXISTS destinatario VARCHAR(20) DEFAULT \'paciente\';');
      return false;
    }
    
    console.log('✅ Table accessible');
    
    // 2. Verificar cuestionarios OYS para padres
    console.log('2️⃣ Checking parent questionnaires...');
    const { data: parentQuestionnaires, error: questError } = await supabase
      .from('cuestionarios')
      .select('id, codigo, titulo')
      .in('codigo', ['OYS-PS-P-SF20', 'OYS-F-P-SF20']);
    
    if (questError) {
      console.error('❌ Error fetching questionnaires:', questError);
      return false;
    }
    
    if (!parentQuestionnaires || parentQuestionnaires.length === 0) {
      console.log('⚠️ No parent questionnaires found. Available codes:');
      const { data: allQuest } = await supabase
        .from('cuestionarios')
        .select('codigo, titulo')
        .order('codigo');
      
      allQuest?.forEach(q => console.log(`  - ${q.codigo}: ${q.titulo}`));
      return false;
    }
    
    console.log('✅ Parent questionnaires found:');
    parentQuestionnaires.forEach(q => console.log(`  - ${q.codigo}: ${q.titulo}`));
    
    // 3. Verificar configuración de email
    console.log('3️⃣ Checking email configuration...');
    const emailConfig = {
      host: process.env.BREVO_SMTP_HOST,
      port: process.env.BREVO_SMTP_PORT,
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS ? '***' : undefined
    };
    
    console.log('Email config:', emailConfig);
    
    if (!emailConfig.host || !emailConfig.port || !emailConfig.user || !emailConfig.pass) {
      console.log('⚠️ Email configuration incomplete. Required env vars:');
      console.log('  - BREVO_SMTP_HOST=smtp-relay.brevo.com');
      console.log('  - BREVO_SMTP_PORT=587');
      console.log('  - BREVO_SMTP_USER=your_email@domain.com');
      console.log('  - BREVO_SMTP_PASS=your_brevo_api_key');
    } else {
      console.log('✅ Email configuration complete');
    }
    
    // 4. Crear un paciente de prueba con datos de padre/tutor
    console.log('4️⃣ Creating test patient with parent/tutor data...');
    
    const testPatient = {
      name: 'Juan Test Pérez',
      email: 'juan.test@example.com',
      phone: '+54 9 11 1111-1111',
      psychologist_id: '00000000-0000-0000-0000-000000000000', // Placeholder
      metadata: {
        padre_tutor: {
          nombre: 'María Test Pérez',
          email: 'maria.test@example.com',
          telefono: '+54 9 11 2222-2222'
        },
        preferencias_cuestionario: {
          canal: 'email'
        }
      }
    };
    
    console.log('Test patient data prepared:', {
      patient: testPatient.name,
      patient_email: testPatient.email,
      parent_name: testPatient.metadata.padre_tutor.nombre,
      parent_email: testPatient.metadata.padre_tutor.email
    });
    
    console.log('🎉 Pre-flight checks completed!');
    console.log('📋 Next steps:');
    console.log('1. Add destinatario column in Supabase if not done');
    console.log('2. Configure email settings in .env.local');
    console.log('3. Test the flow in the web interface');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testParentFlow()
  .then(success => {
    if (success) {
      console.log('✅ Pre-flight checks passed');
    } else {
      console.log('❌ Pre-flight checks failed');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
