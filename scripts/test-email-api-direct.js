const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEmailApiDirect() {
  console.log('🧪 Testing Email API Directly...\n');
  
  try {
    // 1. Buscar el envío programado más reciente para padre/tutor
    console.log('1️⃣ Finding recent parent/tutor scheduled send...');
    const { data: recentSchedule, error: schedError } = await supabase
      .from('envios_programados')
      .select('*, cuestionarios(codigo, titulo)')
      .eq('destinatario', 'padre_tutor')
      .order('creado_en', { ascending: false })
      .limit(1)
      .single();
    
    if (schedError || !recentSchedule) {
      console.error('❌ No recent parent/tutor scheduled send found:', schedError);
      return false;
    }
    
    console.log('✅ Found scheduled send:', {
      id: recentSchedule.id,
      cuestionario: recentSchedule.cuestionarios?.codigo,
      destinatario: recentSchedule.destinatario,
      canal: recentSchedule.canal,
      paciente_id: recentSchedule.paciente_id
    });
    
    // 2. Obtener datos del paciente y padre/tutor
    console.log('\n2️⃣ Getting patient and parent data...');
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, name, email, metadata')
      .eq('id', recentSchedule.paciente_id)
      .single();
    
    if (patientError || !patient) {
      console.error('❌ Patient not found:', patientError);
      return false;
    }
    
    const parentData = patient.metadata?.padre_tutor;
    if (!parentData?.email) {
      console.error('❌ Parent email not found in patient metadata');
      return false;
    }
    
    console.log('✅ Patient and parent data:', {
      patient_name: patient.name,
      patient_email: patient.email,
      parent_name: parentData.nombre,
      parent_email: parentData.email
    });
    
    // 3. Simular llamada directa al API de envío
    console.log('\n3️⃣ Testing direct API call...');
    
    const apiPayload = {
      pacienteId: patient.id,
      cuestionarioId: recentSchedule.cuestionario_id,
      canal: 'email',
      destinatario: 'padre_tutor',
      envioProgramadoId: recentSchedule.id
    };
    
    console.log('API Payload:', apiPayload);
    
    try {
      const response = await fetch('http://localhost:3000/api/cuestionarios/enviar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'next-auth.session-token=test' // Simular sesión
        },
        body: JSON.stringify(apiPayload)
      });
      
      const responseData = await response.json();
      
      console.log('API Response Status:', response.status);
      console.log('API Response Data:', responseData);
      
      if (response.ok) {
        console.log('✅ API call successful');
        
        // 4. Verificar que se creó el link
        console.log('\n4️⃣ Verifying link creation...');
        const { data: newLink, error: linkError } = await supabase
          .from('links_cuestionario')
          .select('*')
          .eq('envio_programado_id', recentSchedule.id)
          .order('creado_en', { ascending: false })
          .limit(1)
          .single();
        
        if (linkError) {
          console.error('❌ Link not found:', linkError);
        } else {
          console.log('✅ Link created:', {
            token: newLink.token,
            enviado_desde: newLink.enviado_desde,
            creado_en: newLink.creado_en,
            expira_en: newLink.expira_en
          });
        }
        
      } else {
        console.error('❌ API call failed:', responseData);
      }
      
    } catch (fetchError) {
      console.error('❌ Fetch error:', fetchError.message);
      
      // 5. Probar con curl como alternativa
      console.log('\n5️⃣ Testing with curl alternative...');
      const curlCommand = `curl -X POST http://localhost:3000/api/cuestionarios/enviar \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(apiPayload)}'`;
      
      console.log('Curl command to test manually:');
      console.log(curlCommand);
    }
    
    // 6. Verificar logs del servidor
    console.log('\n6️⃣ Check server logs for any errors...');
    console.log('Look for these patterns in the server console:');
    console.log('- "POST /api/cuestionarios/enviar body:"');
    console.log('- "Valores para enviarCuestionarioPorCanal:"');
    console.log('- "Error al enviar cuestionario:"');
    console.log('- SMTP connection errors');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testEmailApiDirect()
  .then(success => {
    if (success) {
      console.log('\n✅ Email API testing completed');
    } else {
      console.log('\n❌ Email API testing found issues');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
