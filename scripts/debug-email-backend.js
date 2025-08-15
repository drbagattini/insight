const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugEmailBackend() {
  console.log('🔍 Backend Email Debugging Started...\n');
  
  try {
    // 1. Verificar configuración SMTP
    console.log('1️⃣ Testing SMTP Configuration...');
    const smtpConfig = {
      host: process.env.BREVO_SMTP_HOST,
      port: parseInt(process.env.BREVO_SMTP_PORT, 10),
      secure: parseInt(process.env.BREVO_SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    };
    
    console.log('SMTP Config:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user,
      pass: smtpConfig.auth.pass ? '***configured***' : 'NOT SET'
    });
    
    // Crear transporter y verificar conexión
    const transporter = nodemailer.createTransport(smtpConfig);
    
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (smtpError) {
      console.error('❌ SMTP connection failed:', smtpError.message);
      return false;
    }
    
    // 2. Verificar últimos envíos programados
    console.log('\n2️⃣ Checking recent scheduled sends...');
    const { data: recentSchedules, error: schedError } = await supabase
      .from('envios_programados')
      .select('*, cuestionarios(codigo, titulo)')
      .order('creado_en', { ascending: false })
      .limit(5);
    
    if (schedError) {
      console.error('❌ Error fetching scheduled sends:', schedError);
      return false;
    }
    
    console.log(`Found ${recentSchedules?.length || 0} recent scheduled sends:`);
    recentSchedules?.forEach((sched, i) => {
      console.log(`  ${i+1}. ID: ${sched.id}`);
      console.log(`     Cuestionario: ${sched.cuestionarios?.codigo} - ${sched.cuestionarios?.titulo}`);
      console.log(`     Canal: ${sched.canal}`);
      console.log(`     Destinatario: ${sched.destinatario || 'paciente'}`);
      console.log(`     Próximo envío: ${sched.proximo_envio}`);
      console.log(`     Activo: ${sched.activo}`);
      console.log('');
    });
    
    // 3. Verificar links de cuestionario generados recientemente
    console.log('3️⃣ Checking recent questionnaire links...');
    const { data: recentLinks, error: linksError } = await supabase
      .from('links_cuestionario')
      .select('*, envios_programados(id, destinatario)')
      .order('creado_en', { ascending: false })
      .limit(5);
    
    if (linksError) {
      console.error('❌ Error fetching questionnaire links:', linksError);
      return false;
    }
    
    console.log(`Found ${recentLinks?.length || 0} recent questionnaire links:`);
    recentLinks?.forEach((link, i) => {
      console.log(`  ${i+1}. Token: ${link.token}`);
      console.log(`     Paciente ID: ${link.paciente_id}`);
      console.log(`     Cuestionario ID: ${link.cuestionario_id}`);
      console.log(`     Enviado desde: ${link.enviado_desde}`);
      console.log(`     Envío programado: ${link.envio_programado_id}`);
      console.log(`     Destinatario: ${link.envios_programados?.destinatario || 'N/A'}`);
      console.log(`     Creado: ${link.creado_en}`);
      console.log(`     Expira: ${link.expira_en}`);
      console.log('');
    });
    
    // 4. Test directo de envío de email
    console.log('4️⃣ Testing direct email send...');
    
    const testEmailOptions = {
      from: smtpConfig.auth.user,
      to: 'test@example.com', // Email de prueba
      subject: '🧪 Test Email from Insight Backend',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email sent from the Insight backend debugging script.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>SMTP Host:</strong> ${smtpConfig.host}</p>
        <p><strong>From:</strong> ${smtpConfig.auth.user}</p>
      `
    };
    
    try {
      const info = await transporter.sendMail(testEmailOptions);
      console.log('✅ Test email sent successfully');
      console.log('Message ID:', info.messageId);
      console.log('Response:', info.response);
    } catch (emailError) {
      console.error('❌ Test email failed:', emailError.message);
      console.error('Full error:', emailError);
    }
    
    // 5. Verificar pacientes con datos de padre/tutor
    console.log('\n5️⃣ Checking patients with parent/tutor data...');
    const { data: patientsWithParents, error: patientsError } = await supabase
      .from('patients')
      .select('id, name, email, metadata')
      .not('metadata->padre_tutor', 'is', null)
      .limit(3);
    
    if (patientsError) {
      console.error('❌ Error fetching patients:', patientsError);
    } else {
      console.log(`Found ${patientsWithParents?.length || 0} patients with parent/tutor data:`);
      patientsWithParents?.forEach((patient, i) => {
        const parentData = patient.metadata?.padre_tutor;
        console.log(`  ${i+1}. ${patient.name} (${patient.email})`);
        console.log(`     Padre/Tutor: ${parentData?.nombre || 'N/A'}`);
        console.log(`     Email padre: ${parentData?.email || 'N/A'}`);
        console.log(`     Teléfono padre: ${parentData?.telefono || 'N/A'}`);
        console.log('');
      });
    }
    
    console.log('🎉 Backend debugging completed');
    return true;
    
  } catch (error) {
    console.error('❌ Backend debugging failed:', error);
    return false;
  }
}

debugEmailBackend()
  .then(success => {
    if (success) {
      console.log('\n✅ Backend debugging completed successfully');
    } else {
      console.log('\n❌ Backend debugging found issues');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
