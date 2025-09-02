const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPatientCreationFlow() {
  console.log('🧪 Testing Patient Creation Flow...\n');
  
  try {
    // 1. Obtener un psicólogo existente
    console.log('1️⃣ Getting existing psychologist...');
    const { data: psychologist, error: psychError } = await supabase
      .from('patients')
      .select('psychologist_id')
      .limit(1)
      .single();
    
    if (psychError || !psychologist) {
      console.error('❌ No psychologist found:', psychError);
      return false;
    }
    
    console.log('✅ Using psychologist ID:', psychologist.psychologist_id);
    
    // 2. Obtener un cuestionario para enviar
    console.log('\n2️⃣ Getting questionnaire...');
    const { data: questionnaire, error: qError } = await supabase
      .from('cuestionarios')
      .select('id, codigo, titulo')
      .eq('codigo', 'WHO-5')
      .single();
    
    if (qError || !questionnaire) {
      console.error('❌ WHO-5 questionnaire not found:', qError);
      return false;
    }
    
    console.log('✅ Using questionnaire:', questionnaire.titulo);
    
    // 3. Crear paciente directamente en la base de datos
    console.log('\n3️⃣ Creating patient directly...');
    const patientData = {
      name: `Test Patient ${Date.now()}`,
      email: 'test.patient@example.com',
      psychologist_id: psychologist.psychologist_id,
      metadata: {
        cuestionario_id: questionnaire.id,
        preferencias_cuestionario: {
          canal: 'email',
          frecuencia: 'mensual'
        }
      }
    };
    
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert(patientData)
      .select()
      .single();
    
    if (patientError || !patient) {
      console.error('❌ Error creating patient:', patientError);
      return false;
    }
    
    console.log('✅ Patient created:', patient.name, patient.id);
    
    // 4. Crear envío programado
    console.log('\n4️⃣ Creating scheduled send...');
    const nextSend = new Date();
    nextSend.setMonth(nextSend.getMonth() + 1);
    
    const { data: scheduledSend, error: scheduleError } = await supabase
      .from('envios_programados')
      .insert({
        paciente_id: patient.id,
        cuestionario_id: questionnaire.id,
        canal: 'email',
        frecuencia: 'mensual',
        proximo_envio: nextSend.toISOString(),
        activo: true,
        destinatario: 'paciente'
      })
      .select()
      .single();
    
    if (scheduleError || !scheduledSend) {
      console.error('❌ Error creating scheduled send:', scheduleError);
      return false;
    }
    
    console.log('✅ Scheduled send created:', scheduledSend.id);
    
    // 5. Enviar cuestionario inmediatamente
    console.log('\n5️⃣ Sending questionnaire immediately...');
    const sendRes = await fetch('http://localhost:3000/api/internal/enviar-cuestionario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pacienteId: patient.id,
        cuestionarioId: questionnaire.id,
        canal: 'email',
        envioProgramadoId: scheduledSend.id
      }),
    });
    
    const sendData = await sendRes.json();
    if (sendRes.ok) {
      console.log('✅ Questionnaire sent successfully:', sendData.link);
    } else {
      console.error('❌ Error sending questionnaire:', sendData);
      return false;
    }
    
    // 6. Verificar que el envío programado aparece en el perfil
    console.log('\n6️⃣ Verifying scheduled send appears in profile...');
    const { data: scheduledSends, error: listError } = await supabase
      .from('envios_programados')
      .select('*, cuestionarios(codigo)')
      .eq('paciente_id', patient.id)
      .eq('activo', true);
    
    if (listError) {
      console.error('❌ Error listing scheduled sends:', listError);
      return false;
    }
    
    console.log(`✅ Found ${scheduledSends?.length || 0} active scheduled sends for patient`);
    scheduledSends?.forEach((send, i) => {
      console.log(`  ${i+1}. ${send.cuestionarios?.codigo} - Canal: ${send.canal} - Destinatario: ${send.destinatario}`);
    });
    
    // 7. Verificar que se creó el link del cuestionario
    console.log('\n7️⃣ Verifying questionnaire link was created...');
    const { data: links, error: linkError } = await supabase
      .from('links_cuestionario')
      .select('token, enviado_desde, creado_en')
      .eq('paciente_id', patient.id)
      .eq('envio_programado_id', scheduledSend.id);
    
    if (linkError) {
      console.error('❌ Error checking questionnaire links:', linkError);
      return false;
    }
    
    console.log(`✅ Found ${links?.length || 0} questionnaire links for this patient`);
    links?.forEach((link, i) => {
      console.log(`  ${i+1}. Token: ${link.token} - Enviado desde: ${link.enviado_desde} - Creado: ${link.creado_en}`);
    });
    
    console.log('\n🎉 Patient creation flow test completed successfully!');
    console.log(`Patient ID: ${patient.id}`);
    console.log(`Scheduled Send ID: ${scheduledSend.id}`);
    console.log(`Questionnaire Link: ${sendData.link}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testPatientCreationFlow()
  .then(success => {
    if (success) {
      console.log('\n✅ Patient creation flow test completed successfully');
    } else {
      console.log('\n❌ Patient creation flow test found issues');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
